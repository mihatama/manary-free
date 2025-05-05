"use client"

import { useTransition } from "react"
import { Button } from "@/components/ui/button"
import { logoutAction } from "@/app/actions/auth-actions"
import { LogOut } from "lucide-react"

export function LogoutButton() {
  const [isPending, startTransition] = useTransition()

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={() => startTransition(() => logoutAction())}
      disabled={isPending}
      className="flex items-center gap-1"
    >
      <LogOut className="h-4 w-4" />
      <span>ログアウト</span>
    </Button>
  )
}
