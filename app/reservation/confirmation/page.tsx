import { redirect } from "next/navigation"
import { getAppointmentByToken } from "@/app/actions/reservation-actions"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import Image from "next/image"
import { format } from "date-fns"
import { ja } from "date-fns/locale"

export default async function ConfirmationPage({
  searchParams,
}: {
  searchParams: { token: string }
}) {
  const { token } = searchParams

  if (!token) {
    redirect("/reservation")
  }

  try {
    const appointment = await getAppointmentByToken(token)

    if (!appointment) {
      redirect("/reservation")
    }

    const appointmentDate = new Date(appointment.appointment_date)
    const formattedDate = format(appointmentDate, "yyyy年MM月dd日(EEE)", { locale: ja })
    const startTime = appointment.start_time.substring(0, 5)
    const endTime = appointment.end_time.substring(0, 5)

    return (
      <div className="min-h-screen bg-white">
        <header className="border-b border-gray-100">
          <div className="container mx-auto px-4 py-4 flex justify-between items-center">
            <div className="flex items-center">
              <Image src="/manary-logo.png" alt="Manary Logo" width={60} height={60} />
              <h1 className="text-xl font-bold text-[#f8a0a0] ml-2">マナリー</h1>
            </div>
            <div>
              <Link href="/reservation" className="text-sm text-[#f8a0a0] hover:underline mr-4">
                新規予約
              </Link>
              <Link href="/reservation/manage" className="text-sm text-[#f8a0a0] hover:underline">
                予約の確認・変更
              </Link>
            </div>
          </div>
        </header>

        <main className="container mx-auto px-4 py-12">
          <div className="max-w-2xl mx-auto">
            <h1 className="text-3xl font-bold text-[#f8a0a0] text-center mb-8">予約完了</h1>

            <Card className="w-full shadow-md border-gray-100 mb-8">
              <CardHeader className="bg-green-50 border-b border-green-100">
                <CardTitle className="text-xl text-center text-green-800">予約が確定しました</CardTitle>
                <CardDescription className="text-center text-green-700">
                  以下の内容で予約を受け付けました
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <h3 className="text-sm font-medium text-gray-500">助産院</h3>
                      <p className="text-lg">{appointment.clinics.name}</p>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-gray-500">診療種別</h3>
                      <p className="text-lg">{appointment.service_types.name}</p>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-gray-500">日付</h3>
                      <p className="text-lg">{formattedDate}</p>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-gray-500">時間</h3>
                      <p className="text-lg">
                        {startTime} - {endTime}
                      </p>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-gray-500">お名前</h3>
                      <p className="text-lg">{appointment.patient_name}</p>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-gray-500">電話番号</h3>
                      <p className="text-lg">{appointment.patient_phone}</p>
                    </div>
                    {appointment.patient_email && (
                      <div>
                        <h3 className="text-sm font-medium text-gray-500">メールアドレス</h3>
                        <p className="text-lg">{appointment.patient_email}</p>
                      </div>
                    )}
                  </div>

                  <div className="mt-6 pt-6 border-t border-gray-200">
                    <div className="mt-6 text-center">
                      <p className="text-sm text-gray-600 mb-2">予約管理用トークン（4桁の数字）</p>
                      <div className="flex justify-center items-center space-x-2 mb-4">
                        {token.split("").map((digit, index) => (
                          <div
                            key={index}
                            className="w-12 h-12 flex items-center justify-center bg-blue-100 rounded-lg border border-blue-300 text-xl font-bold"
                          >
                            {digit}
                          </div>
                        ))}
                      </div>
                      <p className="text-sm text-gray-600">
                        このトークンは予約の確認・変更・キャンセルに必要です。
                        <br />
                        大切に保管してください。
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <Link href="/reservation">
                <Button variant="outline" className="w-full">
                  新しい予約を作成
                </Button>
              </Link>
              <Link href={`/reservation/manage?token=${appointment.token}`}>
                <Button className="w-full bg-[#f8a0a0] hover:bg-[#f78989]">予約を管理する</Button>
              </Link>
            </div>
          </div>
        </main>

        <footer className="mt-auto py-6 border-t border-gray-100">
          <div className="container mx-auto px-4 text-center text-gray-500 text-sm">
            &copy; {new Date().getFullYear()} Manary. All rights reserved.
          </div>
        </footer>
      </div>
    )
  } catch (error) {
    console.error("Error in ConfirmationPage:", error)
    redirect("/reservation")
  }
}
