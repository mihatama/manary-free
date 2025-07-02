"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import { validateCSRFToken } from "@/lib/csrf"

async function validateCSRF(formData: FormData) {
  const csrfToken = formData.get("csrf_token") as string
  if (!validateCSRFToken(csrfToken)) {
    throw new Error("セキュリティトークンが無効です。ページを再読み込みしてください。")
  }
}

// Service Type Actions
export async function createServiceType(formData: FormData) {
  await validateCSRF(formData)
  const supabase = createClient()
  const serviceTypeData = {
    clinic_id: Number(formData.get("clinic_id")),
    name: formData.get("name") as string,
    description: formData.get("description") as string,
    duration: Number(formData.get("duration")),
    color: formData.get("color") as string,
  }
  const { data, error } = await supabase.from("service_types").insert(serviceTypeData).select().single()
  if (error) {
    console.error("createServiceType error:", error)
    throw new Error("診療種別の作成に失敗しました。")
  }
  revalidatePath("/dashboard/schedule-settings")
  return data
}

export async function updateServiceType(formData: FormData) {
  await validateCSRF(formData)
  const supabase = createClient()
  const id = Number(formData.get("id"))
  const serviceTypeData = {
    name: formData.get("name") as string,
    description: formData.get("description") as string,
    duration: Number(formData.get("duration")),
    color: formData.get("color") as string,
  }
  const { data, error } = await supabase.from("service_types").update(serviceTypeData).eq("id", id).select().single()
  if (error) {
    console.error("updateServiceType error:", error)
    throw new Error("診療種別の更新に失敗しました。")
  }
  revalidatePath("/dashboard/schedule-settings")
  return data
}

export async function deleteServiceType(formData: FormData) {
  try {
    await validateCSRF(formData)
    const id = Number(formData.get("id"))
    const supabase = createClient()

    const { data: appointments, error: appointmentsError } = await supabase
      .from("appointments")
      .select("id")
      .eq("service_type_id", id)
      .limit(1)

    if (appointmentsError) {
      console.error("Error checking for appointments:", appointmentsError)
      throw new Error("診療種別の削除中にエラーが発生しました。")
    }

    if (appointments && appointments.length > 0) {
      throw new Error("この診療種別には既存の予約があるため削除できません。")
    }

    const { error: availabilityError } = await supabase.from("availabilities").delete().eq("service_type_id", id)

    if (availabilityError) {
      console.error("Error deleting availabilities:", availabilityError)
      throw new Error("関連する予約可能時間の削除に失敗しました。")
    }

    const { error: serviceTypeError } = await supabase.from("service_types").delete().eq("id", id)

    if (serviceTypeError) {
      console.error("Error deleting service type:", serviceTypeError)
      throw new Error("診療種別の削除に失敗しました。")
    }

    revalidatePath("/dashboard/schedule-settings")
    return { success: true }
  } catch (error: any) {
    console.error("Error in deleteServiceType:", error)
    throw new Error(error.message || "診療種別の削除に失敗しました。")
  }
}

// Availability Actions
export async function setAvailabilities(formData: FormData) {
  await validateCSRF(formData)
  const supabase = createClient()
  const clinicId = Number(formData.get("clinic_id"))
  const serviceTypeId = Number(formData.get("service_type_id"))
  const availabilities = JSON.parse(formData.get("availabilities") as string)

  const { error: deleteError } = await supabase.from("availabilities").delete().eq("service_type_id", serviceTypeId)
  if (deleteError) {
    console.error("setAvailabilities delete error:", deleteError)
    throw new Error("既存の予約可能時間設定の削除に失敗しました。")
  }

  if (availabilities.length > 0) {
    const newAvailabilities = availabilities.map((avail: any) => ({
      clinic_id: clinicId,
      service_type_id: serviceTypeId,
      day_of_week: avail.day_of_week,
      start_time: avail.start_time,
      end_time: avail.end_time,
    }))
    const { error: insertError } = await supabase.from("availabilities").insert(newAvailabilities)
    if (insertError) {
      console.error("setAvailabilities insert error:", insertError)
      throw new Error("新しい予約可能時間設定の保存に失敗しました。")
    }
  }

  revalidatePath("/dashboard/schedule-settings")
  return { success: true }
}

// Clinic Actions
export async function getClinics() {
  const supabase = createClient()
  try {
    const { data, error } = await supabase.from("clinics").select("*").order("name")

    if (error) {
      console.error("Database query error")
      throw new Error("データの取得に失敗しました")
    }

    return data
  } catch (error) {
    console.error("Error in getClinics")
    throw new Error("データの取得に失敗しました")
  }
}

// Service Type Actions
export async function getServiceTypes(clinicId?: number) {
  const supabase = createClient()
  try {
    let query = supabase.from("service_types").select("*").order("name")

    // 助産院IDが指定されている場合はフィルタリング
    if (clinicId) {
      query = query.eq("clinic_id", clinicId)
    }

    const { data, error } = await query

    if (error) {
      console.error("Database query error")
      throw new Error("データの取得に失敗しました")
    }

    return data
  } catch (error) {
    console.error("Error in getServiceTypes")
    throw new Error("データの取得に失敗しました")
  }
}

// Availability Actions
export async function getAvailabilitySettings(serviceTypeId: number) {
  const supabase = createClient()
  try {
    const { data, error } = await supabase
      .from("availabilities")
      .select("*")
      .eq("service_type_id", serviceTypeId)
      .order("day_of_week")

    if (error) {
      console.error("Database query error", error)
      throw new Error("データの取得に失敗しました")
    }

    // デバッグ用
    console.log(`サービスタイプID ${serviceTypeId} の予約可能時間:`, data)
    console.log("特定日の設定数:", data.filter((s) => s.specific_date).length)

    return data
  } catch (error) {
    console.error("Error in getAvailabilitySettings", error)
    throw new Error("データの取得に失敗しました")
  }
}

// Availability Actions
export async function getAvailableTimeSlots(serviceTypeId: number, date: string) {
  try {
    // 診療種別の情報を取得
    const supabase = createClient()
    const { data: serviceType, error: serviceTypeError } = await supabase
      .from("service_types")
      .select("*")
      .eq("id", serviceTypeId)
      .single()

    if (serviceTypeError || !serviceType) {
      console.error("診療種別の取得エラー:", serviceTypeError)
      throw new Error("診療種別の取得に失敗しました")
    }

    // 予約可能時間設定を取得
    const availabilitySettings = await getAvailabilitySettings(serviceTypeId)

    // 日付オブジェクトを作成
    const targetDate = new Date(date)
    const dayOfWeek = targetDate.getDay() // 0: 日曜日, 1: 月曜日, ...

    // 特定日の設定を探す
    const specificDateSetting = availabilitySettings.find(
      (setting) => setting.specific_date === date && setting.is_available,
    )

    // 曜日ベースの設定を探す
    const dayOfWeekSetting = availabilitySettings.find(
      (setting) => setting.day_of_week === dayOfWeek && !setting.specific_date && setting.is_available,
    )

    // 適用する設定を決定
    const appliedSetting = specificDateSetting || dayOfWeekSetting

    if (!appliedSetting) {
      // 利用可能な設定がない場合は空の配列を返す
      return []
    }

    // 時間枠を生成
    const timeSlots = []
    const duration = serviceType.duration // 診療時間（分）

    // 開始時間と終了時間をパース
    const [startHour, startMinute] = appliedSetting.start_time.split(":").map(Number)
    const [endHour, endMinute] = appliedSetting.end_time.split(":").map(Number)

    // 開始時間（分単位）
    let currentMinutes = startHour * 60 + startMinute

    // 終了時間（分単位）
    const endMinutes = endHour * 60 + endMinute

    // 時間枠を生成
    while (currentMinutes + duration <= endMinutes) {
      const startTime = formatTime(currentMinutes)
      const endTime = formatTime(currentMinutes + duration)

      timeSlots.push({
        startTime,
        endTime,
        available: true, // 予約状況の確認は別途実装
      })

      // 次の時間枠へ
      currentMinutes += duration
    }

    // 既存の予約を取得して利用可能な時間枠をフィルタリング
    const { data: existingAppointments, error: appointmentsError } = await supabase
      .from("appointments")
      .select("*")
      .eq("service_type_id", serviceTypeId)
      .eq("appointment_date", date)
      .neq("status", "cancelled")

    if (appointmentsError) {
      console.error("予約の取得エラー:", appointmentsError)
      throw new Error("予約情報の取得に失敗しました")
    }

    // 既存の予約と重複する時間枠を除外
    const availableTimeSlots = timeSlots.filter((slot) => {
      return !existingAppointments.some((appointment) => {
        return (
          (slot.startTime >= appointment.start_time && slot.startTime < appointment.end_time) ||
          (slot.endTime > appointment.start_time && slot.endTime <= appointment.end_time) ||
          (slot.startTime <= appointment.start_time && slot.endTime >= appointment.end_time)
        )
      })
    })

    return availableTimeSlots
  } catch (error) {
    console.error("利用可能な時間枠の取得エラー:", error)
    throw new Error("利用可能な時間枠の取得に失敗しました")
  }
}

// Helper Functions
function formatTime(minutes: number): string {
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  return `${hours.toString().padStart(2, "0")}:${mins.toString().padStart(2, "0")}`
}
