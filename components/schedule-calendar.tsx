"use client"

import { useState, useEffect } from "react"
import { Calendar, dateFnsLocalizer, type Event as BigCalendarEvent, type View } from "react-big-calendar"
import { format, parse, startOfWeek, getDay } from "date-fns"
import { ja } from "date-fns/locale"
import "react-big-calendar/lib/css/react-big-calendar.css"
import { getScheduleEventsForMonth } from "@/app/actions/schedule-actions"
import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"

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

interface ScheduleCalendarEvent extends BigCalendarEvent {
  isAvailable: boolean
  isSpecificDate: boolean
  color: string | null
}

interface ScheduleCalendarProps {
  clinicId: number | null
}

// Helper to parse ISO string robustly
const parseISO = (isoString: string | null): Date | null => {
  if (!isoString) return null
  const date = new Date(isoString)
  if (isNaN(date.getTime())) {
    console.error(`[ScheduleCalendar:parseISO] FAILED: Invalid Date for string: '${isoString}'`)
    return null
  }
  return date
}

const CustomToolbar = ({ label, onNavigate, onView, view, views }: any) => {
  const viewNames: { [key: string]: string } = {
    month: "月",
    week: "週",
    day: "日",
  }

  return (
    <div className="flex flex-col sm:flex-row justify-between items-center mb-4 gap-2">
      <div className="flex items-center space-x-2">
        <Button variant="outline" size="sm" onClick={() => onNavigate("PREV")}>
          <ChevronLeft className="h-4 w-4" />
          <span className="sr-only">前へ</span>
        </Button>
        <Button variant="outline" size="sm" onClick={() => onNavigate("TODAY")}>
          今日
        </Button>
        <Button variant="outline" size="sm" onClick={() => onNavigate("NEXT")}>
          <ChevronRight className="h-4 w-4" />
          <span className="sr-only">次へ</span>
        </Button>
      </div>
      <div className="text-lg font-bold order-first sm:order-none">{label}</div>
      <div className="flex items-center space-x-2">
        {(views as View[]).map((v) => (
          <Button key={v} variant={view === v ? "default" : "outline"} size="sm" onClick={() => onView(v)}>
            {viewNames[v]}
          </Button>
        ))}
      </div>
    </div>
  )
}

export function ScheduleCalendar({ clinicId }: ScheduleCalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [events, setEvents] = useState<ScheduleCalendarEvent[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [memoizedEvents, setMemoizedEvents] = useState<{ [key: string]: ScheduleCalendarEvent[] }>({})

  useEffect(() => {
    if (!clinicId) {
      setEvents([])
      return
    }

    const fetchEvents = async () => {
      const monthStr = format(currentDate, "yyyy-MM")
      if (memoizedEvents[monthStr]) {
        setEvents(memoizedEvents[monthStr])
        return
      }

      setIsLoading(true)
      setError(null)
      try {
        const result = await getScheduleEventsForMonth(clinicId, monthStr)
        if (result.error) {
          throw new Error(result.error)
        }

        const processedEvents: ScheduleCalendarEvent[] = (result.events || [])
          .map((event) => {
            const startDate = parseISO(event.start)
            const endDate = parseISO(event.end)

            if (!startDate || !endDate) {
              console.error("[ScheduleCalendar] Skipping invalid event due to date parsing failure:", event)
              return null
            }

            return {
              ...event,
              start: startDate,
              end: endDate,
            }
          })
          .filter((e): e is ScheduleCalendarEvent => e !== null)

        setMemoizedEvents((prev) => ({ ...prev, [monthStr]: processedEvents }))
        setEvents(processedEvents)
      } catch (err: any) {
        setError(err.message || "カレンダーの読み込みに失敗しました。")
        console.error(err)
      } finally {
        setIsLoading(false)
      }
    }

    fetchEvents()
  }, [clinicId, currentDate, memoizedEvents])

  const eventStyleGetter = (event: ScheduleCalendarEvent) => {
    const backgroundColor = event.color || (event.isAvailable ? "#a8d8ea" : "#f5c0c0")
    const textColor = event.isAvailable ? "#212529" : "#616161"

    const style = {
      backgroundColor,
      borderRadius: "5px",
      opacity: event.isSpecificDate ? 1 : 0.7,
      color: textColor,
      border: event.isSpecificDate ? "2px solid #333" : "0px",
      display: "block",
      padding: "2px 5px",
    }
    return { style }
  }

  if (!clinicId) return <p>助産院を選択してください。</p>

  return (
    <div className="space-y-4">
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      {isLoading && <p className="text-center p-4">カレンダーを読み込み中...</p>}
      <div style={{ height: "700px" }}>
        <Calendar
          localizer={localizer}
          events={events}
          startAccessor="start"
          endAccessor="end"
          style={{ height: "100%" }}
          date={currentDate}
          onNavigate={(date) => setCurrentDate(date)}
          views={["month", "week", "day"]}
          defaultView="week"
          eventPropGetter={eventStyleGetter}
          culture="ja"
          components={{
            toolbar: CustomToolbar,
          }}
          formats={{
            monthHeaderFormat: (date) => format(date, "yyyy年M月", { locale: ja }),
            weekdayFormat: (date) => format(date, "E", { locale: ja }),
            dayHeaderFormat: (date) => format(date, "M月d日(E)", { locale: ja }),
            timeGutterFormat: (date) => format(date, "H:mm", { locale: ja }),
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
            noEventsInRange: "この期間に設定はありません",
            showMore: (total) => `他 ${total} 件`,
          }}
        />
      </div>
    </div>
  )
}
