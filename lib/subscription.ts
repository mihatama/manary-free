"use client"

import { differenceInCalendarDays, differenceInMinutes, isAfter } from "date-fns"

import { generateKeyBase64, sealKey, unsealKey, type SealedKey } from "./encryption"
import type { BillingSubscriptionStatus, VerifySubscriptionResponse } from "@/lib/server/billing-client"

const SUBSCRIPTION_STORAGE_KEY = "manary-free-subscription-state"
const ENCRYPTED_STATE_KEY = "manary-free-charts-state"

const FREE_TRIAL_DAYS = 30
const DEFAULT_UNLOCK_CODE = process.env.NEXT_PUBLIC_UNLOCK_CODE ?? "MANARY-UNLOCK-CODE"
const PRODUCT_PAGE_PATH = process.env.NEXT_PUBLIC_PRODUCT_PAGE_PATH ?? "/product"
const BACKEND_SYNC_INTERVAL_MINUTES = 60

export type SubscriptionStatus = "trial" | "expired" | "paid"

type RawSubscriptionState = {
  version: 1
  trialStartedAt: string
  trialEndsAt: string
  status: SubscriptionStatus
  encryptionKey?: string
  sealedKey?: SealedKey
  paidAt?: string
  unlockCode?: string
  backendStatus?: BillingSubscriptionStatus
  currentPeriodEndsAt?: string
  lastSyncedAt?: string
  lastPaymentStatus?: string
  backendReference?: string
  backendMessage?: string
}

export type SubscriptionState = {
  status: SubscriptionStatus
  trialStartedAt: Date
  trialEndsAt: Date
  remainingTrialDays: number
  encryptionKey?: string
  sealedKey?: SealedKey
  paidAt?: Date
  backendStatus?: BillingSubscriptionStatus
  currentPeriodEndsAt?: Date
  lastSyncedAt?: Date
  lastPaymentStatus?: string
  backendReference?: string
  backendMessage?: string
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
    backendStatus: raw.backendStatus,
    currentPeriodEndsAt: raw.currentPeriodEndsAt ? ensureDate(raw.currentPeriodEndsAt) : undefined,
    lastSyncedAt: raw.lastSyncedAt ? ensureDate(raw.lastSyncedAt) : undefined,
    lastPaymentStatus: raw.lastPaymentStatus,
    backendReference: raw.backendReference,
    backendMessage: raw.backendMessage,
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

  if (shouldSyncWithBackend(raw)) {
    const prepared = await ensureSealedKey(raw)
    const verification = await verifyWithBackend(prepared.unlockCode!)
    if (verification) {
      const updated = applyBackendVerification(prepared, verification, prepared.unlockCode!)
      writeStorage(updated)
      raw = updated
    } else {
      const updated: RawSubscriptionState = {
        ...prepared,
        lastSyncedAt: new Date().toISOString(),
        backendMessage: "Failed to contact billing service.",
      }
      writeStorage(updated)
      raw = updated
    }
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

function shouldSyncWithBackend(raw: RawSubscriptionState): boolean {
  if (!raw.unlockCode) {
    return false
  }

  if (!raw.lastSyncedAt) {
    return true
  }

  if (raw.status === "trial") {
    return true
  }

  const now = new Date()
  const lastSyncedAt = ensureDate(raw.lastSyncedAt)
  const minutesSinceSync = differenceInMinutes(now, lastSyncedAt)
  if (minutesSinceSync >= BACKEND_SYNC_INTERVAL_MINUTES) {
    return true
  }

  if (raw.currentPeriodEndsAt) {
    const periodEnds = ensureDate(raw.currentPeriodEndsAt)
    if (isAfter(now, periodEnds)) {
      return true
    }
  }

  return false
}

async function verifyWithBackend(unlockCode: string): Promise<VerifySubscriptionResponse | null> {
  if (typeof window === "undefined") {
    return null
  }

  try {
    const response = await fetch("/api/subscription/verify", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ unlockCode }),
    })

    if (!response.ok) {
      console.warn("Billing service returned an error status.", response.status)
      return null
    }

    const payload = (await response.json()) as VerifySubscriptionResponse | null
    if (!payload || typeof payload.status !== "string") {
      console.warn("Billing service response was not understood.", payload)
      return null
    }

    return payload
  } catch (error) {
    console.error("Failed to verify subscription with backend.", error)
    return null
  }
}

function applyBackendVerification(
  raw: RawSubscriptionState,
  verification: VerifySubscriptionResponse,
  unlockCode: string,
): RawSubscriptionState {
  const next: RawSubscriptionState = {
    ...raw,
    unlockCode,
    backendStatus: verification.status,
    lastSyncedAt: new Date().toISOString(),
    backendMessage: verification.message ?? raw.backendMessage,
    backendReference: verification.reference ?? raw.backendReference,
    lastPaymentStatus: verification.lastPaymentStatus ?? raw.lastPaymentStatus,
    currentPeriodEndsAt:
      verification.currentPeriodEndsAt === null
        ? undefined
        : verification.currentPeriodEndsAt ?? raw.currentPeriodEndsAt,
  }

  if (verification.trialEndsAt ?? raw.trialEndsAt) {
    const trialEndsAt = verification.trialEndsAt ?? raw.trialEndsAt
    if (trialEndsAt) {
      next.trialEndsAt = trialEndsAt
    }
  }

  if (!verification.isActive) {
    return {
      ...next,
      status: "expired",
      encryptionKey: undefined,
    }
  }

  if (verification.status === "trialing") {
    return {
      ...next,
      status: "trial",
    }
  }

  return {
    ...next,
    status: "paid",
  }
}

export async function markSubscriptionAsPaid(
  unlockCode: string,
): Promise<{ success: boolean; state?: SubscriptionState; error?: string }> {
  if (typeof window === "undefined") {
    return { success: false, error: "Subscription activation is only supported in the browser." }
  }

  const raw = readStorage()
  if (!raw) {
    return { success: false, error: "Subscription state could not be located." }
  }

  const prepared = await ensureSealedKey(raw)

  if (!prepared.sealedKey) {
    console.error("No sealed key stored; cannot unlock subscription.")
    return { success: false, error: "Unlocking is unavailable for this browser session." }
  }

  const verification = await verifyWithBackend(unlockCode)
  if (!verification) {
    return {
      success: false,
      error: "Unable to confirm the billing status. Check your connection and try again.",
    }
  }

  if (!verification.isActive) {
    const updated = applyBackendVerification(prepared, verification, unlockCode)
    writeStorage(updated)
    return {
      success: false,
      state: toPublicState(updated),
      error:
        verification.message ??
        "Billing is not active for this subscription. Please confirm the card payment status.",
    }
  }

  try {
    const key = await unsealKey(prepared.sealedKey, unlockCode)
    const now = new Date()
    const updated: RawSubscriptionState = {
      ...prepared,
      status: "paid",
      encryptionKey: key,
      paidAt: now.toISOString(),
      sealedKey: await sealKey(key, unlockCode),
      unlockCode,
      backendStatus: verification.status,
      currentPeriodEndsAt: verification.currentPeriodEndsAt ?? raw.currentPeriodEndsAt,
      lastSyncedAt: now.toISOString(),
      lastPaymentStatus: verification.lastPaymentStatus ?? raw.lastPaymentStatus,
      backendReference: verification.reference ?? raw.backendReference,
      backendMessage: verification.message ?? raw.backendMessage,
    }
    writeStorage(updated)
    return { success: true, state: toPublicState(updated) }
  } catch (error) {
    console.warn("Failed to unlock subscription", error)
    return { success: false, error: "The unlock code is invalid." }
  }
}

export async function resetSubscriptionForTesting() {
  if (typeof window === "undefined") {
    return
  }
  window.localStorage.removeItem(SUBSCRIPTION_STORAGE_KEY)
  window.localStorage.removeItem(ENCRYPTED_STATE_KEY)
}
