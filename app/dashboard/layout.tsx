import type React from "react"
import { redirect } from "next/navigation"
import { requireAuth } from "@/lib/auth"
import { DashboardNav } from "@/components/dashboard-nav"

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  try {
    // 認証チェック
    const session = await requireAuth()
    const user = session?.user || { name: "ユーザー", role: "admin" }

    return (
      <div className="flex h-screen w-full bg-gray-50 dark:bg-gray-900">
        <DashboardNav />
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 md:p-8">{children}</main>
      </div>
    )
  } catch (error) {
    console.error("Error in DashboardLayout:", error)
    // エラーが発生した場合はログインページにリダイレクト
    redirect("/")
  }
}
