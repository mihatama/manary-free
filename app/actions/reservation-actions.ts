import { createClient } from "@/lib/supabase/server"
import { unstable_noStore as noStore } from "next/cache"
import { revalidatePath } from "next/cache"
import { randomUUID } from "crypto"

// Helper to check for UUID format
const isUUID = (str: string) => {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
  return uuidRegex.test(str)
}

export async function getAppointments({
  query,
  sortBy,
  sortOrder,
}: {
  query?: string
  sortBy?: string
  sortOrder?: "asc" | "desc"
}) {
  noStore()
  const supabase = createClient()

  // Use inner joins for required related data to prevent errors
  let supabaseQuery = supabase.from("reservations").select(
    `
    id,
    reservation_date,
    start_time,
    status,
    users!inner (
      id,
      full_name
    ),
    service_types!inner (
      name
    )
  `,
  )

  if (query) {
    if (isUUID(query)) {
      // Search by user ID
      supabaseQuery = supabaseQuery.eq("users.id", query)
    } else {
      // Search by user name
      supabaseQuery = supabaseQuery.ilike("users.full_name", `%${query}%`)
    }
  }

  if (sortBy) {
    const ascending = sortOrder === "asc"
    let dbSortBy = sortBy

    // Map client-side sort keys to database columns
    switch (sortBy) {
      case "patient_name":
        dbSortBy = "users.full_name"
        break
      case "date":
        dbSortBy = "reservation_date"
        break
      case "time":
        dbSortBy = "start_time"
        break
      case "service":
        dbSortBy = "service_types.name"
        break
      // 'status' can be passed directly
    }

    supabaseQuery = supabaseQuery.order(dbSortBy, { ascending })
  } else {
    // Default sort order
    supabaseQuery = supabaseQuery
      .order("reservation_date", { ascending: false })
      .order("start_time", { ascending: true })
  }

  const { data, error } = await supabaseQuery

  if (error) {
    console.error("Error fetching appointments:", error)
    throw new Error("予約情報の取得に失敗しました。")
  }

  // The !inner join guarantees users and service_types are not null
  return data.map((item) => ({
    id: item.id,
    patient_name: item.users.full_name,
    patient_id: item.users.id,
    date: item.reservation_date,
    time: item.start_time,
    service: item.service_types.name,
    status: item.status,
  }))
}

export async function updateAppointment(
  id: string,
  data: { reservation_date?: string; start_time?: string; status?: string },
) {
  const supabase = createClient()
  const { error } = await supabase.from("reservations").update(data).eq("id", id)
  if (error) {
    console.error("Error updating appointment:", error)
    return { success: false, message: "予約の更新に失敗しました。" }
  }
  revalidatePath("/dashboard/appointments")
  return { success: true, message: "予約を更新しました。" }
}

export async function cancelAppointment(id: string) {
  const supabase = createClient()
  const { error } = await supabase.from("reservations").update({ status: "cancelled" }).eq("id", id)
  if (error) {
    console.error("Error cancelling appointment:", error)
    return { success: false, message: "予約のキャンセルに失敗しました。" }
  }
  revalidatePath("/dashboard/appointments")
  revalidatePath("/reservation/manage")
  return { success: true, message: "予約をキャンセルしました。" }
}

export async function createReservation(prevState: any, formData: FormData) {
  const supabase = createClient()
  const rawData = Object.fromEntries(formData.entries())

  // Simplified: assumes user_id is provided
  const { error } = await supabase.from("reservations").insert({
    user_id: rawData.user_id as string,
    reservation_date: rawData.reservation_date as string,
    start_time: rawData.start_time as string,
    service_type_id: rawData.service_type_id as string,
    status: "confirmed",
    management_token: randomUUID(), // For managing reservation via link
  })

  if (error) {
    console.error("Error creating reservation:", error)
    return { success: false, message: "予約の作成に失敗しました。" }
  }
  revalidatePath("/dashboard/appointments")
  return { success: true, message: "予約を作成しました。" }
}

// This is a complex function that depends on clinic schedule settings.
// This is a simplified placeholder.
export async function getAvailableSlots(date: string) {
  noStore()
  const supabase = createClient()

  // 1. Get clinic's business hours for the day of the week.
  // (Assuming a 'schedules' table exists with business hours)
  const businessHours = { start: "09:00", end: "18:00" } // Placeholder
  const slotDuration = 60 // in minutes, placeholder

  // 2. Get existing reservations for the selected date.
  const { data: existingReservations, error } = await supabase
    .from("reservations")
    .select("start_time")
    .eq("reservation_date", date)
    .in("status", ["confirmed", "pending"])

  if (error) {
    console.error("Error fetching existing reservations:", error)
    return []
  }
  const bookedSlots = existingReservations.map((r) => r.start_time)

  // 3. Generate all possible slots and filter out booked ones.
  const availableSlots = []
  const currentTime = new Date(`${date}T${businessHours.start}:00`)
  const endTime = new Date(`${date}T${businessHours.end}:00`)

  while (currentTime < endTime) {
    const timeString = currentTime.toTimeString().substring(0, 5) // HH:mm
    if (!bookedSlots.includes(timeString + ":00")) {
      availableSlots.push(timeString)
    }
    currentTime.setMinutes(currentTime.getMinutes() + slotDuration)
  }

  return availableSlots
}

// Alias for createReservation for clarity in different contexts
export const createAppointment = createReservation

export async function getAppointmentByToken(token: string) {
  noStore()
  if (!token) return null

  const supabase = createClient()
  const { data, error } = await supabase
    .from("reservations")
    .select(`
      *,
      users (full_name),
      service_types (name)
    `)
    .eq("management_token", token)
    .single()

  if (error) {
    console.error("Error fetching appointment by token:", error)
    return null
  }
  return data
}
