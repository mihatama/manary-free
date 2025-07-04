"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { CSRFForm } from "@/components/csrf-form" // 修正: CsrfForm → CSRFForm
import { createReservation } from "@/app/actions/reservation-actions"
import type { Database } from "@/lib/supabase/database.types"
import { v4 as uuidv4 } from "uuid"

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
  const router = useRouter()

  const handleSubmit = async (formData: FormData) => {
    setIsSubmitting(true)
    setError(null)

    try {
      console.log("予約フォーム送信開始", { formData })

      // 予約データを作成 (snake_case keys)
      const reservationData: Database["public"]["Tables"]["reservations"]["Insert"] = {
        clinic_id: clinicId,
        service_type_id: serviceTypeId,
        reservation_date: date,
        start_time: startTime,
        end_time: endTime,
        patient_name: formData.get("name") as string,
        patient_phone: phoneNumber,
        patient_email: formData.get("email") as string,
        note: formData.get("notes") as string,
        status: "confirmed",
        access_token: uuidv4(),
      }

      console.log("予約データ", reservationData)

      // 予約を作成
      const result = await createReservation(reservationData)
      console.log("予約作成結果", result)

      if (!result.success) {
        throw new Error(result.message || "予約の作成に失敗しました")
      }

      // 予約確認ページにリダイレクト
      router.push(`/reservation/confirmation?id=${result.reservationId}`)
    } catch (err) {
      console.error("予約フォーム送信エラー:", err)
      setError(err instanceof Error ? err.message : "予約の作成中にエラーが発生しました")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <CSRFForm action={handleSubmit} className="space-y-6">
        <div className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="name" className="block text-sm font-medium text-gray-700">
              お名前 <span className="text-red-500">*</span>
            </label>
            <Input id="name" name="name" required placeholder="山田 花子" />
          </div>

          <div className="space-y-2">
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">
              メールアドレス <span className="text-red-500">*</span>
            </label>
            <Input id="email" name="email" type="email" required placeholder="example@email.com" />
          </div>

          <div className="space-y-2">
            <label htmlFor="notes" className="block text-sm font-medium text-gray-700">
              備考
            </label>
            <Textarea id="notes" name="notes" placeholder="予約に関する特別な要望や質問があればご記入ください" />
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
