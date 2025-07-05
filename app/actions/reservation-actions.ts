"use server"

import { createClient } from "@/lib/supabase/server"
import { unstable_noStore as noStore, revalidatePath } from "next/cache"
import type { Database } from "@/lib/supabase/database.types"
import { v4 as uuidv4 } from "uuid"
import { cookies } from "next/headers"

// Types
type Reservation = Database["public"]["Tables"]["reservations"]["Row"]
type ServiceType = Database["public"]["Tables"]["service_types"]["Row"]
export type ReservationWithService = Reservation & {
  service_types: Pick<ServiceType, "name" | "color"> | null
}

// Helper to format time from minutes to HH:mm
const formatTime = (minutes: number): string => {
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  return `${hours.toString().padStart(2, "0")}:${mins.toString().padStart(2, "0")}`
}

// Helper to parse HH:mm or HH:mm:ss to minutes from midnight
const timeToMinutes = (time: string): number => {
  if (!time || !/^\d{2}:\d{2}(:\d{2})?$/.test(time)) return 0
  const [hours, minutes] = time.split(":").map(Number)
  return hours * 60 + minutes
}

export async function getAppointments({
  page = 1,
  limit = 10,
  sortBy = "reservation_date",
  sortOrder = "desc",
  search = "",
}: {
  page?: number
  limit?: number
  sortBy?: string
  sortOrder?: "asc" | "desc"
  search?: string
}) {
  noStore()
  const supabase = createClient()
  const offset = (page - 1) * limit

  try {
    let query = supabase
      .from("reservations")
      .select("*, service_types(name, color), patients!inner(name, kana, email, phone_number)", { count: "exact" })

    if (search) {
      query = query.ilike("patients.name", `%${search}%`)
    }

    const sortableColumns: { [key: string]: string } = {
      date: "reservation_date",
      time: "start_time",
      status: "status",
      patient_name: "patients.name",
    }
    const dbSortBy = sortableColumns[sortBy] || "reservation_date"

    query = query
      .order(dbSortBy, { ascending: sortOrder === "asc", referencedTable: "patients" })
      .range(offset, offset + limit - 1)

    const { data, error, count } = await query

    if (error) {
      console.error("Error fetching appointments:", error.message)
      throw new Error("予約情報の取得に失敗しました。")
    }

    return { data: data as any, count: count ?? 0 }
  } catch (error) {
    console.error(
      "An unexpected error occurred in getAppointments:",
      error instanceof Error ? error.message : "Unknown error",
    )
    throw new Error("予約情報の取得に失敗しました。")
  }
}

export async function getAppointmentByToken(token: string): Promise<ReservationWithService | null> {
  noStore()
  const supabase = createClient()
  try {
    const { data: reservation, error } = await supabase
      .from("reservations")
      .select("*, service_types(name, color)")
      .eq("access_token", token)
      .single()

    if (error || !reservation) {
      console.error("Error fetching reservation by token:", error?.message)
      return null
    }

    return reservation as any
  } catch (error) {
    console.error(
      "An unexpected error occurred in getAppointmentByToken:",
      error instanceof Error ? error.message : "Unknown error",
    )
    return null
  }
}

export async function updateAppointment(
  id: number,
  updates: Partial<Database["public"]["Tables"]["reservations"]["Update"]>,
) {
  const supabase = createClient()
  const { error } = await supabase.from("reservations").update(updates).eq("id", id)

  if (error) {
    console.error("Error updating appointment:", error.message)
    return { success: false, message: "予約の更新に失敗しました。" }
  }

  revalidatePath("/dashboard/appointments")
  revalidatePath("/reservation")
  return { success: true, message: "予約が更新されました。" }
}

export async function getAvailableSlots(clinicId: number, date: string) {
  console.log(`[Action:getAvailableSlots] ClinicID: ${clinicId}, Date: ${date}`)
  const supabase = createClient()

  try {
    const { data: serviceTypes, error: serviceTypesError } = await supabase
      .from("service_types")
      .select("id, duration")
      .eq("clinic_id", clinicId)

    if (serviceTypesError) throw new Error(`診療メニューの取得に失敗しました: ${serviceTypesError.message}`)
    if (!serviceTypes || serviceTypes.length === 0) return { availableSlots: [], existingReservations: [] }

    const serviceTypeIds = serviceTypes.map((st) => st.id)
    const targetDate = new Date(date)
    const dayOfWeek = targetDate.getDay()

    const { data: settings, error: settingsError } = await supabase
      .from("availability_settings")
      .select("*")
      .in("service_type_id", serviceTypeIds)
      .or(`specific_date.eq.${date},and(day_of_week.eq.${dayOfWeek},specific_date.is.null)`)

    if (settingsError) throw new Error(`予約設定の取得に失敗しました: ${settingsError.message}`)

    const { data: existingReservations, error: reservationsError } = await supabase
      .from("reservations")
      .select("reservation_date, start_time, end_time, service_type_id")
      .eq("clinic_id", clinicId)
      .eq("reservation_date", date)
      .neq("status", "cancelled")

    if (reservationsError) throw new Error(`既存の予約の取得に失敗しました: ${reservationsError.message}`)

    const availableSlots: {
      date: string
      startTime: string
      endTime: string
      serviceTypeId: number
    }[] = []

    for (const serviceType of serviceTypes) {
      const { id: serviceTypeId, duration } = serviceType
      if (!duration || duration <= 0) continue

      const relevantSettings = settings?.filter((s) => s.service_type_id === serviceTypeId) || []
      const specificDateSettings = relevantSettings.filter((s) => s.specific_date === date)
      const dayOfWeekSettings = relevantSettings.filter((s) => s.day_of_week === dayOfWeek && !s.specific_date)

      const finalSettings = (specificDateSettings.length > 0 ? specificDateSettings : dayOfWeekSettings).filter(
        (s) => s.is_available,
      )

      for (const setting of finalSettings) {
        const startMinutes = timeToMinutes(setting.start_time)
        const endMinutes = timeToMinutes(setting.end_time)
        let currentMinutes = startMinutes

        while (currentMinutes + duration <= endMinutes) {
          const slotStartTime = formatTime(currentMinutes)
          const slotEndTime = formatTime(currentMinutes + duration)

          const isBooked = existingReservations?.some(
            (res) =>
              slotStartTime < (res.end_time || "00:00").substring(0, 5) &&
              slotEndTime > (res.start_time || "00:00").substring(0, 5),
          )

          if (!isBooked) {
            availableSlots.push({
              date: date,
              startTime: slotStartTime,
              endTime: slotEndTime,
              serviceTypeId: serviceTypeId,
            })
          }
          currentMinutes += duration
        }
      }
    }

    type ExistingReservation = {
      reservation_date: string | null
      start_time: string | null
      end_time: string | null
      service_type_id: number | null
    }

    return { availableSlots, existingReservations: (existingReservations as ExistingReservation[]) || [] }
  } catch (error: any) {
    console.error("Error in getAvailableSlots:", error.message)
    return { error: error.message || "利用可能な予約枠の取得中にエラーが発生しました。" }
  }
}

export async function createReservation(formData: FormData) {
  const supabase = createClient()
  const cookieStore = cookies()

  try {
    const patientData = {
      name: formData.get("patient_name") as string,
      kana: formData.get("patient_kana") as string,
      phone_number: formData.get("patient_phone") as string,
      email: formData.get("patient_email") as string,
    }

    const reservationData = {
      clinic_id: Number(formData.get("clinic_id")),
      service_type_id: Number(formData.get("service_type_id")),
      reservation_date: formData.get("reservation_date") as string,
      start_time: formData.get("start_time") as string,
      end_time: formData.get("end_time") as string,
      status: "confirmed" as const,
      note: formData.get("note") as string,
      access_token: uuidv4(),
    }

    let { data: patient, error: patientError } = await supabase
      .from("patients")
      .select("id")
      .eq("phone_number", patientData.phone_number)
      .single()

    if (patientError && patientError.code !== "PGRST116") throw patientError

    if (!patient) {
      const { data: newPatient, error: newPatientError } = await supabase
        .from("patients")
        .insert(patientData)
        .select("id")
        .single()
      if (newPatientError) throw newPatientError
      patient = newPatient
    } else {
      const { error: updateError } = await supabase
        .from("patients")
        .update({ name: patientData.name, kana: patientData.kana, email: patientData.email })
        .eq("id", patient.id)
      if (updateError) throw updateError
    }

    const { data: newReservation, error: reservationError } = await supabase
      .from("reservations")
      .insert({ ...reservationData, patient_id: patient.id })
      .select()
      .single()

    if (reservationError) throw reservationError

    revalidatePath("/reservation/new")
    revalidatePath("/dashboard/appointments")

    cookieStore.set("new_reservation_id", newReservation.id.toString(), { path: "/" })

    return { success: true, data: newReservation }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "不明なエラーが発生しました。"
    return { success: false, message: `予約の作成に失敗しました: ${errorMessage}`, data: null }
  }
}

export const createAppointment = createReservation

export async function cancelAppointment(id: number) {
  const supabase = createClient()
  const { data, error } = await supabase.from("reservations").update({ status: "cancelled" }).eq("id", id).select()

  if (error) {
    return { success: false, message: "予約のキャンセルに失敗しました。" }
  }

  revalidatePath("/reservation")
  revalidatePath("/dashboard/appointments")
  return { success: true, data }
}

export async function updateReservationStatus(id: number, status: string) {
  return updateAppointment(id, { status })
}

export async function deleteReservation(id: number) {
  const supabase = createClient()
  const { error } = await supabase.from("reservations").delete().eq("id", id)

  if (error) {
    return { success: false, message: "予約の削除に失敗しました。" }
  }

  revalidatePath("/dashboard/appointments")
  return { success: true, message: "予約が削除されました。" }
}
