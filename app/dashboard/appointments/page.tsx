"use client"

import { useState, useEffect } from "react"
import { AppointmentsCalendar } from "@/components/appointments-calendar"
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card"
import { createClient as createServerClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { AppointmentsView } from "@/components/appointments-view"
import type { User } from "@supabase/supabase-js"
import { Skeleton } from "@/components/ui/skeleton"
import { useRouter } from "next/router"

export const dynamic = "force-dynamic"

export default async function AppointmentsPage() {
  const supabase = createServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login")
  }

  const [selectedDate, setSelectedDate] = useState<Date | undefined>()
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const [userState, setUser] = useState<User | null>(null)

  useEffect(() => {
    const checkUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) {
        router.push("/login")
      } else {
        setUser(user as User)
      }
      setLoading(false)
    }
    checkUser()
  }, [router])

  if (loading) {
    return (
      <div className="grid gap-4 md:grid-cols-[280px_1fr]">
        <div>
          <Skeleton className="h-8 w-48 mb-4" />
          <Skeleton className="h-[290px] w-full" />
        </div>
        <Card>
          <CardHeader>
            <Skeleton className="h-8 w-32" />
            <Skeleton className="h-5 w-full max-w-md" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-64 w-full" />
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="grid gap-6 md:grid-cols-[auto_1fr] lg:grid-cols-[300px_1fr]">
      <div className="flex flex-col gap-4">
        <h2 className="text-lg font-semibold">予約日を選択</h2>
        <AppointmentsCalendar selectedDate={selectedDate} onDateChange={setSelectedDate} />
      </div>
      <Card>
        <CardHeader>
          <CardTitle>予約一覧</CardTitle>
          <CardDescription>
            予約の検索、並び替えができます。カレンダーで日付を選択すると、その日の予約のみ表示されます。
          </CardDescription>
        </CardHeader>
        <CardContent>
          <AppointmentsView user={userState as User} />
        </CardContent>
      </Card>
    </div>
  )
}
