"use server"

import { createClient } from "@/lib/supabase/server"
import { unstable_noStore as noStore } from "next/cache"

export async function getAppointmentsByPhoneNumber(phoneNumber: string) {
  noStore()
  const supabase = createClient()

  // Normalize phone number to E.164 format for query if it's not already
  const formattedPhoneNumber = phoneNumber.startsWith("+") ? phoneNumber : `+81${phoneNumber.substring(1)}`

  const { data, error } = await supabase
    .from("reservations")
    .select(
      `
    id,
    reservation_date,
    start_time,
    end_time,
    status,
    token,
    questionnaire_id,
    clinics (name, address, phone_number),
    service_types (name, duration, color)
  `,
    )
    .eq("patient_phone", formattedPhoneNumber)
    .order("reservation_date", { ascending: false })

  if (error) {
    console.error("Error fetching appointments by phone number:", error.message)
    return { success: false, message: "予約の取得に失敗しました。", data: [] }
  }

  return { success: true, data: data || [] }
}

// 電話番号で予約を取得 (Simplified Logic)
export async function getAppointmentsByPhone(
  phoneNumber: string,
): Promise<{ success: boolean; data?: any[]; error?: string }> {
  const supabase = createClient()
  try {
    // Directly query the reservations table using the new patient_phone column
    const { data, error } = await supabase
      .from("reservations")
      .select(
        `
          *,
          access_token,
          questionnaire_id,
          service_types (
            id,
            name,
            duration,
            color
          ),
          clinics (
            name,
            address,
            phone_number
          )
        `,
      )
      .eq("patient_phone", phoneNumber) // Use the new column for direct lookup
      .neq("status", "cancelled")
      .order("reservation_date", { ascending: true })
      .order("start_time", { ascending: true })

    if (error) {
      console.error("Supabase reservation lookup error:", error)
      return { success: false, error: `データベースエラー: ${error.message}` }
    }

    return { success: true, data: data }
  } catch (error: any) {
    console.error("Unhandled error in getAppointmentsByPhone:", error)
    return { success: false, error: "予約情報の取得中に予期せぬエラーが発生しました。" }
  }
}
