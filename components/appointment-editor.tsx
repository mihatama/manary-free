"use client"

import { useState, useEffect } from "react"
import { format } from "date-fns"
import { ja } from "date-fns/locale"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { updateAppointment, cancelAppointment } from "@/app/actions/reservation-actions"
import { useCSRF } from "@/hooks/use-csrf"
import { CalendarTimePicker } from "@/components/calendar-time-picker"
import { parseDateString } from "@/lib/date-utils"

interface AppointmentEditorProps {
  appointment: any
  onClose: () => void
  onComplete: () => void
}

export function AppointmentEditor({ appointment, onClose, onComplete }: AppointmentEditorProps) {
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<{ start: string; end: string } | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isCancelling, setIsCancelling] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  const { csrfToken, isLoading: isLoadingCSRF } = useCSRF()

  // 初期値を設定
  useEffect(() => {
    console.log(
      "%c[AppointmentEditor] Initializing with appointment data:",
      "color: blue; font-weight: bold;",
      appointment,
    )
    if (appointment && appointment.appointment_date && appointment.start_time && appointment.end_time) {
      const appointmentDate = parseDateString(appointment.appointment_date)
      console.log("[AppointmentEditor] Parsed date from string:", appointmentDate)

      if (appointmentDate) {
        setSelectedDate(appointmentDate)
        const startTime = appointment.start_time.substring(0, 5)
        const endTime = appointment.end_time.substring(0, 5)
        setSelectedTimeSlot({ start: startTime, end: endTime })
        console.log("%c[AppointmentEditor] Initial state set successfully.", "color: green;")
      } else {
        console.error(
          "%c[AppointmentEditor] Failed to parse appointment date. Cannot set initial state.",
          "color: red; font-weight: bold;",
        )
        setError("予約データの読み込みに失敗しました。日付の形式が正しくありません。")
      }
    } else {
      console.error(
        "%c[AppointmentEditor] Invalid or incomplete appointment data received.",
        "color: red; font-weight: bold;",
      )
      setError("予約データの読み込みに失敗しました。情報が不完全です。")
    }
  }, [appointment])

  // 日時が選択されたときのハンドラー
  const handleDateTimeSelect = (date: Date, startTime: string, endTime: string) => {
    setSelectedDate(date)
    setSelectedTimeSlot({ start: startTime, end: endTime })
  }

  // 予約を更新
  const handleUpdate = async () => {
    if (!csrfToken || !selectedDate || !selectedTimeSlot) return

    setIsSubmitting(true)
    setError(null)
    setSuccessMessage(null)

    try {
      const formData = new FormData()
      formData.append("csrf_token", csrfToken)
      formData.append("token", appointment.token)
      formData.append("appointment_date", format(selectedDate, "yyyy-MM-dd"))
      formData.append("start_time", selectedTimeSlot.start)
      formData.append("end_time", selectedTimeSlot.end)
      formData.append("patient_name", appointment.patient_name)
      formData.append("patient_phone", appointment.patient_phone)
      formData.append("patient_email", appointment.patient_email || "")

      const result = await updateAppointment(formData)

      if (result.success) {
        setSuccessMessage("予約が更新されました")
        setTimeout(() => {
          onComplete()
        }, 1500)
      } else {
        setError(result.error || "予約の更新に失敗しました")
      }
    } catch (err: any) {
      setError(err.message || "予約の更新に失敗しました")
    } finally {
      setIsSubmitting(false)
    }
  }

  // 予約をキャンセル
  const handleCancel = async () => {
    if (!csrfToken) return

    setIsCancelling(true)
    setError(null)
    setSuccessMessage(null)

    try {
      const formData = new FormData()
      formData.append("csrf_token", csrfToken)
      formData.append("token", appointment.token)

      const result = await cancelAppointment(formData)

      if (result.success) {
        setSuccessMessage("予約がキャンセルされました")
        setIsDialogOpen(false)
        setTimeout(() => {
          onComplete()
        }, 1500)
      } else {
        setError(result.error || "予約のキャンセルに失敗しました")
      }
    } catch (err: any) {
      setError(err.message || "予約のキャンセルに失敗しました")
    } finally {
      setIsCancelling(false)
    }
  }

  return (
    <Card className="w-full shadow-md border-gray-100">
      <CardHeader>
        <CardTitle className="text-xl text-center text-gray-800">予約の変更</CardTitle>
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

        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <h3 className="text-sm font-medium text-gray-500">診療種別</h3>
              <p className="text-lg">{appointment.service_types.name}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500">助産院</h3>
              <p className="text-lg">{appointment.clinics.name}</p>
            </div>
          </div>

          <div className="space-y-2">
            <h3 className="text-sm font-medium text-gray-500">日付と時間</h3>
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
              <div className="mt-2 p-2 bg-blue-50 rounded-md">
                <p className="text-blue-700">
                  選択された日時: {format(selectedDate, "yyyy年MM月dd日(EEE)", { locale: ja })} {selectedTimeSlot.start}{" "}
                  - {selectedTimeSlot.end}
                </p>
              </div>
            )}
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex flex-col sm:flex-row justify-between gap-4 pt-4">
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <Button
            variant="outline"
            className="text-red-500 border-red-200 hover:bg-red-50 bg-transparent"
            onClick={() => setIsDialogOpen(true)}
          >
            予約をキャンセル
          </Button>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>予約のキャンセル</DialogTitle>
              <DialogDescription>予約をキャンセルしますか？この操作は取り消せません。</DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                戻る
              </Button>
              <Button variant="destructive" onClick={handleCancel} disabled={isCancelling}>
                {isCancelling ? "処理中..." : "キャンセルする"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
          <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
            閉じる
          </Button>
          <Button
            className="bg-[#f8a0a0] hover:bg-[#f78989] text-white"
            onClick={handleUpdate}
            disabled={isSubmitting || !selectedDate || !selectedTimeSlot}
          >
            {isSubmitting ? "更新中..." : "予約を更新"}
          </Button>
        </div>
      </CardFooter>
    </Card>
  )
}
