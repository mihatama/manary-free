import { AppointmentsClient } from "@/components/appointments-client"
import { getAppointments } from "@/app/actions/reservation-actions"
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card"

export const dynamic = "force-dynamic"

export default async function AppointmentsPage() {
  const initialAppointments = await getAppointments({})

  return (
    <Card>
      <CardHeader>
        <CardTitle>予約一覧</CardTitle>
        <CardDescription>予約の検索、並び替えができます。</CardDescription>
      </CardHeader>
      <CardContent>
        <AppointmentsClient initialAppointments={initialAppointments} />
      </CardContent>
    </Card>
  )
}
