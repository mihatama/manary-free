"use server"

import crypto from "crypto"
import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import type { Database } from "@/lib/supabase/database.types"
import { validateCSRFToken } from "@/lib/csrf"
import { sendSMS } from "@/lib/twilio"

type Appointment = Database["public"]["Tables"]["appointments"]["Row"]
type AvailabilitySlot = {
  date: string
  start_time: string
  end_time: string
  service_type_id: number
  clinic_id: number
}

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

// CSRF検証を行うヘルパー関数
async function validateCSRF(formData: FormData) {
  const csrfToken = formData.get("csrf_token") as string
  if (!validateCSRFToken(csrfToken)) {
    throw new Error("セキュリティトークンが無効です。ページを再読み込みしてください。")
  }
}

// 予約可能な時間枠を取得
export async function getAvailableTimeSlots(clinicId: number, serviceTypeId: number, date: string) {
  const supabase = createClient()
  try {
    // 指定された日付の曜日を取得
    const dayOfWeek = new Date(date).getDay()

    // 1. 特定の日付の設定を取得
    const { data: specificDateSettings, error: specificError } = await supabase
      .from("availability_settings")
      .select("*")
      .eq("service_type_id", serviceTypeId)
      .eq("specific_date", date)
      .eq("is_available", true)

    if (specificError) {
      console.error("特定日付の設定取得エラー:", specificError)
      throw new Error("予約可能時間の取得に失敗しました")
    }

    // 特定の日付の設定がある場合はそれを使用
    if (specificDateSettings && specificDateSettings.length > 0) {
      // 既存の予約を取得して除外
      const availableSlots = await filterOutBookedSlots(
        specificDateSettings.map((setting) => ({
          date,
          start_time: setting.start_time,
          end_time: setting.end_time,
          service_type_id: serviceTypeId,
          clinic_id: clinicId,
        })),
        date,
        serviceTypeId,
      )

      return availableSlots
    }

    // 2. 曜日ベースの設定を取得
    const { data: weeklySettings, error: weeklyError } = await supabase
      .from("availability_settings")
      .select("*")
      .eq("service_type_id", serviceTypeId)
      .eq("day_of_week", dayOfWeek)
      .is("specific_date", null)
      .eq("is_available", true)

    if (weeklyError) {
      console.error("曜日ベースの設定取得エラー:", weeklyError)
      throw new Error("予約可能時間の取得に失敗しました")
    }

    // 終了日をチェック
    const filteredWeeklySettings = weeklySettings.filter((setting) => {
      if (!setting.end_date) return true
      return new Date(date) <= new Date(setting.end_date)
    })

    // 既存の予約を取得して除外
    const availableSlots = await filterOutBookedSlots(
      filteredWeeklySettings.map((setting) => ({
        date,
        start_time: setting.start_time,
        end_time: setting.end_time,
        service_type_id: serviceTypeId,
        clinic_id: clinicId,
      })),
      date,
      serviceTypeId,
    )

    return availableSlots
  } catch (error) {
    console.error("Error in getAvailableTimeSlots:", error)
    throw new Error("予約可能時間の取得に失敗しました")
  }
}

// 既に予約されている時間枠を除外
async function filterOutBookedSlots(availabilitySlots: AvailabilitySlot[], date: string, serviceTypeId: number) {
  const supabase = createClient()

  // 指定された日付の予約を取得
  const { data: existingAppointments, error } = await supabase
    .from("appointments")
    .select("*")
    .eq("appointment_date", date)
    .eq("service_type_id", serviceTypeId)
    .neq("status", "cancelled")

  if (error) {
    console.error("既存予約の取得エラー:", error)
    throw new Error("予約情報の取得に失敗しました")
  }

  // 診療種別の所要時間を取得
  const { data: serviceType, error: serviceTypeError } = await supabase
    .from("service_types")
    .select("*")
    .eq("id", serviceTypeId)
    .single()

  if (serviceTypeError) {
    console.error("診療種別の取得エラー:", serviceTypeError)
    throw new Error("診療種別の取得に失敗しました")
  }

  const durationMinutes = serviceType.duration

  // 予約可能な時間枠を30分単位で分割
  const timeSlots: { start: string; end: string }[] = []

  availabilitySlots.forEach((slot) => {
    const startTime = new Date(`${date}T${slot.start_time}`)
    const endTime = new Date(`${date}T${slot.end_time}`)

    // 30分単位で時間枠を作成
    let currentTime = new Date(startTime)
    while (currentTime.getTime() + durationMinutes * 60000 <= endTime.getTime()) {
      const slotEndTime = new Date(currentTime.getTime() + durationMinutes * 60000)

      timeSlots.push({
        start: currentTime.toTimeString().substring(0, 5),
        end: slotEndTime.toTimeString().substring(0, 5),
      })

      // 次の時間枠（30分後）
      currentTime = new Date(currentTime.getTime() + 30 * 60000)
    }
  })

  // 既存の予約と重複する時間枠を除外
  const availableTimeSlots = timeSlots.filter((slot) => {
    // 既存の予約と重複するかチェック
    return !existingAppointments.some((appointment) => {
      const appointmentStart = appointment.start_time.substring(0, 5)
      const appointmentEnd = appointment.end_time.substring(0, 5)

      // 時間枠が予約と重複するかチェック
      return (
        (slot.start >= appointmentStart && slot.start < appointmentEnd) ||
        (slot.end > appointmentStart && slot.end <= appointmentEnd) ||
        (slot.start <= appointmentStart && slot.end >= appointmentEnd)
      )
    })
  })

  return availableTimeSlots
}

// 予約トークンを生成する関数を追加
async function generateUniqueToken(supabase: any): Promise<string> {
  // 最大10回試行
  for (let i = 0; i < 10; i++) {
    // 暗号学的に安全な32文字のランダムな16進数文字列を生成
    const token = crypto.randomBytes(4).toString("hex")

    // トークンの重複チェック
    const { data, error } = await supabase.from("appointments").select("token").eq("token", token)

    if (error) {
      console.error("トークン重複チェックエラー:", error)
      continue
    }

    // トークンが存在しない場合は使用可能
    if (data.length === 0) {
      return token
    }
  }

  // 10回試行しても一意のトークンが生成できない場合はエラー
  throw new Error("一意の予約トークンを生成できませんでした。しばらく経ってから再度お試しください。")
}

// 予約を作成
export async function createAppointment(formData: FormData) {
  const supabase = createClient()
  try {
    // CSRF検証
    await validateCSRF(formData)

    const clinicId = Number(formData.get("clinic_id"))
    const serviceTypeId = Number(formData.get("service_type_id"))
    const appointmentDate = formData.get("appointment_date") as string
    const startTime = formData.get("start_time") as string
    const endTime = formData.get("end_time") as string
    const patientName = formData.get("patient_name") as string
    const patientPhone = formData.get("patient_phone") as string
    const patientEmail = (formData.get("patient_email") as string) || null
    const notes = (formData.get("notes") as string) || null // 予約時の備考を取得
    const questionnaireIdString = formData.get("questionnaire_id") as string | null // 問診票IDを文字列として取得

    // questionnaire_id を数値に変換、存在しない場合は null
    const questionnaireId = questionnaireIdString ? Number.parseInt(questionnaireIdString, 10) : null

    // 入力検証 (questionnaireId はオプショナルなのでここでは検証しない)
    if (!clinicId || !serviceTypeId || !appointmentDate || !startTime || !endTime || !patientName || !patientPhone) {
      throw new Error("必須項目が入力されていません")
    }

    // 予約トークンを生成
    const token = await generateUniqueToken(supabase)

    // 予約を作成
    const { data, error } = await supabase
      .from("appointments")
      .insert([
        {
          clinic_id: clinicId,
          service_type_id: serviceTypeId,
          appointment_date: appointmentDate,
          start_time: startTime,
          end_time: endTime,
          patient_name: patientName,
          patient_phone: patientPhone,
          patient_email: patientEmail,
          notes: notes, // 備考を保存
          questionnaire_id: questionnaireId, // 問診票IDを保存
          token: token,
          status: "confirmed",
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ])
      .select() // select() で挿入されたレコードを返す

    if (error) {
      console.error("予約作成エラー:", error)
      throw new Error("予約の作成に失敗しました")
    }

    if (!data || data.length === 0) {
      throw new Error("予約の作成に成功しましたが、データが返されませんでした。")
    }

    const newAppointment = data[0]

    // 患者が新規かどうかを電話番号で判定
    const existingQuestionnaire = await getQuestionnaireByPhone(newAppointment.patient_phone)
    const isNewPatient = !existingQuestionnaire

    // SMSで予約確認を送信
    try {
      const { data: clinicData, error: clinicError } = await supabase
        .from("clinics")
        .select("name")
        .eq("id", newAppointment.clinic_id)
        .single()

      if (clinicError) {
        console.error("SMS送信のためのクリニック情報取得エラー:", clinicError)
      }

      const clinicName = clinicData?.name || "クリニック"

      // タイムゾーン問題を避けるため、日付文字列を直接パース
      const [year, month, day] = newAppointment.appointment_date.split("-").map(Number)
      const dateObj = new Date(year, month - 1, day)
      const dayOfWeek = ["日", "月", "火", "水", "木", "金", "土"][dateObj.getDay()]
      const formattedDate = `${month}月${day}日`

      const formattedTime = newAppointment.start_time.substring(0, 5)

      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL
      if (!baseUrl) {
        console.error("NEXT_PUBLIC_BASE_URLが設定されていません。SMSに管理URLを含められません。")
      }
      const managementUrl = baseUrl ? `${baseUrl}/reservation/manage?token=${newAppointment.token}` : "予約管理ページ"

      let message = `${clinicName}です。${newAppointment.patient_name}様のご予約が完了しました。\n日時: ${formattedDate}(${dayOfWeek}) ${formattedTime}\n予約の確認・変更・キャンセルはこちら:\n${managementUrl}`

      // 新規患者の場合、問診票のリンクを追加
      if (isNewPatient && baseUrl) {
        const questionnaireUrl = `${baseUrl}/reservation/questionnaire?token=${newAppointment.token}`
        message += `\n\n初めての方は、事前に以下のリンクから問診票のご入力をお願いいたします。\n${questionnaireUrl}`
      }

      const smsSent = await sendSMS(newAppointment.patient_phone, message)
      if (!smsSent) {
        console.warn(`予約(ID: ${newAppointment.id})のSMS通知の送信に失敗しました。`)
      }
    } catch (smsError) {
      console.error("SMS送信処理中にエラーが発生しました:", smsError)
    }

    revalidatePath("/reservation") // 予約カレンダーページなどを再検証
    revalidatePath("/dashboard/appointments") // 管理者用予約一覧も再検証
    return { success: true, appointment: newAppointment } // 成功時、作成された予約情報を返す
  } catch (error: any) {
    console.error("Error in createAppointment:", error)
    return { success: false, error: error.message || "予約の作成に失敗しました" }
  }
}

// createReservation関数を追加（createAppointmentのエイリアス）
// こちらも createAppointment を呼び出すように統一
export async function createReservation(formData: FormData) {
  return createAppointment(formData)
}

// トークンで予約を取得
export async function getAppointmentByToken(token: string) {
  const supabase = createClient()
  try {
    const { data, error } = await supabase
      .from("appointments")
      .select(
        `
      *,
      service_types (
        name,
        duration,
        color
      ),
      clinics (
        name,
        address,
        phone
      ),
      questionnaires (
        * 
      )
    `,
      )
      .eq("token", token)
      .single()

    if (error) {
      console.error("予約取得エラー:", error)
      throw new Error("予約情報の取得に失敗しました")
    }

    return data
  } catch (error) {
    console.error("Error in getAppointmentByToken:", error)
    throw new Error("予約情報の取得に失敗しました")
  }
}

// 予約を更新
export async function updateAppointment(formData: FormData) {
  try {
    // CSRF検証
    await validateCSRF(formData)

    const token = formData.get("token") as string
    const appointmentDate = formData.get("appointment_date") as string
    const startTime = formData.get("start_time") as string
    const endTime = formData.get("end_time") as string
    const patientName = formData.get("patient_name") as string
    const patientPhone = formData.get("patient_phone") as string
    const patientEmail = (formData.get("patient_email") as string) || null
    const notes = (formData.get("notes") as string) || null // 備考を取得

    // 入力検証
    if (!token || !appointmentDate || !startTime || !endTime || !patientName || !patientPhone) {
      throw new Error("必須項目が入力されていません")
    }

    const supabase = createClient()

    // 予約を更新
    const { data, error } = await supabase
      .from("appointments")
      .update({
        appointment_date: appointmentDate,
        start_time: startTime,
        end_time: endTime,
        patient_name: patientName,
        patient_phone: patientPhone,
        patient_email: patientEmail,
        notes: notes, // 備考を更新
        updated_at: new Date().toISOString(),
      })
      .eq("token", token)
      .select()

    if (error) {
      console.error("予約更新エラー:", error)
      throw new Error("予約の更新に失敗しました")
    }

    if (!data || data.length === 0) {
      throw new Error("予約の更新に成功しましたが、データが返されませんでした。")
    }

    revalidatePath("/reservation/manage")
    return { success: true, appointment: data[0] }
  } catch (error: any) {
    console.error("Error in updateAppointment:", error)
    return { success: false, error: error.message || "予約の更新に失敗しました" }
  }
}

// 予約をキャンセル
export async function cancelAppointment(formData: FormData) {
  try {
    // CSRF検証
    await validateCSRF(formData)

    const token = formData.get("token") as string

    // 入力検証
    if (!token) {
      throw new Error("予約トークンが指定されていません")
    }

    const supabase = createClient()

    // 予約をキャンセル
    const { data, error } = await supabase
      .from("appointments")
      .update({
        status: "cancelled",
        updated_at: new Date().toISOString(),
      })
      .eq("token", token)
      .select()

    if (error) {
      console.error("予約キャンセルエラー:", error)
      throw new Error("予約のキャンセルに失敗しました")
    }

    if (!data || data.length === 0) {
      throw new Error("予約のキャンセルに成功しましたが、データが返されませんでした。")
    }

    revalidatePath("/reservation/manage")
    return { success: true, appointment: data[0] }
  } catch (error: any) {
    console.error("Error in cancelAppointment:", error)
    return { success: false, error: error.message || "予約のキャンセルに失敗しました" }
  }
}

// 全ての予約を取得（管理者用）
export async function getAllAppointments() {
  const supabase = createClient()
  try {
    const { data, error } = await supabase
      .from("appointments")
      .select(
        `
      *,
      service_types (
        name,
        duration,
        color
      ),
      clinics (
        name,
        address,
        phone
      ),
      questionnaires (
        *
      )
    `,
      )
      .order("appointment_date", { ascending: true })
      .order("start_time", { ascending: true })

    if (error) {
      console.error("予約一覧取得エラー:", error)
      throw new Error("予約情報の取得に失敗しました")
    }

    return data
  } catch (error) {
    console.error("Error in getAllAppointments:", error)
    throw new Error("予約情報の取得に失敗しました")
  }
}

export const getAvailableSlots = getAvailableTimeSlots
