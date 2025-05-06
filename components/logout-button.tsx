"use client"

import { useTransition } from "react"
import { Button } from "@/components/ui/button"
import { logoutAction } from "@/app/actions/auth-actions"
import { LogOut } from "lucide-react"
import { useCSRF } from "@/hooks/use-csrf"
import { useRouter } from "next/navigation"

export function LogoutButton() {
  const [isPending, startTransition] = useTransition()
  const { csrfToken, isLoading, error } = useCSRF()
  const router = useRouter()

  // ログアウトボタンのエラーハンドリングを一貫させる
  const handleLogout = () => {
    if (!csrfToken) {
      console.error("Security token not available")
      // Even if CSRF token is not available, attempt to logout
      // This is a fallback mechanism
      window.location.href = "/"
      return
    }

    const formData = new FormData()
    formData.append("csrf_token", csrfToken)

    startTransition(async () => {
      try {
        const result = await logoutAction(formData)
        if (result.success) {
          // Handle successful logout on the client side
          router.push("/")
        } else {
          console.error("Logout failed:", result.error)
          // Fallback to client-side redirect
          window.location.href = "/"
        }
      } catch (error) {
        console.error("Logout failed:", error)
        // If server action fails, fallback to client-side redirect
        window.location.href = "/"
      }
    })
  }

  if (isLoading) {
    return (
      <Button variant="outline" size="sm" disabled>
        <span className="h-4 w-4 mr-1 animate-spin">⏳</span>
        読み込み中
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
