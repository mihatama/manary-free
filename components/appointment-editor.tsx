"use client"

import { useState, useEffect, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { ReservationCalendar } from "@/components/reservation-calendar"
import { getAvailableSlots, updateAppointment, cancelAppointment } from "@/app/actions/reservation-actions"
import { parseDate, parseTime, formatDate, formatTimeSimple } from "@/lib/date-utils"
import { toast } from "sonner"
import type { ReservationWithService } from "@/app/actions/reservation-actions"
import type { ServiceType } from "@/app/actions/schedule-actions"

interface AppointmentEditorProps {
  appointment: ReservationWithService | null
  serviceTypes: ServiceType[]
  isOpen: boolean
  onClose: () => void
  onAppointmentUpdate: () => void
}

export function AppointmentEditor({
  appointment,
  serviceTypes,
  isOpen,
  onClose,
  onAppointmentUpdate,
}: AppointmentEditorProps) {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined)
  const [selectedTime, setSelectedTime] = useState<string | undefined>(undefined)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    console.log("[AppointmentEditor] Initializing with appointment data:", appointment)
    if (appointment) {
      const initialDate = parseDate(appointment.reservation_date)
      if (initialDate) {
        setSelectedDate(initialDate)
        const initialTime = formatTimeSimple(parseTime(appointment.start_time, initialDate))
        setSelectedTime(initialTime)
        console.log("[AppointmentEditor] State initialized:", { initialDate, initialTime })
      } else {
        console.error("[AppointmentEditor] Failed to parse initial date from appointment.", appointment)
        setError("予約データの読み込みに失敗しました。日付情報が不正です。")
      }
    } else {
      setError("予約データの読み込みに失敗しました。情報が不完全です。")
      console.error("[AppointmentEditor] Invalid or incomplete appointment data received.")
    }
  }, [appointment])

  const currentServiceType = useMemo(() => {
    if (!appointment || !serviceTypes) return null
    return serviceTypes.find((st) => st.id === appointment.service_type_id)
  }, [appointment, serviceTypes])

  const handleUpdate = async () => {
    if (!appointment || !selectedDate || !selectedTime || !currentServiceType) {
      toast.error("更新情報が不完全です。")
      return
    }
    setIsLoading(true)
    setError(null)

    const newStartTime = selectedTime
    const duration = currentServiceType.duration || 60
    const [hours, minutes] = newStartTime.split(":").map(Number)
    const newEndTimeDate = new Date(selectedDate)
    newEndTimeDate.setHours(hours, minutes + duration)
    const newEndTime = formatTimeSimple(newEndTimeDate)

    const updates = {
      reservation_date: formatDate(selectedDate),
      start_time: `${newStartTime}:00`,
      end_time: `${newEndTime}:00`,
    }

    const result = await updateAppointment(appointment.id, updates)
    setIsLoading(false)

    if (result.success) {
      toast.success("予約が正常に更新されました。")
      onAppointmentUpdate()
      onClose()
    } else {
      toast.error(`予約の更新に失敗しました: ${result.message}`)
      setError(result.message || "不明なエラーが発生しました。")
    }
  }

  const handleCancel = async () => {
    if (!appointment) return
    setIsLoading(true)
    const result = await cancelAppointment(appointment.id)
    setIsLoading(false)
    if (result.success) {
      toast.success("予約をキャンセルしました。")
      onAppointmentUpdate()
      onClose()
    } else {
      toast.error(`予約のキャンセルに失敗しました: ${result.message}`)
    }
  }

  if (!appointment) {
    return null
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
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
          <div>
            <h3 className="font-semibold">診療種別</h3>
            <p>{appointment.service_types?.name}</p>
            <p className="text-sm text-muted-foreground">{appointment.clinics?.name}</p>
          </div>
          <div>
            <h3 className="font-semibold">日付と時間</h3>
            <ReservationCalendar
              clinicId={appointment.clinic_id}
              serviceTypeId={appointment.service_type_id}
              getAvailableSlots={getAvailableSlots}
              selectedDate={selectedDate}
              onDateSelect={setSelectedDate}
              selectedTime={selectedTime}
              onTimeSelect={setSelectedTime}
              duration={currentServiceType?.duration || 60}
            />
          </div>
        </div>
        <DialogFooter className="justify-between">
          <Button variant="destructive" onClick={handleCancel} disabled={isLoading}>
            予約をキャンセル
          </Button>
          <div className="flex gap-2">
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
