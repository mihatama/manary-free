import { getAppointmentByToken } from "@/app/actions/reservation-actions"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { notFound } from "next/navigation"
import { format } from "date-fns"
import { ja } from "date-fns/locale"
import { CheckCircle, AlertTriangle } from "lucide-react"

// Helper function to safely format the reservation date and time
const formatReservationDateTime = (dateStr: string | null, timeStr: string | null): string => {
  if (!dateStr || !timeStr) {
    return "日時情報不明"
  }
  try {
    // Combine date and time and explicitly parse as JST (+09:00)
    // This creates a correct Date object regardless of the server's timezone
    const dateTimeInJST = new Date(`${dateStr}T${timeStr}+09:00`)

    // Check if the created date is valid
    if (isNaN(dateTimeInJST.getTime())) {
      console.error("Invalid date created:", `${dateStr}T${timeStr}`)
      return "無効な日時情報"
    }

    return format(dateTimeInJST, "yyyy年MM月dd日 (E) HH:mm", { locale: ja })
  } catch (error) {
    console.error("Error formatting date:", error)
    return "日時のフォーマットに失敗しました"
  }
}

export default async function ReservationConfirmationPage({ searchParams }: { searchParams: { token?: string } }) {
  if (!searchParams.token) {
    notFound()
  }

  const appointment = await getAppointmentByToken(searchParams.token)

  if (!appointment) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <Card className="w-full max-w-lg text-center">
          <CardHeader>
            <div className="mx-auto bg-red-100 rounded-full p-3 w-fit">
              <AlertTriangle className="h-8 w-8 text-red-600" />
            </div>
            <CardTitle className="mt-4">予約が見つかりません</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600">
              ご指定の予約情報が見つかりませんでした。URLが正しいかご確認いただくか、お手数ですが再度予約手続きをお願いいたします。
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Safely access nested properties
  const clinicName = Array.isArray(appointment.clinics)
    ? appointment.clinics[0]?.name
    : (appointment.clinics?.name ?? "クリニック情報なし")
  const serviceTypeName = Array.isArray(appointment.service_types)
    ? appointment.service_types[0]?.name
    : (appointment.service_types?.name ?? "サービス情報なし")

  const formattedDateTime = formatReservationDateTime(appointment.reservation_date, appointment.start_time)

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <Card className="w-full max-w-lg">
        <CardHeader className="text-center">
          <div className="mx-auto bg-green-100 rounded-full p-3 w-fit">
            <CheckCircle className="h-8 w-8 text-green-600" />
          </div>
          <CardTitle className="mt-4">ご予約ありがとうございます</CardTitle>
          <CardDescription>以下の内容でご予約を承りました。</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="border rounded-lg p-4 space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-500">お名前</span>
              <span className="font-medium">{appointment.patient_name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">クリニック</span>
              <span className="font-medium">{clinicName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">診療内容</span>
              <span className="font-medium">{serviceTypeName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">ご予約日時</span>
              <span className="font-medium">{formattedDateTime}</span>
            </div>
          </div>
          <p className="text-xs text-gray-500 text-center">
            予約の変更やキャンセルをご希望の場合は、クリニックまで直接お問い合わせください。
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
