"use client"

import { useState, useEffect } from "react"
import { format, startOfMonth } from "date-fns"
import { ja } from "date-fns/locale"
import { Calendar } from "@/components/ui/calendar"
import { getReservationDatesForMonth } from "@/app/actions/reservation-actions"

interface AppointmentsCalendarProps {
  selectedDate: Date | undefined
  onDateChange: (date: Date | undefined) => void
}

export function AppointmentsCalendar({ selectedDate, onDateChange }: AppointmentsCalendarProps) {
  const [highlightedDays, setHighlightedDays] = useState<Date[]>([])
  const [currentMonth, setCurrentMonth] = useState(startOfMonth(new Date()))

  useEffect(() => {
    async function fetchReservationDates() {
      const monthStr = format(currentMonth, "yyyy-MM")
      const { dates, error } = await getReservationDatesForMonth(monthStr)
      if (error) {
        console.error(error)
        setHighlightedDays([])
      } else {
        const validDates = (dates || [])
          .map((dateStr) => {
            if (!dateStr) return null
            // Dates from DB are not in UTC, so parse them as local
            const [year, month, day] = dateStr.split("-").map(Number)
            return new Date(year, month - 1, day)
          })
          .filter((d): d is Date => d !== null)
        setHighlightedDays(validDates)
      }
    }
    fetchReservationDates()
  }, [currentMonth])

  const handleMonthChange = (month: Date) => {
    setCurrentMonth(startOfMonth(month))
  }

  const handleSelect = (day: Date | undefined) => {
    // If the same day is clicked again, deselect it
    if (day && selectedDate && day.getTime() === selectedDate.getTime()) {
      onDateChange(undefined)
    } else {
      onDateChange(day)
    }
  }

  const dayWithReservationStyle = {
    backgroundColor: "hsl(var(--primary) / 0.1)",
    border: "1px solid hsl(var(--primary) / 0.3)",
  }

  return (
    <Calendar
      mode="single"
      selected={selectedDate}
      onSelect={handleSelect}
      onMonthChange={handleMonthChange}
      className="rounded-md border"
      locale={ja}
      modifiers={{
        hasReservation: highlightedDays,
      }}
      modifiersStyles={{
        hasReservation: dayWithReservationStyle,
      }}
    />
  )
}
