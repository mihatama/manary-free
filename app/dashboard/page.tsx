"use client"

import { useEffect } from "react"
import Image from "next/image"
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
        return "有料プラン（お支払い要確認）"
      }
      if (backendStatus === "trialing") {
        return "有料プラン（決済側トライアル中）"
      }
      return "有料プラン"
    }
    case "trial": {
      if (normalizedDays <= 0) {
        return "無料トライアル（本日終了）"
      }
      return `無料トライアル（残り${normalizedDays}日）`
    }
    default:
      return "無料トライアル（終了済み）"
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
        <p className="text-sm text-muted-foreground">契約状況を確認しています...</p>
      </div>
    )
  }

  if (status === "expired") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-accent">
        <p className="text-sm text-muted-foreground">無料トライアルが終了しました。プラン案内ページへ移動します...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-accent">
      <header className="border-b border-slate-200 bg-white">
        <div className="container mx-auto flex items-center justify-between px-4 py-4">
          <div className="flex items-center gap-3">
            <Image
              src="/manary-logo.png"
              alt="Manary"
              width={42}
              height={42}
              className="h-10 w-10 rounded-full border border-primary/20 bg-white object-cover"
              priority
            />
            <div>
              <h1 className="text-2xl font-bold text-primary">Manary ダッシュボード</h1>
              <p className="text-sm text-muted-foreground">
                乳房ケアと産後ケアのカルテを暗号化されたローカル保存で管理します。
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex flex-col items-end gap-1 text-right">
              <span className="text-sm font-medium text-primary">{userDisplayName}</span>
              <span className="text-xs text-muted-foreground">現在のプラン: {currentPlan}</span>
            </div>
            <Button
              variant="outline"
              onClick={() => {
                void onSignOut()
              }}
            >
              サインアウト
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
