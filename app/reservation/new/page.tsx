import { MedicalQuestionnaireForm } from "@/components/medical-questionnaire-form"
import { PhoneVerificationWrapper } from "@/components/phone-verification-wrapper"
import Image from "next/image"
import Link from "next/link"

interface NewReservationPageProps {
  searchParams: {
    clinicId?: string
    serviceTypeId?: string
    date?: string
    startTime?: string
    endTime?: string
    phone?: string
    verified?: string
  }
}

// サーバーコンポーネントを同期的に変更
export default function NewReservationPage({ searchParams }: NewReservationPageProps) {
  console.log("NewReservationPage レンダリング開始", { searchParams })
  const { clinicId, serviceTypeId, date, startTime, endTime, phone, verified } = searchParams

  // 必要なパラメータがない場合は予約ページにリダイレクト
  if (!clinicId || !serviceTypeId || !date || !startTime || !endTime) {
    console.log("必要なパラメータが不足しています。リダイレクトします。")
    // クライアントサイドでリダイレクトするためのメタタグを返す
    return (
      <>
        <meta httpEquiv="refresh" content="0;url=/reservation" />
        <p>リダイレクト中...</p>
      </>
    )
  }

  // 電話番号認証済みの場合
  if (phone && verified === "true") {
    console.log("電話番号認証済み", { phone })

    // 問診票の有無を確認せず、常に問診票フォームを表示する
    return (
      <div className="min-h-screen bg-white">
        <header className="border-b border-gray-100">
          <div className="container mx-auto px-4 py-4 flex justify-between items-center">
            <div className="flex items-center">
              <Image src="/manary-logo.png" alt="Manary Logo" width={60} height={60} />
              <h1 className="text-xl font-bold text-[#f8a0a0] ml-2">マナリー</h1>
            </div>
            <div>
              <Link href="/reservation" className="text-sm text-[#f8a0a0] hover:underline">
                予約カレンダーに戻る
              </Link>
            </div>
          </div>
        </header>

        <main className="container mx-auto px-4 py-12">
          <div className="max-w-3xl mx-auto">
            <h1 className="text-3xl font-bold text-[#f8a0a0] text-center mb-8">
              初めての方は問診票の記入をお願いします
            </h1>
            <MedicalQuestionnaireForm
              phoneNumber={phone}
              reservationData={{
                clinicId: Number(clinicId),
                serviceTypeId: Number(serviceTypeId),
                date,
                startTime,
                endTime,
                patientName: "", // 予約フォームで入力してもらう
              }}
            />
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

  // 電話番号認証が必要な場合
  console.log("電話番号認証が必要です。認証ページを表示します。")
  return (
    <div className="min-h-screen bg-white">
      <header className="border-b border-gray-100">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center">
            <Image src="/manary-logo.png" alt="Manary Logo" width={60} height={60} />
            <h1 className="text-xl font-bold text-[#f8a0a0] ml-2">マナリー</h1>
          </div>
          <div>
            <Link href="/reservation" className="text-sm text-[#f8a0a0] hover:underline">
              予約カレンダーに戻る
            </Link>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-12">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-3xl font-bold text-[#f8a0a0] text-center mb-8">電話番号認証</h1>
          <PhoneVerificationWrapper
            clinicId={clinicId}
            serviceTypeId={serviceTypeId}
            date={date}
            startTime={startTime}
            endTime={endTime}
            buttonText="次へ進む"
          />
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
