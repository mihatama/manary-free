"use client"

import { differenceInCalendarDays, isAfter } from "date-fns"

import { generateKeyBase64, sealKey, unsealKey, type SealedKey } from "./encryption"

const SUBSCRIPTION_STORAGE_KEY = "manary-free-subscription-state"
const ENCRYPTED_STATE_KEY = "manary-free-charts-state"

const FREE_TRIAL_DAYS = 30
const DEFAULT_UNLOCK_CODE = process.env.NEXT_PUBLIC_UNLOCK_CODE ?? "MANARY-UNLOCK-CODE"
const PRODUCT_PAGE_PATH = process.env.NEXT_PUBLIC_PRODUCT_PAGE_PATH ?? "/product"

export type SubscriptionStatus = "trial" | "expired" | "paid"

type RawSubscriptionState = {
  version: 1
  trialStartedAt: string
  trialEndsAt: string
  status: SubscriptionStatus
  encryptionKey?: string
  sealedKey?: SealedKey
  paidAt?: string
}

export type SubscriptionState = {
  status: SubscriptionStatus
  trialStartedAt: Date
  trialEndsAt: Date
  remainingTrialDays: number
  encryptionKey?: string
  sealedKey?: SealedKey
  paidAt?: Date
}

function readStorage(): RawSubscriptionState | null {
  if (typeof window === "undefined") {
    return null
  }

  try {
    const stored = window.localStorage.getItem(SUBSCRIPTION_STORAGE_KEY)
    if (!stored) {
      return null
    }
    const parsed = JSON.parse(stored) as RawSubscriptionState | null
    if (!parsed || parsed.version !== 1) {
      return null
    }
    return parsed
  } catch (error) {
    console.error("Failed to read subscription state", error)
    return null
  }
}

function writeStorage(state: RawSubscriptionState) {
  if (typeof window === "undefined") {
    return
  }
  try {
    window.localStorage.setItem(SUBSCRIPTION_STORAGE_KEY, JSON.stringify(state))
  } catch (error) {
    console.error("Failed to write subscription state", error)
  }
}

function ensureDate(value: string): Date {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return new Date()
  }
  return date
}

function toPublicState(raw: RawSubscriptionState): SubscriptionState {
  const trialStarts = ensureDate(raw.trialStartedAt)
  const trialEnds = ensureDate(raw.trialEndsAt)
  const remaining = Math.max(
    raw.status === "expired" ? 0 : differenceInCalendarDays(trialEnds, new Date()),
    0,
  )

  return {
    status: raw.status,
    trialStartedAt: trialStarts,
    trialEndsAt: trialEnds,
    remainingTrialDays: remaining,
    encryptionKey: raw.encryptionKey,
    sealedKey: raw.sealedKey,
    paidAt: raw.paidAt ? ensureDate(raw.paidAt) : undefined,
  }
}

function addDays(base: Date, days: number): Date {
  const next = new Date(base)
  next.setDate(next.getDate() + days)
  return next
}

async function createInitialState(): Promise<RawSubscriptionState> {
  const now = new Date()
  const encryptionKey = await generateKeyBase64()
  let sealedKey: SealedKey | undefined
  try {
    sealedKey = await sealKey(encryptionKey, DEFAULT_UNLOCK_CODE)
  } catch (error) {
    console.warn("Failed to create sealed key. Unlocking after trial may be unavailable.", error)
  }

  const state: RawSubscriptionState = {
    version: 1,
    trialStartedAt: now.toISOString(),
    trialEndsAt: addDays(now, FREE_TRIAL_DAYS).toISOString(),
    status: "trial",
    encryptionKey,
    sealedKey,
  }

  writeStorage(state)
  return state
}

async function ensureSealedKey(raw: RawSubscriptionState): Promise<RawSubscriptionState> {
  if (raw.sealedKey || !raw.encryptionKey) {
    return raw
  }
  try {
    const sealedKey = await sealKey(raw.encryptionKey, DEFAULT_UNLOCK_CODE)
    const next: RawSubscriptionState = { ...raw, sealedKey }
    writeStorage(next)
    return next
  } catch (error) {
    console.warn("Unable to seal encryption key", error)
    return raw
  }
}

export async function ensureSubscriptionState(): Promise<SubscriptionState> {
  if (typeof window === "undefined") {
    return {
      status: "trial",
      trialStartedAt: new Date(),
      trialEndsAt: addDays(new Date(), FREE_TRIAL_DAYS),
      remainingTrialDays: FREE_TRIAL_DAYS,
    }
  }

  let raw = readStorage()
  if (!raw) {
    raw = await createInitialState()
    return toPublicState(raw)
  }

  if (raw.status === "trial") {
    const now = new Date()
    const expiresAt = ensureDate(raw.trialEndsAt)
    if (isAfter(now, expiresAt)) {
      const sealedPrepared = await ensureSealedKey(raw)
      const updated: RawSubscriptionState = {
        ...sealedPrepared,
        status: "expired",
        encryptionKey: undefined,
      }
      writeStorage(updated)
      raw = updated
    }
  }

  return toPublicState(raw)
}

export function getEncryptedStateKey() {
  return ENCRYPTED_STATE_KEY
}

export function getProductPagePath() {
  return PRODUCT_PAGE_PATH
}

export async function markSubscriptionAsPaid(
  unlockCode: string,
): Promise<{ success: boolean; state?: SubscriptionState }> {
  if (typeof window === "undefined") {
    return { success: false }
  }

  const raw = readStorage()
  if (!raw) {
    return { success: false }
  }

  if (!raw.sealedKey) {
    console.error("No sealed key stored; cannot unlock subscription.")
    return { success: false }
  }

  try {
    const key = await unsealKey(raw.sealedKey, unlockCode)
    const now = new Date()
    const updated: RawSubscriptionState = {
      ...raw,
      status: "paid",
      encryptionKey: key,
      paidAt: now.toISOString(),
      sealedKey: await sealKey(key, unlockCode),
    }
    writeStorage(updated)
    return { success: true, state: toPublicState(updated) }
  } catch (error) {
    console.warn("Failed to unlock subscription", error)
    return { success: false }
  }
}

export async function resetSubscriptionForTesting() {
  if (typeof window === "undefined") {
    return
  }
  window.localStorage.removeItem(SUBSCRIPTION_STORAGE_KEY)
  window.localStorage.removeItem(ENCRYPTED_STATE_KEY)
}
