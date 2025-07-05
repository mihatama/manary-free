"use client"

import { useState, useEffect, useCallback } from "react"
import FullCalendar from "@fullcalendar/react"
import dayGridPlugin from "@fullcalendar/daygrid"
import timeGridPlugin from "@fullcalendar/timegrid"
import interactionPlugin from "@fullcalendar/interaction"
import { getCalendarEventsForMonth } from "@/app/actions/reservation-actions"
import { format } from "date-fns"
import { useToast } from "@/components/ui/use-toast"
import { Loader2 } from "lucide-react"

interface ReservationCalendarProps {
  clinicId: number
  serviceTypeId: number
  onSelectSlot: (slot: { start: Date; end: Date }) => void
}

export function ReservationCalendar({ clinicId, serviceTypeId, onSelectSlot }: ReservationCalendarProps) {
  const [events, setEvents] = useState<any[]>([])
  const [currentMonth, setCurrentMonth] = useState(format(new Date(), "yyyy-MM"))
  const [isLoading, setIsLoading] = useState(true)
  const { toast } = useToast()

  const fetchEvents = useCallback(
    async (month: string) => {
      setIsLoading(true)
      try {
        const result = await getCalendarEventsForMonth(clinicId, serviceTypeId, month)
        if (result.error) {
          throw new Error(result.error)
        }
        setEvents(result.events || [])
      } catch (error) {
        console.error("Failed to fetch calendar events:", error)
        toast({
          title: "エラー",
          description: "カレンダーの読み込みに失敗しました。",
          variant: "destructive",
        })
        setEvents([])
      } finally {
        setIsLoading(false)
      }
    },
    [clinicId, serviceTypeId, toast],
  )

  useEffect(() => {
    fetchEvents(currentMonth)
  }, [currentMonth, fetchEvents])

  const handleDatesSet = (arg: any) => {
    const newMonth = format(arg.view.currentStart, "yyyy-MM")
    if (newMonth !== currentMonth) {
      setCurrentMonth(newMonth)
    }
  }

  const handleEventClick = (clickInfo: any) => {
    if (clickInfo.event.extendedProps.isAvailable) {
      onSelectSlot({
        start: clickInfo.event.start,
        end: clickInfo.event.end,
      })
    }
  }

  const eventContent = (eventInfo: any) => {
    const { event, view } = eventInfo
    const isAvailable = event.extendedProps.isAvailable

    if (isAvailable) {
      const startTime = format(new Date(event.start), "HH:mm")
      const endTime = format(new Date(event.end), "HH:mm")
      const serviceName = event.extendedProps.serviceName || "予約枠"

      if (view.type === "timeGridWeek" || view.type === "timeGridDay") {
        return (
          <div className="p-1 text-white text-xs h-full flex flex-col justify-center">
            <div>{`${startTime} - ${endTime}`}</div>
            <div className="font-bold">{serviceName}</div>
          </div>
        )
      }
      return (
        <div className="p-1 text-xs">
          <b>{startTime}</b>
        </div>
      )
    }

    return (
      <div className="p-1 bg-gray-300 text-gray-600 text-xs rounded-sm h-full flex items-center justify-center">
        <div>予約済</div>
      </div>
    )
  }

  return (
    <div className="relative">
      {isLoading && (
        <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center z-10">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      )}
      <FullCalendar
        plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
        initialView="timeGridWeek"
        headerToolbar={{
          left: "prev,next today",
          center: "title",
          right: "dayGridMonth,timeGridWeek,timeGridDay",
        }}
        locale="ja"
        events={events}
        datesSet={handleDatesSet}
        eventClick={handleEventClick}
        selectable={false}
        editable={false}
        allDaySlot={false}
        slotMinTime="08:00:00"
        slotMaxTime="20:00:00"
        eventContent={eventContent}
        eventClassNames={(arg) => {
          if (arg.event.extendedProps.isAvailable) {
            return ["cursor-pointer", "bg-primary", "border-primary"]
          }
          return ["bg-gray-200", "border-gray-200", "opacity-70"]
        }}
      />
    </div>
  )
}
