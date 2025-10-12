"use client"

import { useRouter } from "next/navigation"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { badgeVariants } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { useSubscription } from "@/components/providers/subscription-provider"
import { cn } from "@/lib/utils"
import type { BillingSubscriptionStatus } from "@/lib/server/billing-client"

function formatDate(date?: Date) {
  if (!date) {
    return ""
  }
  try {
    return new Intl.DateTimeFormat("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      weekday: "short",
    }).format(date)
  } catch {
    return date.toLocaleDateString()
  }
}

function describeBackendStatus(status?: BillingSubscriptionStatus) {
  switch (status) {
    case "active":
      return "Active"
    case "trialing":
      return "Trialing"
    case "past_due":
      return "Past due"
    case "canceled":
      return "Canceled"
    case "incomplete":
      return "Incomplete"
    case "unpaid":
      return "Unpaid"
    default:
      return undefined
  }
}

export function TrialStatusBanner() {
  const router = useRouter()
  const { status, remainingTrialDays, state, productPagePath } = useSubscription()

  if (status === "paid") {
    return null
  }

  const trialEndsAt = state?.trialEndsAt
  const badgeText =
    status === "trial"
      ? remainingTrialDays <= 0
        ? "Trial ended"
        : `${remainingTrialDays} days left`
      : "Trial expired"

  const badgeVariant =
    status === "trial" ? (remainingTrialDays <= 5 ? "destructive" : "secondary") : "destructive"

  const handleNavigate = () => {
    router.push(productPagePath)
  }

  const backendStatus = describeBackendStatus(state?.backendStatus)
  const backendMessage = state?.backendMessage

  return (
    <Alert
      variant={status === "trial" && remainingTrialDays > 5 ? "default" : "destructive"}
      className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between"
    >
      <div className="space-y-2">
        <AlertTitle className="flex flex-col gap-2 md:flex-row md:items-center md:gap-3">
          <button
            type="button"
            onClick={handleNavigate}
            className="w-fit rounded-full border border-transparent bg-transparent p-0 text-left text-sm font-semibold text-primary focus:outline-none focus:ring-2 focus:ring-primary/40 focus:ring-offset-2"
          >
            <span className={cn(badgeVariants({ variant: badgeVariant }), "cursor-pointer px-3 py-1")}>
              {badgeText}
            </span>
          </button>
          {status === "trial" ? "You are using the free trial." : "The free trial has ended."}
        </AlertTitle>
        <AlertDescription>
          <div className="space-y-2 text-sm text-muted-foreground">
            {status === "trial" ? (
              <span>
                {trialEndsAt ? `Scheduled to end: ${formatDate(trialEndsAt)}.` : null}
                Click the badge above to review subscription options.
              </span>
            ) : (
              <span>Purchase a subscription to regain access to saved charts.</span>
            )}
            {backendStatus ? (
              <p className="text-xs text-muted-foreground">
                Billing status: {backendStatus}
                {backendMessage ? " - " + backendMessage : ""}
              </p>
            ) : null}
          </div>
        </AlertDescription>
      </div>
      <Button onClick={handleNavigate} className="w-full md:w-auto">
        View plans
      </Button>
    </Alert>
  )
}
