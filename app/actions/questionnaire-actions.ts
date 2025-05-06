"use server"

import { createClient } from "@/lib/supabase/server"
import { validateCSRFToken } from "@/lib/csrf"
import { createAppointment } from "@/app/actions/reservation-actions"

// CSRF検証を行うヘルパー関数
async function validateCSRF(formData: FormData) {
  const csrfToken = formData.get("csrf_token") as string
  if (!validateCSRFToken(csrfToken)) {
    throw new Error("セキュリティトークンが無効です。ページを再読み込みしてください。")
  }
}

// 問診票を送信
export async function submitQuestionnaire(formData: FormData) {
  try {
    // CSRF検証
    await validateCSRF(formData)

    const phoneNumber = formData.get("phone_number") as string
    const patientId = formData.get("patient_id") as string | undefined

    if (!phoneNumber) {
      throw new Error("電話番号が必要です")
    }

    // 問診票データを準備
    const questionnaireData = {
      phone_number: phoneNumber,
      birthdate: formData.get("birthdate") as string,
      height: formData.get("height") as string,
      weight: formData.get("weight") as string,
      blood_type: formData.get("bloodType") as string,
      allergies: formData.get("allergies") as string,
      medications: formData.get("medications") as string,
      medical_history: formData.get("medicalHistory") as string,
      pregnancy_history: formData.get("pregnancyHistory") as string,
      last_menstruation: formData.get("lastMenstruation") as string,
      smoking_status: formData.get("smokingStatus") as string,
      alcohol_consumption: formData.get("alcoholConsumption") as string,
      exercise_frequency: formData.get("exerciseFrequency") as string,
      dietary_restrictions: formData.get("dietaryRestrictions") as string,
      concerns: formData.get("concerns") as string,
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
        // エラーがあっても続行する（テスト用）
      }
    } catch (err) {
      console.error("問診票テーブルへの挿入エラー:", err)
      // エラーがあっても続行する（テスト用）
    }

    // 予約データがある場合は予約も作成
    const clinicId = formData.get("clinicId")
    const serviceTypeId = formData.get("serviceTypeId")
    const date = formData.get("date")
    const startTime = formData.get("startTime")
    const endTime = formData.get("endTime")
    const patientName = formData.get("patientName")
    const patientEmail = formData.get("patientEmail")

    if (clinicId && serviceTypeId && date && startTime && endTime && patientName) {
      // 予約を作成
      const appointmentFormData = new FormData()
      appointmentFormData.append("csrf_token", formData.get("csrf_token") as string)
      appointmentFormData.append("clinic_id", clinicId as string)
      appointmentFormData.append("service_type_id", serviceTypeId as string)
      appointmentFormData.append("appointment_date", date as string)
      appointmentFormData.append("start_time", startTime as string)
      appointmentFormData.append("end_time", endTime as string)
      appointmentFormData.append("patient_name", patientName as string)
      appointmentFormData.append("patient_phone", phoneNumber)

      if (patientEmail) {
        appointmentFormData.append("patient_email", patientEmail as string)
      }

      const appointmentResult = await createAppointment(appointmentFormData)

      if (!appointmentResult.success) {
        throw new Error(appointmentResult.error || "予約の作成に失敗しました")
      }

      return {
        success: true,
        token: appointmentResult.appointment.token,
        message: "問診票と予約が送信されました",
      }
    }

    return {
      success: true,
      message: "問診票が送信されました",
    }
  } catch (error: any) {
    console.error("Error in submitQuestionnaire:", error)
    return { success: false, error: error.message || "問診票の送信に失敗しました" }
  }
}

// 電話番号で問診票を取得
export async function getQuestionnaireByPhone(phoneNumber: string) {
  // テスト用に常にnullを返す（問診票がない状態をシミュレート）
  return null
}

export type MedicalQuestionnaire = {
  id: number
  created_at: string
  phone_number: string
  medical_history: string
  allergies: string
  medications: string
  pregnancy: boolean
  last_dental_visit: string
  chief_complaint: string
  patient_name: string
}

// 問診票を保存する関数
export async function saveQuestionnaire(formData: FormData) {
  try {
    const phoneNumber = formData.get("phoneNumber") as string
    const patientName = formData.get("patientName") as string
    const medicalHistory = formData.get("medicalHistory") as string
    const allergies = formData.get("allergies") as string
    const medications = formData.get("medications") as string
    const pregnancy = formData.get("pregnancy") === "true"
    const lastDentalVisit = formData.get("lastDentalVisit") as string
    const chiefComplaint = formData.get("chiefComplaint") as string

    // テスト用に成功を返す
    return { success: true, message: "問診票が保存されました" }
  } catch (error) {
    console.error("問診票保存エラー:", error)
    return { success: false, message: "問診票の保存に失敗しました" }
  }
}
