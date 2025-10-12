"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import type { AuthUser } from "aws-amplify/auth"
import { Authenticator } from "@aws-amplify/ui-react"

import { TrialStatusBanner } from "@/components/subscription/trial-status-banner"
import { useSubscription } from "@/components/providers/subscription-provider"
import { Button } from "@/components/ui/button"
import { ChartsManager } from "@/components/charts/charts-manager"

export default function DashboardPage() {
  return (
    <Authenticator>
      {({ user, signOut }) => <DashboardContent user={user} onSignOut={signOut} />}
    </Authenticator>
  )
}

type DashboardContentProps = {
  user?: AuthUser
  onSignOut: () => void | Promise<void>
}

function DashboardContent({ user, onSignOut }: DashboardContentProps) {
  const router = useRouter()
  const { isReady: isSubscriptionReady, status, productPagePath } = useSubscription()
  const userDisplayName = user?.signInDetails?.loginId ?? user?.username ?? "Manary User"

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
        <p className="text-sm text-muted-foreground">利用状況を確認しています…</p>
      </div>
    )
  }

  if (status === "expired") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-accent">
        <p className="text-sm text-muted-foreground">無料期間が終了したため、商品ページへ移動します…</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-accent">
      <header className="border-b border-slate-200 bg-white">
        <div className="container mx-auto flex items-center justify-between px-4 py-4">
          <div>
            <h1 className="text-2xl font-bold text-primary">Manary カルテダッシュボード</h1>
            <p className="text-sm text-muted-foreground">
              乳房ケア・産後ケアのカルテをブラウザのローカルストレージで安全に管理できます。
            </p>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-muted-foreground">{userDisplayName}</span>
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
