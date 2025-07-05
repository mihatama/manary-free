"use client"

import { useState, useEffect, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { CalendarTimePicker } from "@/components/calendar-time-picker"
import { updateAppointment, cancelAppointment } from "@/app/actions/reservation-actions"
import { toast } from "sonner"
import { parseDate, parseTime, formatDate, formatTimeSimple } from "@/lib/date-utils"

interface AppointmentEditorProps {
  appointment: any
  onClose: () => void
  onUpdate: () => void
}

export function AppointmentEditor({ appointment, onClose, onUpdate }: AppointmentEditorProps) {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined)
  const [selectedTime, setSelectedTime] = useState<string | undefined>(undefined)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    console.log("[AppointmentEditor] Initializing with appointment data:", appointment)
    if (appointment?.reservation_date && appointment?.start_time) {
      const initialDate = parseDate(appointment.reservation_date)
      if (initialDate) {
        setSelectedDate(initialDate)
        const initialTime = parseTime(appointment.start_time, initialDate)
        if (initialTime) {
          const formattedTime = formatTimeSimple(initialTime)
          setSelectedTime(formattedTime)
          console.log("[AppointmentEditor] State initialized:", { initialDate, formattedTime })
        } else {
          setError("予約時間の読み込みに失敗しました。")
          console.error("[AppointmentEditor] Failed to parse initial time:", appointment.start_time)
        }
      } else {
        setError("予約日の読み込みに失敗しました。")
        console.error("[AppointmentEditor] Failed to parse initial date:", appointment.reservation_date)
      }
    } else {
      setError("予約データの読み込みに失敗しました。情報が不完全です。")
      console.error("[AppointmentEditor] Invalid or incomplete appointment data received.", appointment)
    }
  }, [appointment])

  const serviceType = useMemo(() => {
    if (!appointment?.service_types) {
      console.error("Service type information is missing from the appointment object.")
      return null
    }
    return appointment.service_types
  }, [appointment])

  const handleUpdate = async () => {
    console.log("--- [handleUpdate] Fired ---")
    console.log("State at update:", {
      appointment: !!appointment,
      selectedDate: selectedDate,
      selectedTime: selectedTime,
      serviceType: serviceType,
      duration: serviceType?.duration,
    })

    if (!appointment || !selectedDate || !selectedTime || !serviceType?.duration) {
      const validationError = "Update validation failed. Required data is missing."
      console.error(validationError, {
        hasAppointment: !!appointment,
        hasSelectedDate: !!selectedDate,
        hasSelectedTime: !!selectedTime,
        hasDuration: !!serviceType?.duration,
      })
      toast.error("更新情報が不完全です。", { description: "日付と時刻が選択されているか確認してください。" })
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const [hours, minutes] = selectedTime.split(":").map(Number)
      const newEndTimeDate = new Date(selectedDate)
      newEndTimeDate.setHours(hours, minutes + serviceType.duration)

      const updates = {
        reservation_date: formatDate(selectedDate),
        start_time: `${selectedTime}:00`,
        end_time: formatTimeSimple(newEndTimeDate) + ":00",
      }

      const result = await updateAppointment(appointment.id, updates)

      if (result.success) {
        toast.success("予約が正常に変更されました。")
        onUpdate()
        onClose()
      } else {
        throw new Error(result.message || "予約の変更に失敗しました。")
      }
    } catch (e: any) {
      setError(e.message)
      toast.error(e.message)
    } finally {
      setIsLoading(false)
    }
  }

  const handleCancel = async () => {
    if (!appointment || !window.confirm("本当にこの予約をキャンセルしますか？")) {
      return
    }
    setIsLoading(true)
    setError(null)
    try {
      const result = await cancelAppointment(appointment.id)
      if (result.success) {
        toast.success("予約をキャンセルしました。")
        onUpdate()
        onClose()
      } else {
        throw new Error(result.message || "予約のキャンセルに失敗しました。")
      }
    } catch (e: any) {
      setError(e.message)
      toast.error(e.message)
    } finally {
      setIsLoading(false)
    }
  }

  if (!appointment) return null

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px] md:max-w-2xl">
        <DialogHeader>
          <DialogTitle>予約の変更</DialogTitle>
        </DialogHeader>
        {error && (
          <Alert variant="destructive">
            <AlertTitle>エラー</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        <div className="grid gap-4 py-4">
          <div className="p-4 border rounded-lg bg-gray-50">
            <h3 className="font-semibold text-lg">{serviceType?.name}</h3>
            <p className="text-sm text-muted-foreground">{appointment.clinics?.name}</p>
          </div>
          <div className="grid gap-4">
            <h4 className="font-semibold">日付と時間を選択</h4>
            <CalendarTimePicker
              clinicId={appointment.clinic_id}
              serviceTypeId={appointment.service_type_id}
              onSelectDateTime={(date, start, end) => {
                setSelectedDate(date)
                setSelectedTime(start)
              }}
              selectedDate={selectedDate}
              selectedTime={{ start: selectedTime, end: "" }}
            />
          </div>
          <div className="mt-4 p-2 bg-slate-100 rounded-md text-xs border border-slate-200">
            <h4 className="font-bold">Debug Info:</h4>
            <p>Selected Date: {selectedDate ? formatDate(selectedDate) : "None"}</p>
            <p>Selected Time: {selectedTime || "None"}</p>
            <p>Service Duration: {serviceType?.duration ?? "N/A"}</p>
            <p>Is Button Disabled: {String(isLoading || !selectedTime)}</p>
          </div>
        </div>
        <DialogFooter className="flex-col-reverse sm:flex-row sm:justify-between w-full">
          <Button variant="destructive" onClick={handleCancel} disabled={isLoading}>
            予約をキャンセル
          </Button>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={onClose}>
              閉じる
            </Button>
            <Button onClick={handleUpdate} disabled={isLoading || !selectedTime}>
              {isLoading ? "更新中..." : "予約を更新"}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
