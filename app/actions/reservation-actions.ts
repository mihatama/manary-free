"use server"

import { createClient } from "@/lib/supabase/server"
import { unstable_noStore as noStore, revalidatePath } from "next/cache"
import type { Database } from "@/lib/supabase/database.types"
import { v4 as uuidv4 } from "uuid"
import { startOfMonth, endOfMonth, eachDayOfInterval, format, parse } from "date-fns"

// Correctly derive types from the master Database type
type Reservation = Database["public"]["Tables"]["reservations"]["Row"]
type ServiceType = Database["public"]["Tables"]["service_types"]["Row"]

// This type represents a reservation with its related service type information joined.
export type ReservationWithService = Reservation & {
  service_types: Pick<ServiceType, "name" | "color"> | null
}

// Helper function to validate time strings (HH:mm or HH:mm:ss)
function isValidTime(time: string | null | undefined): time is string {
  if (!time) return false
  const parts = time.split(":").map(Number)
  if (parts.length < 2 || parts.length > 3) return false
  const [hour, minute, second] = parts
  if (hour < 0 || hour > 23 || minute < 0 || minute > 59) {
    return false
  }
  if (second !== undefined && (second < 0 || second > 59)) {
    return false
  }
  return true
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
    const sortableColumns: { [key: string]: string } = {
      date: "reservation_date",
      time: "start_time",
      status: "status",
      patient_name: "patient_name",
    }
    const dbSortBy = sortableColumns[sortBy] || "reservation_date"

    let reservationQuery = supabase.from("reservations").select("*", { count: "exact" })

    if (search) {
      reservationQuery = reservationQuery.ilike("patient_name", `%${search}%`)
    }

    reservationQuery = reservationQuery
      .order(dbSortBy, { ascending: sortOrder === "asc" })
      .range(offset, offset + limit - 1)

    const { data: reservations, error: reservationsError, count } = await reservationQuery

    if (reservationsError) {
      console.error("Error fetching reservations:", reservationsError.message)
      throw new Error("予約情報の取得に失敗しました。")
    }
    if (!reservations || reservations.length === 0) {
      return { data: [], count: 0 }
    }

    const serviceTypeIds = reservations.map((r) => r.service_type_id).filter((id): id is number => id !== null)

    if (serviceTypeIds.length === 0) {
      const dataWithServices: ReservationWithService[] = reservations.map((reservation) => ({
        ...reservation,
        service_types: null,
      }))
      return { data: dataWithServices, count: count ?? 0 }
    }

    const { data: serviceTypes, error: serviceTypesError } = await supabase
      .from("service_types")
      .select("id, name, color")
      .in("id", serviceTypeIds)

    if (serviceTypesError) {
      console.error("Error fetching service types:", serviceTypesError.message)
      throw new Error("サービス情報の取得に失敗しました。")
    }

    const serviceTypesMap = new Map(serviceTypes?.map((st) => [st.id, st]) ?? [])

    const dataWithServices: ReservationWithService[] = reservations.map((reservation) => ({
      ...reservation,
      service_types: reservation.service_type_id ? (serviceTypesMap.get(reservation.service_type_id) ?? null) : null,
    }))

    return { data: dataWithServices, count: count ?? 0 }
  } catch (error) {
    console.error(
      "An unexpected error occurred in getAppointments:",
      error instanceof Error ? error.message : "Unknown error",
    )
    throw new Error("予約情報の取得に失敗しました。")
  }
}

export const getReservations = getAppointments

export async function getAppointmentByToken(token: string): Promise<ReservationWithService | null> {
  noStore()
  const supabase = createClient()
  try {
    const { data: reservation, error } = await supabase
      .from("reservations")
      .select("*")
      .eq("access_token", token)
      .single()

    if (error || !reservation) {
      console.error("Error fetching reservation by token:", error?.message)
      return null
    }

    let serviceTypeData: Pick<ServiceType, "name" | "color"> | null = null
    if (reservation.service_type_id) {
      const { data: st, error: stError } = await supabase
        .from("service_types")
        .select("name, color")
        .eq("id", reservation.service_type_id)
        .single()
      if (stError) {
        console.error("Error fetching service type for reservation:", stError.message)
      } else {
        serviceTypeData = st
      }
    }

    return {
      ...reservation,
      service_types: serviceTypeData,
    }
  } catch (error) {
    console.error(
      "An unexpected error occurred in getAppointmentByToken:",
      error instanceof Error ? error.message : "Unknown error",
    )
    return null
  }
}

export async function createReservation(formData: FormData) {
  const supabase = createClient()
  const rawData = Object.fromEntries(formData.entries())

  const reservationData: Database["public"]["Tables"]["reservations"]["Insert"] = {
    clinic_id: Number(rawData.clinic_id),
    service_type_id: Number(rawData.service_type_id),
    reservation_date: String(rawData.reservation_date),
    start_time: String(rawData.start_time),
    end_time: String(rawData.end_time),
    patient_name: String(rawData.patient_name),
    patient_email: String(rawData.patient_email),
    patient_phone: String(rawData.patient_phone),
    note: String(rawData.note),
    status: "confirmed",
    access_token: uuidv4(),
  }

  const { data, error } = await supabase.from("reservations").insert(reservationData).select().single()

  if (error) {
    console.error("Error creating reservation:", error.message)
    return { success: false, message: `予約の作成に失敗しました: ${error.message}`, data: null }
  }

  revalidatePath("/dashboard/appointments")
  return { success: true, message: "予約が作成されました。", data }
}

export const createAppointment = createReservation

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
  revalidatePath("/reservation/manage")
  return { success: true, message: "予約が更新されました。" }
}

export async function updateReservationStatus(id: number, status: string) {
  return updateAppointment(id, { status })
}

export async function cancelAppointment(id: number) {
  return updateAppointment(id, { status: "cancelled" })
}

export async function getAvailableSlots(serviceTypeId: number, month: string) {
  noStore()
  const supabase = createClient()

  try {
    const monthDate = parse(month, "yyyy-MM", new Date())
    const startDate = startOfMonth(monthDate)
    const endDate = endOfMonth(monthDate)

    const { data: serviceType, error: serviceTypeError } = await supabase
      .from("service_types")
      .select("duration")
      .eq("id", serviceTypeId)
      .single()

    if (serviceTypeError || !serviceType || !serviceType.duration) {
      console.error("[getAvailableSlots] Error fetching service type or duration is null:", serviceTypeError?.message)
      throw new Error("サービス情報の取得に失敗しました。")
    }
    const slotInterval = serviceType.duration
    if (slotInterval <= 0) return []

    const { data: availabilitySettings, error: availabilityError } = await supabase
      .from("availability_settings")
      .select("*")
      .eq("service_type_id", serviceTypeId)
      .eq("is_available", true)

    if (availabilityError) throw new Error("予約可能時間の設定の取得に失敗しました。")
    if (!availabilitySettings) return []

    const { data: existingReservations, error: reservationError } = await supabase
      .from("reservations")
      .select("id, reservation_date, start_time")
      .eq("service_type_id", serviceTypeId)
      .gte("reservation_date", format(startDate, "yyyy-MM-dd"))
      .lte("reservation_date", format(endDate, "yyyy-MM-dd"))
      .in("status", ["confirmed", "pending"])

    if (reservationError) throw new Error("既存の予約情報の取得に失敗しました。")

    const bookedSlots = new Set(
      existingReservations
        .map((r) => {
          if (!r.reservation_date || !isValidTime(r.start_time)) {
            console.warn(`[SERVER LOG] Skipping reservation ID ${r.id} due to null/invalid date/time. Data:`, r)
            return null
          }
          try {
            let time = r.start_time
            if (/^\d{2}:\d{2}$/.test(time)) {
              time = `${time}:00`
            }
            const dateStr = `${r.reservation_date}T${time}+09:00`
            const date = new Date(dateStr)
            if (isNaN(date.getTime())) {
              console.error(
                `[SERVER LOG] Invalid reservation data. ID: ${r.id}. Could not parse date string: "${dateStr}"`,
              )
              return null
            }
            return date.toISOString()
          } catch (e) {
            console.error(`[SERVER LOG] CRITICAL ERROR parsing reservation data. ID: ${r.id}. Data:`, r)
            return null
          }
        })
        .filter((d): d is string => d !== null),
    )

    const allSlots: { start_time: string; end_time: string; is_available: boolean }[] = []
    const allDays = eachDayOfInterval({ start: startDate, end: endDate })

    const weeklySettings = availabilitySettings.filter((s) => !s.specific_date)
    const specificDateSettings = availabilitySettings.filter((s) => s.specific_date)

    for (const date of allDays) {
      const dateStr = format(date, "yyyy-MM-dd")
      const dayOfWeek = date.getDay()

      let settingsForThisDay = specificDateSettings.filter((s) => s.specific_date === dateStr)

      if (settingsForThisDay.length === 0) {
        settingsForThisDay = weeklySettings.filter((s) => s.day_of_week === dayOfWeek)
      }

      for (const setting of settingsForThisDay) {
        try {
          if (setting.end_date && new Date(dateStr) > new Date(setting.end_date)) continue

          if (!isValidTime(setting.start_time) || !isValidTime(setting.end_time)) {
            console.warn(
              `[SERVER LOG] Skipping availability setting ID ${setting.id} due to invalid time format. Start: "${setting.start_time}", End: "${setting.end_time}"`,
            )
            continue
          }

          let startTime = setting.start_time
          if (/^\d{2}:\d{2}$/.test(startTime)) {
            startTime = `${startTime}:00`
          }
          let endTime = setting.end_time
          if (/^\d{2}:\d{2}$/.test(endTime)) {
            endTime = `${endTime}:00`
          }

          const startDateTimeStr = `${dateStr}T${startTime}+09:00`
          const slotStartDateTime = new Date(startDateTimeStr)

          const endDateTimeStr = `${dateStr}T${endTime}+09:00`
          const settingEndDateTime = new Date(endDateTimeStr)

          if (endTime <= startTime) {
            settingEndDateTime.setDate(settingEndDateTime.getDate() + 1)
          }

          if (isNaN(slotStartDateTime.getTime()) || isNaN(settingEndDateTime.getTime())) {
            console.error(
              `[SERVER LOG] CRITICAL: Skipping setting ID ${setting.id}. Failed to create valid Date object.`,
            )
            continue
          }

          let currentSlotStart = slotStartDateTime
          while (currentSlotStart < settingEndDateTime) {
            const currentSlotEnd = new Date(currentSlotStart.getTime() + slotInterval * 60 * 1000)
            if (currentSlotEnd > settingEndDateTime) break

            const isBooked = bookedSlots.has(currentSlotStart.toISOString())
            allSlots.push({
              start_time: currentSlotStart.toISOString(),
              end_time: currentSlotEnd.toISOString(),
              is_available: !isBooked,
            })
            currentSlotStart = currentSlotEnd
          }
        } catch (e) {
          console.error(
            `[SERVER LOG] CRITICAL ERROR processing setting ID ${setting.id}. Skipping. Error: ${
              e instanceof Error ? e.message : "Unknown error"
            }`,
          )
        }
      }
    }
    return allSlots
  } catch (error) {
    console.error(
      "[getAvailableSlots] FATAL ERROR in function:",
      error instanceof Error ? error.message : "Unknown error",
    )
    return []
  }
}

export async function deleteReservation(id: number) {
  const supabase = createClient()
  const { error } = await supabase.from("reservations").delete().eq("id", id)

  if (error) {
    console.error("Error deleting reservation:", error.message)
    return { success: false, message: "予約の削除に失敗しました。" }
  }

  revalidatePath("/dashboard/appointments")
  return { success: true, message: "予約が削除されました。" }
}
