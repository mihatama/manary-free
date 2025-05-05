"use client"

import { useTransition } from "react"
import { Button } from "@/components/ui/button"
import { logoutAction } from "@/app/actions/auth-actions"
import { LogOut } from "lucide-react"
import { useCSRF } from "@/hooks/use-csrf"

export function LogoutButton() {
  const [isPending, startTransition] = useTransition()
  const { csrfToken, isLoading, error } = useCSRF()

  // ログアウトボタンのエラーハンドリングを一貫させる
  const handleLogout = () => {
    if (!csrfToken) {
      console.error("Security token not available")
      return
    }

    const formData = new FormData()
    formData.append("csrf_token", csrfToken)

    startTransition(() => logoutAction(formData))
  }

  if (isLoading) {
    return (
      <Button variant="outline" size="sm" disabled>
        <span className="h-4 w-4 mr-1 animate-spin">⏳</span>
        読み込み中
      </Button>
    )
  }

  if (error) {
    return (
      <Button variant="outline" size="sm" disabled className="text-red-500">
        エラー
      </Button>
    )
  }

  return (
    <Button variant="outline" size="sm" onClick={handleLogout} disabled={isPending} className="flex items-center gap-1">
      <LogOut className="h-4 w-4" />
      <span>ログアウト</span>
    </Button>
  )
}
