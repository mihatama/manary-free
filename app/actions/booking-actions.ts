"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import { v4 as uuidv4 } from "uuid"
import { format, parseISO } from "date-fns"
import { validateCSRFToken } from "@/lib/csrf"

// 予約可能な時間枠を取得
export async function getAvailableTimeSlots(clinicId: number, serviceTypeId: number, date: string) {
  const supabase = createClient()

  try {
    // 1. 選択された診療種別の情報を取得
    const { data: serviceType, error: serviceTypeError } = await supabase
      .from("service_types")
      .select("*")
      .eq("id", serviceTypeId)
      .single()

    if (serviceTypeError) {
      console.error("Error fetching service type:", serviceTypeError)
      return generateDefaultTimeSlots(date, 60) // デフォルトの所要時間は60分
    }

    if (!serviceType) {
      console.error("Service type not found")
      return generateDefaultTimeSlots(date, 60)
    }

    // 2. 選択された日付の曜日を取得
    const dateObj = parseISO(date)
    const dayOfWeek = dateObj.getDay() // 0 = 日曜日, 1 = 月曜日, ...

    // 3. availability_settingsテーブルから利用可能時間を取得
    const { data: availabilitySettings, error: availabilityError } = await supabase
      .from("availability_settings")
      .select("*")
      .eq("service_type_id", serviceTypeId)
      .or(`day_of_week.eq.${dayOfWeek},specific_date.eq.${date}`)
      .eq("is_available", true)
      .order("specific_date", { ascending: false }) // 特定日付の設定を優先

    // availability_settingsテーブルが存在しない場合やエラーの場合
    if (availabilityError) {
      console.error("Error fetching availability settings:", availabilityError)

      // schedules テーブルから取得を試みる
      const { data: schedules, error: scheduleError } = await supabase
        .from("schedules")
        .select("*")
        .eq("clinic_id", clinicId)
        .eq("date", date)
        .order("start_time")

      if (scheduleError || !schedules || schedules.length === 0) {
        return generateDefaultTimeSlots(date, serviceType.duration)
      }

      // schedulesテーブルからスロットを生成
      return generateTimeSlotsFromSchedules(date, serviceType.duration, schedules)
    }

    // 利用可能設定がない場合はデフォルトのスケジュールを返す
    if (!availabilitySettings || availabilitySettings.length === 0) {
      return generateDefaultTimeSlots(date, serviceType.duration)
    }

    // 4. 既存の予約を取得
    let existingBookings: any[] = []
    try {
      const { data: bookings, error: bookingsError } = await supabase
        .from("bookings")
        .select("*")
        .eq("clinic_id", clinicId)
        .eq("booking_date", date)
        .neq("status", "cancelled")
        .order("start_time")

      if (!bookingsError && bookings) {
        existingBookings = bookings
      }
    } catch (err) {
      console.error("Error fetching bookings:", err)
    }

    // 5. 利用可能な時間枠を計算
    const availableSlots: { start: string; end: string }[] = []

    // 特定日付の設定または曜日の設定を使用
    const setting = availabilitySettings[0]

    if (setting) {
      const startTime = new Date(`${date}T${setting.start_time}`)
      const endTime = new Date(`${date}T${setting.end_time}`)

      // 診療時間内で、診療種別の所要時間ごとに時間枠を作成
      let currentSlotStart = new Date(startTime)

      while (true) {
        const currentSlotEnd = new Date(currentSlotStart.getTime() + serviceType.duration * 60 * 1000)

        // 終了時間を超えたら終了
        if (currentSlotEnd > endTime) break

        // この時間枠が既存の予約と重複していないか確認
        const isSlotAvailable = !existingBookings?.some((booking) => {
          const bookingStart = new Date(`${date}T${booking.start_time}`)
          const bookingEnd = new Date(`${date}T${booking.end_time}`)

          return (
            (currentSlotStart < bookingEnd && currentSlotEnd > bookingStart) ||
            (currentSlotStart.getTime() === bookingStart.getTime() && currentSlotEnd.getTime() === bookingEnd.getTime())
          )
        })

        // 利用可能な時間枠を追加
        if (isSlotAvailable) {
          availableSlots.push({
            start: format(currentSlotStart, "HH:mm"),
            end: format(currentSlotEnd, "HH:mm"),
          })
        }

        // 次の時間枠へ（30分単位で進める）
        currentSlotStart = new Date(currentSlotStart.getTime() + 30 * 60 * 1000)
      }
    }

    return availableSlots
  } catch (error) {
    console.error("Error in getAvailableTimeSlots:", error)
    // エラーが発生した場合はデフォルトのスケジュールを返す
    return generateDefaultTimeSlots(date, 60)
  }
}

// スケジュールからタイムスロットを生成する関数
function generateTimeSlotsFromSchedules(
  date: string,
  duration: number,
  schedules: any[],
): { start: string; end: string }[] {
  const slots: { start: string; end: string }[] = []

  for (const schedule of schedules) {
    const startTime = new Date(`${date}T${schedule.start_time}`)
    const endTime = new Date(`${date}T${schedule.end_time}`)

    let currentSlotStart = new Date(startTime)

    while (true) {
      const currentSlotEnd = new Date(currentSlotStart.getTime() + duration * 60 * 1000)

      // 終了時間を超えたら終了
      if (currentSlotEnd > endTime) break

      slots.push({
        start: format(currentSlotStart, "HH:mm"),
        end: format(currentSlotEnd, "HH:mm"),
      })

      // 次の時間枠へ（30分単位で進める）
      currentSlotStart = new Date(currentSlotStart.getTime() + 30 * 60 * 1000)
    }
  }

  return slots
}

// デフォルトの時間枠を生成する関数
function generateDefaultTimeSlots(date: string, duration: number): { start: string; end: string }[] {
  const slots: { start: string; end: string }[] = []

  // デフォルトの営業時間: 9:00-17:00
  const startTime = new Date(`${date}T09:00:00`)
  const endTime = new Date(`${date}T17:00:00`)

  let currentSlotStart = new Date(startTime)

  while (true) {
    const currentSlotEnd = new Date(currentSlotStart.getTime() + duration * 60 * 1000)

    // 終了時間を超えたら終了
    if (currentSlotEnd > endTime) break

    slots.push({
      start: format(currentSlotStart, "HH:mm"),
      end: format(currentSlotEnd, "HH:mm"),
    })

    // 次の時間枠へ（30分単位で進める）
    currentSlotStart = new Date(currentSlotStart.getTime() + 30 * 60 * 1000)
  }

  return slots
}

// 予約を作成
export async function createBooking(formData: FormData) {
  // CSRFトークンの検証
  const csrfToken = formData.get("csrf_token") as string
  if (!csrfToken) {
    throw new Error("セキュリティトークンが不足しています")
  }

  try {
    await validateCSRFToken(csrfToken)
  } catch (error) {
    console.error("CSRF validation error:", error)
    throw new Error("セキュリティトークンが無効です")
  }

  const clinicId = Number(formData.get("clinic_id"))
  const serviceTypeId = Number(formData.get("service_type_id"))
  const bookingDate = formData.get("booking_date") as string
  const startTime = formData.get("start_time") as string
  const endTime = formData.get("end_time") as string
  const patientName = formData.get("patient_name") as string
  const patientEmail = (formData.get("patient_email") as string) || null
  const patientPhone = formData.get("patient_phone") as string
  const notes = (formData.get("notes") as string) || null

  // 入力検証
  if (!clinicId || !serviceTypeId || !bookingDate || !startTime || !endTime || !patientName || !patientPhone) {
    throw new Error("必須項目が不足しています")
  }

  const supabase = createClient()

  try {
    // 予約の重複チェック
    const { data: existingBookings, error: checkError } = await supabase
      .from("bookings")
      .select("*")
      .eq("clinic_id", clinicId)
      .eq("booking_date", bookingDate)
      .neq("status", "cancelled")
      .or(`start_time.lte.${endTime},end_time.gte.${startTime}`)

    if (checkError) {
      console.error("Error checking existing bookings:", checkError)
      throw new Error("予約の確認中にエラーが発生しました")
    }

    if (existingBookings && existingBookings.length > 0) {
      throw new Error("選択された時間枠は既に予約されています")
    }

    // アクセストークンの生成
    const accessToken = uuidv4()

    // 予約の作成
    const { data: booking, error: insertError } = await supabase
      .from("bookings")
      .insert({
        clinic_id: clinicId,
        service_type_id: serviceTypeId,
        booking_date: bookingDate,
        start_time: startTime,
        end_time: endTime,
        patient_name: patientName,
        patient_email: patientEmail,
        patient_phone: patientPhone,
        notes: notes,
        status: "confirmed",
        access_token: accessToken,
      })
      .select()
      .single()

    if (insertError) {
      console.error("Error creating booking:", insertError)
      throw new Error("予約の作成に失敗しました")
    }

    // キャッシュの再検証
    revalidatePath("/admin/bookings")
    revalidatePath("/booking")

    return booking
  } catch (error: any) {
    console.error("Error in createBooking:", error)
    throw new Error(error.message || "予約処理中にエラーが発生しました")
  }
}
