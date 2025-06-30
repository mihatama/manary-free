"use client"

import type React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  Home,
  Calendar,
  Settings,
  Users,
  MessageSquare,
  FileText,
  BookHeart,
  CalendarClock,
  LogOut,
} from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Separator } from "@/components/ui/separator"

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
      href: "/dashboard/appointments",
      label: "予約一覧",
      icon: <Calendar className="h-5 w-5" />,
    },
    {
      href: "/dashboard/questionnaires",
      label: "問診票一覧",
      icon: <FileText className="h-5 w-5" />,
    },
    {
      href: "/dashboard/charts",
      label: "カルテ一覧",
      icon: <BookHeart className="h-5 w-5" />,
    },
    {
      href: "/dashboard/schedule-settings",
      label: "予約設定",
      icon: <CalendarClock className="h-5 w-5" />,
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
    <div className="border-r flex flex-col w-64">
      <div className="p-4">
        <Link href="/" className="font-bold text-2xl">
          Clinic Name
        </Link>
      </div>
      <Separator />
      <nav className="flex-1 py-4">
        <nav className="space-y-1">
          {navItems.map((item) => {
            const isActive =
              pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(`${item.href}`))

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                  isActive
                    ? "bg-manary-pink text-white"
                    : "text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
                }`}
              >
                <span className={`mr-3 ${isActive ? "text-white" : "text-gray-500 dark:text-gray-400"}`}>
                  {item.icon}
                </span>
                {item.label}
              </Link>
            )
          })}
        </nav>
      </nav>
      <Separator />
      <div className="p-4">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="w-full justify-start gap-2">
              <Avatar className="h-8 w-8">
                <AvatarImage src="https://github.com/shadcn.png" alt="@shadcn" />
                <AvatarFallback>SC</AvatarFallback>
              </Avatar>
              <div>
                <div className="font-bold">Your Name</div>
                <div className="text-sm text-muted-foreground">your.email@example.com</div>
              </div>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56" align="end" forceMount>
            <DropdownMenuItem>
              <Link href="/dashboard/profile" className="w-full">
                プロフィール
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem>
              <LogOut className="mr-2 h-4 w-4" />
              ログアウト
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  )
}
