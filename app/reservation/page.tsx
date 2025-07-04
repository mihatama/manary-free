import { Suspense } from "react"
import { NewReservationFlow } from "@/components/new-reservation-flow"
import { getClinics, getServiceTypes } from "@/app/actions/schedule-actions"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"

export default async function ReservationPage() {
  const clinics = await getClinics()
  const serviceTypes = await getServiceTypes()

  return (
    <div className="container mx-auto p-4 md:p-8">
      <header className="text-center mb-8">
        <h1 className="text-3xl font-bold text-pink-500">ご予約</h1>
        <p className="text-gray-600">オンラインで簡単にご予約いただけます。</p>
      </header>
      <main>
        <Card>
          <CardHeader>
            <CardTitle>新規予約作成</CardTitle>
            <CardDescription>以下のステップに従って予約を完了してください。</CardDescription>
          </CardHeader>
          <CardContent>
            <Suspense fallback={<div>読み込み中...</div>}>
              <NewReservationFlow clinics={clinics} serviceTypes={serviceTypes} />
            </Suspense>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
