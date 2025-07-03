"use server"

import { createClient } from "@/lib/supabase/server"
import { unstable_noStore as noStore, revalidatePath } from "next/cache"
import type { Database } from "@/lib/supabase/database.types"
import { v4 as uuidv4 } from "uuid"
import {
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  format,
  parse,
  setHours,
  setMinutes,
  setSeconds,
  getDay,
} from "date-fns"

// Correctly derive types from the master Database type
type Reservation = Database["public"]["Tables"]["reservations"]["Row"]
type ServiceType = Database["public"]["Tables"]["service_types"]["Row"]

// This type represents a reservation with its related service type information joined.
export type ReservationWithService = Reservation & {
  service_types: Pick<ServiceType, "name" | "color"> | null
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
    service_type_id: Number(rawData.service_type_id),
    reservation_date: String(rawData.reservation_date),
    start_time: String(rawData.start_time),
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
    return { success: false, message: "予約の作成に失敗しました。", data: null }
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

    // 1. Fetch service type to get duration
    const { data: serviceType, error: serviceTypeError } = await supabase
      .from("service_types")
      .select("duration")
      .eq("id", serviceTypeId)
      .single()

    if (serviceTypeError || !serviceType || !serviceType.duration) {
      console.error("Error fetching service type or duration is null:", serviceTypeError?.message)
      throw new Error("サービス情報の取得に失敗しました。")
    }
    const slotInterval = serviceType.duration // in minutes
    if (slotInterval <= 0) {
      console.error(`Invalid slot interval for service type ${serviceTypeId}: ${slotInterval}`)
      return []
    }

    // 2. Fetch availability settings for the service type
    const { data: availabilitySettings, error: availabilityError } = await supabase
      .from("availability_settings")
      .select("*")
      .eq("service_type_id", serviceTypeId)
      .eq("is_available", true)

    if (availabilityError) {
      console.error("Error fetching availability settings:", availabilityError.message)
      throw new Error("予約可能時間の設定の取得に失敗しました。")
    }
    if (!availabilitySettings) {
      return [] // No availability settings for this service type
    }

    // 3. Fetch existing reservations for the month
    const { data: existingReservations, error: reservationError } = await supabase
      .from("reservations")
      .select("reservation_date, start_time")
      .eq("service_type_id", serviceTypeId)
      .gte("reservation_date", format(startDate, "yyyy-MM-dd"))
      .lte("reservation_date", format(endDate, "yyyy-MM-dd"))
      .in("status", ["confirmed", "pending"])

    if (reservationError) {
      console.error("Error fetching existing reservations:", reservationError.message)
      throw new Error("既存の予約情報の取得に失敗しました。")
    }

    const bookedSlots = new Set(existingReservations.map((r) => `${r.reservation_date}T${r.start_time}`))

    // 4. Generate all possible slots based on availability settings
    const allSlots: { start_time: string; end_time: string; is_available: boolean }[] = []
    const allDays = eachDayOfInterval({ start: startDate, end: endDate })

    const weeklySettings = availabilitySettings.filter((s) => !s.specific_date)
    const specificDateSettings = availabilitySettings.filter((s) => s.specific_date)

    for (const day of allDays) {
      const dayOfWeek = getDay(day)
      const dateStr = format(day, "yyyy-MM-dd")

      const hasSpecificSettingForDay = specificDateSettings.some((s) => s.specific_date === dateStr)
      let settingsToUse = []

      if (hasSpecificSettingForDay) {
        settingsToUse = specificDateSettings.filter((s) => s.specific_date === dateStr)
      } else {
        settingsToUse = weeklySettings.filter((s) => s.day_of_week === dayOfWeek)
      }

      for (const setting of settingsToUse) {
        // Robustly check if the setting's end_date has passed
        if (setting.end_date && dateStr > setting.end_date) {
          continue
        }

        try {
          const [startHour, startMinute] = setting.start_time.split(":").map(Number)
          const [endHour, endMinute] = setting.end_time.split(":").map(Number)

          if (isNaN(startHour) || isNaN(startMinute) || isNaN(endHour) || isNaN(endMinute)) {
            throw new Error("Invalid time format in setting")
          }

          let slotStart = setSeconds(setMinutes(setHours(day, startHour), startMinute), 0)
          const settingEnd = setSeconds(setMinutes(setHours(day, endHour), endMinute), 0)

          while (slotStart < settingEnd) {
            const slotEnd = new Date(slotStart.getTime() + slotInterval * 60 * 1000)
            if (slotEnd > settingEnd) break

            const formattedDate = format(slotStart, "yyyy-MM-dd")
            const formattedTime = format(slotStart, "HH:mm:ss")
            const isBooked = bookedSlots.has(`${formattedDate}T${formattedTime}`)

            allSlots.push({
              start_time: slotStart.toISOString(),
              end_time: slotEnd.toISOString(),
              is_available: !isBooked,
            })

            slotStart = slotEnd
          }
        } catch (e) {
          console.error(
            `Skipping availability setting due to an error. Setting ID: ${setting.id}, Error: ${
              e instanceof Error ? e.message : "Unknown error"
            }`,
          )
          continue
        }
      }
    }

    return allSlots
  } catch (error) {
    console.error("Error in getAvailableSlots:", error instanceof Error ? error.message : "Unknown error")
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
