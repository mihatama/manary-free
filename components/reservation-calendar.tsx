"use client"

import { useState, useEffect } from "react"
import { Calendar, dateFnsLocalizer, type Event as BigCalendarEvent } from "react-big-calendar"
import { format, parse, startOfWeek, getDay, parseISO } from "date-fns"
import { ja } from "date-fns/locale"
import "react-big-calendar/lib/css/react-big-calendar.css"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { getAvailableSlots } from "@/app/actions/reservation-actions"
import type { Database } from "@/lib/supabase/database.types"

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

interface ReservationCalendarProps {
  serviceType: ServiceType | null
  onSelectSlot: (slot: Date) => void
  selectedSlot: Date | null
}

interface CalendarEvent extends BigCalendarEvent {
  isAvailable: boolean
}

export function ReservationCalendar({ serviceType, onSelectSlot, selectedSlot }: ReservationCalendarProps) {
  const [date, setDate] = useState(new Date())
  const [events, setEvents] = useState<CalendarEvent[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [view, setView] = useState<"month" | "week" | "day">("month")

  useEffect(() => {
    if (!serviceType) {
      setEvents([])
      return
    }

    async function fetchAvailableSlots() {
      try {
        setIsLoading(true)
        setError(null)
        const month = format(date, "yyyy-MM")
        const slots = await getAvailableSlots(serviceType!.id, month)

        const calendarEvents: CalendarEvent[] = slots.map((slot) => {
          const startTime = parseISO(slot.start_time)
          const endTime = parseISO(slot.end_time)
          return {
            title: "予約可能",
            start: startTime,
            end: endTime,
            isAvailable: slot.is_available,
          }
        })
        setEvents(calendarEvents)
      } catch (err) {
        console.error("Failed to fetch available slots:", err)
        setError("予約枠の読み込みに失敗しました。")
      } finally {
        setIsLoading(false)
      }
    }

    fetchAvailableSlots()
  }, [serviceType, date])

  const handleNavigate = (newDate: Date) => {
    setDate(newDate)
  }

  const handleView = (newView: any) => {
    setView(newView)
  }

  const handleSelectSlot = (slotInfo: { start: Date }) => {
    if (view === "month") {
      setDate(slotInfo.start)
      setView("day")
    } else {
      const isAvailable = events.some(
        (event) =>
          event.start && event.end && slotInfo.start >= event.start && slotInfo.start < event.end && event.isAvailable,
      )
      if (isAvailable) {
        onSelectSlot(slotInfo.start)
      }
    }
  }

  const eventStyleGetter = (event: CalendarEvent) => {
    const isSelected = selectedSlot && event.start?.getTime() === selectedSlot.getTime()
    const style = {
      backgroundColor: isSelected ? "#f78989" : event.isAvailable ? "#a8d8ea" : "#e0e0e0",
      borderRadius: "5px",
      opacity: 0.8,
      color: isSelected ? "white" : "black",
      border: "0px",
      display: "block",
      cursor: event.isAvailable ? "pointer" : "not-allowed",
    }
    return {
      style: style,
    }
  }

  const CustomToolbar = (toolbar: any) => {
    const goToBack = () => {
      toolbar.onNavigate("PREV")
    }

    const goToNext = () => {
      toolbar.onNavigate("NEXT")
    }

    const goToCurrent = () => {
      toolbar.onNavigate("TODAY")
    }

    const label = () => {
      return format(toolbar.date, "yyyy年 M月", { locale: ja })
    }

    return (
      <div className="rbc-toolbar">
        <span className="rbc-btn-group">
          <Button onClick={goToBack}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button onClick={goToCurrent}>今日</Button>
          <Button onClick={goToNext}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </span>
        <span className="rbc-toolbar-label">{label()}</span>
        <span className="rbc-btn-group">
          {["month", "week", "day"].map((viewName) => (
            <Button
              key={viewName}
              onClick={() => toolbar.onView(viewName)}
              className={toolbar.view === viewName ? "rbc-active" : ""}
            >
              {viewName === "month" ? "月" : viewName === "week" ? "週" : "日"}
            </Button>
          ))}
        </span>
      </div>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">{serviceType ? `${serviceType.name} - 予約日時選択` : "予約日時選択"}</CardTitle>
      </CardHeader>
      <CardContent>
        {error && <p className="text-red-500">{error}</p>}
        <div style={{ height: "600px" }}>
          <Calendar
            localizer={localizer}
            events={events}
            startAccessor="start"
            endAccessor="end"
            style={{ height: "100%" }}
            date={date}
            onNavigate={handleNavigate}
            onView={handleView}
            view={view}
            onSelectSlot={handleSelectSlot}
            selectable
            eventPropGetter={eventStyleGetter}
            culture="ja"
            components={{
              toolbar: CustomToolbar,
            }}
            formats={{
              dayHeaderFormat: (date) => format(date, "M月d日 (E)", { locale: ja }),
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
            }}
          />
        </div>
        {isLoading && <p>予約枠を読み込み中...</p>}
      </CardContent>
    </Card>
  )
}
