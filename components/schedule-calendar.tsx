"use client"

import React from "react"
import { Calendar, momentLocalizer } from "react-big-calendar"
import moment from "moment"
import "react-big-calendar/lib/css/react-big-calendar.css"
import type { CalendarEvent } from "@/types"
import { getContrastYIQ } from "@/lib/utils"

interface ScheduleCalendarProps {
  events: CalendarEvent[]
}

const localizer = momentLocalizer(moment)

export const ScheduleCalendar: React.FC<ScheduleCalendarProps> = ({ events }) => {
  const eventPropGetter = React.useCallback(
    (event: CalendarEvent) => ({
      style: {
        backgroundColor: event.color || "#3174ad",
        color: getContrastYIQ(event.color),
        borderRadius: "5px",
        border: "none",
        padding: "2px 5px",
      },
    }),
    [],
  )

  return (
    <div className="h-full w-full">
      <Calendar
        localizer={localizer}
        events={events}
        startAccessor="start"
        endAccessor="end"
        style={{ height: "100%" }}
        eventPropGetter={eventPropGetter}
      />
    </div>
  )
}
