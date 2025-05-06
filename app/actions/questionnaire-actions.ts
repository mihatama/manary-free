"use server"

import { createClient } from "@/lib/supabase/server"
import { validateCSRFToken } from "@/lib/csrf"

// CSRF検証を行うヘルパー関数
async function validateCSRF(formData: FormData) {
  const csrfToken = formData.get("csrf_token") as string
  if (!validateCSRFToken(csrfToken)) {
    throw new Error("セキュリティトークンが無効です。ページを再読み込みしてください。")
  }
}

// 問診票を送信
export async function submitQuestionnaire(data: any) {
  try {
    const phoneNumber = data.phoneNumber

    if (!phoneNumber) {
      throw new Error("電話番号が必要です")
    }

    // 問診票データを準備
    const questionnaireData = {
      phone_number: phoneNumber,

      // 受診場所
      location_nishinomiya: data.locationNishinomiya || false,
      location_takarazuka: data.locationTakarazuka || false,
      location_nihonbashi: data.locationNihonbashi || false,
      location_aichi: data.locationAichi || false,
      location_visit: data.locationVisit || false,

      // ママ情報
      mother_last_name: data.motherLastName || "",
      mother_first_name: data.motherFirstName || "",
      mother_last_name_kana: data.motherLastNameKana || "",
      mother_first_name_kana: data.motherFirstNameKana || "",
      mother_birth_year: data.motherBirthYear || null,
      mother_birth_month: data.motherBirthMonth || null,
      mother_birth_day: data.motherBirthDay || null,

      // お子様情報
      child_last_name: data.childLastName || "",
      child_first_name: data.childFirstName || "",
      child_last_name_kana: data.childLastNameKana || "",
      child_first_name_kana: data.childFirstNameKana || "",
      child_birth_year: data.childBirthYear || null,
      child_birth_month: data.childBirthMonth || null,
      child_birth_day: data.childBirthDay || null,
      child_number: data.childNumber || null,
      child_gender: data.childGender || "",

      // お仕事について
      occupation: data.occupation || "",
      is_on_maternity_leave: data.isOnMaternityLeave || false,
      has_resigned: data.hasResigned || false,

      // 予約関連情報
      email: data.email || "",
      notes: data.notes || "",

      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }

    // 問診票を保存
    const supabase = createClient()

    try {
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
    } catch (err) {
      console.error("問診票テーブルへの挿入エラー:", err)
      throw err
    }
  } catch (error: any) {
    console.error("Error in submitQuestionnaire:", error)
    return { success: false, error: error.message || "問診票の送信に失敗しました" }
  }
}

// 電話番号で問診票を取得
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
export async function createQuestionnaireAndReservation(data: any) {
  try {
    // 1. 問診票を保存
    const questionnaireResult = await submitQuestionnaire(data)

    if (!questionnaireResult.success) {
      throw new Error(questionnaireResult.error || "問診票の保存に失敗しました")
    }

    // 2. 予約データを作成
    const reservationData = {
      clinicId: data.reservationData.clinicId,
      serviceTypeId: data.reservationData.serviceTypeId,
      date: data.reservationData.date,
      startTime: data.reservationData.startTime,
      endTime: data.reservationData.endTime,
      patientName: `${data.motherLastName} ${data.motherFirstName}`,
      phoneNumber: data.phoneNumber,
      email: data.email || "",
      notes: data.notes || "",
    }

    // 3. 予約を作成
    const reservationResult = await createReservation(reservationData)

    if (!reservationResult.success) {
      throw new Error(reservationResult.error || "予約の作成に失敗しました")
    }

    return {
      success: true,
      message: "問診票と予約が正常に作成されました",
      reservationId: reservationResult.reservationId,
    }
  } catch (error: any) {
    console.error("問診票と予約の作成エラー:", error)
    return {
      success: false,
      error: error.message || "問診票と予約の作成中にエラーが発生しました",
    }
  }
}

// 予約作成用の関数（reservation-actionsから呼び出す）
export async function createReservation(data: any) {
  try {
    // 実際の予約作成ロジックはreservation-actionsに実装されているため、
    // ここではダミーの成功レスポンスを返す（テスト用）
    return {
      success: true,
      reservationId: "test-reservation-id",
      message: "予約が作成されました",
    }
  } catch (error: any) {
    return {
      success: false,
      error: error.message || "予約の作成に失敗しました",
    }
  }
}
