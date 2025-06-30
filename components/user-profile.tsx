"use client"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { LogOut } from "lucide-react"
import Link from "next/link"
import { logOut } from "@/app/actions/auth-actions"
import type { User } from "@supabase/supabase-js"

export function UserProfile({ user }: { user: User }) {
  const handleLogout = async () => {
    await logOut()
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="w-full justify-start gap-2 text-left h-auto py-2">
          <Avatar className="h-9 w-9">
            <AvatarImage
              src={user.user_metadata?.avatar_url || "/placeholder.svg"}
              alt={user.user_metadata?.name ?? "User"}
            />
            <AvatarFallback>
              {user.user_metadata?.name?.charAt(0) ?? user.email?.charAt(0)?.toUpperCase() ?? "U"}
            </AvatarFallback>
          </Avatar>
          <div className="truncate flex-1">
            <div className="font-semibold truncate text-sm">{user.user_metadata?.name ?? "User Name"}</div>
            <div className="text-xs text-muted-foreground truncate">{user.email}</div>
          </div>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end" forceMount>
        <DropdownMenuItem asChild>
          <Link href="/dashboard/settings">プロフィール設定</Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleLogout} className="cursor-pointer text-red-500 focus:text-red-500">
          <LogOut className="mr-2 h-4 w-4" />
          ログアウト
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
