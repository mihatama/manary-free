"use server"

import { createClient } from "@/lib/supabase/server"
import { unstable_noStore as noStore, revalidatePath } from "next/cache"
import type { Database } from "@/lib/supabase/database.types"
import { v4 as uuidv4 } from "uuid"
import { cookies } from "next/headers"
import { startOfMonth, endOfMonth, eachDayOfInterval, format, getDay } from "date-fns"

// Types
type Reservation = Database["public"]["Tables"]["reservations"]["Row"]
type ServiceType = Database["public"]["Tables"]["service_types"]["Row"]
export type ReservationWithService = Reservation & {
  service_types: Pick<ServiceType, "id" | "name" | "color"> | null
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
  filterDate = "all", // new parameter: 'today', 'all', or a 'YYYY-MM-DD' string
}: {
  page?: number
  limit?: number
  sortBy?: string
  sortOrder?: "asc" | "desc"
  search?: string
  filterDate?: "today" | "all" | string
}) {
  noStore()
  const supabase = createClient()
  const offset = (page - 1) * limit

  try {
    let query = supabase.from("reservations").select(
      `
        *,
        service_types ( id, name, color ),
        patients!inner ( id, name, kana, email, phone_number ),
        questionnaires ( id, data, created_at )
      `,
      { count: "exact" },
    )

    if (search) {
      query = query.ilike("patients.name", `%${search}%`)
    }

    // New date filtering logic
    if (filterDate === "today") {
      const today = format(new Date(), "yyyy-MM-dd")
      query = query.eq("reservation_date", today)
    } else if (filterDate !== "all") {
      query = query.eq("reservation_date", filterDate)
    }

    const sortableColumns: { [key: string]: string } = {
      date: "reservation_date",
      time: "start_time",
      status: "status",
      patient_name: "patients.name",
    }
    const dbSortBy = sortableColumns[sortBy] || "reservation_date"

    const orderOptions: { ascending: boolean; referencedTable?: string } = {
      ascending: sortOrder === "asc",
    }

    if (sortBy === "patient_name") {
      orderOptions.referencedTable = "patients"
    }

    query = query.order(dbSortBy, orderOptions).range(offset, offset + limit - 1)

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
  if (!token || token === "undefined") {
    console.warn("getAppointmentByToken called with invalid token.")
    return null
  }
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
  console.log(`[Action:getAvailableSlots] START - ClinicID: ${clinicId}, Date: ${date}`)
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
    console.log(`[Action:getAvailableSlots] Fetched availability_settings for ${date}:`, settings)

    const { data: existingReservations, error: reservationsError } = await supabase
      .from("reservations")
      .select("id, reservation_date, start_time, end_time, status, service_type_id")
      .eq("clinic_id", clinicId)
      .eq("reservation_date", date)
      .neq("status", "cancelled")

    if (reservationsError) throw new Error(`既存の予約の取得に失敗しました: ${reservationsError.message}`)
    console.log(`[Action:getAvailableSlots] Fetched existingReservations for ${date}:`, existingReservations)

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
            const newSlot = {
              date: date,
              startTime: slotStartTime,
              endTime: slotEndTime,
              serviceTypeId: serviceTypeId,
            }
            // console.log(`[Action:getAvailableSlots] Generated available slot:`, newSlot);
            availableSlots.push(newSlot)
          }
          currentMinutes += duration
        }
      }
    }
    console.log(`[Action:getAvailableSlots] END - Returning for ${date}:`, {
      availableSlots,
      existingReservations: (existingReservations as Reservation[]) || [],
    })
    return { availableSlots, existingReservations: (existingReservations as Reservation[]) || [] }
  } catch (error: any) {
    console.error(`[Action:getAvailableSlots] CATCH ERROR for ${date}:`, error.message)
    return { error: error.message || "利用可能な予約枠の取得中にエラーが発生しました。" }
  }
}

export async function createReservation(formData: FormData) {
  const supabase = createClient()
  const cookieStore = await cookies()

  console.log("[Action:createReservation] Received FormData:", Object.fromEntries(formData.entries()))

  try {
    const patientPhoneNumber = formData.get("patient_phone") as string
    const email = formData.get("patient_email") as string
    const patientData = {
      name: formData.get("patient_name") as string,
      kana: formData.get("patient_kana") as string,
      phone_number: patientPhoneNumber,
      email: email || null, // Use null if email is empty
    }
    console.log("[Action:createReservation] Parsed patient data:", patientData)

    const reservationData = {
      clinic_id: Number(formData.get("clinic_id")),
      service_type_id: Number(formData.get("service_type_id")),
      reservation_date: formData.get("reservation_date") as string,
      start_time: formData.get("start_time") as string,
      end_time: formData.get("end_time") as string,
      status: "confirmed" as const,
      note: null, // Notes field is removed from form
      access_token: uuidv4(),
      patient_phone: patientPhoneNumber, // Save the phone number directly
    }
    console.log("[Action:createReservation] Parsed reservation data:", reservationData)

    // Step 1: Find existing patient
    console.log("[Action:createReservation] Step 1: Finding patient with phone", patientData.phone_number)
    let { data: patient, error: patientError } = await supabase
      .from("patients")
      .select("id")
      .eq("phone_number", patientData.phone_number)
      .single()

    if (patientError && patientError.code !== "PGRST116") {
      // PGRST116: no rows found
      console.error("[Action:createReservation] Error finding patient:", patientError)
      throw patientError
    }
    console.log("[Action:createReservation] Found patient:", patient)

    // Step 2: Create or update patient
    if (!patient) {
      console.log("[Action:createReservation] Step 2a: Patient not found, creating new one.")
      const { data: newPatient, error: newPatientError } = await supabase
        .from("patients")
        .insert(patientData)
        .select("id")
        .single()
      if (newPatientError) {
        console.error("[Action:createReservation] Error creating new patient:", newPatientError)
        throw newPatientError
      }
      patient = newPatient
      console.log("[Action:createReservation] Created new patient:", patient)
    } else {
      console.log("[Action:createReservation] Step 2b: Patient found, updating details for patient ID:", patient.id)
      const { error: updateError } = await supabase
        .from("patients")
        .update({ name: patientData.name, kana: patientData.kana, email: patientData.email })
        .eq("id", patient.id)
      if (updateError) {
        console.error("[Action:createReservation] Error updating patient:", updateError)
        throw updateError
      }
      console.log("[Action:createReservation] Successfully updated patient.")
    }

    // Step 3: Create reservation
    console.log("[Action:createReservation] Step 3: Creating reservation for patient ID:", patient.id)
    const { data: newReservation, error: reservationError } = await supabase
      .from("reservations")
      .insert({ ...reservationData, patient_id: patient.id })
      .select()
      .single()

    if (reservationError) {
      console.error("[Action:createReservation] Error creating reservation:", reservationError)
      throw reservationError
    }
    console.log("[Action:createReservation] Successfully created reservation:", newReservation)

    revalidatePath("/reservation/new")
    revalidatePath("/dashboard/appointments")

    cookieStore.set("new_reservation_id", newReservation.id.toString(), { path: "/" })

    return { success: true, data: newReservation }
  } catch (error: any) {
    console.error("[Action:createReservation] CATCH BLOCK - Full error object:", error)
    const errorMessage = error.message || "不明なエラーが発生しました。"
    const detailedMessage = error.details ? `${errorMessage} 詳細: ${error.details}` : errorMessage
    console.error("[Action:createReservation] CATCH BLOCK:", detailedMessage)
    return { success: false, message: `予約の作成に失敗しました: ${detailedMessage}`, data: null }
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

export async function getCalendarEventsForMonth(clinicId: number, serviceTypeId: number, month: string) {
  noStore()
  console.log(
    `[Action:getCalendarEventsForMonth] START - ClinicID: ${clinicId}, ServiceTypeID: ${serviceTypeId}, Month: ${month}`,
  )
  const supabase = createClient()

  try {
    const targetMonth = new Date(`${month}-01T00:00:00`)
    const startDate = startOfMonth(targetMonth)
    const endDate = endOfMonth(targetMonth)

    // 1. Fetch service type details
    console.log(`[Action:getCalendarEventsForMonth] Fetching service type ${serviceTypeId}`)
    const { data: serviceType, error: serviceTypeError } = await supabase
      .from("service_types")
      .select("id, duration")
      .eq("id", serviceTypeId)
      .single()

    if (serviceTypeError) throw new Error(`診療メニューの取得に失敗しました: ${serviceTypeError.message}`)
    if (!serviceType || !serviceType.duration || serviceType.duration <= 0) {
      console.warn(
        `[Action:getCalendarEventsForMonth] Service type ${serviceTypeId} not found or has invalid duration.`,
      )
      return { events: [] }
    }
    const { duration } = serviceType
    console.log(`[Action:getCalendarEventsForMonth] Service duration: ${duration} minutes.`)

    // 2. Fetch all reservations for the month
    console.log(`[Action:getCalendarEventsForMonth] Fetching reservations for month ${month}`)
    const { data: reservations, error: reservationsError } = await supabase
      .from("reservations")
      .select("id, reservation_date, start_time, end_time, status, service_type_id")
      .eq("clinic_id", clinicId)
      .eq("service_type_id", serviceTypeId)
      .gte("reservation_date", format(startDate, "yyyy-MM-dd"))
      .lte("reservation_date", format(endDate, "yyyy-MM-dd"))
      .neq("status", "cancelled")

    if (reservationsError) throw new Error(`既存の予約の取得に失敗しました: ${reservationsError.message}`)
    console.log(`[Action:getCalendarEventsForMonth] Found ${reservations?.length || 0} existing reservations.`)

    // 3. Fetch all relevant availability settings
    console.log(`[Action:getCalendarEventsForMonth] Fetching availability settings for service type ${serviceTypeId}`)
    const { data: settings, error: settingsError } = await supabase
      .from("availability_settings")
      .select("*")
      .eq("service_type_id", serviceTypeId)
      .or(
        `specific_date.gte.${format(startDate, "yyyy-MM-dd")},specific_date.lte.${format(
          endDate,
          "yyyy-MM-dd",
        )},specific_date.is.null`,
      )

    if (settingsError) throw new Error(`予約設定の取得に失敗しました: ${settingsError.message}`)
    console.log(`[Action:getCalendarEventsForMonth] Found ${settings?.length || 0} availability settings.`)

    const events: {
      title: string
      start: string // ISO string
      end: string // ISO string
      isAvailable: boolean
    }[] = []

    // Add existing reservations to events
    reservations?.forEach((res) => {
      if (res.reservation_date && res.start_time && res.end_time) {
        const start = new Date(`${res.reservation_date}T${res.start_time}+09:00`)
        const end = new Date(`${res.reservation_date}T${res.end_time}+09:00`)
        if (!isNaN(start.getTime()) && !isNaN(end.getTime())) {
          events.push({
            title: "予約済",
            start: start.toISOString(),
            end: end.toISOString(),
            isAvailable: false,
          })
        }
      }
    })

    // Create a lookup for booked slots
    const bookedSlots = new Set(reservations?.map((r) => `${r.reservation_date}T${r.start_time}`))

    // Process each day of the month
    const daysInMonth = eachDayOfInterval({ start: startDate, end: endDate })
    const weeklySettings = settings?.filter((s) => !s.specific_date && s.is_available) || []
    const specificDateSettings = settings?.filter((s) => s.specific_date && s.is_available) || []
    console.log(
      `[Action:getCalendarEventsForMonth] Processing ${daysInMonth.length} days. Weekly settings: ${weeklySettings.length}, Specific date settings: ${specificDateSettings.length}`,
    )

    for (const day of daysInMonth) {
      const dayStr = format(day, "yyyy-MM-dd")
      const dayOfWeek = getDay(day)

      const specificSettingsForDay = specificDateSettings.filter((s) => s.specific_date === dayStr)
      const weeklySettingsForDay = weeklySettings.filter((s) => s.day_of_week === dayOfWeek)

      const finalSettings = specificSettingsForDay.length > 0 ? specificSettingsForDay : weeklySettingsForDay

      for (const setting of finalSettings) {
        const startMinutes = timeToMinutes(setting.start_time)
        const endMinutes = timeToMinutes(setting.end_time)
        let currentMinutes = startMinutes

        while (currentMinutes + duration <= endMinutes) {
          const slotStartTime = formatTime(currentMinutes)
          const slotEndTime = formatTime(currentMinutes + duration)
          const slotStartDateTime = `${dayStr}T${slotStartTime}:00`

          if (!bookedSlots.has(slotStartDateTime.substring(0, 19))) {
            const start = new Date(`${dayStr}T${slotStartTime}:00+09:00`)
            const end = new Date(`${dayStr}T${slotEndTime}:00+09:00`)
            if (!isNaN(start.getTime()) && !isNaN(end.getTime())) {
              events.push({
                title: slotStartTime,
                start: start.toISOString(),
                end: end.toISOString(),
                isAvailable: true,
              })
            }
          }
          currentMinutes += duration
        }
      }
    }

    console.log(
      `[Action:getCalendarEventsForMonth] END - Returning ${events.length} total events (available + booked).`,
    )
    return { events }
  } catch (error: any) {
    console.error(`[Action:getCalendarEventsForMonth] CATCH ERROR:`, error.message)
    return { error: error.message || "カレンダーのデータ取得中にエラーが発生しました。" }
  }
}
