import { Suspense } from "react"
import { getAppointmentByToken } from "@/app/actions/reservation-actions"
import { DetailedQuestionnaireForm } from "@/components/detailed-questionnaire-form"
import { redirect } from "next/navigation"
import { Skeleton } from "@/components/ui/skeleton"

function QuestionnairePageContent({ token }: { token: string }) {
  return (
    <Suspense fallback={<Loading />}>
      <QuestionnaireLoader token={token} />
    </Suspense>
  )
}

async function QuestionnaireLoader({ token }: { token: string }) {
  const appointment = await getAppointmentByToken(token)

  if (!appointment) {
    return (
      <div className="container mx-auto p-4 md:p-8 text-center">
        <h1 className="text-2xl font-bold mb-4 text-red-600">エラー</h1>
        <p>無効な予約トークンです。URLをご確認いただくか、再度予約確認SMSからアクセスしてください。</p>
      </div>
    )
  }

  if (appointment.questionnaire_id) {
    return (
      <div className="container mx-auto p-4 md:p-8 text-center">
        <h1 className="text-2xl font-bold mb-4 text-green-600">送信済み</h1>
        <p>問診票はすでに提出済みです。ご協力ありがとうございました。</p>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-4 md:p-8">
      <h1 className="text-2xl font-bold mb-4 text-center text-[#f8a0a0]">問診票</h1>
      <p className="mb-6 text-center text-gray-600">※ わかる範囲で結構ですので、ご記入ください。</p>
      <DetailedQuestionnaireForm appointment={appointment} />
    </div>
  )
}

function Loading() {
  return (
    <div className="container mx-auto p-4 md:p-8">
      <div className="space-y-4 max-w-2xl mx-auto">
        <Skeleton className="h-8 w-1/2 mx-auto" />
        <Skeleton className="h-4 w-3/4 mx-auto" />
        <div className="space-y-8 pt-8">
          <Skeleton className="h-64 w-full" />
          <Skeleton className="h-64 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
      </div>
    </div>
  )
}

export default function Page({ searchParams }: { searchParams: { token?: string } }) {
  const token = searchParams.token
  if (!token) {
    redirect("/") // or a dedicated error page
  }
  return <QuestionnairePageContent token={token} />
}
