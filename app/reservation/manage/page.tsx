import { PhoneAuthReservationManager } from "@/components/phone-auth-reservation-manager"
import { DevAuthBypass } from "@/components/dev-auth-bypass"
import Image from "next/image"
import Link from "next/link"

export default function ManagePage() {
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
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-12">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-3xl font-bold text-[#f8a0a0] text-center mb-8">予約の確認・変更</h1>

          {/* 開発環境用の認証バイパス */}
          {process.env.NODE_ENV !== "production" && (
            <DevAuthBypass
              onLogin={(phone) => {
                // 開発環境では直接電話番号を渡して認証済みとする
                window.location.href = `/reservation/manage?phone=${encodeURIComponent(phone)}`
              }}
            />
          )}

          <PhoneAuthReservationManager />
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
