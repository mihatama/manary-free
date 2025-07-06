import { Suspense } from "react"
import { getAppointmentByToken } from "@/app/actions/reservation-actions"
import { DetailedQuestionnaireForm } from "@/components/detailed-questionnaire-form"
import { redirect } from "next/navigation"
import { Skeleton } from "@/components/ui/skeleton"
import { getLatestQuestionnaireByPhone, getQuestionnaireById } from "@/app/actions/questionnaire-actions"

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

  let previousData: { [key: string]: any } | null = null
  let isSubmitted = false

  if (appointment.questionnaire_id) {
    isSubmitted = true
    const existingQuestionnaire = await getQuestionnaireById(appointment.questionnaire_id)
    if (
      existingQuestionnaire &&
      typeof existingQuestionnaire.data === "object" &&
      existingQuestionnaire.data !== null
    ) {
      previousData = existingQuestionnaire.data as { [key: string]: any }
    }
  } else if (appointment.patient_phone) {
    previousData = await getLatestQuestionnaireByPhone(appointment.patient_phone)
  }

  return (
    <div className="container mx-auto p-4 md:p-8">
      <h1 className="text-2xl font-bold mb-4 text-center text-[#f8a0a0]">問診票</h1>
      {isSubmitted ? (
        <p className="mb-6 text-center text-gray-500 text-sm bg-green-50 p-3 rounded-md">
          問診票は提出済みです。内容をご確認・修正の上、再度送信してください。
        </p>
      ) : (
        <p className="mb-6 text-center text-gray-600">※ わかる範囲で結構ですので、ご記入ください。</p>
      )}
      {previousData && !isSubmitted && (
        <p className="mb-6 text-center text-gray-500 text-sm bg-blue-50 p-3 rounded-md">
          以前ご入力いただいた内容を読み込みました。内容をご確認・修正の上、送信してください。
        </p>
      )}
      <DetailedQuestionnaireForm appointment={appointment} previousData={previousData} />
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
