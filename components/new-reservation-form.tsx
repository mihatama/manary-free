"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { format } from "date-fns"
import { ja } from "date-fns/locale"
import { createAppointment } from "@/app/actions/reservation-actions"
import { useCSRF } from "@/hooks/use-csrf"

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
  const [patientName, setPatientName] = useState("")
  const [patientEmail, setPatientEmail] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const router = useRouter()
  const { csrfToken, isLoading: isLoadingCSRF } = useCSRF()

  // 予約を作成
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!patientName) {
      setError("お名前を入力してください")
      return
    }

    if (!csrfToken) {
      setError("セキュリティトークンが利用できません。ページを再読み込みしてください。")
      return
    }

    setIsSubmitting(true)

    try {
      const formData = new FormData()
      formData.append("csrf_token", csrfToken)
      formData.append("clinic_id", clinicId.toString())
      formData.append("service_type_id", serviceTypeId.toString())
      formData.append("appointment_date", date)
      formData.append("start_time", startTime)
      formData.append("end_time", endTime)
      formData.append("patient_name", patientName)
      formData.append("patient_phone", phoneNumber)

      if (patientEmail) {
        formData.append("patient_email", patientEmail)
      }

      const result = await createAppointment(formData)

      if (result.success) {
        router.push(`/reservation/confirmation?token=${result.appointment.token}`)
      } else {
        setError(result.error || "予約の作成に失敗しました")
      }
    } catch (err: any) {
      console.error("予約作成エラー:", err)
      setError(err.message || "予約の作成に失敗しました")
    } finally {
      setIsSubmitting(false)
    }
  }

  // 日付をフォーマット
  const formattedDate = format(new Date(date), "yyyy年MM月dd日(EEE)", { locale: ja })

  return (
    <Card className="w-full shadow-md border-gray-100">
      <CardHeader>
        <CardTitle className="text-xl text-center text-gray-800">予約情報の確認</CardTitle>
        <CardDescription className="text-center">以下の内容で予約を確定します</CardDescription>
      </CardHeader>
      <CardContent>
        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="mb-6 p-4 bg-gray-50 rounded-lg">
          <h3 className="font-medium mb-2">予約内容</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
            <div>
              <span className="text-gray-500">日付:</span> {formattedDate}
            </div>
            <div>
              <span className="text-gray-500">時間:</span> {startTime} - {endTime}
            </div>
            <div>
              <span className="text-gray-500">電話番号:</span> {phoneNumber}
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">お名前</Label>
            <Input
              id="name"
              value={patientName}
              onChange={(e) => setPatientName(e.target.value)}
              placeholder="例: 山田 花子"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">メールアドレス (任意)</Label>
            <Input
              id="email"
              type="email"
              value={patientEmail}
              onChange={(e) => setPatientEmail(e.target.value)}
              placeholder="例: example@example.com"
            />
          </div>

          <Button
            type="submit"
            className="w-full bg-[#f8a0a0] hover:bg-[#f78989] text-white"
            disabled={isSubmitting || isLoadingCSRF}
          >
            {isSubmitting ? "送信中..." : "予約を確定する"}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
