"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import type { AuthUser } from "aws-amplify/auth"
import { Authenticator } from "@aws-amplify/ui-react"

import { TrialStatusBanner } from "@/components/subscription/trial-status-banner"
import { useSubscription } from "@/components/providers/subscription-provider"
import { Button } from "@/components/ui/button"
import { ChartsManager } from "@/components/charts/charts-manager"
import type { SubscriptionStatus } from "@/lib/subscription"

type DashboardContentProps = {
  user?: AuthUser
  onSignOut: () => void | Promise<void>
}

function describePlan(status: SubscriptionStatus, remainingDays: number, backendStatus?: string | null) {
  const normalizedDays = Math.max(remainingDays, 0)

  switch (status) {
    case "paid": {
      if (backendStatus === "past_due" || backendStatus === "unpaid") {
        return "Paid plan (payment needs attention)"
      }
      if (backendStatus === "trialing") {
        return "Paid plan (billing provider trial)"
      }
      return "Paid plan"
    }
    case "trial": {
      if (normalizedDays <= 0) {
        return "Free plan (ends today)"
      }
      return `Free plan (${normalizedDays} day${normalizedDays === 1 ? "" : "s"} remaining)`
    }
    default:
      return "Free plan (expired)"
  }
}

export default function DashboardPage() {
  return (
    <Authenticator>
      {({ user, signOut }) => <DashboardContent user={user} onSignOut={signOut} />}
    </Authenticator>
  )
}

function DashboardContent({ user, onSignOut }: DashboardContentProps) {
  const router = useRouter()
  const {
    isReady: isSubscriptionReady,
    status,
    productPagePath,
    remainingTrialDays,
    state,
  } = useSubscription()

  const userDisplayName = user?.signInDetails?.loginId ?? user?.username ?? "Manary User"
  const currentPlan = describePlan(status, remainingTrialDays, state?.backendStatus)

  useEffect(() => {
    if (!isSubscriptionReady) {
      return
    }
    if (status === "expired") {
      void router.replace(productPagePath)
    }
  }, [isSubscriptionReady, status, router, productPagePath])

  if (!isSubscriptionReady) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-accent">
        <p className="text-sm text-muted-foreground">Confirming subscription status...</p>
      </div>
    )
  }

  if (status === "expired") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-accent">
        <p className="text-sm text-muted-foreground">Your free trial has ended. Redirecting to the plans page...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-accent">
      <header className="border-b border-slate-200 bg-white">
        <div className="container mx-auto flex items-center justify-between px-4 py-4">
          <div>
            <h1 className="text-2xl font-bold text-primary">Manary Dashboard</h1>
            <p className="text-sm text-muted-foreground">
              Manage breast-care and postpartum-care charts with encrypted local storage.
            </p>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex flex-col items-end gap-1 text-right">
              <span className="text-sm font-medium text-primary">{userDisplayName}</span>
              <span className="text-xs text-muted-foreground">Current plan: {currentPlan}</span>
            </div>
            <Button
              variant="outline"
              onClick={() => {
                void onSignOut()
              }}
            >
              Sign out
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-10">
        <div className="space-y-8">
          <TrialStatusBanner />
          <ChartsManager />
        </div>
      </main>
    </div>
  )
}
