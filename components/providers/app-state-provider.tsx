"use client"

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react"
import { signOut, useSession } from "next-auth/react"
import type { DefaultSession } from "next-auth"
import { v4 as uuidv4 } from "uuid"

type ReservationStatus = "pending" | "confirmed" | "cancelled"

type Reservation = {
  id: string
  patientName: string
  patientEmail: string
  patientPhone: string
  serviceTypeId: string
  serviceTypeName: string
  appointmentDate: string
  appointmentTime: string
  notes?: string
  status: ReservationStatus
  createdAt: string
}

type ServiceType = {
  id: string
  name: string
  durationMinutes: number
}

type AppState = {
  reservations: Reservation[]
  serviceTypes: ServiceType[]
}

type AppStateContextValue = {
  isReady: boolean
  currentUser?: DefaultSession["user"]
  reservations: Reservation[]
  serviceTypes: ServiceType[]
  logout: () => Promise<void>
  createReservation: (reservation: Omit<Reservation, "id" | "status" | "createdAt">) => Reservation
  updateReservationStatus: (id: string, status: ReservationStatus) => void
  deleteReservation: (id: string) => void
  resetState: () => void
}

const STORAGE_KEY = "manary-local-app-state"

const defaultServiceTypes: ServiceType[] = [
  { id: "prenatal", name: "妊婦健診", durationMinutes: 60 },
  { id: "postnatal", name: "産後ケア", durationMinutes: 90 },
  { id: "breast", name: "乳房ケア", durationMinutes: 45 },
]

const defaultState: AppState = {
  reservations: [],
  serviceTypes: defaultServiceTypes,
}

const AppStateContext = createContext<AppStateContextValue | undefined>(undefined)

function loadState(): AppState {
  if (typeof window === "undefined") {
    return defaultState
  }

  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (!stored) {
      return defaultState
    }

    const parsed = JSON.parse(stored) as Partial<AppState>

    const reservations = Array.isArray(parsed.reservations) ? parsed.reservations : []
    const serviceTypes =
      parsed.serviceTypes && parsed.serviceTypes.length > 0 ? parsed.serviceTypes : defaultServiceTypes

    return {
      reservations,
      serviceTypes,
    }
  } catch (error) {
    console.error("Failed to load local state", error)
    return defaultState
  }
}

function persistState(state: AppState) {
  if (typeof window === "undefined") {
    return
  }

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  } catch (error) {
    console.error("Failed to persist local state", error)
  }
}

export function AppStateProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AppState>(defaultState)
  const [isLocalReady, setIsLocalReady] = useState(false)
  const { data: session, status } = useSession()

  useEffect(() => {
    const initialState = loadState()
    setState(initialState)
    setIsLocalReady(true)
  }, [])

  useEffect(() => {
    if (isLocalReady) {
      persistState(state)
    }
  }, [state, isLocalReady])

  const logout = useCallback(async () => {
    await signOut({ callbackUrl: "/" })
  }, [])

  const createReservation = useCallback<AppStateContextValue["createReservation"]>((reservation) => {
    const newReservation: Reservation = {
      ...reservation,
      id: uuidv4(),
      status: "pending",
      createdAt: new Date().toISOString(),
    }

    setState((prev) => ({
      reservations: [...prev.reservations, newReservation],
      serviceTypes: prev.serviceTypes,
    }))

    return newReservation
  }, [])

  const updateReservationStatus = useCallback<AppStateContextValue["updateReservationStatus"]>((id, status) => {
    setState((prev) => ({
      reservations: prev.reservations.map((reservation) =>
        reservation.id === id ? { ...reservation, status } : reservation,
      ),
      serviceTypes: prev.serviceTypes,
    }))
  }, [])

  const deleteReservation = useCallback<AppStateContextValue["deleteReservation"]>((id) => {
    setState((prev) => ({
      reservations: prev.reservations.filter((reservation) => reservation.id !== id),
      serviceTypes: prev.serviceTypes,
    }))
  }, [])

  const resetState = useCallback(() => {
    setState({
      reservations: [],
      serviceTypes: defaultServiceTypes,
    })
  }, [])

  const isReady = isLocalReady && status !== "loading"

  const contextValue = useMemo<AppStateContextValue>(() => {
    return {
      isReady,
      currentUser: session?.user,
      reservations: state.reservations,
      serviceTypes: state.serviceTypes,
      logout,
      createReservation,
      updateReservationStatus,
      deleteReservation,
      resetState,
    }
  }, [
    isReady,
    session?.user,
    state.reservations,
    state.serviceTypes,
    logout,
    createReservation,
    updateReservationStatus,
    deleteReservation,
    resetState,
  ])

  return <AppStateContext.Provider value={contextValue}>{children}</AppStateContext.Provider>
}

export function useAppState() {
  const context = useContext(AppStateContext)
  if (!context) {
    throw new Error("useAppState must be used within an AppStateProvider")
  }
  return context
}

export type { Reservation, ReservationStatus, ServiceType }
