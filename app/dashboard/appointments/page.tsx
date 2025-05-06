import { requireAuth } from "@/lib/auth"
import { getAllAppointments } from "@/app/actions/reservation-actions"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { format } from "date-fns"
import { ja } from "date-fns/locale"
import Link from "next/link"
import { Button } from "@/components/ui/button"

export default async function AppointmentsPage() {
  // サーバーサイドで認証チェック
  await requireAuth()

  // 全ての予約を取得
  const appointments = await getAllAppointments()

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200">
        <div className="container mx-auto px-4 py-4">
          <h1 className="text-xl font-bold text-[#f8a0a0]">予約一覧</h1>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-lg font-bold">予約管理</h2>
          <Link href="/reservation" target="_blank">
            <Button className="bg-manary-pink hover:bg-[#f78989]">予約ページを開く</Button>
          </Link>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>予約一覧</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-gray-50 border-b">
                    <th className="px-4 py-2 text-left">日付</th>
                    <th className="px-4 py-2 text-left">時間</th>
                    <th className="px-4 py-2 text-left">診療種別</th>
                    <th className="px-4 py-2 text-left">患者名</th>
                    <th className="px-4 py-2 text-left">電話番号</th>
                    <th className="px-4 py-2 text-left">ステータス</th>
                    <th className="px-4 py-2 text-left">予約日時</th>
                  </tr>
                </thead>
                <tbody>
                  {appointments.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-4 py-4 text-center text-gray-500">
                        予約はありません
                      </td>
                    </tr>
                  ) : (
                    appointments.map((appointment) => {
                      const appointmentDate = new Date(appointment.appointment_date)
                      const formattedDate = format(appointmentDate, "yyyy/MM/dd(EEE)", { locale: ja })
                      const startTime = appointment.start_time.substring(0, 5)
                      const endTime = appointment.end_time.substring(0, 5)
                      const createdAt = new Date(appointment.created_at)
                      const formattedCreatedAt = format(createdAt, "yyyy/MM/dd HH:mm")

                      return (
                        <tr key={appointment.id} className="border-b hover:bg-gray-50">
                          <td className="px-4 py-3">{formattedDate}</td>
                          <td className="px-4 py-3">
                            {startTime} - {endTime}
                          </td>
                          <td className="px-4 py-3">
                            <span
                              className="inline-block w-3 h-3 rounded-full mr-2"
                              style={{ backgroundColor: appointment.service_types.color }}
                            />
                            {appointment.service_types.name}
                          </td>
                          <td className="px-4 py-3">{appointment.patient_name}</td>
                          <td className="px-4 py-3">{appointment.patient_phone}</td>
                          <td className="px-4 py-3">
                            <span
                              className={`inline-block px-2 py-1 rounded-full text-xs ${
                                appointment.status === "confirmed"
                                  ? "bg-green-100 text-green-800"
                                  : "bg-red-100 text-red-800"
                              }`}
                            >
                              {appointment.status === "confirmed" ? "予約済" : "キャンセル"}
                            </span>
                          </td>
                          <td className="px-4 py-3">{formattedCreatedAt}</td>
                        </tr>
                      )
                    })
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
