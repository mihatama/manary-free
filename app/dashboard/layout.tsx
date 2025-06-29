import type React from "react"
import { DashboardNav } from "@/components/dashboard-nav"
import { LogoutButton } from "@/components/logout-button"
import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"

export const dynamic = "force-dynamic"

async function checkAuth() {
  try {
    const supabase = createClient()
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser()

    if (error || !user) {
      redirect("/")
    }

    return user
  } catch (error) {
    console.error("Authentication check failed:", error)
    redirect("/")
  }
}

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  await checkAuth()

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <div className="w-64 bg-white shadow-md flex flex-col">
        <div className="p-4 border-b">
          <div className="flex items-center space-x-2">
            <img src="/manary-logo.png" alt="Manary" className="h-8 w-auto" />
            <span className="text-xl font-semibold text-gray-800">管理画面</span>
          </div>
        </div>

        <nav className="flex-1 p-4">
          <DashboardNav />
        </nav>

        <div className="p-4 border-t">
          <LogoutButton />
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="bg-white shadow-sm border-b">
          <div className="px-6 py-4">
            <h1 className="text-2xl font-semibold text-gray-900">ダッシュボード</h1>
          </div>
        </header>
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-100 p-6">{children}</main>
      </div>
    </div>
  )
}
