import { redirect } from "next/navigation"
import { BookingCalendar } from "@/components/booking-calendar"
import Image from "next/image"
import Link from "next/link"

export default function BookingPage({
  searchParams,
}: {
  searchParams: { clinic?: string; success?: string; token?: string }
}) {
  // 予約成功時のリダイレクト
  if (searchParams.success && searchParams.token) {
    redirect(`/booking/confirmation?token=${searchParams.token}`)
  }

  // デフォルトのクリニックID（URLパラメータから取得、なければ1）
  const clinicId = searchParams.clinic ? Number.parseInt(searchParams.clinic) : 1

  return (
    <div className="min-h-screen bg-white">
      <header className="border-b border-gray-100">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center">
            <Link href="/">
              <div className="flex items-center">
                <Image src="/manary-logo.png" alt="Manary Logo" width={60} height={60} className="mr-2" />
                <span className="text-xl font-semibold text-manary-pink">マナリー助産院</span>
              </div>
            </Link>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-3xl font-bold text-manary-pink text-center mb-8">助産院予約</h1>
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <BookingCalendar clinicId={clinicId} />
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
}
