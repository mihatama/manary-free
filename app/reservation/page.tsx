import { Suspense } from "react"
import { ReservationForm } from "@/components/reservation-form"
import { DevAuthBypass } from "@/components/dev-auth-bypass"
import Image from "next/image"
import Link from "next/link"

export default function ReservationPage() {
  return (
    <div className="min-h-screen bg-white">
      <header className="border-b border-gray-100">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center">
            <Image src="/manary-logo.png" alt="Manary Logo" width={60} height={60} />
            <h1 className="text-xl font-bold text-[#f8a0a0] ml-2">マナリー</h1>
          </div>
          <div>
            <Link href="/reservation/manage" className="text-sm text-[#f8a0a0] hover:underline">
              予約の確認・変更
            </Link>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-12">
        <div className="max-w-2xl mx-auto">
          <h1 className="text-3xl font-bold text-[#f8a0a0] text-center mb-8">予約システム</h1>

          {/* 開発環境用の認証バイパス */}
          {process.env.NODE_ENV !== "production" && (
            <DevAuthBypass
              onLogin={(phone) => {
                // 開発環境では直接予約確認ページに移動
                window.location.href = `/reservation/manage?phone=${encodeURIComponent(phone)}`
              }}
            />
          )}

          <Suspense fallback={<div>読み込み中...</div>}>
            <ReservationForm />
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
