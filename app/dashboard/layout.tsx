import type React from "react"

import { DashboardNav } from "@/components/dashboard-nav"
import { Toaster } from "@/components/ui/toaster"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex min-h-screen w-full bg-background">
      <DashboardNav />
      <main className="flex-1 p-4 sm:p-6 lg:p-8">{children}</main>
      <Toaster />
    </div>
  )
}
