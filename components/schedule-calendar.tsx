"use client"

import { useState, useEffect, useMemo } from "react"
import { Calendar, dateFnsLocalizer, type Event as BigCalendarEvent } from "react-big-calendar"
import { format, parse, startOfWeek, getDay, addDays, startOfDay } from "date-fns"
import { ja } from "date-fns/locale"
import "react-big-calendar/lib/css/react-big-calendar.css"
import { getAvailabilitySettings } from "@/app/actions/schedule-actions"
import type { Database } from "@/lib/supabase/database.types"

type AvailabilitySetting = Database["public"]["Tables"]["availability_settings"]["Row"]

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
}

interface ScheduleCalendarProps {
  serviceTypeId: number | null
}

// Helper to parse time robustly, accepting HH:mm and HH:mm:ss
const parseTimeToDate = (timeStr: string, date: Date): Date | null => {
  if (!timeStr || !/^\d{2}:\d{2}(:\d{2})?$/.test(timeStr)) {
    console.warn(`Invalid time format for parsing: ${timeStr}`)
    return null
  }
  const parts = timeStr.split(":").map(Number)
  const newDate = new Date(date)
  newDate.setHours(parts[0], parts[1], parts[2] || 0, 0)
  return newDate
}

export function ScheduleCalendar({ serviceTypeId }: ScheduleCalendarProps) {
  const [settings, setSettings] = useState<AvailabilitySetting[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!serviceTypeId) {
      setSettings([])
      return
    }

    const fetchSettings = async () => {
      setIsLoading(true)
      setError(null)
      try {
        const data = await getAvailabilitySettings(serviceTypeId)
        setSettings(data)
      } catch (err) {
        setError("予約設定の読み込みに失敗しました。")
        console.error(err)
      } finally {
        setIsLoading(false)
      }
    }

    fetchSettings()
  }, [serviceTypeId])

  const events = useMemo(() => {
    const calendarEvents: ScheduleCalendarEvent[] = []
    const today = startOfDay(new Date())

    settings.forEach((setting) => {
      // Handle specific date settings
      if (setting.specific_date) {
        const date = startOfDay(new Date(setting.specific_date))
        const start = parseTimeToDate(setting.start_time, date)
        const end = parseTimeToDate(setting.end_time, date)

        if (start && end) {
          calendarEvents.push({
            title: `${setting.start_time.substring(0, 5)} - ${setting.end_time.substring(0, 5)}`,
            start,
            end,
            isAvailable: setting.is_available,
            isSpecificDate: true,
            resource: setting,
          })
        } else {
          console.warn("Skipping setting with invalid or null time format:", setting)
        }
        return
      }

      // Handle weekly recurring settings
      if (setting.day_of_week !== null) {
        // Display for the next 8 weeks
        for (let i = -4; i < 8; i++) {
          const weekStart = addDays(startOfWeek(today), i * 7)
          const targetDate = addDays(weekStart, setting.day_of_week)

          // If there's an end_date, don't show past it
          if (setting.end_date && targetDate > new Date(setting.end_date)) {
            continue
          }

          const start = parseTimeToDate(setting.start_time, targetDate)
          const end = parseTimeToDate(setting.end_time, targetDate)

          if (start && end) {
            calendarEvents.push({
              title: `${setting.start_time.substring(0, 5)} - ${setting.end_time.substring(0, 5)}`,
              start,
              end,
              isAvailable: setting.is_available,
              isSpecificDate: false,
              resource: setting,
            })
          } else {
            console.warn("Skipping setting with invalid or null time format:", setting)
          }
        }
      }
    })
    return calendarEvents
  }, [settings])

  const eventStyleGetter = (event: ScheduleCalendarEvent) => {
    let backgroundColor = event.isAvailable ? "#28a745" : "#dc3545" // green for available, red for unavailable
    if (event.isSpecificDate) {
      backgroundColor = event.isAvailable ? "#17a2b8" : "#ffc107" // cyan for specific available, yellow for specific unavailable
    }

    const style = {
      backgroundColor,
      borderRadius: "5px",
      opacity: 0.8,
      color: "white",
      border: "0px",
      display: "block",
      padding: "2px 5px",
    }
    return {
      style: style,
    }
  }

  if (isLoading) return <p>カレンダーを読み込み中...</p>
  if (error) return <p className="text-red-500">{error}</p>
  if (!serviceTypeId) return <p>診療メニューを選択してください。</p>

  return (
    <div style={{ height: "700px" }}>
      <Calendar
        localizer={localizer}
        events={events}
        startAccessor="start"
        endAccessor="end"
        style={{ height: "100%" }}
        views={["month", "week", "day"]}
        defaultView="week"
        eventPropGetter={eventStyleGetter}
        culture="ja"
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
  )
}
