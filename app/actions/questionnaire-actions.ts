"use server"

import { createClient } from "@/lib/supabase/server"
import { validateCSRFToken } from "@/lib/csrf"
import { createAppointment } from "@/app/actions/reservation-actions" // 実際の予約作成アクションをインポート

// CSRF検証を行うヘルパー関数 (これは既存のままで問題ない想定)
// async function validateCSRF(formData: FormData) {
//   const csrfToken = formData.get("csrf_token") as string
//   if (!validateCSRFToken(csrfToken)) {
//     throw new Error("セキュリティトークンが無効です。ページを再読み込みしてください。")
//   }
// }

// 問診票を送信 (これは既存のままで問題ない想定)
export async function submitQuestionnaire(data: any) {
  try {
    const phoneNumber = data.phoneNumber

    if (!phoneNumber) {
      throw new Error("電話番号が必要です")
    }

    const questionnaireData = {
      phone_number: phoneNumber,
      location_nishinomiya: data.locationNishinomiya || false,
      location_takarazuka: data.locationTakarazuka || false,
      location_nihonbashi: data.locationNihonbashi || false,
      location_aichi: data.locationAichi || false,
      location_visit: data.locationVisit || false,
      mother_last_name: data.motherLastName || "",
      mother_first_name: data.motherFirstName || "",
      mother_last_name_kana: data.motherLastNameKana || "",
      mother_first_name_kana: data.motherFirstNameKana || "",
      mother_birth_year: data.motherBirthYear || null,
      mother_birth_month: data.motherBirthMonth || null,
      mother_birth_day: data.motherBirthDay || null,
      child_last_name: data.childLastName || "",
      child_first_name: data.childFirstName || "",
      child_last_name_kana: data.childLastNameKana || "",
      child_first_name_kana: data.childFirstNameKana || "",
      child_birth_year: data.childBirthYear || null,
      child_birth_month: data.childBirthMonth || null,
      child_birth_day: data.childBirthDay || null,
      child_number: data.childNumber || null,
      child_gender: data.childGender || "",
      occupation: data.occupation || "",
      is_on_maternity_leave: data.isOnMaternityLeave || false,
      has_resigned: data.hasResigned || false,
      email: data.email || "",
      notes: data.notes || "", // 問診票の備考
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }

    const supabase = createClient()
    const { data: questionnaireResult, error: questionnaireError } = await supabase
      .from("questionnaires")
      .insert([questionnaireData])
      .select()

    if (questionnaireError) {
      console.error("問診票保存エラー:", questionnaireError)
      throw new Error(questionnaireError.message)
    }

    console.log("問診票保存成功:", questionnaireResult)
    return {
      success: true,
      message: "問診票が送信されました",
      data: questionnaireResult[0],
    }
  } catch (error: any) {
    console.error("Error in submitQuestionnaire:", error)
    return { success: false, error: error.message || "問診票の送信に失敗しました" }
  }
}

// 電話番号で問診票を取得 (これは既存のままで問題ない想定)
export async function getQuestionnaireByPhone(phoneNumber: string) {
  try {
    const supabase = createClient()
    const { data, error } = await supabase
      .from("questionnaires")
      .select("*")
      .eq("phone_number", phoneNumber)
      .order("created_at", { ascending: false })
      .limit(1)
      .single()

    if (error) {
      // 該当データがない場合はエラーではなくnullを返すのが一般的
      if (error.code === "PGRST116") {
        return null
      }
      console.error("問診票取得エラー:", error)
      return null
    }
    return data
  } catch (error) {
    console.error("問診票取得中のエラー:", error)
    return null
  }
}

// 問診票と予約を同時に作成
export async function createQuestionnaireAndReservation(questionnaireAndReservationData: {
  // 問診票データ (submitQuestionnaireが期待する形式)
  phoneNumber: string
  locationNishinomiya?: boolean
  locationTakarazuka?: boolean
  locationNihonbashi?: boolean
  locationAichi?: boolean
  locationVisit?: boolean
  motherLastName?: string
  motherFirstName?: string
  motherLastNameKana?: string
  motherFirstNameKana?: string
  motherBirthYear?: number
  motherBirthMonth?: number
  motherBirthDay?: number
  childLastName?: string
  childFirstName?: string
  childLastNameKana?: string
  childFirstNameKana?: string
  childBirthYear?: number
  childBirthMonth?: number
  childBirthDay?: number
  childNumber?: number
  childGender?: string
  occupation?: string
  isOnMaternityLeave?: boolean
  hasResigned?: boolean
  email?: string
  notes?: string // 問診票の備考
  csrf_token: string // CSRFトークン

  // 予約固有データ (createAppointmentが期待するFormDataのキーに対応)
  clinic_id: string
  service_type_id: string
  date: string // YYYY-MM-DD
  start_time: string // HH:MM
  end_time: string // HH:MM
  // patient_name は motherLastName と motherFirstName から生成
  // patient_phone は phoneNumber を使用
  reservation_notes?: string // 予約時の備考 (問診票のnotesとは別の場合)
}) {
  try {
    // CSRFトークンを検証
    if (!validateCSRFToken(questionnaireAndReservationData.csrf_token)) {
      throw new Error("セキュリティトークンが無効です。ページを再読み込みしてください。")
    }

    // 1. 問診票を保存
    // submitQuestionnaire に渡すデータを選別
    const questionnaireDataForSubmit = {
      phoneNumber: questionnaireAndReservationData.phoneNumber,
      locationNishinomiya: questionnaireAndReservationData.locationNishinomiya,
      locationTakarazuka: questionnaireAndReservationData.locationTakarazuka,
      locationNihonbashi: questionnaireAndReservationData.locationNihonbashi,
      locationAichi: questionnaireAndReservationData.locationAichi,
      locationVisit: questionnaireAndReservationData.locationVisit,
      motherLastName: questionnaireAndReservationData.motherLastName,
      motherFirstName: questionnaireAndReservationData.motherFirstName,
      motherLastNameKana: questionnaireAndReservationData.motherLastNameKana,
      motherFirstNameKana: questionnaireAndReservationData.motherFirstNameKana,
      motherBirthYear: questionnaireAndReservationData.motherBirthYear,
      motherBirthMonth: questionnaireAndReservationData.motherBirthMonth,
      motherBirthDay: questionnaireAndReservationData.motherBirthDay,
      childLastName: questionnaireAndReservationData.childLastName,
      childFirstName: questionnaireAndReservationData.childFirstName,
      childLastNameKana: questionnaireAndReservationData.childLastNameKana,
      childFirstNameKana: questionnaireAndReservationData.childFirstNameKana,
      childBirthYear: questionnaireAndReservationData.childBirthYear,
      childBirthMonth: questionnaireAndReservationData.childBirthMonth,
      childBirthDay: questionnaireAndReservationData.childBirthDay,
      childNumber: questionnaireAndReservationData.childNumber,
      childGender: questionnaireAndReservationData.childGender,
      occupation: questionnaireAndReservationData.occupation,
      isOnMaternityLeave: questionnaireAndReservationData.isOnMaternityLeave,
      hasResigned: questionnaireAndReservationData.hasResigned,
      email: questionnaireAndReservationData.email,
      notes: questionnaireAndReservationData.notes, // 問診票の備考
    }
    const questionnaireResult = await submitQuestionnaire(questionnaireDataForSubmit)

    if (!questionnaireResult.success || !questionnaireResult.data) {
      throw new Error(questionnaireResult.error || "問診票の保存に失敗しました")
    }

    const savedQuestionnaire = questionnaireResult.data

    // 2. 予約データ用のFormDataを構築
    const appointmentFormData = new FormData()
    appointmentFormData.append("clinic_id", questionnaireAndReservationData.clinic_id)
    appointmentFormData.append("service_type_id", questionnaireAndReservationData.service_type_id)
    appointmentFormData.append("date", questionnaireAndReservationData.date)
    appointmentFormData.append("start_time", questionnaireAndReservationData.start_time)
    appointmentFormData.append("end_time", questionnaireAndReservationData.end_time)

    const patientName =
      `${questionnaireAndReservationData.motherLastName || ""} ${questionnaireAndReservationData.motherFirstName || ""}`.trim()
    appointmentFormData.append("patient_name", patientName || "名前未入力")
    appointmentFormData.append("patient_phone", questionnaireAndReservationData.phoneNumber)

    if (questionnaireAndReservationData.email) {
      appointmentFormData.append("email", questionnaireAndReservationData.email)
    }
    // 予約時の備考 (問診票のnotesとは別に設定する場合。なければ問診票のnotesを使うか、空にする)
    appointmentFormData.append(
      "notes",
      questionnaireAndReservationData.reservation_notes || questionnaireAndReservationData.notes || "",
    )
    appointmentFormData.append("csrf_token", questionnaireAndReservationData.csrf_token)
    appointmentFormData.append("questionnaire_id", savedQuestionnaire.id) // 保存した問診票のIDを連携

    // 3. 予約を作成
    const appointmentResult = await createAppointment(appointmentFormData)

    if (!appointmentResult.success || !appointmentResult.appointment) {
      // ここで問診票のロールバック処理を検討することもできるが、まずはエラーを投げる
      console.error("予約作成失敗:", appointmentResult.error)
      throw new Error(appointmentResult.error || "予約の作成に失敗しました")
    }

    return {
      success: true,
      message: "問診票と予約が正常に作成されました",
      questionnaireId: savedQuestionnaire.id,
      appointmentId: appointmentResult.appointment.id,
      appointmentToken: appointmentResult.appointment.token, // 予約確認に必要なトークン
    }
  } catch (error: any) {
    console.error("問診票と予約の作成エラー:", error)
    return {
      success: false,
      error: error.message || "問診票と予約の作成中にエラーが発生しました",
    }
  }
}

// ダミーの createReservation 関数は削除されました
