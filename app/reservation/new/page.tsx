import { MedicalQuestionnaireForm } from "@/components/medical-questionnaire-form"
import { PhoneVerificationWrapper } from "@/components/phone-verification-wrapper"
import Image from "next/image"
import Link from "next/link"
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Suspense } from "react"
import { Skeleton } from "@/components/ui/skeleton"
import { redirect } from "next/navigation"

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
    redirect("/reservation")
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
    <div className="container mx-auto p-4 md:p-8">
      <Card className="mb-8 bg-gray-50 border-gray-200">
        <CardHeader>
          <CardTitle className="text-2xl md:text-3xl font-bold text-gray-800">新規ご予約</CardTitle>
          <CardDescription className="text-gray-600">
            ご希望のクリニック、メニュー、日時を選択して予約手続きを進めてください。
          </CardDescription>
        </CardHeader>
      </Card>
      <Suspense fallback={<Skeleton className="w-full h-96" />}>
        <PhoneVerificationWrapper
          clinicId={clinicId}
          serviceTypeId={serviceTypeId}
          date={date}
          startTime={startTime}
          endTime={endTime}
          buttonText="次へ進む"
        />
      </Suspense>
    </div>
  )
}
