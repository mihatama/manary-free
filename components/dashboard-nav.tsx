"use client"

import type React from "react"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Home, Calendar, Settings, Users, MessageSquare, BookOpen } from "lucide-react"

interface NavItem {
  href: string
  label: string
  icon: React.ReactNode
}

export function DashboardNav() {
  const pathname = usePathname()

  const navItems: NavItem[] = [
    {
      href: "/dashboard",
      label: "ダッシュボード",
      icon: <Home className="h-5 w-5" />,
    },
    {
      href: "/dashboard/schedule-settings",
      label: "予約設定",
      icon: <Calendar className="h-5 w-5" />,
    },
    {
      href: "/dashboard/appointments",
      label: "予約一覧",
      icon: <BookOpen className="h-5 w-5" />,
    },
    {
      href: "/dashboard/users",
      label: "利用者管理",
      icon: <Users className="h-5 w-5" />,
    },
    {
      href: "/dashboard/messages",
      label: "メッセージ",
      icon: <MessageSquare className="h-5 w-5" />,
    },
    {
      href: "/dashboard/settings",
      label: "システム設定",
      icon: <Settings className="h-5 w-5" />,
    },
  ]

  return (
    <nav className="space-y-1">
      {navItems.map((item) => {
        const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`)

        return (
          <Link
            key={item.href}
            href={item.href}
            className={`flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
              isActive ? "bg-manary-pink text-white" : "text-gray-600 hover:bg-gray-100"
            }`}
          >
            <span className={`mr-3 ${isActive ? "text-white" : "text-gray-500"}`}>{item.icon}</span>
            {item.label}
          </Link>
        )
      })}
    </nav>
  )
}
