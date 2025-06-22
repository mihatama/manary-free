"use client"

import type React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { LayoutDashboard, CalendarDays, Settings, Users, ClipboardList } from "lucide-react"

interface NavItem {
  href: string
  label: string
  icon: React.ElementType
}

const navItems: NavItem[] = [
  {
    href: "/dashboard",
    label: "Dashboard",
    icon: LayoutDashboard,
  },
  {
    href: "/dashboard/appointments",
    label: "Appointments",
    icon: CalendarDays,
  },
  {
    href: "/dashboard/schedule-settings",
    label: "Schedule Settings",
    icon: Settings,
  },
  {
    href: "/dashboard/users",
    label: "Users",
    icon: Users,
  },
  {
    href: "/reservation/manage",
    label: "Manage Reservations",
    icon: ClipboardList,
  },
]

export function DashboardNav() {
  const pathname = usePathname()

  return (
    <nav className="grid items-start gap-2">
      {navItems.map((item) => {
        const Icon = item.icon
        return (
          <Link key={item.href} href={item.href}>
            <span
              className={cn(
                "group flex items-center rounded-md px-3 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground",
                pathname === item.href ? "bg-accent" : "transparent",
              )}
            >
              <Icon className="mr-2 h-4 w-4" />
              <span>{item.label}</span>
            </span>
          </Link>
        )
      })}
    </nav>
  )
}
