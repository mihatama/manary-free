"use client"

import { useState, useEffect } from "react"
import { Calendar, dateFnsLocalizer, type Event as BigCalendarEvent } from "react-big-calendar"
import { format, parse, startOfWeek, getDay, addMonths, subMonths } from "date-fns"
import { ja } from "date-fns/locale"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight } from "lucide-react"
import type { Database } from "@/lib/supabase/database.types"
import { Alert, AlertDescription } from "@/components/ui/alert"
import ErrorBoundary from "./error-boundary"
import "react-big-calendar/lib/css/react-big-calendar.css"
import { getCalendarEventsForMonth } from "@/app/actions/reservation-actions"

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
  clinicId: number
  serviceType: ServiceType
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

// Helper to parse time robustly, with detailed logging
const parseISO = (isoString: string | null): Date | null => {
  if (!isoString) {
    return null
  }
  const date = new Date(isoString)
  if (isNaN(date.getTime())) {
    console.error(`[ReservationCalendar:parseISO] FAILED: Invalid Date for string: '${isoString}'`)
    return null
  }
  return date
}

// Helper to parse time robustly, with detailed logging
const parseTime = (dateStr: string | null, timeStr: string | null): Date | null => {
  console.log(`[ReservationCalendar:parseTime] Attempting to parse: date='${dateStr}', time='${timeStr}'`)
  if (!dateStr || !timeStr) {
    console.error(`[ReservationCalendar:parseTime] FAILED: Missing date or time string.`)
    return null
  }
  // Regex to validate HH:mm or HH:mm:ss
  if (!/^\d{2}:\d{2}(:\d{2})?$/.test(timeStr)) {
    console.error(`[ReservationCalendar:parseTime] FAILED: Invalid time format detected: '${timeStr}'`)
    return null
  }
  try {
    const dateTimeString = `${dateStr}T${timeStr}`
    const date = new Date(dateTimeString)
    if (isNaN(date.getTime())) {
      console.error(
        `[ReservationCalendar:parseTime] FAILED: new Date() returned Invalid Date for string: '${dateTimeString}'`,
      )
      return null
    }
    // console.log(`[ReservationCalendar:parseTime] SUCCESS: Parsed to:`, date);
    return date
  } catch (e) {
    console.error(
      `[ReservationCalendar:parseTime] FAILED: Caught exception while parsing date/time: ${dateStr}T${timeStr}`,
      e,
    )
    return null
  }
}

export function ReservationCalendar({ clinicId, serviceType, onSelectSlot, selectedSlot }: ReservationCalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [events, setEvents] = useState<CalendarEvent[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  console.log(`[ReservationCalendar] Rendering. Props:`, {
    clinicId,
    serviceTypeName: serviceType?.name,
    selectedSlot,
  })

  useEffect(() => {
    if (!clinicId || !serviceType) {
      setEvents([])
      return
    }

    async function fetchMonthEvents() {
      setIsLoading(true)
      setError(null)
      const monthStr = format(currentDate, "yyyy-MM")
      console.log(
        `[ReservationCalendar:useEffect] Fetching events for clinic ${clinicId}, service type ${serviceType.id}, month ${monthStr}`,
      )
      try {
        const result = await getCalendarEventsForMonth(clinicId, serviceType.id, monthStr)

        if (result.error) {
          throw new Error(result.error)
        }

        const processedEvents: CalendarEvent[] = (result.events || [])
          .map((event) => {
            const startDate = parseISO(event.start)
            const endDate = parseISO(event.end)

            if (!startDate || !endDate) {
              console.error("[ReservationCalendar] Skipping invalid event due to date parsing failure:", event)
              return null
            }

            return {
              title: event.isAvailable ? format(startDate, "HH:mm") : "予約済",
              start: startDate,
              end: endDate,
              isAvailable: event.isAvailable,
            }
          })
          .filter((e): e is CalendarEvent => e !== null) // Filter out nulls

        console.log(`[ReservationCalendar:useEffect] Total processed events for month: ${processedEvents.length}`)
        setEvents(processedEvents)
      } catch (err: any) {
        console.error("[ReservationCalendar] A top-level error occurred:", err)
        setError(err.message || "予約枠の読み込み中にエラーが発生しました。")
      } finally {
        setIsLoading(false)
      }
    }

    fetchMonthEvents()
  }, [clinicId, serviceType, currentDate])

  const eventStyleGetter = (event: CalendarEvent) => {
    const isSelected = selectedSlot && event.start?.getTime() === selectedSlot.start?.getTime()
    const selectedColor = serviceType.color || "#f78989"
    const availableColor = "#a8d8ea"
    const unavailableColor = "#e0e0e0"

    let backgroundColor = event.isAvailable ? availableColor : unavailableColor
    if (isSelected) {
      backgroundColor = selectedColor
    }

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
          <CardTitle className="text-lg">{serviceType.name} - 予約日時選択</CardTitle>
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
              views={["month"]}
              defaultView="month"
              eventPropGetter={eventStyleGetter}
              onSelectEvent={handleSelectEvent}
              selectable={false}
              culture="ja"
              formats={{
                monthHeaderFormat: (date) => format(date, "yyyy年M月", { locale: ja }),
                weekdayFormat: (date) => format(date, "E", { locale: ja }),
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
