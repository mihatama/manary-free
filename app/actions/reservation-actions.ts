"use server"

import { createClient } from "@/lib/supabase/server"
import { unstable_noStore as noStore, revalidatePath } from "next/cache"
import type { Database } from "@/lib/supabase/database.types"
import { v4 as uuidv4 } from "uuid"
import {
  addMinutes,
  eachDayOfInterval,
  endOfMonth,
  format,
  formatISO,
  getDay,
  isAfter,
  isBefore,
  parse,
  parseISO,
  startOfMonth,
  areIntervalsOverlapping,
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

export async function createReservation(reservationData: Database["public"]["Tables"]["reservations"]["Insert"]) {
  const supabase = createClient()

  const dataToInsert = {
    ...reservationData,
    access_token: reservationData.access_token || uuidv4(),
  }

  const { data, error } = await supabase.from("reservations").insert(dataToInsert).select("id").single()

  if (error) {
    console.error("Error creating reservation:", error.message)
    return { success: false, message: `予約の作成に失敗しました: ${error.message}`, reservationId: null }
  }

  revalidatePath("/dashboard/appointments")
  revalidatePath("/reservation")
  revalidatePath("/reservation/new-calendar")

  return { success: true, message: "予約が作成されました。", reservationId: data.id }
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
    const duration = serviceType.duration
    if (duration <= 0) {
      console.error(`Invalid duration for service type ${serviceTypeId}: ${duration}`)
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
    const monthDate = parse(month, "yyyy-MM", new Date())
    const startDate = startOfMonth(monthDate)
    const endDate = endOfMonth(monthDate)

    const { data: existingReservations, error: reservationError } = await supabase
      .from("reservations")
      .select("reservation_date, start_time, end_time")
      .eq("service_type_id", serviceTypeId)
      .gte("reservation_date", format(startDate, "yyyy-MM-dd"))
      .lte("reservation_date", format(endDate, "yyyy-MM-dd"))
      .in("status", ["confirmed", "pending"])

    if (reservationError) {
      console.error("Error fetching existing reservations:", reservationError.message)
      throw new Error("既存の予約情報の取得に失敗しました。")
    }

    const bookedIntervals = existingReservations
      .map((r) => {
        try {
          if (!r.reservation_date || !r.start_time || !r.end_time) return null
          const start = parseISO(`${r.reservation_date}T${r.start_time}`)
          const end = parseISO(`${r.reservation_date}T${r.end_time}`)
          if (isNaN(start.getTime()) || isNaN(end.getTime())) return null
          return { start, end }
        } catch {
          return null
        }
      })
      .filter((i): i is { start: Date; end: Date } => i !== null)

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
        if (setting.end_date && dateStr > setting.end_date) {
          continue
        }

        try {
          if (!setting.start_time || !setting.end_time) continue

          const settingStart = parse(setting.start_time, "HH:mm:ss", day)
          const settingEnd = parse(setting.end_time, "HH:mm:ss", day)

          if (isNaN(settingStart.getTime()) || isNaN(settingEnd.getTime())) {
            console.warn(`Invalid time format in setting ID ${setting.id} for date ${dateStr}`)
            continue
          }

          let currentSlotStart = settingStart

          while (isBefore(currentSlotStart, settingEnd)) {
            const currentSlotEnd = addMinutes(currentSlotStart, duration)
            if (isAfter(currentSlotEnd, settingEnd)) break

            const isBooked = bookedIntervals.some((booked) =>
              areIntervalsOverlapping(
                { start: currentSlotStart, end: currentSlotEnd },
                { start: booked.start, end: booked.end },
                { inclusive: false },
              ),
            )

            allSlots.push({
              start_time: formatISO(currentSlotStart),
              end_time: formatISO(currentSlotEnd),
              is_available: !isBooked,
            })

            currentSlotStart = addMinutes(currentSlotStart, duration)
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
