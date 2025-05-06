import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { format, eachDayOfInterval, parseISO } from "date-fns"

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const clinicId = searchParams.get("clinicId")
    const serviceTypeId = searchParams.get("serviceTypeId")
    const start = searchParams.get("start")
    const end = searchParams.get("end")

    if (!clinicId || !serviceTypeId || !start || !end) {
      return NextResponse.json({ error: "必須パラメータが不足しています" }, { status: 400 })
    }

    const supabase = createClient()

    // 指定された期間の予約可能時間設定を取得
    const { data: availabilitySettings, error: availabilityError } = await supabase
      .from("availability_settings")
      .select("*")
      .eq("service_type_id", serviceTypeId)
      .eq("is_available", true)

    if (availabilityError) {
      console.error("予約可能時間設定の取得エラー:", availabilityError)
      return NextResponse.json({ error: "予約可能時間設定の取得に失敗しました" }, { status: 500 })
    }

    // 指定された期間の予約を取得
    const { data: existingAppointments, error: appointmentsError } = await supabase
      .from("appointments")
      .select("*")
      .eq("service_type_id", serviceTypeId)
      .eq("clinic_id", clinicId)
      .gte("appointment_date", start)
      .lte("appointment_date", end)
      .neq("status", "cancelled")

    if (appointmentsError) {
      console.error("予約の取得エラー:", appointmentsError)
      return NextResponse.json({ error: "予約の取得に失敗しました" }, { status: 500 })
    }

    // 期間内の全日付を生成
    const allDates = eachDayOfInterval({
      start: parseISO(start),
      end: parseISO(end),
    }).map((date) => format(date, "yyyy-MM-dd"))

    // 各日付について、予約可能かどうかを判定
    const availableDates = allDates.filter((date) => {
      // 曜日を取得（0: 日曜日, 1: 月曜日, ...）
      const dayOfWeek = parseISO(date).getDay()

      // 特定の日付の設定を探す
      const specificDateSetting = availabilitySettings.find((setting) => setting.specific_date === date)

      // 曜日ベースの設定を探す
      const dayOfWeekSetting = availabilitySettings.find(
        (setting) => setting.day_of_week === dayOfWeek && !setting.specific_date,
      )

      // 特定の日付の設定または曜日ベースの設定があれば予約可能
      const hasAvailabilitySetting = specificDateSetting || dayOfWeekSetting

      // その日の予約状況をチェック
      const appointmentsForDate = existingAppointments.filter((appointment) => appointment.appointment_date === date)

      // 予約可能時間設定があり、かつ予約が埋まっていなければ予約可能
      return hasAvailabilitySetting && appointmentsForDate.length < 10 // 1日の最大予約数を10とする
    })

    return NextResponse.json({ availableDates })
  } catch (error) {
    console.error("利用可能な日付の取得エラー:", error)
    return NextResponse.json({ error: "利用可能な日付の取得に失敗しました" }, { status: 500 })
  }
}
