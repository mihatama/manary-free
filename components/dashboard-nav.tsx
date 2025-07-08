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
    <aside className="hidden w-64 flex-col border-r border-pink-100 p-6 sm:flex" 
           style={{ backgroundColor: '#ffeaed' }}>
      {/* ヘッダー部分 */}
      <div className="flex items-center gap-3 mb-10 pb-6 border-b border-pink-200/60">
        <div className="relative">
          <Image 
            src="/manary-logo.png" 
            alt="Manary Logo" 
            width={50} 
            height={50}
            className="rounded-xl shadow-sm bg-white p-2"
          />
        </div>
        <div>
          <h1 className="text-xl font-bold bg-gradient-to-r from-rose-600 to-pink-600 bg-clip-text text-transparent">
            Manary
          </h1>
          <p className="text-xs text-rose-500/70 font-medium">管理画面</p>
        </div>
      </div>

      {/* ナビゲーション */}
      <nav className="flex-1 space-y-2">
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "group flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all duration-200 ease-in-out",
              pathname === item.href 
                ? "bg-white/80 text-rose-700 shadow-md shadow-pink-200/50 scale-[1.02]" 
                : "text-rose-600/70 hover:text-rose-700 hover:bg-white/50 hover:scale-[1.01] hover:shadow-sm"
            )}
          >
            <item.icon className={cn(
              "h-5 w-5 transition-colors duration-200",
              pathname === item.href 
                ? "text-rose-600" 
                : "text-rose-500/60 group-hover:text-rose-600"
            )} />
            <span className="font-medium">{item.label}</span>
            {pathname === item.href && (
              <div className="ml-auto w-2 h-2 bg-rose-500 rounded-full shadow-sm"></div>
            )}
          </Link>
        ))}
      </nav>

      {/* ログアウトボタン */}
      <div className="mt-auto pt-6 border-t border-pink-200/60">
        <form action={logOut}>
          <Button 
            variant="ghost" 
            className="w-full justify-start group text-rose-600/70 hover:text-rose-700 hover:bg-white/50 transition-all duration-200 rounded-xl py-3"
          >
            <LogOut className="mr-3 h-5 w-5 text-rose-500/60 group-hover:text-rose-600 transition-colors duration-200" />
            <span className="font-medium">ログアウト</span>
          </Button>
        </form>
      </div>
    </aside>
  )
}