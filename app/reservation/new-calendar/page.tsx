import { Suspense } from "react"
import { ReservationCalendarView } from "@/components/reservation-calendar-view"
import Image from "next/image"
import Link from "next/link"

export default function NewCalendarPage() {
  return (
    <div className="min-h-screen bg-white">
      <header className="border-b border-gray-100">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center">
            <Image src="/manary-logo.png" alt="Manary Logo" width={60} height={60} />
            <h1 className="text-xl font-bold text-[#f8a0a0] ml-2">Manary</h1>
          </div>
          <div>
            <Link href="/reservation" className="text-sm text-[#f8a0a0] hover:underline">
              予約の確認・変更
            </Link>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 bg-[#ffeaed] py-8">
        <h1 className="text-2xl font-bold text-center mb-8 text-[#f8a0a0]">新規予約</h1>

        <div className="max-w-5xl mx-auto">
          <Suspense fallback={<div className="text-center py-8">読み込み中...</div>}>
            <ReservationCalendarView />
          </Suspense>
        </div>
      </main>

      <footer className="mt-auto py-6 border-t border-gray-100">
        <div className="container mx-auto px-4 text-center text-gray-500 text-sm">
          &copy; {new Date().getFullYear()} Manary. All rights reserved.
        </div>
      </footer>
    </div>
  )
}
