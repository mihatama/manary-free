"use client"

import { useState } from "react"
import type { User } from "@supabase/supabase-js"
import { AppointmentsClient } from "@/components/appointments-client"
import { AppointmentsCalendar } from "@/components/appointments-calendar"
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card"

interface AppointmentsViewProps {
  user: User
}

export function AppointmentsView({ user }: AppointmentsViewProps) {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>()

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
          <AppointmentsClient
            user={{ id: user.id, name: user.user_metadata.name || null, email: user.email }}
            selectedDate={selectedDate}
          />
        </CardContent>
      </Card>
    </div>
  )
}
