"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

// NOTE: This assumes a `postpartum_care_charts` table exists in your database.
// You may need to create it based on the fields used in `postpartum-care-chart.tsx`.
export type PostpartumCareChart = {
  id?: number
  appointment_id: number
  created_at?: string
  visit_date?: string | null
  practitioner_name?: string | null
  mother_condition?: string | null
  lochia_status?: string | null
  episiotomy_pain?: string | null
  constipation_status?: string | null
  mental_state?: string | null
  family_support?: string | null
  baby_condition?: string | null
  jaundice_level?: string | null
  umbilical_cord_status?: string | null
  feeding_status?: string | null
  care_plan?: string | null
  guidance?: string | null
  payment_details?: string | null
}

type ChartInsert = Omit<PostpartumCareChart, "id" | "created_at">
type ChartUpdate = PostpartumCareChart

export async function getPostpartumCareChartByAppointmentId(appointmentId: number) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from("postpartum_care_charts")
    .select("*")
    .eq("appointment_id", appointmentId)
    .single()

  if (error && error.code !== "PGRST116") {
    // PGRST116: no rows found
    console.error("Error fetching postpartum care chart:", error)
    return { error: error.message }
  }

  return { data }
}

export async function upsertPostpartumCareChart(chartData: ChartInsert | ChartUpdate) {
  const supabase = createClient()

  if (!chartData.appointment_id) {
    return { error: "Appointment ID is required." }
  }

  const { data, error } = await supabase
    .from("postpartum_care_charts")
    .upsert(chartData, { onConflict: "appointment_id" })
    .select()
    .single()

  if (error) {
    console.error("Error upserting postpartum care chart:", error)
    return { error: error.message }
  }

  revalidatePath("/dashboard/appointments")
  return { data }
}
