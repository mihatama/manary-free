import { type NextRequest, NextResponse } from "next/server"
import { format, eachDayOfInterval, parseISO } from "date-fns"

export async function GET(request: NextRequest) {
  console.log("available-dates API 呼び出し開始")
  try {
    const searchParams = request.nextUrl.searchParams
    const clinicId = searchParams.get("clinicId")
    const serviceTypeId = searchParams.get("serviceTypeId")
    const start = searchParams.get("start")
    const end = searchParams.get("end")

    console.log("リクエストパラメータ", { clinicId, serviceTypeId, start, end })

    if (!clinicId || !serviceTypeId || !start || !end) {
      console.error("必須パラメータが不足しています")
      return NextResponse.json({ error: "必須パラメータが不足しています" }, { status: 400 })
    }

    // 開発環境またはテスト用に仮のデータを返す
    // 実際の環境では、データベースから取得するロジックを実装する
    try {
      const startDate = parseISO(start)
      const endDate = parseISO(end)

      // 期間内の全日付を生成
      const allDates = eachDayOfInterval({
        start: startDate,
        end: endDate,
      }).map((date) => format(date, "yyyy-MM-dd"))

      // テスト用に、すべての日付を利用可能とする
      const availableDates = allDates
      console.log("利用可能な日付を生成しました", { count: availableDates.length })

      return NextResponse.json({ availableDates })
    } catch (parseError) {
      console.error("日付のパース中にエラーが発生しました", parseError)
      return NextResponse.json({ error: "日付の形式が正しくありません" }, { status: 400 })
    }
  } catch (error) {
    console.error("利用可能な日付の取得エラー:", error)
    return NextResponse.json({ error: "利用可能な日付の取得に失敗しました" }, { status: 500 })
  }
}
