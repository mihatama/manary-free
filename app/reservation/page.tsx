"use client"

import { useState } from "react"
import Link from "next/link"
import { useAppState } from "@/components/providers/app-state-provider"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"

export default function ReservationPage() {
  const { createReservation, serviceTypes } = useAppState()
  const [patientName, setPatientName] = useState("")
  const [patientEmail, setPatientEmail] = useState("")
  const [patientPhone, setPatientPhone] = useState("")
  const [serviceTypeId, setServiceTypeId] = useState(serviceTypes[0]?.id ?? "")
  const [appointmentDate, setAppointmentDate] = useState("")
  const [appointmentTime, setAppointmentTime] = useState("")
  const [notes, setNotes] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  const selectedService = serviceTypes.find((service) => service.id === serviceTypeId)

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!serviceTypeId || !selectedService) {
      return
    }

    setIsSubmitting(true)

    const newReservation = createReservation({
      patientName,
      patientEmail,
      patientPhone,
      serviceTypeId,
      serviceTypeName: selectedService.name,
      appointmentDate,
      appointmentTime,
      notes,
    })

    setSuccessMessage(
      `予約が完了しました。予約ID: ${newReservation.id} を控えておいてください。管理者が確認後に連絡します。`,
    )
    setPatientName("")
    setPatientEmail("")
    setPatientPhone("")
    setAppointmentDate("")
    setAppointmentTime("")
    setNotes("")
    setIsSubmitting(false)
  }

  return (
    <div className="min-h-screen bg-[#ffeaed]">
      <header className="border-b border-slate-300 bg-white">
        <div className="container mx-auto flex items-center justify-between px-4 py-4">
          <h1 className="text-2xl font-bold text-[#f8a0a0]">Manary 予約フォーム</h1>
          <Link href="/" className="text-sm text-[#f8a0a0] hover:underline">
            管理画面に戻る
          </Link>
        </div>
      </header>

      <main className="container mx-auto px-4 py-10">
        <div className="mx-auto max-w-3xl">
          <Card>
            <CardHeader>
              <CardTitle>オンライン予約</CardTitle>
              <CardDescription>
                こちらのフォームに必要事項を入力し送信すると、ローカルストレージに予約が保存されます。
              </CardDescription>
            </CardHeader>
            <CardContent>
              {successMessage && (
                <Alert className="mb-6 border-emerald-300 bg-emerald-50 text-emerald-800">
                  <AlertDescription>{successMessage}</AlertDescription>
                </Alert>
              )}

              <form className="grid gap-6" onSubmit={handleSubmit}>
                <div className="grid gap-2">
                  <Label htmlFor="patientName">お名前</Label>
                  <Input
                    id="patientName"
                    value={patientName}
                    onChange={(event) => setPatientName(event.target.value)}
                    placeholder="例: 山田 花子"
                    required
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="patientEmail">メールアドレス</Label>
                  <Input
                    id="patientEmail"
                    type="email"
                    value={patientEmail}
                    onChange={(event) => setPatientEmail(event.target.value)}
                    placeholder="example@manary.care"
                    required
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="patientPhone">電話番号</Label>
                  <Input
                    id="patientPhone"
                    value={patientPhone}
                    onChange={(event) => setPatientPhone(event.target.value)}
                    placeholder="090-1234-5678"
                    required
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="serviceType">希望するサービス</Label>
                  <select
                    id="serviceType"
                    value={serviceTypeId}
                    onChange={(event) => setServiceTypeId(event.target.value)}
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus:border-primary focus:outline-none"
                  >
                    {serviceTypes.map((service) => (
                      <option key={service.id} value={service.id}>
                        {service.name}（{service.durationMinutes}分）
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid gap-2 md:grid-cols-2">
                  <div className="grid gap-2">
                    <Label htmlFor="appointmentDate">予約日</Label>
                    <Input
                      id="appointmentDate"
                      type="date"
                      value={appointmentDate}
                      onChange={(event) => setAppointmentDate(event.target.value)}
                      required
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="appointmentTime">開始時間</Label>
                    <Input
                      id="appointmentTime"
                      type="time"
                      value={appointmentTime}
                      onChange={(event) => setAppointmentTime(event.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="notes">相談内容・備考</Label>
                  <Textarea
                    id="notes"
                    value={notes}
                    onChange={(event) => setNotes(event.target.value)}
                    placeholder="気になる点や当日のご希望があればご記入ください。"
                    rows={4}
                  />
                </div>

                <Button
                  type="submit"
                  className="w-full bg-[#f8a0a0] text-white hover:bg-[#f69494]"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "送信中..." : "予約を送信"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
