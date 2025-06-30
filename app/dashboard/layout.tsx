import type React from "react"
import { DashboardNav } from "@/components/dashboard-nav"
import { Toaster } from "@/components/ui/toaster"
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import type { Database } from "@/lib/supabase/database.types"

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const cookieStore = cookies()
  const supabase = createServerComponentClient<Database>({
    cookies: () => cookieStore,
  })
  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) {
    redirect("/")
  }

  return (
    <div className="flex min-h-screen w-full bg-background">
      <DashboardNav />
      <main className="flex-1 p-4 sm:p-6 lg:p-8">{children}</main>
      <Toaster />
    </div>
  )
}
