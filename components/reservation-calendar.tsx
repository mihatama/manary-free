"use client"

import { useState, useEffect, useMemo } from "react"
import { Calendar } from "@/components/ui/calendar"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { getAvailableSlots } from "@/app/actions/reservation-actions"
import { format, startOfMonth, endOfMonth, eachDayOfInterval } from "date-fns"
import { ja } from "date-fns/locale"
import { Skeleton } from "@/components/ui/skeleton"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useRouter } from "next/navigation"

interface ReservationCalendarProps {
  clinicId: number
}

type CalendarEvent = {
  id: string | number
  title: string
  start: Date
  end: Date
  backgroundColor?: string
  textColor?: string
  extendedProps?: any
}

export function ReservationCalendar({ clinicId }: ReservationCalendarProps) {
  const router = useRouter()
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined)
  const [selectedTime, setSelectedTime] = useState<string | null>(null)
  const [events, setEvents] = useState<CalendarEvent[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [monthlyAvailability, setMonthlyAvailability] = useState<Record<string, boolean>>({})

  useEffect(() => {
    const fetchMonthlyData = async () => {
      setIsLoading(true)
      setError(null)
      try {
        const startDate = startOfMonth(currentMonth)
        const endDate = endOfMonth(currentMonth)
        const days = eachDayOfInterval({ start: startDate, end: endDate })
        const promises = days.map((day) => getAvailableSlots(clinicId, format(day, "yyyy-MM-dd")))
        const results = await Promise.all(promises)

        const newEvents: CalendarEvent[] = []
        const newMonthlyAvailability: Record<string, boolean> = {}

        results.forEach((dayResult, index) => {
          const day = days[index]
          const dateStr = format(day, "yyyy-MM-dd")

          if (dayResult.error) {
            console.warn(`Could not fetch slots for ${dateStr}:`, dayResult.error)
            newMonthlyAvailability[dateStr] = false
            return
          }

          const hasSlots = dayResult.availableSlots && dayResult.availableSlots.length > 0
          newMonthlyAvailability[dateStr] = hasSlots

          // Process available slots
          dayResult.availableSlots?.forEach((slot) => {
            try {
              const startTime = new Date(`${slot.date}T${slot.startTime}`)
              const endTime = new Date(`${slot.date}T${slot.endTime}`)

              if (isNaN(startTime.getTime()) || isNaN(endTime.getTime())) {
                console.error("Skipping invalid available slot due to invalid date:", slot)
                return
              }

              newEvents.push({
                id: `${slot.date}-${slot.startTime}-${slot.serviceTypeId}`,
                title: `空きあり (${slot.serviceTypeName})`,
                start: startTime,
                end: endTime,
                backgroundColor: slot.serviceTypeColor || "#3788d8",
                extendedProps: { type: "available", slot },
              })
            } catch (e) {
              console.error("Skipping invalid available slot due to processing error:", e, slot)
            }
          })

          // Process existing reservations
          dayResult.existingReservations?.forEach((reservation) => {
            try {
              const startTime = new Date(`${reservation.reservation_date}T${reservation.start_time}`)
              const endTime = new Date(`${reservation.reservation_date}T${reservation.end_time}`)

              if (isNaN(startTime.getTime()) || isNaN(endTime.getTime())) {
                console.error("Skipping invalid reservation due to invalid date:", reservation)
                return
              }

              newEvents.push({
                id: reservation.id,
                title: "予約済み",
                start: startTime,
                end: endTime,
                backgroundColor: "#d3d3d3",
                textColor: "#000000",
                extendedProps: { type: "reserved" },
              })
            } catch (e) {
              console.error("Skipping invalid reservation due to processing error:", e, reservation)
            }
          })
        })

        setEvents(newEvents)
        setMonthlyAvailability(newMonthlyAvailability)
      } catch (err) {
        console.error("Failed to fetch monthly data:", err)
        setError("予約情報の読み込みに失敗しました。")
      } finally {
        setIsLoading(false)
      }
    }

    fetchMonthlyData()
  }, [currentMonth, clinicId])

  const dailySlots = useMemo(() => {
    if (!selectedDate) return []
    const dateStr = format(selectedDate, "yyyy-MM-dd")
    return events
      .filter((event) => event.extendedProps?.type === "available" && format(event.start, "yyyy-MM-dd") === dateStr)
      .sort((a, b) => a.start.getTime() - b.start.getTime())
  }, [selectedDate, events])

  const handleSelectDate = (date: Date | undefined) => {
    setSelectedDate(date)
    setSelectedTime(null)
  }

  const handleProceedToForm = () => {
    if (selectedDate && selectedTime) {
      const selectedSlot = dailySlots.find((event) => format(event.start, "HH:mm") === selectedTime)?.extendedProps.slot

      if (selectedSlot) {
        const params = new URLSearchParams({
          clinicId: clinicId.toString(),
          serviceTypeId: selectedSlot.serviceTypeId.toString(),
          date: format(selectedDate, "yyyy-MM-dd"),
          time: selectedTime,
        })
        router.push(`/reservation/new?${params.toString()}`)
      }
    }
  }

  return (
    <Card className="p-4">
      <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2">
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={handleSelectDate}
            month={currentMonth}
            onMonthChange={setCurrentMonth}
            locale={ja}
            disabled={(date) => {
              const dateStr = format(date, "yyyy-MM-dd")
              return !monthlyAvailability[dateStr]
            }}
            components={{
              DayContent: ({ date }) => {
                const dateStr = format(date, "yyyy-MM-dd")
                const isAvailable = monthlyAvailability[dateStr]
                return (
                  <div className="relative w-full h-full flex items-center justify-center">
                    <span>{date.getDate()}</span>
                    {isAvailable && <span className="absolute bottom-0.5 w-1 h-1 bg-green-500 rounded-full"></span>}
                  </div>
                )
              },
            }}
            className="rounded-md border"
          />
        </div>
        <div className="md:col-span-1">
          <h3 className="font-semibold mb-4 text-lg">
            {selectedDate ? format(selectedDate, "M月d日 (E)", { locale: ja }) : "日付を選択"}
          </h3>
          {isLoading && <Skeleton className="h-48 w-full" />}
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          {!isLoading && !error && selectedDate && (
            <div className="space-y-2 max-h-72 overflow-y-auto pr-2">
              {dailySlots.length > 0 ? (
                dailySlots.map((event) => (
                  <Button
                    key={event.id}
                    variant={selectedTime === format(event.start, "HH:mm") ? "default" : "outline"}
                    onClick={() => setSelectedTime(format(event.start, "HH:mm"))}
                    className="w-full justify-between"
                    style={{
                      // @ts-ignore
                      "--bg-color": event.backgroundColor,
                      "--text-color": event.textColor || "white",
                    }}
                  >
                    <span>{format(event.start, "HH:mm")}</span>
                    <span className="text-xs truncate" style={{ color: event.backgroundColor }}>
                      ●
                    </span>
                    <span className="text-xs truncate">{event.extendedProps.slot.serviceTypeName}</span>
                  </Button>
                ))
              ) : (
                <p className="text-sm text-gray-500">この日の予約可能な時間枠はありません。</p>
              )}
            </div>
          )}
          {selectedDate && selectedTime && (
            <Button onClick={handleProceedToForm} className="w-full mt-4 bg-[#f8a0a0] hover:bg-[#f78989] text-white">
              予約へ進む
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
