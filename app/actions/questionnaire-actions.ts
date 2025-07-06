"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath, unstable_noStore as noStore } from "next/cache"
import { createReservation } from "./reservation-actions"
import type { Database } from "@/lib/supabase/database.types"

type QuestionnaireInsert = Database["public"]["Tables"]["questionnaires"]["Insert"]
type Questionnaire = Database["public"]["Tables"]["questionnaires"]["Row"]
type Reservation = Database["public"]["Tables"]["reservations"]["Row"]

// Define a combined type for the response
export type QuestionnaireWithReservation = Omit<Questionnaire, "data" | "updated_at"> & {
  reservations: Pick<Reservation, "patient_name" | "reservation_date"> | null
}

export type DetailedQuestionnaireWithReservation = Questionnaire & {
  reservations: Reservation | null
}

export async function createQuestionnaireAndReservation(formData: FormData) {
  const supabase = createClient()

  const reservationResult = await createReservation(formData)

  if (!reservationResult.success || !reservationResult.data) {
    return { success: false, message: reservationResult.message || "予約の作成に失敗しました。", data: null }
  }

  const reservationId = reservationResult.data.id
  const rawData = Object.fromEntries(formData.entries())

  const questionnairePayload: QuestionnaireInsert = {
    reservation_id: reservationId,
    data: rawData,
  }

  const { data: questionnaire, error } = await supabase
    .from("questionnaires")
    .insert(questionnairePayload)
    .select()
    .single()

  if (error) {
    console.error("Error creating questionnaire:", error.message)
    // NOTE: In a production environment, you should implement a transaction
    // or a cleanup mechanism to delete the reservation if questionnaire creation fails.
    return { success: false, message: "問診票の作成に失敗しました。", data: null }
  }

  revalidatePath("/dashboard/questionnaires")
  revalidatePath("/reservation/confirmation")

  return {
    success: true,
    message: "予約と問診票が正常に作成されました。",
    data: { reservation: reservationResult.data, questionnaire },
  }
}

export async function getQuestionnaires({
  page = 1,
  limit = 10,
}: {
  page?: number
  limit?: number
}): Promise<{ data: QuestionnaireWithReservation[]; count: number }> {
  noStore()
  const supabase = createClient()
  const offset = (page - 1) * limit

  // Step 1: Fetch questionnaires with their reservation_id
  const {
    data: questionnairesData,
    error: questionnairesError,
    count,
  } = await supabase
    .from("questionnaires")
    .select("id, created_at, reservation_id", { count: "exact" })
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1)

  if (questionnairesError) {
    console.error("Error fetching questionnaires:", questionnairesError.message)
    throw new Error("問診票の取得に失敗しました。")
  }

  if (!questionnairesData || questionnairesData.length === 0) {
    return { data: [], count: 0 }
  }

  // Step 2: Extract non-null reservation IDs
  const reservationIds = questionnairesData.map((q) => q.reservation_id).filter((id): id is number => id !== null)

  let reservationsMap = new Map<number, { patient_name: string; reservation_date: string | null }>()

  // Step 3: Fetch the corresponding reservations if there are any IDs
  if (reservationIds.length > 0) {
    const { data: reservationsData, error: reservationsError } = await supabase
      .from("reservations")
      .select("id, reservation_date, patients(name)")
      .in("id", reservationIds)

    if (reservationsError) {
      console.error("Error fetching reservations for questionnaires:", reservationsError.message)
      // Proceed without reservation data, but log the error.
    } else if (reservationsData) {
      const typedReservationsData = reservationsData as {
        id: number
        reservation_date: string | null
        patients: { name: string | null } | null
      }[]

      reservationsMap = new Map(
        typedReservationsData.map((r) => [
          r.id,
          {
            patient_name: r.patients?.name || "",
            reservation_date: r.reservation_date,
          },
        ]),
      )
    }
  }

  // Step 4: Combine the data
  const combinedData = questionnairesData.map((q) => {
    const reservation = q.reservation_id ? reservationsMap.get(q.reservation_id) : null
    return {
      id: q.id,
      created_at: q.created_at,
      reservation_id: q.reservation_id,
      reservations: reservation
        ? { patient_name: reservation.patient_name, reservation_date: reservation.reservation_date }
        : null,
    }
  })

  return { data: combinedData, count: count ?? 0 }
}

export async function getQuestionnaireById(id: number): Promise<DetailedQuestionnaireWithReservation | null> {
  noStore()
  const supabase = createClient()

  // Step 1: Fetch the questionnaire
  const { data: questionnaire, error: questionnaireError } = await supabase
    .from("questionnaires")
    .select("*")
    .eq("id", id)
    .single()

  if (questionnaireError) {
    console.error("Error fetching questionnaire by id:", questionnaireError.message)
    return null
  }

  if (!questionnaire) {
    return null
  }

  // Step 2: Fetch the associated reservation if the ID exists
  let reservationData: Reservation | null = null
  if (questionnaire.reservation_id) {
    const { data: reservation, error: reservationError } = await supabase
      .from("reservations")
      .select("*")
      .eq("id", questionnaire.reservation_id)
      .single()

    if (reservationError) {
      console.error("Error fetching reservation for questionnaire:", reservationError.message)
      // Continue without reservation data
    } else {
      reservationData = reservation
    }
  }

  // Step 3: Combine the data
  const combinedData: DetailedQuestionnaireWithReservation = {
    ...questionnaire,
    reservations: reservationData,
  }

  return combinedData
}

export async function deleteQuestionnaire(id: number) {
  const supabase = createClient()
  const { error } = await supabase.from("questionnaires").delete().eq("id", id)

  if (error) {
    console.error("Error deleting questionnaire:", error.message)
    return { success: false, message: "問診票の削除に失敗しました。" }
  }

  revalidatePath("/dashboard/questionnaires")
  return { success: true, message: "問診票が削除されました。" }
}

export async function submitAndLinkQuestionnaire(formData: FormData) {
  const supabase = createClient()
  const rawData = Object.fromEntries(formData.entries())

  const appointment_id_raw = rawData.appointment_id
  if (!appointment_id_raw) {
    return { success: false, message: "予約IDが見つかりません。" }
  }
  const appointment_id = Number(appointment_id_raw)

  // We don't want to store these in the data blob
  const dataForBlob = { ...rawData }
  delete (dataForBlob as any).appointment_id
  delete (dataForBlob as any).appointment_token
  delete (dataForBlob as any).csrf_token
  delete (dataForBlob as any).phone_number // This is on the appointment, not needed in blob

  // Fetch the reservation to check for an existing questionnaire
  const { data: reservation, error: reservationError } = await supabase
    .from("reservations")
    .select("questionnaire_id")
    .eq("id", appointment_id)
    .single()

  if (reservationError) {
    console.error("Error fetching reservation:", reservationError.message)
    return { success: false, message: "予約情報の取得に失敗しました。" }
  }

  let questionnaire
  let message = "問診票が正常に送信されました。"

  if (reservation.questionnaire_id) {
    // Update existing questionnaire
    const { data: updatedQuestionnaire, error } = await supabase
      .from("questionnaires")
      .update({ data: dataForBlob, updated_at: new Date().toISOString() })
      .eq("id", reservation.questionnaire_id)
      .select()
      .single()

    if (error) {
      console.error("Error updating questionnaire:", error.message)
      return { success: false, message: "問診票の更新に失敗しました。" }
    }
    questionnaire = updatedQuestionnaire
    message = "問診票が正常に更新されました。"
  } else {
    // Insert new questionnaire
    const questionnairePayload: QuestionnaireInsert = {
      reservation_id: appointment_id,
      data: dataForBlob,
    }
    const { data: newQuestionnaire, error: insertError } = await supabase
      .from("questionnaires")
      .insert(questionnairePayload)
      .select()
      .single()

    if (insertError) {
      console.error("Error inserting questionnaire:", insertError.message)
      return { success: false, message: "問診票の作成に失敗しました。" }
    }
    questionnaire = newQuestionnaire

    // Link questionnaire to reservation
    const { error: updateReservationError } = await supabase
      .from("reservations")
      .update({ questionnaire_id: questionnaire.id })
      .eq("id", appointment_id)

    if (updateReservationError) {
      console.error("Error updating reservation with questionnaire_id:", updateReservationError.message)
      // Not fatal, but should be logged.
    }
  }

  revalidatePath("/dashboard/questionnaires")
  if (rawData.appointment_token) {
    revalidatePath(`/reservation/questionnaire?token=${rawData.appointment_token}`)
  }
  revalidatePath(`/reservation/questionnaire/success`)

  return { success: true, message, data: questionnaire }
}

export async function getLatestQuestionnaireByPhone(phone: string): Promise<{ [key: string]: any } | null> {
  noStore()
  if (!phone) return null

  const supabase = createClient()

  // First, find all reservations for the given phone number.
  const { data: reservations, error: reservationsError } = await supabase
    .from("reservations")
    .select("id")
    .eq("patient_phone", phone)

  if (reservationsError || !reservations || reservations.length === 0) {
    if (reservationsError) {
      console.error("Error fetching reservations by phone:", reservationsError.message)
    }
    return null
  }

  const reservationIds = reservations.map((r) => r.id)

  // Then, find the latest questionnaire associated with these reservations.
  const { data: latestQuestionnaire, error: questionnaireError } = await supabase
    .from("questionnaires")
    .select("data")
    .in("reservation_id", reservationIds)
    .order("created_at", { ascending: false })
    .limit(1)
    .single()

  if (questionnaireError) {
    if (questionnaireError.code !== "PGRST116") {
      // 'PGRST116' means no rows found
      console.error("Error fetching latest questionnaire:", questionnaireError.message)
    }
    return null
  }

  return latestQuestionnaire?.data as { [key: string]: any } | null
}
