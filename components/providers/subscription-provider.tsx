"use client"

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type PropsWithChildren,
} from "react"

import {
  ensureSubscriptionState,
  getProductPagePath,
  markSubscriptionAsPaid,
  type SubscriptionState,
  type SubscriptionStatus,
} from "@/lib/subscription"

type SubscriptionContextValue = {
  isReady: boolean
  status: SubscriptionStatus
  state: SubscriptionState | null
  encryptionKey?: string
  productPagePath: string
  remainingTrialDays: number
  markAsPaid: (unlockCode: string) => Promise<boolean>
  isUnlocking: boolean
  refresh: () => Promise<void>
}

const SubscriptionContext = createContext<SubscriptionContextValue | null>(null)

export function SubscriptionProvider({ children }: PropsWithChildren) {
  const [state, setState] = useState<SubscriptionState | null>(null)
  const [isReady, setIsReady] = useState(false)
  const [isUnlocking, setIsUnlocking] = useState(false)
  const refreshInFlight = useRef<Promise<void> | null>(null)

  const performRefresh = useCallback(async () => {
    const snapshot = await ensureSubscriptionState()
    setState(snapshot)
    setIsReady(true)
  }, [])

  useEffect(() => {
    const promise = performRefresh()
    refreshInFlight.current = promise
    promise.finally(() => {
      if (refreshInFlight.current === promise) {
        refreshInFlight.current = null
      }
    })
  }, [performRefresh])

  useEffect(() => {
    const tick = () => {
      const promise = performRefresh()
      refreshInFlight.current = promise
      promise.finally(() => {
        if (refreshInFlight.current === promise) {
          refreshInFlight.current = null
        }
      })
    }
    const interval = window.setInterval(tick, 60 * 60 * 1000)
    return () => {
      window.clearInterval(interval)
    }
  }, [performRefresh])

  const markAsPaid = useCallback(async (unlockCode: string) => {
    setIsUnlocking(true)
    try {
      const result = await markSubscriptionAsPaid(unlockCode)
      if (result.success && result.state) {
        setState(result.state)
        setIsReady(true)
        return true
      }
      return false
    } finally {
      setIsUnlocking(false)
    }
  }, [])

  const refresh = useCallback(async () => {
    if (refreshInFlight.current) {
      await refreshInFlight.current
      return
    }
    const promise = performRefresh()
    refreshInFlight.current = promise
    try {
      await promise
    } finally {
      if (refreshInFlight.current === promise) {
        refreshInFlight.current = null
      }
    }
  }, [performRefresh])

  const contextValue = useMemo<SubscriptionContextValue>(() => {
    const status = state?.status ?? "trial"
    return {
      isReady,
      status,
      state,
      encryptionKey: state?.encryptionKey,
      productPagePath: getProductPagePath(),
      remainingTrialDays: state?.remainingTrialDays ?? 0,
      markAsPaid,
      isUnlocking,
      refresh,
    }
  }, [isReady, state, markAsPaid, isUnlocking, refresh])

  return <SubscriptionContext.Provider value={contextValue}>{children}</SubscriptionContext.Provider>
}

export function useSubscription() {
  const value = useContext(SubscriptionContext)
  if (!value) {
    throw new Error("useSubscription must be used within a SubscriptionProvider")
  }
  return value
}
