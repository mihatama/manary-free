"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Home, Calendar, FileText, Users, MessageSquare, Settings, LogOut, BarChart3 } from "lucide-react"
import { cn } from "@/lib/utils"
import Image from "next/image"
import { Button } from "./ui/button"
import { logOut } from "@/app/actions/auth-actions"

const navItems = [
  { href: "/dashboard", label: "ダッシュボード", icon: Home },
  { href: "/dashboard/appointments", label: "予約一覧", icon: Calendar },
  { href: "/dashboard/questionnaires", label: "問診票一覧", icon: FileText },
  { href: "/dashboard/charts", label: "カルテ一覧", icon: BarChart3 },
  { href: "/dashboard/schedule-settings", label: "予約設定", icon: Settings },
  { href: "/dashboard/users", label: "利用者管理", icon: Users },
  { href: "/dashboard/messages", label: "メッセージ", icon: MessageSquare },
  { href: "/dashboard/settings", label: "システム設定", icon: Settings },
]

export function DashboardNav() {
  const pathname = usePathname()

  return (
    <aside className="hidden w-64 flex-col border-r bg-card p-4 sm:flex">
      <div className="flex items-center gap-2 mb-8">
        <Image src="/manary-logo.png" alt="Manary Logo" width={32} height={32} />
        <h1 className="text-lg font-bold text-foreground">管理画面</h1>
      </div>
      <nav className="flex-1 space-y-1">
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-all hover:text-primary",
              pathname === item.href && "bg-primary/10 text-primary",
            )}
          >
            <item.icon className="h-4 w-4" />
            {item.label}
          </Link>
        ))}
      </nav>
      <div className="mt-auto">
        <form action={logOut}>
          <Button variant="ghost" className="w-full justify-start">
            <LogOut className="mr-2 h-4 w-4" />
            ログアウト
          </Button>
        </form>
      </div>
    </aside>
  )
}
