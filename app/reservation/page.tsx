import Image from "next/image"

import { FeatureDisabledMessage } from "@/components/feature-disabled-message"

export default function ReservationPage() {
  return (
    <div className="min-h-screen bg-white">
      <header className="border-b border-gray-100">
        <div className="container mx-auto flex items-center justify-between px-4 py-4">
          <div className="flex items-center">
            <Image src="/manary-logo.png" alt="Manary Logo" width={60} height={60} />
            <h1 className="ml-2 text-xl font-bold text-[#f8a0a0]">Manary</h1>
          </div>
        </div>
      </header>

      <main className="container mx-auto flex flex-1 items-center justify-center bg-[#ffeaed] px-4 py-12">
        <FeatureDisabledMessage
          title="オンライン予約は終了しました"
          description="現在はお電話や直接のご連絡にてご相談を承っております。恐れ入りますが、こちらのページからの予約手続きはできません。"
          backHref="/"
        />
      </main>

      <footer className="mt-auto border-t border-gray-100 py-6">
        <div className="container mx-auto px-4 text-center text-sm text-gray-500">
          &copy; {new Date().getFullYear()} Manary. All rights reserved.
        </div>
      </footer>
    </div>
  )
}
