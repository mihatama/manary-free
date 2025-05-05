import type React from "react"
import { requireAuth } from "@/lib/auth"
import { LogoutButton } from "@/components/logout-button"
import { DashboardNav } from "@/components/dashboard-nav"
import Image from "next/image"
import Link from "next/link"
import { Menu } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { user } = await requireAuth()

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="container mx-auto px-4 py-3 flex justify-between items-center">
          <div className="flex items-center">
            <Sheet>
              <SheetTrigger asChild className="md:hidden mr-2">
                <Button variant="ghost" size="icon">
                  <Menu className="h-5 w-5" />
                  <span className="sr-only">メニュー</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-64 p-0">
                <div className="p-4 border-b">
                  <Link href="/dashboard" className="flex items-center">
                    <Image src="/manary-logo.png" alt="Manary Logo" width={40} height={40} className="mr-2" />
                    <h1 className="text-xl font-bold text-[#f8a0a0]">マナリー</h1>
                  </Link>
                </div>
                <div className="p-4">
                  <DashboardNav />
                </div>
              </SheetContent>
            </Sheet>
            <Link href="/dashboard" className="flex items-center">
              <Image src="/manary-logo.png" alt="Manary Logo" width={40} height={40} className="mr-2" />
              <h1 className="text-xl font-bold text-[#f8a0a0]">マナリー管理システム</h1>
            </Link>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-600 hidden sm:inline">
              {user.name} ({user.role})
            </span>
            <LogoutButton />
          </div>
        </div>
      </header>

      <div className="flex flex-1">
        <aside className="w-64 bg-white border-r border-gray-200 p-4 hidden md:block">
          <DashboardNav />
        </aside>

        <main className="flex-1">{children}</main>
      </div>
    </div>
  )
}
