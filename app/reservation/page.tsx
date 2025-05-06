import { Suspense } from "react"
import { ReservationForm } from "@/components/reservation-form"

export default function ReservationPage() {
  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-2xl font-bold text-center mb-8">予約システム</h1>

      <div className="max-w-2xl mx-auto">
        <Suspense fallback={<div>読み込み中...</div>}>
          <ReservationForm />
        </Suspense>
      </div>
    </div>
  )
}
