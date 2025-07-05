"use client"

import { useState, useEffect } from "react"
import { format } from "date-fns"
import { ja } from "date-fns/locale"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { ReservationCalendar, type CalendarEvent } from "@/components/reservation-calendar"
import { updateAppointment } from "@/app/actions/reservation-actions"
import { Loader2 } from "lucide-react"
import type { Database } from "@/lib/supabase/database.types"

type ServiceType = Database["public"]["Tables"]["service_types"]["Row"]

// Helper to parse date string safely.
// An invalid date string from the database can cause a crash.
// This function ensures we always have a valid Date object.
const parseDateString = (dateStr: string | null | undefined): Date => {
  console.log(`[AppointmentEditor:parseDateString] Parsing date string:`, dateStr)
  // If date string is missing or empty, default to today.
  if (!dateStr) {
    console.warn(`[AppointmentEditor:parseDateString] Received null or empty date string. Defaulting to today.`)
    return new Date()
  }
  // Use 'T00:00:00' to ensure parsing in local timezone, not UTC.
  const date = new Date(`${dateStr}T00:00:00`)
  // If parsing fails, default to today and log the error.
  if (isNaN(date.getTime())) {
    console.error(
      `[AppointmentEditor:parseDateString] Invalid date string received: "${dateStr}". Defaulting to today.`,
    )
    return new Date()
  }
  console.log(`[AppointmentEditor:parseDateString] Successfully parsed to:`, date)
  return date
}

export function AppointmentEditor({
  appointment,
  onClose,
  onComplete,
}: {
  appointment: any
  onClose: () => void
  onComplete: () => void
}) {
  console.log("[AppointmentEditor] Component rendered with appointment data:", appointment)
  const [isOpen, setIsOpen] = useState(true)
  const [selectedSlot, setSelectedSlot] = useState<CalendarEvent | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Safely parse the appointment date to prevent crashes.
  const initialDate = parseDateString(appointment.reservation_date)
  const [serviceType, setServiceType] = useState<ServiceType | null>(null)

  useEffect(() => {
    if (appointment?.service_types) {
      setServiceType(appointment.service_types)
    }
  }, [appointment])

  const handleSelectSlot = (slot: CalendarEvent) => {
    setSelectedSlot(slot)
    setError(null)
  }

  const handleSubmit = async () => {
    if (!selectedSlot?.start || !selectedSlot?.end) {
      setError("新しい予約日時を選択してください。")
      return
    }

    setIsLoading(true)
    setError(null)

    const updates = {
      reservation_date: format(selectedSlot.start, "yyyy-MM-dd"),
      start_time: format(selectedSlot.start, "HH:mm:ss"),
      end_time: format(selectedSlot.end, "HH:mm:ss"),
    }

    const result = await updateAppointment(appointment.id, updates)
    setIsLoading(false)

    if (result.success) {
      onComplete()
    } else {
      setError(result.message || "予約の変更に失敗しました。")
    }
  }

  const handleClose = () => {
    setIsOpen(false)
    // Delay closing to allow for animation
    setTimeout(onClose, 300)
  }

  if (!serviceType) {
    return (
      <Dialog open={isOpen} onOpenChange={handleClose}>
        <DialogContent>
          <div className="flex items-center justify-center p-8">
            <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
            <p className="ml-4">読み込み中...</p>
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>予約の変更</DialogTitle>
          <p className="text-sm text-muted-foreground">
            現在の予約: {format(initialDate, "M月d日")} {appointment.start_time?.substring(0, 5)}
          </p>
        </DialogHeader>

        <div className="py-4">
          <ReservationCalendar
            clinicId={appointment.clinic_id}
            serviceType={serviceType}
            onSelectSlot={handleSelectSlot}
            selectedSlot={selectedSlot}
          />
        </div>

        {selectedSlot?.start && (
          <div className="text-center font-semibold text-lg p-2 bg-green-100 text-green-800 rounded-md">
            新しい予約日時: {format(selectedSlot.start, "M月d日 (E) HH:mm", { locale: ja })}
          </div>
        )}

        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            キャンセル
          </Button>
          <Button onClick={handleSubmit} disabled={!selectedSlot || isLoading}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            変更を確定する
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
