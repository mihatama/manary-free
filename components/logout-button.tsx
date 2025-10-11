"use client"

import { Button } from "@/components/ui/button"
import { resetLocalData } from "@/lib/storage/local-storage"
import { LogOut } from "lucide-react"
import { useRouter } from "next/navigation"

export function LogoutButton() {
  const router = useRouter()

  const handleLogout = () => {
    if (window.confirm("ローカルに保存されたデータを削除してトップページに戻りますか？")) {
      resetLocalData()
      router.push("/")
    }
  }

  return (
    <Button variant="outline" size="sm" onClick={handleLogout} className="flex items-center gap-1">
      <LogOut className="h-4 w-4" />
      <span>ログアウト</span>
    </Button>
  )
}
