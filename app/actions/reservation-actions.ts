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
  revalidatePath("/reservation")
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
    // Note: Using 'availability' table as per previous fix context.
    const { data: availability, error: availabilityError } = await supabase
      .from("availability")
      .select("*")
      .eq("service_type_id", serviceTypeId)

    if (availabilityError) {
      console.error("Error fetching availability settings:", availabilityError.message)
      throw new Error("予約可能時間の設定の取得に失敗しました。")
    }
    if (!availability) {
      return [] // No availability settings for this service type
    }

    // 3. Fetch existing reservations for the month
    const monthDate = parseISO(`${month}-01`)
    const monthStart = startOfMonth(monthDate)
    const monthEnd = endOfMonth(monthDate)

    const { data: existingReservations, error: reservationError } = await supabase
      .from("reservations")
      .select("reservation_date, start_time, end_time")
      .eq("service_type_id", serviceTypeId)
      .gte("reservation_date", format(monthStart, "yyyy-MM-dd"))
      .lte("reservation_date", format(monthEnd, "yyyy-MM-dd"))
      .in("status", ["confirmed", "pending"])

    if (reservationError) {
      console.error("Error fetching existing reservations:", reservationError.message)
      throw new Error("既存の予約情報の取得に失敗しました。")
    }

    // 4. Generate all possible slots based on availability settings
    const slots: { start_time: string; end_time: string; is_available: boolean }[] = []
    const days = eachDayOfInterval({ start: monthStart, end: monthEnd })

    for (const day of days) {
      const dayOfWeek = getDay(day) // 0 = Sunday, 1 = Monday, ...
      const dayAvailability = availability.find((a) => a.day_of_week === dayOfWeek)

      if (dayAvailability && dayAvailability.start_time && dayAvailability.end_time) {
        try {
          const startTime = parse(dayAvailability.start_time, "HH:mm:ss", day)
          const endTime = parse(dayAvailability.end_time, "HH:mm:ss", day)

          if (isNaN(startTime.getTime()) || isNaN(endTime.getTime())) {
            console.warn(
              `Could not parse time for day ${day}: start=${dayAvailability.start_time}, end=${dayAvailability.end_time}`,
            )
            continue
          }

          let currentTime = startTime

          while (isBefore(currentTime, endTime)) {
            const slotEnd = addMinutes(currentTime, duration)
            if (isAfter(slotEnd, endTime)) break

            const isBooked = existingReservations.some((r) => {
              if (!r.reservation_date || !r.start_time || !r.end_time) return false

              try {
                const reservationStart = parseISO(`${r.reservation_date}T${r.start_time}`)
                const reservationEnd = parseISO(`${r.reservation_date}T${r.end_time}`)

                if (isNaN(reservationStart.getTime()) || isNaN(reservationEnd.getTime())) {
                  console.warn(`Invalid reservation time found for date ${r.reservation_date}`)
                  return false
                }

                return areIntervalsOverlapping(
                  { start: currentTime, end: slotEnd },
                  { start: reservationStart, end: reservationEnd },
                  { inclusive: true },
                )
              } catch (e) {
                console.warn(`Error parsing reservation time: ${r.reservation_date}T${r.start_time}`)
                return false
              }
            })

            slots.push({
              start_time: formatISO(currentTime),
              end_time: formatISO(slotEnd),
              is_available: !isBooked,
            })
            // The interval for generating the next potential slot.
            // This could be different from the service duration.
            currentTime = addMinutes(currentTime, 30)
          }
        } catch (e) {
          console.error(`Error processing availability for day ${day}:`, e)
        }
      }
    }
    return slots
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
