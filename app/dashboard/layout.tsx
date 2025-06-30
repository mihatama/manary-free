import type React from "react"
import { DashboardNav } from "@/components/dashboard-nav"
import { UserProfile } from "@/components/user-profile"
import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import type { User } from "@supabase/supabase-js"

export const dynamic = "force-dynamic"

async function checkAuth(): Promise<User> {
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
  const user = await checkAuth()

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-950">
      {/* Sidebar */}
      <div className="w-64 bg-white dark:bg-gray-900 border-r dark:border-gray-800 flex flex-col">
        <div className="p-4 border-b dark:border-gray-800">
          <div className="flex items-center space-x-3">
            <img src="/manary-logo.png" alt="Manary" className="h-8 w-auto" />
            <span className="text-xl font-semibold text-gray-800 dark:text-white">管理画面</span>
          </div>
        </div>

        <nav className="flex-1 p-3 overflow-y-auto">
          <DashboardNav />
        </nav>

        <div className="p-3 border-t dark:border-gray-800">
          <UserProfile user={user} />
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-50 dark:bg-gray-950 p-6">{children}</main>
      </div>
    </div>
  )
}
