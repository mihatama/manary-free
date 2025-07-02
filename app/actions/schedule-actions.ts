"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import type { Database } from "@/lib/supabase/database.types"
import { validateCSRFToken } from "@/lib/csrf"

type Clinic = Database["public"]["Tables"]["clinics"]["Row"]
type ServiceType = Database["public"]["Tables"]["service_types"]["Row"]
type AvailabilitySetting = Database["public"]["Tables"]["availability_settings"]["Row"]

// CSRF検証を行うヘルパー関数
async function validateCSRF(formData: FormData) {
  const csrfToken = formData.get("csrf_token") as string
  if (!validateCSRFToken(csrfToken)) {
    throw new Error("セキュリティトークンが無効です。ページを再読み込みしてください。")
  }
}

// 全ての助産院を取得
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

// 特定の助産院の診療種別を取得
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

// 特定の診療種別の予約可能時間を取得
export async function getAvailabilitySettings(serviceTypeId: number) {
  const supabase = createClient()
  try {
    const { data, error } = await supabase
      .from("availability_settings")
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

// 特定の日付と診療種別の利用可能な時間枠を取得
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

// 時間を "HH:MM" 形式にフォーマット
function formatTime(minutes: number): string {
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  return `${hours.toString().padStart(2, "0")}:${mins.toString().padStart(2, "0")}`
}

// 診療種別を作成
export async function createServiceType(formData: FormData) {
  // CSRF検証
  try {
    await validateCSRF(formData)

    const serviceType = {
      clinic_id: Number(formData.get("clinic_id")),
      name: formData.get("name") as string,
      description: formData.get("description") as string,
      duration: Number(formData.get("duration")),
      color: formData.get("color") as string,
    }

    const supabase = createClient()
    const { data, error } = await supabase
      .from("service_types")
      .insert([
        {
          ...serviceType,
          updated_at: new Date().toISOString(),
        },
      ])
      .select()

    if (error) {
      console.error("Database operation error")
      throw new Error("データの保存に失敗しました")
    }

    revalidatePath("/dashboard/schedule-settings")
    return data[0]
  } catch (error) {
    console.error("Error in createServiceType")
    throw new Error("データの保存に失敗しました")
  }
}

// 診療種別を更新
export async function updateServiceType(formData: FormData) {
  try {
    // CSRF検証
    await validateCSRF(formData)

    const id = Number(formData.get("id"))
    const serviceType = {
      name: formData.get("name") as string,
      description: formData.get("description") as string,
      duration: Number(formData.get("duration")),
      color: formData.get("color") as string,
    }

    const supabase = createClient()
    const { data, error } = await supabase
      .from("service_types")
      .update({
        ...serviceType,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select()

    if (error) {
      console.error("Database operation error")
      throw new Error("データの更新に失敗しました")
    }

    revalidatePath("/dashboard/schedule-settings")
    return data[0]
  } catch (error) {
    console.error("Error in updateServiceType")
    throw new Error("データの更新に失敗しました")
  }
}

// 診療種別を削除
export async function deleteServiceType(formData: FormData) {
  try {
    // CSRF検証
    await validateCSRF(formData)

    const id = Number(formData.get("id"))

    const supabase = createClient()
    const { error } = await supabase.from("service_types").delete().eq("id", id)

    if (error) {
      console.error("Database operation error")
      throw new Error("データの削除に失敗しました")
    }

    revalidatePath("/dashboard/schedule-settings")
    return { success: true }
  } catch (error) {
    console.error("Error in deleteServiceType")
    throw new Error("データの削除に失敗しました")
  }
}

// 予約可能時間を作成または更新
export async function upsertAvailabilitySetting(formData: FormData) {
  try {
    // CSRF検証
    await validateCSRF(formData)

    const endDateValue = (formData.get("end_date") as string) || null
    const setting = {
      service_type_id: Number(formData.get("service_type_id")),
      day_of_week: Number(formData.get("day_of_week")),
      start_time: formData.get("start_time") as string,
      end_time: formData.get("end_time") as string,
      is_available: formData.get("is_available") === "true",
      specific_date: (formData.get("specific_date") as string) || null,
    }

    // Add end_date only if the column exists in the database
    try {
      // Check if we have an end date value
      if (endDateValue) {
        console.log("End date provided:", endDateValue)
        // @ts-ignore - We'll add this field even if TypeScript doesn't know about it yet
        setting.end_date = endDateValue
      }
    } catch (error) {
      console.error("Error setting end_date:", error)
      // Continue without the end_date field
    }

    // デバッグ用
    console.log("保存する設定:", setting)

    const supabase = createClient()

    // 既存の設定を確認
    let query = supabase
      .from("availability_settings")
      .select("id")
      .eq("service_type_id", setting.service_type_id)
      .eq("start_time", setting.start_time)
      .eq("end_time", setting.end_time)

    // 特定の日付が指定されている場合
    if (setting.specific_date) {
      console.log("特定日の設定を検索:", setting.specific_date) // デバッグ用
      query = query.eq("specific_date", setting.specific_date)
    } else {
      // 曜日ベースの場合
      console.log("曜日ベースの設定を検索:", setting.day_of_week) // デバッグ用
      query = query.eq("day_of_week", setting.day_of_week).is("specific_date", null)
    }

    const { data: existingData, error: queryError } = await query

    if (queryError) {
      console.error("既存設定の検索エラー:", queryError) // デバッグ用
    } else {
      console.log("既存設定の検索結果:", existingData) // デバッグ用
    }

    if (existingData && existingData.length > 0) {
      // 既存の設定を更新
      const { data, error } = await supabase
        .from("availability_settings")
        .update({
          ...setting,
          updated_at: new Date().toISOString(),
        })
        .eq("id", existingData[0].id)
        .select()

      if (error) {
        console.error("Database operation error:", error)
        console.error("Attempted to save setting:", setting)
        throw new Error("データの更新に失敗しました: " + error.message)
      }

      revalidatePath("/dashboard/schedule-settings")
      return data[0]
    } else {
      // 新しい設定を作成
      const { data, error } = await supabase
        .from("availability_settings")
        .insert([
          {
            ...setting,
            updated_at: new Date().toISOString(),
          },
        ])
        .select()

      if (error) {
        console.error("Database operation error:", error)
        console.error("Attempted to save setting:", setting)
        throw new Error("データの保存に失敗しました: " + error.message)
      }

      revalidatePath("/dashboard/schedule-settings")
      return data[0]
    }
  } catch (error) {
    console.error("Error in upsertAvailabilitySetting")
    throw new Error("データの保存に失敗しました")
  }
}

// 予約可能時間を削除
export async function deleteAvailabilitySetting(formData: FormData) {
  try {
    // CSRF検証
    await validateCSRF(formData)

    const id = Number(formData.get("id"))

    const supabase = createClient()
    const { error } = await supabase.from("availability_settings").delete().eq("id", id)

    if (error) {
      console.error("Database operation error")
      throw new Error("データの削除に失敗しました")
    }

    revalidatePath("/dashboard/schedule-settings")
    return { success: true }
  } catch (error) {
    console.error("Error in deleteAvailabilitySetting")
    throw new Error("データの削除に失敗しました")
  }
}
