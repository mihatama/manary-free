"use client"

import { useState } from "react"
import { Calendar } from "@/components/ui/calendar"
import { Button } from "@/components/ui/button"
import { format, addDays } from "date-fns"
import { ja } from "date-fns/locale"

interface TimeSlot {
  startTime: string
  endTime: string
  available: boolean
}

interface CalendarTimePickerProps {
  selectedDate: Date | null
  onDateChange: (date: Date) => void
  selectedTime: string | null
  onTimeChange: (time: string) => void
  availableTimeSlots: TimeSlot[]
  serviceTypeId: number | null
}

export function CalendarTimePicker({
  selectedDate,
  onDateChange,
  selectedTime,
  onTimeChange,
  availableTimeSlots,
  serviceTypeId,
}: CalendarTimePickerProps) {
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date())

  // 今日から3ヶ月先までの日付を許可
  const disabledDays = {
    before: new Date(),
    after: addDays(new Date(), 90),
  }

  return (
    <div className="space-y-4">
      <div className="border rounded-md p-3">
        <Calendar
          mode="single"
          selected={selectedDate}
          onSelect={(date) => date && onDateChange(date)}
          disabled={disabledDays}
          locale={ja}
          onMonthChange={setCurrentMonth}
          className="rounded-md"
        />
      </div>

      {selectedDate && availableTimeSlots.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-sm font-medium">
            {format(selectedDate, "yyyy年MM月dd日(EEE)", { locale: ja })}の予約可能時間
          </h3>
          <div className="grid grid-cols-3 gap-2">
            {availableTimeSlots.map((slot, index) => (
              <Button
                key={index}
                variant={selectedTime === slot.startTime ? "default" : "outline"}
                className={selectedTime === slot.startTime ? "bg-[#f8a0a0] hover:bg-[#f78989]" : ""}
                onClick={() => onTimeChange(slot.startTime)}
              >
                {slot.startTime}
              </Button>
            ))}
          </div>
        </div>
      )}

      {selectedDate && availableTimeSlots.length === 0 && (
        <div className="text-center p-4 border rounded-md bg-gray-50">
          <p className="text-gray-500">この日に利用可能な時間枠はありません</p>
        </div>
      )}
    </div>
  )
}
