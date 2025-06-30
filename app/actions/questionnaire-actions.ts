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

  let reservationsMap = new Map<number, Pick<Reservation, "id" | "patient_name" | "reservation_date">>()

  // Step 3: Fetch the corresponding reservations if there are any IDs
  if (reservationIds.length > 0) {
    const { data: reservationsData, error: reservationsError } = await supabase
      .from("reservations")
      .select("id, patient_name, reservation_date")
      .in("id", reservationIds)

    if (reservationsError) {
      console.error("Error fetching reservations:", reservationsError.message)
      // Proceed without reservation data, but log the error.
    } else if (reservationsData) {
      reservationsMap = new Map(reservationsData.map((r) => [r.id, r]))
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

  const reservation_id_raw = rawData.reservation_id
  if (!reservation_id_raw) {
    return { success: false, message: "予約IDが見つかりません。" }
  }
  const reservation_id = Number(reservation_id_raw)

  // We don't want to store the reservation_id inside the data blob
  const dataForBlob = { ...rawData }
  delete (dataForBlob as any).reservation_id

  const questionnairePayload: QuestionnaireInsert = {
    reservation_id: reservation_id,
    data: dataForBlob,
  }

  const { data, error } = await supabase.from("questionnaires").insert(questionnairePayload).select().single()

  if (error) {
    console.error("Error submitting and linking questionnaire:", error.message)
    return { success: false, message: "問診票の提出に失敗しました。" }
  }

  revalidatePath("/dashboard/questionnaires")
  revalidatePath(`/reservation/questionnaire/success?reservation_id=${reservation_id}`)
  return { success: true, message: "問診票が正常に提出されました。", data }
}
