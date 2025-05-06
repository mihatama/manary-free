"use client"

import { useState, useEffect } from "react"
import {
  format,
  addMonths,
  subMonths,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  isToday,
  addDays,
} from "date-fns"
import { ja } from "date-fns/locale"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { ChevronLeft, ChevronRight, Clock } from "lucide-react"
import { getAvailableTimeSlots } from "@/app/actions/schedule-actions"
import { cn } from "@/lib/utils"
import { Skeleton } from "@/components/ui/skeleton"
import { useRouter } from "next/navigation"

interface ReservationCalendarProps {
  clinicId: number | null
  serviceTypeId: number | null
  onSelectDateTime?: (date: Date, startTime: string, endTime: string) => void
  selectedDate?: Date | null
  selectedTime?: { start: string; end: string } | null
}

export function ReservationCalendar({
  clinicId,
  serviceTypeId,
  onSelectDateTime,
  selectedDate,
  selectedTime,
}: ReservationCalendarProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [availableDates, setAvailableDates] = useState<string[]>([])
  const [isLoadingDates, setIsLoadingDates] = useState(false)
  const [calendarDays, setCalendarDays] = useState<Date[]>([])
  const [selectedDateInternal, setSelectedDateInternal] = useState<Date | null>(selectedDate || null)
  const [availableTimeSlots, setAvailableTimeSlots] = useState<
    { startTime: string; endTime: string; available: boolean }[]
  >([])
  const [isLoadingTimeSlots, setIsLoadingTimeSlots] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const router = useRouter()

  // カレンダーの日付を生成
  useEffect(() => {
    const start = startOfMonth(currentMonth)
    const end = endOfMonth(currentMonth)

    // 月の最初の日の曜日（0: 日曜日, 1: 月曜日, ...）
    const startDay = start.getDay()
    // 前月の日を追加
    const prevDays = Array.from({ length: startDay }).map((_, i) => addDays(start, -startDay + i))

    // 当月の日を追加
    const daysInMonth = eachDayOfInterval({ start, end })

    // 次月の日を追加（6週間分になるように）
    const totalDaysShown = 42 // 6週間 = 42日
    const nextDays = Array.from({ length: Math.max(0, totalDaysShown - prevDays.length - daysInMonth.length) }).map(
      (_, i) => addDays(end, i + 1),
    )

    setCalendarDays([...prevDays, ...daysInMonth, ...nextDays])
  }, [currentMonth])

  // 利用可能な日付を取得
  useEffect(() => {
    if (!clinicId || !serviceTypeId) return

    const fetchAvailableDates = async () => {
      try {
        setIsLoadingDates(true)
        setError(null)

        const start = format(startOfMonth(currentMonth), "yyyy-MM-dd")
        const end = format(endOfMonth(currentMonth), "yyyy-MM-dd")

        // 本来はAPIから利用可能な日付を取得する
        // ここでは仮のデータを使用
        const response = await fetch(
          `/api/available-dates?clinicId=${clinicId}&serviceTypeId=${serviceTypeId}&start=${start}&end=${end}`,
        )

        if (!response.ok) {
          throw new Error("利用可能な日付の取得に失敗しました")
        }

        const data = await response.json()
        setAvailableDates(data.availableDates)
      } catch (err) {
        console.error("利用可能な日付の取得エラー:", err)
        setError("利用可能な日付の取得に失敗しました")
      } finally {
        setIsLoadingDates(false)
      }
    }

    fetchAvailableDates()
  }, [clinicId, serviceTypeId, currentMonth])

  // 選択された日付の利用可能な時間枠を取得
  useEffect(() => {
    if (!clinicId || !serviceTypeId || !selectedDateInternal) return

    const fetchTimeSlots = async () => {
      try {
        setIsLoadingTimeSlots(true)
        setError(null)

        const formattedDate = format(selectedDateInternal, "yyyy-MM-dd")
        const slots = await getAvailableTimeSlots(serviceTypeId, formattedDate)
        setAvailableTimeSlots(slots)
      } catch (err) {
        console.error("時間枠取得エラー:", err)
        setError("利用可能な時間枠の取得に失敗しました")
      } finally {
        setIsLoadingTimeSlots(false)
      }
    }

    fetchTimeSlots()
  }, [clinicId, serviceTypeId, selectedDateInternal])

  // 前月へ
  const goToPreviousMonth = () => {
    setCurrentMonth(subMonths(currentMonth, 1))
  }

  // 次月へ
  const goToNextMonth = () => {
    setCurrentMonth(addMonths(currentMonth, 1))
  }

  // 日付を選択
  const handleSelectDate = (date: Date) => {
    setSelectedDateInternal(date)
  }

  // 時間枠を選択
  const handleSelectTimeSlot = (startTime: string, endTime: string) => {
    if (onSelectDateTime && selectedDateInternal) {
      onSelectDateTime(selectedDateInternal, startTime, endTime)
    } else {
      // 直接予約フローに進む
      if (selectedDateInternal) {
        const formattedDate = format(selectedDateInternal, "yyyy-MM-dd")
        router.push(
          `/reservation/new?clinicId=${clinicId}&serviceTypeId=${serviceTypeId}&date=${formattedDate}&startTime=${startTime}&endTime=${endTime}`,
        )
      }
    }
  }

  // 日付が予約可能かどうかを判定
  const isDateAvailable = (date: Date) => {
    const formattedDate = format(date, "yyyy-MM-dd")
    return availableDates.includes(formattedDate)
  }

  // 今日より前の日付かどうかを判定
  const isPastDate = (date: Date) => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    return date < today
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">予約カレンダー</h3>
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm" onClick={goToPreviousMonth}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-sm font-medium">{format(currentMonth, "yyyy年M月", { locale: ja })}</span>
          <Button variant="outline" size="sm" onClick={goToNextMonth}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {error && <div className="text-sm text-red-500">{error}</div>}

      <div className="grid grid-cols-1 md:grid-cols-7 gap-4">
        <div className="hidden md:grid md:grid-cols-7 md:col-span-7 gap-1 mb-1">
          {["日", "月", "火", "水", "木", "金", "土"].map((day, i) => (
            <div
              key={i}
              className={cn(
                "text-center text-sm font-medium h-8 flex items-center justify-center",
                i === 0 ? "text-red-500" : i === 6 ? "text-blue-500" : "text-gray-500",
              )}
            >
              {day}
            </div>
          ))}
        </div>

        {isLoadingDates
          ? // ローディング状態
            Array.from({ length: 42 }).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)
          : // カレンダー表示
            calendarDays.map((date, i) => {
              const isCurrentMonth = isSameMonth(date, currentMonth)
              const isSelected = selectedDateInternal ? isSameDay(date, selectedDateInternal) : false
              const isAvailable = isDateAvailable(date) && !isPastDate(date)
              const isTodayDate = isToday(date)
              const dayOfWeek = date.getDay()

              return (
                <Button
                  key={i}
                  variant="outline"
                  className={cn(
                    "h-10 w-full relative",
                    !isCurrentMonth && "text-gray-300",
                    isSelected && "bg-manary-pink text-white hover:bg-manary-pink hover:text-white",
                    isAvailable &&
                      !isSelected &&
                      "border-manary-pink text-manary-pink hover:bg-manary-pink hover:text-white",
                    !isAvailable && "cursor-not-allowed opacity-50",
                    isTodayDate && !isSelected && "border-blue-500",
                    dayOfWeek === 0 && "text-red-500",
                    dayOfWeek === 6 && "text-blue-500",
                  )}
                  disabled={!isAvailable}
                  onClick={() => isAvailable && handleSelectDate(date)}
                >
                  <span className="text-sm">{format(date, "d")}</span>
                  {isAvailable && (
                    <span className="absolute bottom-1 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-manary-pink rounded-full"></span>
                  )}
                </Button>
              )
            })}
      </div>

      {selectedDateInternal && (
        <Card className="mt-4">
          <CardContent className="p-4">
            <h4 className="text-base font-medium mb-2">
              {format(selectedDateInternal, "yyyy年MM月dd日(EEE)", { locale: ja })}の予約可能時間
            </h4>

            {isLoadingTimeSlots ? (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {Array.from({ length: 8 }).map((_, i) => (
                  <Skeleton key={i} className="h-10 w-full" />
                ))}
              </div>
            ) : availableTimeSlots.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {availableTimeSlots.map((slot, i) => (
                  <Button
                    key={i}
                    variant="outline"
                    className={cn(
                      "border-manary-pink text-manary-pink hover:bg-manary-pink hover:text-white",
                      selectedTime && selectedTime.start === slot.startTime && "bg-manary-pink text-white",
                    )}
                    onClick={() => handleSelectTimeSlot(slot.startTime, slot.endTime)}
                  >
                    <Clock className="h-3 w-3 mr-1" />
                    {slot.startTime}
                  </Button>
                ))}
              </div>
            ) : (
              <div className="text-center py-4 text-gray-500">予約可能な時間がありません</div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
