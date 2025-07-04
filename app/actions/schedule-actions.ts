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
    const { data: existingReservations, error: reservationsError } = await supabase
      .from("reservations")
      .select("start_time, end_time")
      .eq("service_type_id", serviceTypeId)
      .eq("reservation_date", date)
      .neq("status", "cancelled")

    if (reservationsError) {
      console.error("予約の取得エラー:", reservationsError)
      throw new Error("予約情報の取得に失敗しました")
    }

    // 既存の予約と重複する時間枠を除外
    const availableTimeSlots = timeSlots.filter((slot) => {
      return !existingReservations.some((reservation) => {
        const reservationStartTime = reservation.start_time.substring(0, 5)
        const reservationEndTime = reservation.end_time.substring(0, 5)
        const slotStartTime = slot.startTime
        const slotEndTime = slot.endTime

        return (
          (slotStartTime >= reservationStartTime && slotStartTime < reservationEndTime) ||
          (slotEndTime > reservationStartTime && slotEndTime <= reservationEndTime) ||
          (slotStartTime <= reservationStartTime && slotEndTime >= reservationEndTime)
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

// 新しいサーバーアクション：休憩時間を含む週次の予約可能時間を作成
export async function createWeeklyAvailability(formData: FormData) {
  try {
    await validateCSRF(formData)

    const service_type_id = Number(formData.get("service_type_id"))
    const day_of_week = Number(formData.get("day_of_week"))
    const start_time = formData.get("start_time") as string
    const end_time = formData.get("end_time") as string
    const is_available = true // Always true for new availability
    const end_date = (formData.get("end_date") as string) || null
    const break_start_time = (formData.get("break_start_time") as string) || null
    const break_end_time = (formData.get("break_end_time") as string) || null

    // --- Server-side validation ---
    if (start_time >= end_time) {
      throw new Error("開始時間は終了時間より前である必要があります")
    }

    const supabase = createClient()

    // Fetch service type duration
    const { data: serviceType, error: serviceTypeError } = await supabase
      .from("service_types")
      .select("duration")
      .eq("id", service_type_id)
      .single()

    if (serviceTypeError || !serviceType) {
      throw new Error("診療種別の取得に失敗しました")
    }
    const duration = serviceType.duration
    if (!duration || duration <= 0) {
      throw new Error("診療種別の所要時間が0分以下に設定されているため、予約枠を作成できません。")
    }

    // Define work periods
    const workPeriods: { start: string; end: string }[] = []
    if (break_start_time && break_end_time) {
      if (break_start_time >= break_end_time) {
        throw new Error("休憩の開始時間は終了時間より前である必要があります")
      }
      if (break_start_time <= start_time || break_end_time >= end_time) {
        throw new Error("休憩時間は勤務時間内に設定してください")
      }
      workPeriods.push({ start: start_time, end: break_start_time })
      workPeriods.push({ start: break_end_time, end: end_time })
    } else {
      workPeriods.push({ start: start_time, end: end_time })
    }

    // Generate slots based on duration
    const slotsToCreate: { start_time: string; end_time: string }[] = []
    const timeToMinutes = (time: string): number => {
      const [hours, minutes] = time.split(":").map(Number)
      return hours * 60 + minutes
    }

    for (const period of workPeriods) {
      let currentMinutes = timeToMinutes(period.start)
      const periodEndMinutes = timeToMinutes(period.end)

      while (currentMinutes + duration <= periodEndMinutes) {
        const slotStartTime = formatTime(currentMinutes)
        const slotEndTime = formatTime(currentMinutes + duration)
        slotsToCreate.push({ start_time: slotStartTime, end_time: slotEndTime })
        currentMinutes += duration
      }
    }

    if (slotsToCreate.length === 0) {
      throw new Error("作成できる予約枠がありません。勤務時間と所要時間を確認してください。")
    }

    // --- Overlap check ---
    const { data: existingSettings, error: fetchError } = await supabase
      .from("availability_settings")
      .select("start_time, end_time")
      .eq("service_type_id", service_type_id)
      .eq("day_of_week", day_of_week)
      .is("specific_date", null)

    if (fetchError) {
      console.error("Error fetching existing settings:", fetchError)
      throw new Error("既存の設定の確認に失敗しました")
    }

    for (const slot of slotsToCreate) {
      const hasOverlap = existingSettings.some(
        (existing) =>
          (slot.start_time >= existing.start_time && slot.start_time < existing.end_time) ||
          (slot.end_time > existing.start_time && slot.end_time <= existing.end_time) ||
          (slot.start_time <= existing.start_time && slot.end_time >= existing.end_time),
      )
      if (hasOverlap) {
        throw new Error(`時間帯 ${slot.start_time}-${slot.end_time} は既存の設定と重複しています`)
      }
    }

    // --- Insert new settings ---
    const newSettingsPayload = slotsToCreate.map((slot) => ({
      service_type_id,
      day_of_week,
      start_time: slot.start_time,
      end_time: slot.end_time,
      is_available,
      end_date,
      updated_at: new Date().toISOString(),
    }))

    const { data, error } = await supabase.from("availability_settings").insert(newSettingsPayload).select()

    if (error) {
      console.error("Database operation error:", error)
      throw new Error("データの保存に失敗しました: " + error.message)
    }

    revalidatePath("/dashboard/schedule-settings")
    return data // returns an array of new settings
  } catch (error: any) {
    console.error("Error in createWeeklyAvailability:", error)
    // Re-throw with a user-friendly message
    throw new Error(error.message || "予約可能時間の作成に失敗しました")
  }
}

// 新しいサーバーアクション：休憩時間を含む特定日の予約可能時間を作成
export async function createSpecificDateAvailability(formData: FormData) {
  try {
    await validateCSRF(formData)

    const service_type_id = Number(formData.get("service_type_id"))
    const specific_date = formData.get("specific_date") as string
    const start_time = formData.get("start_time") as string
    const end_time = formData.get("end_time") as string
    const break_start_time = (formData.get("break_start_time") as string) || null
    const break_end_time = (formData.get("break_end_time") as string) || null

    if (!specific_date) {
      throw new Error("日付が指定されていません")
    }

    // --- Server-side validation ---
    if (start_time >= end_time) {
      throw new Error("開始時間は終了時間より前である必要があります")
    }

    const supabase = createClient()

    // Fetch service type duration
    const { data: serviceType, error: serviceTypeError } = await supabase
      .from("service_types")
      .select("duration")
      .eq("id", service_type_id)
      .single()

    if (serviceTypeError || !serviceType) {
      throw new Error("診療種別の取得に失敗しました")
    }
    const duration = serviceType.duration
    if (!duration || duration <= 0) {
      throw new Error("診療種別の所要時間が0分以下に設定されているため、予約枠を作成できません。")
    }

    // Define work periods
    const workPeriods: { start: string; end: string }[] = []
    if (break_start_time && break_end_time) {
      if (break_start_time >= break_end_time) {
        throw new Error("休憩の開始時間は終了時間より前である必要があります")
      }
      if (break_start_time <= start_time || break_end_time >= end_time) {
        throw new Error("休憩時間は勤務時間内に設定してください")
      }
      workPeriods.push({ start: start_time, end: break_start_time })
      workPeriods.push({ start: break_end_time, end: end_time })
    } else {
      workPeriods.push({ start: start_time, end: end_time })
    }

    // Generate slots based on duration
    const slotsToCreate: { start_time: string; end_time: string }[] = []
    const timeToMinutes = (time: string): number => {
      const [hours, minutes] = time.split(":").map(Number)
      return hours * 60 + minutes
    }

    for (const period of workPeriods) {
      let currentMinutes = timeToMinutes(period.start)
      const periodEndMinutes = timeToMinutes(period.end)

      while (currentMinutes + duration <= periodEndMinutes) {
        const slotStartTime = formatTime(currentMinutes)
        const slotEndTime = formatTime(currentMinutes + duration)
        slotsToCreate.push({ start_time: slotStartTime, end_time: slotEndTime })
        currentMinutes += duration
      }
    }

    if (slotsToCreate.length === 0) {
      throw new Error("作成できる予約枠がありません。勤務時間と所要時間を確認してください。")
    }

    // --- Overlap check ---
    const { data: existingSettings, error: fetchError } = await supabase
      .from("availability_settings")
      .select("start_time, end_time")
      .eq("service_type_id", service_type_id)
      .eq("specific_date", specific_date)

    if (fetchError) {
      console.error("Error fetching existing settings:", fetchError)
      throw new Error("既存の設定の確認に失敗しました")
    }

    for (const slot of slotsToCreate) {
      const hasOverlap = existingSettings.some(
        (existing) =>
          (slot.start_time >= existing.start_time && slot.start_time < existing.end_time) ||
          (slot.end_time > existing.start_time && slot.end_time <= existing.end_time) ||
          (slot.start_time <= existing.start_time && slot.end_time >= existing.end_time),
      )
      if (hasOverlap) {
        throw new Error(`時間帯 ${slot.start_time}-${slot.end_time} は既存の設定と重複しています`)
      }
    }

    // --- Insert new settings ---
    const day_of_week = new Date(specific_date).getDay()
    const newSettingsPayload = slotsToCreate.map((slot) => ({
      service_type_id,
      day_of_week,
      specific_date,
      start_time: slot.start_time,
      end_time: slot.end_time,
      is_available: true,
      updated_at: new Date().toISOString(),
    }))

    const { data, error } = await supabase.from("availability_settings").insert(newSettingsPayload).select()

    if (error) {
      console.error("Database operation error:", error)
      throw new Error("データの保存に失敗しました: " + error.message)
    }

    revalidatePath("/dashboard/schedule-settings")
    return data // returns an array of new settings
  } catch (error: any) {
    console.error("Error in createSpecificDateAvailability:", error)
    throw new Error(error.message || "特定日の予約可能時間の作成に失敗しました")
  }
}
