import { Suspense } from "react"
import { getAppointmentByToken } from "@/app/actions/reservation-actions"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { CheckCircle, Calendar, User, MapPin, Stethoscope } from "lucide-react"
import { format, parseISO } from "date-fns"
import { ja } from "date-fns/locale"

function ConfirmationContent({ token }: { token: string }) {
  return (
    <Suspense fallback={<ConfirmationSkeleton />}>
      <ConfirmationData token={token} />
    </Suspense>
  )
}

async function ConfirmationData({ token }: { token: string }) {
  const appointment = await getAppointmentByToken(token)

  if (!appointment) {
    return (
      <Card className="w-full max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>予約情報が見つかりません</CardTitle>
        </CardHeader>
        <CardContent>
          <p>指定された予約情報が見つかりませんでした。URLをご確認の上、再度お試しください。</p>
        </CardContent>
      </Card>
    )
  }

  const safeParseDate = (dateStr: string | null, timeStr: string | null): Date | null => {
    if (!dateStr || !timeStr) return null
    try {
      const combinedStr = `${dateStr}T${timeStr}`
      const date = parseISO(combinedStr)
      return isNaN(date.getTime()) ? null : date
    } catch (e) {
      return null
    }
  }

  const reservationDate = safeParseDate(appointment.reservation_date, appointment.start_time)

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader className="text-center">
        <div className="flex justify-center items-center mb-4">
          <CheckCircle className="h-16 w-16 text-green-500" />
        </div>
        <CardTitle className="text-2xl font-bold">ご予約が確定しました</CardTitle>
        <CardDescription>ご予約いただきありがとうございます。詳細は下記をご確認ください。</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4 p-6 border rounded-lg">
          <h3 className="font-semibold text-lg">予約内容</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex items-start space-x-3">
              <Calendar className="h-5 w-5 text-gray-500 mt-1" />
              <div>
                <p className="text-sm text-gray-500">予約日時</p>
                <p className="font-medium">
                  {reservationDate ? format(reservationDate, "yyyy年M月d日 (E) HH:mm", { locale: ja }) : "日時情報なし"}
                </p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <User className="h-5 w-5 text-gray-500 mt-1" />
              <div>
                <p className="text-sm text-gray-500">お名前</p>
                <p className="font-medium">{appointment.patient_name}</p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <MapPin className="h-5 w-5 text-gray-500 mt-1" />
              <div>
                <p className="text-sm text-gray-500">助産院</p>
                <p className="font-medium">{appointment.clinics?.name ?? "情報なし"}</p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <Stethoscope className="h-5 w-5 text-gray-500 mt-1" />
              <div>
                <p className="text-sm text-gray-500">診療内容</p>
                <p className="font-medium">{appointment.service_types?.name ?? "情報なし"}</p>
              </div>
            </div>
          </div>
        </div>
        <Alert>
          <AlertTitle>今後の流れ</AlertTitle>
          <AlertDescription>
            当日は予約時間の5分前までにお越しください。持ち物など、ご不明な点がございましたらお気軽にお問い合わせください。
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  )
}

function ConfirmationSkeleton() {
  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader className="text-center">
        <div className="flex justify-center items-center mb-4">
          <div className="h-16 w-16 bg-gray-200 rounded-full animate-pulse" />
        </div>
        <div className="h-8 bg-gray-200 rounded w-3/4 mx-auto animate-pulse" />
        <div className="h-4 bg-gray-200 rounded w-1/2 mx-auto mt-2 animate-pulse" />
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4 p-6 border rounded-lg">
          <div className="h-6 bg-gray-200 rounded w-1/4 animate-pulse" />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="flex items-start space-x-3">
                <div className="h-5 w-5 bg-gray-200 rounded animate-pulse mt-1" />
                <div className="w-full">
                  <div className="h-4 bg-gray-200 rounded w-1/3 animate-pulse" />
                  <div className="h-5 bg-gray-200 rounded w-2/3 mt-1 animate-pulse" />
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="p-4 border rounded-lg">
          <div className="h-5 bg-gray-200 rounded w-1/5 mb-2 animate-pulse" />
          <div className="h-4 bg-gray-200 rounded w-full animate-pulse" />
        </div>
      </CardContent>
    </Card>
  )
}

export default function ConfirmationPage({ searchParams }: { searchParams: { token?: string } }) {
  const token = searchParams.token

  return (
    <div className="container mx-auto py-12 px-4">
      {!token ? (
        <Card className="w-full max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle>無効なアクセス</CardTitle>
          </CardHeader>
          <CardContent>
            <p>予約情報にアクセスするための情報が不足しています。</p>
          </CardContent>
        </Card>
      ) : (
        <ConfirmationContent token={token} />
      )}
    </div>
  )
}
