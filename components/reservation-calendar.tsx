"use client"

import { useState, useMemo, useEffect } from "react"
import FullCalendar from "@fullcalendar/react"
import dayGridPlugin from "@fullcalendar/daygrid"
import timeGridPlugin from "@fullcalendar/timegrid"
import interactionPlugin from "@fullcalendar/interaction"
import { getAvailableSlots, getReservations } from "@/app/actions/reservation-actions"
import { toast } from "@/components/ui/use-toast"

// Define a combined type for simplicity
type CalendarDataSource = {
  id: number
  date: string | null
  start_time: string | null
  end_time: string | null
}

interface CalendarEvent {
  id: string
  title: string
  start: Date
  end: Date
  backgroundColor: string
  borderColor: string
  extendedProps: {
    type: "available" | "reserved"
  }
}

interface ReservationCalendarProps {
  clinicId: number
  serviceTypeId: number
  onSelectTime: (time: Date) => void
}

export function ReservationCalendar({ clinicId, serviceTypeId, onSelectTime }: ReservationCalendarProps) {
  const [availableSlots, setAvailableSlots] = useState<CalendarDataSource[]>([])
  const [reservations, setReservations] = useState<CalendarDataSource[]>([])
  const [currentDate, setCurrentDate] = useState(new Date())

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const year = currentDate.getFullYear()
        const month = currentDate.getMonth() + 1

        const [slotsData, reservationsData] = await Promise.all([
          getAvailableSlots(clinicId, serviceTypeId, year, month),
          getReservations(clinicId, serviceTypeId, year, month),
        ])

        if (slotsData.error) throw new Error(slotsData.error)
        if (reservationsData.error) throw new Error(reservationsData.error)

        setAvailableSlots(slotsData.data || [])
        setReservations(reservationsData.data || [])
      } catch (error) {
        console.error("Failed to fetch calendar data:", error)
        toast({
          title: "Error",
          description: "Failed to load calendar data. Please try again.",
          variant: "destructive",
        })
      }
    }

    fetchEvents()
  }, [clinicId, serviceTypeId, currentDate])

  const events = useMemo(() => {
    const allEvents: CalendarEvent[] = []

    const processEventData = (source: CalendarDataSource[], type: "available" | "reserved") => {
      const colors = {
        available: { bg: "#34d399", border: "#34d399" },
        reserved: { bg: "#f87171", border: "#f87171" },
      }

      source.forEach((item) => {
        try {
          if (!item.date || !item.start_time || !item.end_time) {
            console.warn(`Skipping item with missing data:`, item)
            return
          }

          const startTime = new Date(`${item.date}T${item.start_time}`)
          const endTime = new Date(`${item.date}T${item.end_time}`)

          if (isNaN(startTime.getTime()) || isNaN(endTime.getTime())) {
            console.error(`Skipping item with invalid time value. Input: ${item.date}T${item.start_time}`, item)
            return
          }

          allEvents.push({
            id: `${type}-${item.id}`,
            title: type.charAt(0).toUpperCase() + type.slice(1),
            start: startTime,
            end: endTime,
            backgroundColor: colors[type].bg,
            borderColor: colors[type].border,
            extendedProps: { type },
          })
        } catch (error) {
          console.error(`Error processing ${type} item, skipping:`, item, error)
        }
      })
    }

    processEventData(availableSlots, "available")
    processEventData(reservations, "reserved")

    return allEvents
  }, [availableSlots, reservations])

  const handleEventClick = (clickInfo: any) => {
    if (clickInfo.event.extendedProps.type === "available") {
      onSelectTime(clickInfo.event.start)
    } else {
      toast({
        title: "Slot Unavailable",
        description: "This time slot is already reserved.",
      })
    }
  }

  const handleDatesSet = (arg: any) => {
    setCurrentDate(arg.view.currentStart)
  }

  return (
    <div className="p-4 bg-white rounded-lg shadow">
      <FullCalendar
        plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
        initialView="timeGridWeek"
        headerToolbar={{
          left: "prev,next today",
          center: "title",
          right: "dayGridMonth,timeGridWeek,timeGridDay",
        }}
        events={events}
        eventClick={handleEventClick}
        datesSet={handleDatesSet}
        slotMinTime="09:00:00"
        slotMaxTime="21:00:00"
        allDaySlot={false}
        height="auto"
      />
    </div>
  )
}
