import { NewReservationForm } from "@/components/new-reservation-form"
import { PhoneVerification } from "@/components/phone-verification"
import { MedicalQuestionnaireForm } from "@/components/medical-questionnaire-form"
import Image from "next/image"
import Link from "next/link"
import { getQuestionnaireByPhone } from "@/app/actions/questionnaire-actions"

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

export default async function NewReservationPage({ searchParams }: NewReservationPageProps) {
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

    try {
      // 問診票の有無を確認
      console.log("問診票の取得を試みます")
      const questionnaire = await getQuestionnaireByPhone(phone)
      console.log("問診票取得結果", { questionnaire })

      // 問診票がない場合は問診票フォームを表示
      if (!questionnaire) {
        console.log("問診票がありません。問診票フォームを表示します。")
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

      // 問診票がある場合は予約フォームを表示
      console.log("問診票があります。予約フォームを表示します。")
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
              <h1 className="text-3xl font-bold text-[#f8a0a0] text-center mb-8">予約情報の入力</h1>
              <NewReservationForm
                clinicId={Number(clinicId)}
                serviceTypeId={Number(serviceTypeId)}
                date={date}
                startTime={startTime}
                endTime={endTime}
                phoneNumber={phone}
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
    } catch (error) {
      console.error("NewReservationPage エラー:", error)
      // エラーが発生した場合は電話番号認証ページを表示
      console.log("エラーが発生したため、電話番号認証ページを表示します。")
    }
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
          <PhoneVerification
            onVerified={(phoneNumber) => {
              // 認証完了後、同じページに電話番号を付けてリダイレクト
              window.location.href = `/reservation/new?clinicId=${clinicId}&serviceTypeId=${serviceTypeId}&date=${date}&startTime=${startTime}&endTime=${endTime}&phone=${phoneNumber}&verified=true`
            }}
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
