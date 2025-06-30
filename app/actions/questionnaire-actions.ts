"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath, unstable_noStore as noStore } from "next/cache"
import { createReservation } from "./reservation-actions"
import type { Database } from "@/lib/supabase/database.types"

type QuestionnaireInsert = Database["public"]["Tables"]["questionnaires"]["Insert"]

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
}) {
  noStore()
  const supabase = createClient()
  const offset = (page - 1) * limit

  const { data, error, count } = await supabase
    .from("questionnaires")
    .select(
      `
      id,
      created_at,
      reservations (
        patient_name,
        reservation_date
      )
    `,
      { count: "exact" },
    )
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1)

  if (error) {
    console.error("Error fetching questionnaires:", error.message)
    throw new Error("問診票の取得に失敗しました。")
  }

  return { data, count: count ?? 0 }
}

export async function getQuestionnaireById(id: number) {
  noStore()
  const supabase = createClient()

  const { data, error } = await supabase
    .from("questionnaires")
    .select(
      `
      *,
      reservations ( * )
    `,
    )
    .eq("id", id)
    .single()

  if (error) {
    console.error("Error fetching questionnaire by id:", error.message)
    return null
  }

  return data
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
