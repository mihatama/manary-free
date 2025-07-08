"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { format } from "date-fns"
import { ja } from "date-fns/locale"
import { getAppointmentByToken, updateAppointment, cancelAppointment } from "@/app/actions/reservation-actions"
import { useCSRF } from "@/hooks/use-csrf"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { CalendarTimePicker } from "@/components/calendar-time-picker"

interface ReservationManagerProps {
  initialToken?: string
}

export function ReservationManager({ initialToken }: ReservationManagerProps) {
  const router = useRouter()
  const [token, setToken] = useState(initialToken || "")
  const [appointment, setAppointment] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  // フォーム状態
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<{ start: string; end: string } | null>(null)
  const [patientName, setPatientName] = useState("")
  const [patientPhone, setPatientPhone] = useState("")
  const [patientEmail, setPatientEmail] = useState("")

  const { csrfToken, isLoading: isLoadingCSRF, error: csrfError } = useCSRF()

  // 初期トークンがある場合は予約を取得
  useEffect(() => {
    if (initialToken) {
      setToken(initialToken)
      fetchAppointment(initialToken)
    }
  }, [initialToken])

  const fetchAppointment = async (appointmentToken: string) => {
    if (!appointmentToken) return

    try {
      setIsLoading(true)
      setError(null)
      const data = await getAppointmentByToken(appointmentToken)

      if (data) {
        setAppointment(data)

        // フォーム状態を更新
        setPatientName(data.patient_name)
        setPatientPhone(data.patient_phone)
        setPatientEmail(data.patient_email || "")

        const appointmentDate = new Date(data.appointment_date)
        setSelectedDate(appointmentDate)

        const startTime = data.start_time.substring(0, 5)
        const endTime = data.end_time.substring(0, 5)
        setSelectedTimeSlot({ start: startTime, end: endTime })
      }
    } catch (err: any) {
      setError(err.message || "予約情報の取得に失敗しました")
    } finally {
      setIsLoading(false)
    }
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (token) {
      fetchAppointment(token)
    }
  }

  // 日時が選択されたときのハンドラー
  const handleDateTimeSelect = (date: Date, startTime: string, endTime: string) => {
    setSelectedDate(date)
    setSelectedTimeSlot({ start: startTime, end: endTime })
  }

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError(null)
    setSuccessMessage(null)

    try {
      if (!csrfToken) {
        setError("セキュリティトークンが利用できません。ページを再読み込みしてください。")
        return
      }

      if (!selectedDate || !selectedTimeSlot || !patientName || !patientPhone) {
        setError("必須項目をすべて入力してください")
        return
      }

      const formattedDate = format(selectedDate, "yyyy-MM-dd")

      const formData = new FormData()
      formData.append("csrf_token", csrfToken)
      formData.append("token", token)
      formData.append("appointment_date", formattedDate)
      formData.append("start_time", selectedTimeSlot.start)
      formData.append("end_time", selectedTimeSlot.end)
      formData.append("patient_name", patientName)
      formData.append("patient_phone", patientPhone)
      formData.append("patient_email", patientEmail)

      const result = await updateAppointment(formData)

      if (result.success) {
        setSuccessMessage("予約が更新されました")
        setAppointment(result.appointment)
      } else {
        setError(result.error || "予約の更新に失敗しました")
      }
    } catch (err: any) {
      setError(err.message || "予約の更新に失敗しました")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleCancel = async () => {
    setIsSubmitting(true)
    setError(null)
    setSuccessMessage(null)

    try {
      if (!csrfToken) {
        setError("セキュリティトークンが利用できません。ページを再読み込みしてください。")
        return
      }

      const formData = new FormData()
      formData.append("csrf_token", csrfToken)
      formData.append("token", token)

      const result = await cancelAppointment(formData)

      if (result.success) {
        setSuccessMessage("予約がキャンセルされました")
        setAppointment(result.appointment)
        setIsDialogOpen(false)
      } else {
        setError(result.error || "予約のキャンセルに失敗しました")
      }
    } catch (err: any) {
      setError(err.message || "予約のキャンセルに失敗しました")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="space-y-6">
      {!appointment && (
        <Card className="w-full shadow-md border-gray-100">
          <CardHeader>
            <CardTitle className="text-xl text-center text-gray-800">予約の検索</CardTitle>
            <CardDescription className="text-center">
              予約時に発行されたトークンを入力して予約を検索してください
            </CardDescription>
          </CardHeader>
          <CardContent>
            {error && (
              <Alert variant="destructive" className="mb-4">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <form onSubmit={handleSearch} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="token">予約トークン</Label>
                <Input
                  id="token"
                  value={token}
                  onChange={(e) => setToken(e.target.value)}
                  placeholder="予約トークンを入力"
                  required
                />
              </div>
              <Button
                type="submit"
                className="w-full bg-[#f8a0a0] hover:bg-[#f78989] text-white"
                disabled={isLoading || !token}
              >
                {isLoading ? "検索中..." : "予約を検索"}
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      {appointment && (
        <Card className="w-full shadow-md border-gray-100">
          <CardHeader>
            <CardTitle className="text-xl text-center text-gray-800">予約の詳細</CardTitle>
            <CardDescription className="text-center">予約内容の確認・変更・キャンセルができます</CardDescription>
          </CardHeader>
          <CardContent>
            {error && (
              <Alert variant="destructive" className="mb-4">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {successMessage && (
              <Alert className="mb-4 bg-green-50 border-green-200">
                <AlertDescription className="text-green-700">{successMessage}</AlertDescription>
              </Alert>
            )}

            {appointment.status === "cancelled" ? (
              <Alert className="mb-4 bg-red-50 border-red-200">
                <AlertDescription className="text-red-700">この予約はキャンセルされています</AlertDescription>
              </Alert>
            ) : (
              <form onSubmit={handleUpdate} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium text-gray-500">助産院</Label>
                    <p className="text-lg">{appointment.clinics.name}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-500">診療種別</Label>
                    <p className="text-lg">{appointment.service_types.name}</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>日付と時間</Label>
                    <div className="border rounded-md p-4">
                      <CalendarTimePicker
                        clinicId={appointment.clinic_id}
                        serviceTypeId={appointment.service_type_id}
                        onSelectDateTime={handleDateTimeSelect}
                        selectedDate={selectedDate}
                        selectedTime={selectedTimeSlot}
                      />
                    </div>
                    {selectedDate && selectedTimeSlot && (
                      <div className="mt-2 p-2 bg-green-50 rounded-md">
                        <p className="text-green-700">
                          選択された日時: {format(selectedDate, "yyyy年MM月dd日(EEE)", { locale: ja })}{" "}
                          {selectedTimeSlot.start} - {selectedTimeSlot.end}
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="patient-name">
                      お名前 <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="patient-name"
                      value={patientName}
                      onChange={(e) => setPatientName(e.target.value)}
                      placeholder="例: 山田 花子"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="patient-phone">
                      電話番号 <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="patient-phone"
                      value={patientPhone}
                      onChange={(e) => setPatientPhone(e.target.value)}
                      placeholder="例: 090-1234-5678"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="patient-email">メールアドレス（任意）</Label>
                    <Input
                      id="patient-email"
                      type="email"
                      value={patientEmail}
                      onChange={(e) => setPatientEmail(e.target.value)}
                      placeholder="例: example@email.com"
                    />
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row justify-between gap-4 pt-4">
                  <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                    <DialogTrigger asChild>
                      <Button variant="outline" className="text-red-500 border-red-200 hover:bg-red-50">
                        予約をキャンセル
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>予約のキャンセル</DialogTitle>
                        <DialogDescription>予約をキャンセルしますか？この操作は取り消せません。</DialogDescription>
                      </DialogHeader>
                      <DialogFooter>
                        <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                          戻る
                        </Button>
                        <Button variant="destructive" onClick={handleCancel} disabled={isSubmitting}>
                          {isSubmitting ? "処理中..." : "キャンセルする"}
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>

                  <Button
                    type="submit"
                    className="bg-[#f8a0a0] hover:bg-[#f78989] text-white"
                    disabled={
                      isSubmitting || isLoading || !selectedDate || !selectedTimeSlot || !patientName || !patientPhone
                    }
                  >
                    {isSubmitting ? "更新中..." : "予約を更新"}
                  </Button>
                </div>
              </form>
            )}
          </CardContent>
          <CardFooter className="flex justify-center border-t pt-6">
            <Button variant="link" onClick={() => setAppointment(null)}>
              別の予約を検索
            </Button>
          </CardFooter>
        </Card>
      )}
    </div>
  )
}
