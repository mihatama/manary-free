import { readFile } from "node:fs/promises"
import path from "node:path"

import { z } from "zod"

export type BillingSubscriptionStatus = "trialing" | "active" | "past_due" | "canceled" | "incomplete" | "unpaid"
export type BillingPaymentStatus = "paid" | "failed" | "incomplete" | "pending" | "canceled" | "unpaid"

export type VerifySubscriptionResponse = {
  status: BillingSubscriptionStatus
  isActive: boolean
  trialEndsAt?: string | null
  currentPeriodEndsAt?: string | null
  cancelAtPeriodEnd?: boolean
  lastPaymentStatus?: BillingPaymentStatus
  reference?: string | null
  message?: string
}

const ACTIVE_STATUSES: BillingSubscriptionStatus[] = ["active", "trialing"]

const remoteResponseSchema = z.object({
  status: z.enum(["trialing", "active", "past_due", "canceled", "incomplete", "unpaid"]),
  trialEndsAt: z.string().nullable().optional(),
  currentPeriodEndsAt: z.string().nullable().optional(),
  cancelAtPeriodEnd: z.boolean().optional(),
  lastPaymentStatus: z.enum(["paid", "failed", "incomplete", "pending", "canceled", "unpaid"]).optional(),
  reference: z.string().nullable().optional(),
  message: z.string().optional(),
})

type RemoteResponse = z.infer<typeof remoteResponseSchema>

const localEntrySchema = remoteResponseSchema.extend({
  unlockCode: z.string(),
})

type LocalEntry = z.infer<typeof localEntrySchema>

export async function verifySubscription(unlockCode: string): Promise<VerifySubscriptionResponse> {
  const billingServiceUrl = process.env.BILLING_SERVICE_URL
  if (billingServiceUrl) {
    const response = await verifyWithRemoteService(billingServiceUrl, unlockCode)
    if (response) {
      return response
    }
  }
  return verifyWithLocalFixture(unlockCode)
}

async function verifyWithRemoteService(baseUrl: string, unlockCode: string): Promise<VerifySubscriptionResponse | null> {
  try {
    const url = new URL("/subscriptions/verify", baseUrl)
    const apiKey = process.env.BILLING_SERVICE_API_KEY
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(apiKey ? { Authorization: `Bearer ${apiKey}` } : {}),
      },
      body: JSON.stringify({ unlockCode }),
      cache: "no-store",
    })

    if (!response.ok) {
      const message = `Billing service responded with status ${response.status}`
      console.error(message)
      return {
        status: "canceled",
        isActive: false,
        message,
      }
    }

    const payload = await response.json()
    const candidate = payload?.subscription ?? payload
    const parsed = remoteResponseSchema.safeParse(candidate)
    if (!parsed.success) {
      console.error("Unable to parse billing response", parsed.error)
      return {
        status: "canceled",
        isActive: false,
        message: "Billing response was invalid.",
      }
    }

    return normalizeResponse(parsed.data)
  } catch (error) {
    console.error("Failed to contact billing service", error)
    return null
  }
}

async function verifyWithLocalFixture(unlockCode: string): Promise<VerifySubscriptionResponse> {
  try {
    const filePath = path.join(process.cwd(), "data", "subscriptions-dev.json")
    const raw = await readFile(filePath, "utf8")
    const entries = parseLocalEntries(raw)
    const match = entries.find((entry) => entry.unlockCode === unlockCode)
    if (!match) {
      return {
        status: "canceled",
        isActive: false,
        message: "Subscription not found in local fixture.",
      }
    }

    const { unlockCode: _ignored, ...rest } = match
    return normalizeResponse(rest)
  } catch (error) {
    console.error("Failed to inspect local subscription fixture", error)
    return {
      status: "canceled",
      isActive: false,
      message: "Billing information is unavailable.",
    }
  }
}

function normalizeResponse(payload: RemoteResponse): VerifySubscriptionResponse {
  const isActive = computeActivity(payload.status, payload.currentPeriodEndsAt)
  return {
    status: payload.status,
    isActive,
    trialEndsAt: payload.trialEndsAt ?? undefined,
    currentPeriodEndsAt: payload.currentPeriodEndsAt ?? undefined,
    cancelAtPeriodEnd: payload.cancelAtPeriodEnd,
    lastPaymentStatus: payload.lastPaymentStatus,
    reference: payload.reference ?? undefined,
    message: payload.message,
  }
}

function computeActivity(status: BillingSubscriptionStatus, currentPeriodEndsAt?: string | null): boolean {
  if (!ACTIVE_STATUSES.includes(status)) {
    return false
  }

  if (currentPeriodEndsAt) {
    const ends = new Date(currentPeriodEndsAt)
    if (!Number.isNaN(ends.getTime()) && ends.getTime() < Date.now()) {
      return false
    }
  }

  return true
}

function parseLocalEntries(source: string): LocalEntry[] {
  try {
    const parsed = JSON.parse(source) as unknown
    const array = z.array(localEntrySchema).safeParse(parsed)
    if (!array.success) {
      console.error("Local subscription fixture is invalid", array.error)
      return []
    }
    return array.data
  } catch (error) {
    console.error("Failed to parse local subscription fixture", error)
    return []
  }
}
