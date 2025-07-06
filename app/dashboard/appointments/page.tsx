import { AppointmentsClient } from "@/components/appointments-client"
import { getAppointments } from "@/app/actions/reservation-actions"
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card"
import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"

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
    initialAppointmentsData = await getAppointments({})
  } catch (error) {
    console.error("Failed to fetch initial appointments:", error)
  }

  const { data: initialAppointments } = initialAppointmentsData

  return (
    <Card>
      <CardHeader>
        <CardTitle>予約一覧</CardTitle>
        <CardDescription>予約の検索、並び替えができます。</CardDescription>
      </CardHeader>
      <CardContent>
        <AppointmentsClient
          initialAppointments={initialAppointments || []}
          user={{ id: user.id, name: user.user_metadata.name || null, email: user.email }}
        />
      </CardContent>
    </Card>
  )
}
