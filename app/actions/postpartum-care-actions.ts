"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import type { Tables } from "@/lib/supabase/database.types"
import { unstable_noStore as noStore } from "next/cache"

type ChartInsert = Tables<"postpartum_care_charts">["Insert"]
type ChartUpdate = Tables<"postpartum_care_charts">["Update"]

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
  revalidatePath("/dashboard/charts")
  return { data }
}

export async function getPostpartumCareChartById(id: number) {
  noStore()
  const supabase = createClient()
  const { data, error } = await supabase
    .from("postpartum_care_charts")
    .select(`*, reservations(*, questionnaires(*))`)
    .eq("id", id)
    .single()

  if (error) {
    console.error("Error fetching postpartum care chart by id:", error)
  }

  return { data, error }
}
