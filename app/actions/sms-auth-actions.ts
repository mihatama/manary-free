"use server"

import { createClient } from "@/lib/supabase/server"
import { unstable_noStore as noStore } from "next/cache"

export async function getAppointmentsByPhone(
  phoneNumber: string,
): Promise<{ success: boolean; data?: any[]; error?: string }> {
  noStore()
  console.log(`[Action] getAppointmentsByPhone called with: ${phoneNumber}`)
  const supabase = createClient()

  try {
    const { data, error } = await supabase
      .from("reservations")
      .select(
        `
  id,
  reservation_date,
  start_time,
  end_time,
  status,
  access_token,
  patient_phone,
  clinics (
    name,
    address,
    phone_number
  ),
  service_types (
    name,
    duration,
    color
  ),
  questionnaires (
    id
  )
`,
      )
      .eq("patient_phone", phoneNumber)
      .neq("status", "cancelled")
      .order("reservation_date", { ascending: true })
      .order("start_time", { ascending: true })

    if (error) {
      console.error("Supabase error fetching appointments by phone:", error)
      return { success: false, error: `データベースエラー: ${error.message}` }
    }

    if (!data) {
      console.log("[Action] No data returned from Supabase.")
      return { success: true, data: [] }
    }

    console.log(`[Action] Found ${data.length} appointments from Supabase.`)

    const transformedData = data.map((item) => {
      // Supabase returns the joined table as an array.
      // A reservation can have at most one questionnaire.
      const questionnaire = Array.isArray(item.questionnaires) ? item.questionnaires[0] : null

      const result = {
        ...item,
        questionnaire_id: questionnaire ? questionnaire.id : null,
        token: item.access_token, // Rename access_token to token for the frontend
      }
      // Clean up the original questionnaires array to avoid confusion
      delete (result as any).questionnaires
      delete (result as any).access_token

      return result
    })

    console.log("[Action] Transformed data:", transformedData)

    return { success: true, data: transformedData }
  } catch (error: any) {
    console.error("Unhandled error in getAppointmentsByPhone:", error)
    return { success: false, error: "予約情報の取得中に予期せぬエラーが発生しました。" }
  }
}
