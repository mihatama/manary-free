"use client"

import { useState, useEffect } from "react"
import { Calendar, dateFnsLocalizer, type Event as BigCalendarEvent } from "react-big-calendar"
import { format, parse, startOfWeek, getDay, parseISO, addMonths, subMonths } from "date-fns"
import { ja } from "date-fns/locale"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { getAvailableSlots } from "@/app/actions/reservation-actions"
import type { Database } from "@/lib/supabase/database.types"
import { Alert, AlertDescription } from "@/components/ui/alert"
import ErrorBoundary from "./error-boundary"
import "react-big-calendar/lib/css/react-big-calendar.css" // Import calendar CSS

// date-fns localizer setup
const locales = {
  ja: ja,
}
const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek: (date) => startOfWeek(date, { locale: ja }),
  getDay,
  locales,
})

type ServiceType = Database["public"]["Tables"]["service_types"]["Row"]

export interface CalendarEvent extends BigCalendarEvent {
  isAvailable: boolean
}

interface ReservationCalendarProps {
  serviceType: ServiceType | null
  onSelectSlot: (event: CalendarEvent) => void
  selectedSlot: CalendarEvent | null
}

function getContrastingTextColor(hexColor: string): string {
  if (!hexColor) return "#000000"
  const cleanHex = hexColor.startsWith("#") ? hexColor.slice(1) : hexColor
  const fullHex =
    cleanHex.length === 3
      ? cleanHex
          .split("")
          .map((char) => char + char)
          .join("")
      : cleanHex
  if (fullHex.length !== 6) return "#000000"
  const r = Number.parseInt(fullHex.substring(0, 2), 16)
  const g = Number.parseInt(fullHex.substring(2, 4), 16)
  const b = Number.parseInt(fullHex.substring(4, 6), 16)
  const luma = (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255
  return luma > 0.5 ? "#212529" : "#FFFFFF"
}

export function ReservationCalendar({ serviceType, onSelectSlot, selectedSlot }: ReservationCalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [events, setEvents] = useState<CalendarEvent[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!serviceType) {
      setEvents([])
      return
    }

    async function fetchAndProcessSlots() {
      setIsLoading(true)
      setError(null)
      try {
        const month = format(currentDate, "yyyy-MM")
        const slots = await getAvailableSlots(serviceType!.id, month)

        if (!Array.isArray(slots)) {
          console.error("[CLIENT ERROR] Data from server is not an array:", slots)
          setError("サーバーから予期しない形式のデータを受信しました。")
          setEvents([])
          setIsLoading(false)
          return
        }

        const processedEvents: CalendarEvent[] = []
        slots.forEach((slot, index) => {
          // Defensively check the slot object and its properties
          if (!slot || typeof slot.start_time !== "string" || typeof slot.end_time !== "string") {
            console.warn(`[CLIENT WARN] Skipping invalid slot object at index ${index}:`, slot)
            return // continue to next iteration
          }

          try {
            // Attempt to parse the ISO strings
            const startTime = parseISO(slot.start_time)
            const endTime = parseISO(slot.end_time)

            // CRITICAL CHECK: Validate the parsed dates.
            // isNaN(date.getTime()) is the most reliable way to check for an "Invalid Date" object.
            if (isNaN(startTime.getTime()) || isNaN(endTime.getTime())) {
              console.error(
                `[CLIENT ERROR] Skipping slot at index ${index} due to invalid date after parsing. This is the cause of the crash.`,
                {
                  original_start: slot.start_time,
                  original_end: slot.end_time,
                  parsed_start: startTime,
                  parsed_end: endTime,
                },
              )
              return // continue to next iteration
            }

            // If we reach here, the dates are valid.
            processedEvents.push({
              title: slot.is_available ? format(startTime, "HH:mm") : "予約済",
              start: startTime,
              end: endTime,
              isAvailable: slot.is_available,
            })
          } catch (e) {
            // This catch block is a fallback. The isNaN check above should prevent most crashes.
            console.error(
              `[CLIENT CRITICAL] A RangeError was thrown while processing slot at index ${index}. This indicates a severely malformed date string.`,
              {
                slot,
                error: e,
              },
            )
            // Do not add this event and continue
          }
        })

        setEvents(processedEvents)
      } catch (err) {
        console.error("[CLIENT FATAL] A top-level error occurred while fetching or processing slots:", err)
        setError("予約枠の読み込み中に重大なエラーが発生しました。")
      } finally {
        setIsLoading(false)
      }
    }

    fetchAndProcessSlots()
  }, [serviceType, currentDate])

  const eventStyleGetter = (event: CalendarEvent) => {
    const isSelected = selectedSlot && event.start?.getTime() === selectedSlot.start?.getTime()
    const selectedColor = "#f78989"
    const availableColor = "#a8d8ea"
    const unavailableColor = "#e0e0e0"
    const backgroundColor = isSelected ? selectedColor : event.isAvailable ? availableColor : unavailableColor
    const textColor = getContrastingTextColor(backgroundColor)
    const style = {
      backgroundColor: backgroundColor,
      borderRadius: "4px",
      opacity: 0.9,
      color: event.isAvailable ? textColor : "#616161",
      border: "none",
      display: "block",
      cursor: event.isAvailable ? "pointer" : "not-allowed",
      padding: "2px 4px",
      fontSize: "0.8em",
      textAlign: "center" as const,
    }
    return { style }
  }

  const handleSelectEvent = (event: CalendarEvent) => {
    if (event.isAvailable && event.start) {
      onSelectSlot(event)
    }
  }

  const goToPreviousMonth = () => setCurrentDate((prev) => subMonths(prev, 1))
  const goToNextMonth = () => setCurrentDate((prev) => addMonths(prev, 1))
  const goToToday = () => setCurrentDate(new Date())

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle className="text-lg">
            {serviceType ? `${serviceType.name} - 予約日時選択` : "予約日時選択"}
          </CardTitle>
          <div className="flex items-center space-x-2">
            <Button variant="outline" size="sm" onClick={goToPreviousMonth}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={goToToday}>
              今月
            </Button>
            <Button variant="outline" size="sm" onClick={goToNextMonth}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        {isLoading && <p className="text-center p-4">予約枠を読み込み中...</p>}
        <div style={{ height: "600px" }}>
          <ErrorBoundary>
            <Calendar
              localizer={localizer}
              events={events}
              startAccessor="start"
              endAccessor="end"
              style={{ height: "100%" }}
              date={currentDate}
              onNavigate={(date) => setCurrentDate(date)}
              views={["month", "week", "day"]}
              defaultView="month"
              eventPropGetter={eventStyleGetter}
              onSelectEvent={handleSelectEvent}
              selectable={false}
              culture="ja"
              formats={{
                monthHeaderFormat: (date) => format(date, "yyyy年M月", { locale: ja }),
                weekdayFormat: (date) => format(date, "E", { locale: ja }),
                dayHeaderFormat: (date) => format(date, "M月d日(E)", { locale: ja }),
                dayRangeHeaderFormat: ({ start, end }) =>
                  `${format(start, "yyyy年M月d日", { locale: ja })} - ${format(end, "M月d日", { locale: ja })}`,
                timeGutterFormat: (date) => format(date, "H:mm"),
              }}
              messages={{
                today: "今日",
                previous: "前へ",
                next: "次へ",
                month: "月",
                week: "週",
                day: "日",
                agenda: "予定",
                date: "日付",
                time: "時間",
                event: "イベント",
                noEventsInRange: "この期間に予約可能な時間はありません",
                showMore: (total) => `他 ${total} 件`,
              }}
            />
          </ErrorBoundary>
        </div>
      </CardContent>
    </Card>
  )
}
