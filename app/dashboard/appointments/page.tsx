import { AppointmentsClient } from "@/components/appointments-client"
import { getAppointments } from "@/app/actions/reservation-actions"
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card"
import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { format } from "date-fns"
import { ja } from "date-fns/locale"

export const dynamic = "force-dynamic"

export default async function AppointmentsPage() {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login")
  }

  let initialAppointmentsData: any = { data: [], count: 0 }
  try {
    // Fetch today's appointments by default
    initialAppointmentsData = await getAppointments({ filterDate: "today" })
  } catch (error) {
    console.error("Failed to fetch initial appointments:", error)
  }

  const { data: initialAppointments, count } = initialAppointmentsData

  return (
    <Card>
      <CardHeader>
        <CardTitle>予約一覧</CardTitle>
        <CardDescription>
          本日 ({format(new Date(), "yyyy年M月d日 (E)", { locale: ja })}) の予約一覧です。タブで全予約の表示も可能です。
        </CardDescription>
      </CardHeader>
      <CardContent>
        <AppointmentsClient
          initialAppointments={initialAppointments || []}
          initialCount={count || 0}
          user={{ id: user.id, name: user.user_metadata.name || null, email: user.email }}
        />
      </CardContent>
    </Card>
  )
}
