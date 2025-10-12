"use client"

import type { AuthUser } from "aws-amplify/auth"
import { Authenticator } from "@aws-amplify/ui-react"

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
  const userDisplayName = user?.signInDetails?.loginId ?? user?.username ?? "Manary User"

  return (
    <div className="min-h-screen bg-[#ffeaed]">
      <header className="border-b border-slate-200 bg-white">
        <div className="container mx-auto flex items-center justify-between px-4 py-4">
          <div>
            <h1 className="text-2xl font-bold text-[#f47b9a]">Manary カルテダッシュボード</h1>
            <p className="text-sm text-muted-foreground">
              乳房ケア・産後ケアカルテをブラウザのローカルストレージで安全に管理します。
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
        <ChartsManager />
      </main>
    </div>
  )
}
