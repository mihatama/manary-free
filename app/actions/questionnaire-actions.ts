import { createClient } from "@/lib/supabase/server"
import { unstable_noStore as noStore } from "next/cache"
import { redirect } from "next/navigation"

export async function getQuestionnaires({
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

  let supabaseQuery = supabase.from("medical_questionnaires").select(
    `
      id,
      created_at,
      users (
        id,
        full_name
      )
    `,
  )

  if (query) {
    supabaseQuery = supabaseQuery.or(`users.full_name.ilike.%${query}%,users.id::text.ilike.%${query}%`)
  }

  if (sortBy) {
    const ascending = sortOrder === "asc"
    if (sortBy === "patient_name") {
      supabaseQuery = supabaseQuery.order("users(full_name)", { ascending })
    } else {
      supabaseQuery = supabaseQuery.order(sortBy, { ascending })
    }
  } else {
    supabaseQuery = supabaseQuery.order("created_at", { ascending: false })
  }

  const { data, error } = await supabaseQuery

  if (error) {
    console.error("Error fetching questionnaires:", error)
    throw new Error("問診票情報の取得に失敗しました。")
  }

  return data.map((item) => ({
    id: item.id,
    patient_name: item.users?.full_name || "N/A",
    patient_id: item.users?.id || "N/A",
    submission_date: item.created_at,
  }))
}

export async function createQuestionnaireAndReservation(prevState: any, formData: FormData) {
  const supabase = createClient()

  // This is a simplified example. A real implementation would have robust validation and error handling.
  const rawData = Object.fromEntries(formData.entries())

  // This logic should be transactional in a production environment
  try {
    // 1. Create user (or find existing) - simplified
    const { data: user, error: userError } = await supabase
      .from("users")
      .select("id")
      .eq("email", rawData.email as string)
      .single()
    let userId = user?.id

    if (userError && userError.code !== "PGRST116") {
      // PGRST116: no rows found
      console.error("Error finding user:", userError)
      return { message: "ユーザーの確認中にエラーが発生しました。" }
    }

    if (!userId) {
      // Create a new user if not found (simplified)
      const { data: newUser, error: newUserError } = await supabase
        .from("users")
        .insert({
          full_name: rawData.full_name as string,
          email: rawData.email as string,
          phone_number: rawData.phone_number as string,
        })
        .select("id")
        .single()

      if (newUserError) {
        console.error("Error creating user:", newUserError)
        return { message: "ユーザーの作成中にエラーが発生しました。" }
      }
      userId = newUser!.id
    }

    // 2. Create reservation
    const { error: reservationError } = await supabase.from("reservations").insert({
      user_id: userId,
      reservation_date: rawData.reservation_date as string,
      start_time: rawData.start_time as string,
      service_type_id: rawData.service_type_id as string,
      status: "pending", // or some default
    })

    if (reservationError) {
      throw new Error(`Reservation creation failed: ${reservationError.message}`)
    }

    // 3. Create questionnaire
    const { error: questionnaireError } = await supabase.from("medical_questionnaires").insert({
      user_id: userId,
      // NOTE: Add other questionnaire fields from formData here
    })

    if (questionnaireError) {
      throw new Error(`Questionnaire creation failed: ${questionnaireError.message}`)
    }
  } catch (error: any) {
    console.error("Transaction failed:", error)
    return { message: error.message || "問診票と予約の作成中にエラーが発生しました。" }
  }

  redirect("/reservation/confirmation")
}

export async function submitAndLinkQuestionnaire(prevState: any, formData: FormData) {
  const supabase = createClient()
  const rawData = Object.fromEntries(formData.entries())
  const userId = rawData.user_id as string

  if (!userId) {
    return { message: "ユーザーIDが必要です。" }
  }

  const { error } = await supabase.from("medical_questionnaires").insert({
    user_id: userId,
    // NOTE: Add other questionnaire fields from formData here
  })

  if (error) {
    console.error("Error submitting questionnaire:", error)
    return { message: "問診票の送信中にエラーが発生しました。" }
  }

  redirect("/reservation/questionnaire/success")
}
