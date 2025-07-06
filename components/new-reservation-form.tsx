"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { CSRFForm } from "@/components/csrf-form"
import { createReservation } from "@/app/actions/reservation-actions"

interface NewReservationFormProps {
  clinicId: number
  serviceTypeId: number
  date: string
  startTime: string
  endTime: string
  phoneNumber: string
}

export function NewReservationForm({
  clinicId,
  serviceTypeId,
  date,
  startTime,
  endTime,
  phoneNumber,
}: NewReservationFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isSuccess, setIsSuccess] = useState(false)
  const [newReservationId, setNewReservationId] = useState<number | null>(null)
  const router = useRouter()

  useEffect(() => {
    console.log("[NewReservationForm] Rendering with props:", {
      clinicId,
      serviceTypeId,
      date,
      startTime,
      endTime,
      phoneNumber,
    })
  }, [clinicId, serviceTypeId, date, startTime, endTime, phoneNumber])

  const handleSubmit = async (formData: FormData) => {
    setIsSubmitting(true)
    setError(null)
    setIsSuccess(false)

    // Client-side validation
    if (!clinicId || !serviceTypeId || !date || !startTime || !endTime || !phoneNumber) {
      const errorMessage = "予約情報が不完全です。前のステップに戻ってやり直してください。"
      console.error(errorMessage, { clinicId, serviceTypeId, date, startTime, endTime, phoneNumber })
      setError(errorMessage)
      setIsSubmitting(false)
      return
    }

    try {
      // Append data from props to the FormData object
      formData.append("clinic_id", String(clinicId))
      formData.append("service_type_id", String(serviceTypeId))
      formData.append("reservation_date", date)
      formData.append("start_time", startTime)
      formData.append("end_time", endTime)
      formData.append("patient_phone", phoneNumber)

      console.log("Submitting FormData to createReservation:", Object.fromEntries(formData.entries()))

      // Call the action with the complete FormData object
      const result = await createReservation(formData)
      console.log("Reservation creation result:", result)

      if (!result.success || !result.data?.id) {
        throw new Error(result.message || "予約の作成に失敗しました")
      }

      // Set success state instead of redirecting
      setIsSuccess(true)
      setNewReservationId(result.data.id)
    } catch (err) {
      console.error("予約フォーム送信エラー:", err)
      setError(err instanceof Error ? err.message : "予約の作成中にエラーが発生しました")
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isSuccess && newReservationId) {
    return (
      <div className="bg-white p-8 rounded-lg shadow-md text-center space-y-6">
        <h2 className="text-2xl font-bold text-green-600">予約が完了しました！</h2>
        <p className="text-gray-700">ご予約ありがとうございます。以下のボタンから予約内容をご確認いただけます。</p>
        <Button asChild className="w-full bg-[#f8a0a0] hover:bg-[#f78b8b] text-white py-3">
          <Link href={`/reservation/confirmation?id=${newReservationId}`}>予約内容を確認する</Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <CSRFForm action={handleSubmit} className="space-y-6">
        <div className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="patient_name" className="block text-sm font-medium text-gray-700">
              お名前 <span className="text-red-500">*</span>
            </label>
            <Input id="patient_name" name="patient_name" required placeholder="山田 花子" />
          </div>

          <div className="space-y-2">
            <label htmlFor="patient_kana" className="block text-sm font-medium text-gray-700">
              フリガナ <span className="text-red-500">*</span>
            </label>
            <Input id="patient_kana" name="patient_kana" required placeholder="ヤマダ ハナコ" />
          </div>

          <div className="space-y-2">
            <label htmlFor="patient_email" className="block text-sm font-medium text-gray-700">
              メールアドレス
            </label>
            <Input id="patient_email" name="patient_email" type="email" placeholder="example@email.com" />
          </div>
        </div>

        {error && <div className="p-3 bg-red-100 text-red-700 rounded-md">{error}</div>}

        <Button type="submit" disabled={isSubmitting} className="w-full bg-[#f8a0a0] hover:bg-[#f78b8b]">
          {isSubmitting ? "送信中..." : "予約を確定する"}
        </Button>
      </CSRFForm>
    </div>
  )
}
