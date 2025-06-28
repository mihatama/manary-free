"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import { validateCSRFToken } from "@/lib/csrf"
import { createAppointment } from "@/app/actions/reservation-actions"

// 電話番号で問診票を取得
export async function getQuestionnaireByPhone(phoneNumber: string) {
  const supabase = createClient()
  try {
    const { data, error } = await supabase
      .from("questionnaires")
      .select("*")
      .eq("phone_number", phoneNumber)
      .maybeSingle() // 1件または0件を期待

    if (error) {
      console.error("電話番号による問診票取得エラー:", error)
      return null
    }
    return data
  } catch (error) {
    console.error("Error in getQuestionnaireByPhone:", error)
    return null
  }
}

// 問診票を送信し、予約に紐付ける
export async function submitAndLinkQuestionnaire(formData: FormData) {
  const supabase = createClient()
  try {
    // CSRF検証
    const csrfToken = formData.get("csrf_token") as string
    if (!validateCSRFToken(csrfToken)) {
      throw new Error("セキュリティトークンが無効です。ページを再読み込みしてください。")
    }

    const appointmentId = Number(formData.get("appointment_id"))
    const appointmentToken = formData.get("appointment_token") as string
    const phoneNumber = formData.get("phone_number") as string

    if (!appointmentId || !appointmentToken || !phoneNumber) {
      throw new Error("予約情報が不足しています。")
    }

    // 1. 問診票データを作成
    const { data: questionnaireData, error: questionnaireError } = await supabase
      .from("questionnaires")
      .insert([
        {
          // フォームから全てのデータを取得してマッピング
          location_nishinomiya: formData.get("locationNishinomiya") === "on",
          location_takarazuka: formData.get("locationTakarazuka") === "on",
          location_nihonbashi: formData.get("locationNihonbashi") === "on",
          location_aichi: formData.get("locationAichi") === "on",
          location_visit: formData.get("locationVisit") === "on",
          mother_last_name: formData.get("motherLastName") as string,
          mother_first_name: formData.get("motherFirstName") as string,
          mother_last_name_kana: formData.get("motherLastNameKana") as string,
          mother_first_name_kana: formData.get("motherFirstNameKana") as string,
          mother_birth_year: Number(formData.get("motherBirthYear")),
          mother_birth_month: Number(formData.get("motherBirthMonth")),
          mother_birth_day: Number(formData.get("motherBirthDay")),
          child_last_name: formData.get("childLastName") as string,
          child_first_name: formData.get("childFirstName") as string,
          child_last_name_kana: formData.get("childLastNameKana") as string,
          child_first_name_kana: formData.get("childFirstNameKana") as string,
          child_birth_year: Number(formData.get("childBirthYear")),
          child_birth_month: Number(formData.get("childBirthMonth")),
          child_birth_day: Number(formData.get("childBirthDay")),
          child_number: Number(formData.get("childNumber")),
          child_gender: formData.get("childGender") as string,
          occupation: formData.get("occupation") as string,
          is_on_maternity_leave: formData.get("isOnMaternityLeave") === "on",
          has_resigned: formData.get("hasResigned") === "on",
          email: formData.get("email") as string,
          phone_number: phoneNumber,
          notes: formData.get("notes") as string,
          created_at: new Date().toISOString(),
        },
      ])
      .select()
      .single()

    if (questionnaireError) {
      console.error("問診票作成エラー:", questionnaireError)
      throw new Error("問診票の保存に失敗しました。")
    }

    // 2. 予約テーブルを更新して問診票IDを紐付ける
    const { error: appointmentUpdateError } = await supabase
      .from("appointments")
      .update({ questionnaire_id: questionnaireData.id })
      .eq("id", appointmentId)

    if (appointmentUpdateError) {
      console.error("予約更新エラー:", appointmentUpdateError)
      // ここでロールバック処理を入れるのが理想だが、簡略化のためエラーを投げる
      throw new Error("予約情報との紐付けに失敗しました。")
    }

    revalidatePath(`/reservation/manage?token=${appointmentToken}`)
    revalidatePath(`/reservation/questionnaire?token=${appointmentToken}`)
    revalidatePath("/dashboard/appointments")
    return { success: true, questionnaire: questionnaireData }
  } catch (error: any) {
    console.error("Error in submitAndLinkQuestionnaire:", error)
    return { success: false, error: error.message || "問診票の送信に失敗しました。" }
  }
}

export async function createQuestionnaireAndReservation(formData: FormData) {
  const supabase = createClient()
  try {
    // CSRF検証
    const csrfToken = formData.get("csrf_token") as string
    if (!validateCSRFToken(csrfToken)) {
      throw new Error("セキュリティトークンが無効です。ページを再読み込みしてください。")
    }

    const phoneNumber = formData.get("phone_number") as string
    if (!phoneNumber) {
      throw new Error("電話番号は必須です。")
    }

    // 1. 問診票データを作成
    const { data: questionnaireData, error: questionnaireError } = await supabase
      .from("questionnaires")
      .insert([
        {
          location_nishinomiya: formData.get("locationNishinomiya") === "on",
          location_takarazuka: formData.get("locationTakarazuka") === "on",
          location_nihonbashi: formData.get("locationNihonbashi") === "on",
          location_aichi: formData.get("locationAichi") === "on",
          location_visit: formData.get("locationVisit") === "on",
          mother_last_name: formData.get("motherLastName") as string,
          mother_first_name: formData.get("motherFirstName") as string,
          mother_last_name_kana: formData.get("motherLastNameKana") as string,
          mother_first_name_kana: formData.get("motherFirstNameKana") as string,
          mother_birth_year: Number(formData.get("motherBirthYear")),
          mother_birth_month: Number(formData.get("motherBirthMonth")),
          mother_birth_day: Number(formData.get("motherBirthDay")),
          child_last_name: formData.get("childLastName") as string,
          child_first_name: formData.get("childFirstName") as string,
          child_last_name_kana: formData.get("childLastNameKana") as string,
          child_first_name_kana: formData.get("childFirstNameKana") as string,
          child_birth_year: Number(formData.get("childBirthYear")),
          child_birth_month: Number(formData.get("childBirthMonth")),
          child_birth_day: Number(formData.get("childBirthDay")),
          child_number: Number(formData.get("childNumber")),
          child_gender: formData.get("childGender") as string,
          occupation: formData.get("occupation") as string,
          is_on_maternity_leave: formData.get("isOnMaternityLeave") === "on",
          has_resigned: formData.get("hasResigned") === "on",
          email: formData.get("email") as string,
          phone_number: phoneNumber,
          notes: formData.get("notes") as string,
          created_at: new Date().toISOString(),
        },
      ])
      .select()
      .single()

    if (questionnaireError) {
      console.error("問診票作成エラー:", questionnaireError)
      throw new Error("問診票の保存に失敗しました。")
    }

    // 2. 予約を作成するために、formDataを準備
    formData.set("questionnaire_id", questionnaireData.id.toString())
    const childName = `${formData.get("childLastName") as string} ${formData.get("childFirstName") as string}`
    formData.set("patient_name", childName)
    formData.set("patient_phone", phoneNumber)
    formData.set("patient_email", formData.get("email") as string)

    // 3. 予約作成アクションを呼び出す
    const reservationResult = await createAppointment(formData)

    if (!reservationResult.success) {
      // TODO: Consider rolling back the questionnaire creation
      throw new Error(reservationResult.error || "予約の作成に失敗しました。")
    }

    revalidatePath("/reservation/new") // Revalidate the page where this might be used
    return { success: true, questionnaire: questionnaireData, appointment: reservationResult.appointment }
  } catch (error: any) {
    console.error("Error in createQuestionnaireAndReservation:", error)
    return { success: false, error: error.message || "問診票と予約の作成に失敗しました。" }
  }
}
