import { AppointmentsClient } from "@/components/appointments-client"
import { createClient } from "@/lib/supabase/server"
import type { Tables } from "@/lib/supabase/database.types"

type AppointmentWithDetails = Tables<"appointments"> & {
  questionnaires: Tables<"questionnaires"> | null
  service_types: Tables<"service_types"> | null
  clinics: Tables<"clinics"> | null
}

export const dynamic = "force-dynamic"

async function getAppointments() {
  try {
    const supabase = createClient()

    const { data, error } = await supabase
      .from("appointments")
      .select(`
        *,
        service_types (
          name,
          duration,
          color
        ),
        clinics (
          name,
          address,
          phone
        ),
        questionnaires (
          *
        )
      `)
      .order("appointment_date", { ascending: true })
      .order("start_time", { ascending: true })

    if (error) {
      console.error("予約一覧取得エラー:", error)
      return { data: null, error: error.message }
    }

    return { data, error: null }
  } catch (error) {
    console.error("Error in getAppointments:", error)
    return { data: null, error: "予約情報の取得に失敗しました" }
  }
}

export default async function AppointmentsPage() {
  const { data: appointments, error } = await getAppointments()

  if (error) {
    return (
      <div className="container mx-auto py-10">
        <h1 className="text-3xl font-bold mb-6">予約一覧</h1>
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <div className="text-red-800">予約データの読み込みに失敗しました</div>
          <div className="text-red-600 text-sm mt-1">{error}</div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-10">
      <h1 className="text-3xl font-bold mb-6">予約一覧</h1>
      <AppointmentsClient appointments={appointments || []} />
    </div>
  )
}
