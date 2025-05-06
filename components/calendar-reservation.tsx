"use client"

import { useState, useEffect } from "react"
import { format, addDays, startOfWeek, addWeeks, subWeeks, isSameDay } from "date-fns"
import { ja } from "date-fns/locale"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ChevronLeft, ChevronRight, Clock } from "lucide-react"
import { getAvailableTimeSlots } from "@/app/actions/schedule-actions"
import { Skeleton } from "@/components/ui/skeleton"
import { useCSRF } from "@/hooks/use-csrf"

interface CalendarReservationProps {
  clinicId: number
  serviceTypeId: number
  onSelectDateTime: (date: Date, startTime: string, endTime: string) => void
}

export function CalendarReservation({ clinicId, serviceTypeId, onSelectDateTime }: CalendarReservationProps) {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [availableTimeSlots, setAvailableTimeSlots] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<{ startTime: string; endTime: string } | null>(null)
  const [weekStart, setWeekStart] = useState(startOfWeek(currentDate, { weekStartsOn: 0 }))

  const { csrfToken } = useCSRF()

  // 週の日付を生成
  const weekDays = Array.from({ length: 7 }).map((_, i) => addDays(weekStart, i))

  // 前の週へ
  const goToPreviousWeek = () => {
    const newWeekStart = subWeeks(weekStart, 1)
    setWeekStart(newWeekStart)
  }

  // 次の週へ
  const goToNextWeek = () => {
    const newWeekStart = addWeeks(weekStart, 1)
    setWeekStart(newWeekStart)
  }

  // 今日へ
  const goToToday = () => {
    const today = new Date()
    setWeekStart(startOfWeek(today, { weekStartsOn: 0 }))
  }

  // 日付が選択されたときの処理
  const handleDateSelect = (date: Date) => {
    setSelectedDate(date)
    setSelectedTimeSlot(null)
  }

  // 時間枠が選択されたときの処理
  const handleTimeSlotSelect = (startTime: string, endTime: string) => {
    if (selectedDate) {
      setSelectedTimeSlot({ startTime, endTime })
      onSelectDateTime(selectedDate, startTime, endTime)
    }
  }

  // 選択された日付の利用可能な時間枠を取得
  useEffect(() => {
    if (!selectedDate || !clinicId || !serviceTypeId) return

    const fetchTimeSlots = async () => {
      try {
        setIsLoading(true)
        const formattedDate = format(selectedDate, "yyyy-MM-dd")

        // CSRFトークンがある場合はフォームデータに追加
        const formData = new FormData()
        if (csrfToken) {
          formData.append("csrf_token", csrfToken)
        }
        formData.append("service_type_id", serviceTypeId.toString())
        formData.append("date", formattedDate)

        // 関数呼び出しを修正
        const slots = await getAvailableTimeSlots(formData)
        setAvailableTimeSlots(slots)
      } catch (error) {
        console.error("時間枠取得エラー:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchTimeSlots()
  }, [selectedDate, clinicId, serviceTypeId, csrfToken])

  // 日付が今日以前かどうかをチェック
  const isPastDate = (date: Date) => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    return date < today
  }

  // 日付に利用可能な時間枠があるかどうかをチェック
  const hasAvailableSlots = (date: Date) => {
    // 実際には、この日付の利用可能な時間枠を事前に取得する必要があります
    // ここでは、デモのために単純化しています
    return !isPastDate(date)
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">予約カレンダー</h3>
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm" onClick={goToPreviousWeek}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={goToToday}>
            今日
          </Button>
          <Button variant="outline" size="sm" onClick={goToNextWeek}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-center text-base">{format(weekStart, "yyyy年MM月", { locale: ja })}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-7 gap-1">
            {/* 曜日ヘッダー */}
            {["日", "月", "火", "水", "木", "金", "土"].map((day, index) => (
              <div
                key={`header-${index}`}
                className={`text-center py-2 font-medium text-sm ${
                  index === 0 ? "text-red-500" : index === 6 ? "text-blue-500" : ""
                }`}
              >
                {day}
              </div>
            ))}

            {/* 日付 */}
            {weekDays.map((date, index) => {
              const isSelected = selectedDate && isSameDay(date, selectedDate)
              const isDisabled = isPastDate(date)
              const hasSlots = hasAvailableSlots(date)

              return (
                <div
                  key={`day-${index}`}
                  className={`
                    relative h-14 border rounded-md p-1 
                    ${isSelected ? "border-manary-pink bg-pink-50" : "border-gray-200"} 
                    ${isDisabled ? "bg-gray-100 opacity-50" : ""}
                    ${!isDisabled && !isSelected ? "hover:border-manary-pink hover:bg-pink-50" : ""}
                  `}
                  onClick={() => !isDisabled && handleDateSelect(date)}
                >
                  <div
                    className={`text-right text-sm font-medium ${
                      index === 0 ? "text-red-500" : index === 6 ? "text-blue-500" : ""
                    }`}
                  >
                    {format(date, "d")}
                  </div>
                  {hasSlots && !isDisabled && (
                    <div className="absolute bottom-1 left-0 right-0 flex justify-center">
                      <div className="h-1.5 w-1.5 rounded-full bg-manary-pink"></div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {selectedDate && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">
              {format(selectedDate, "yyyy年MM月dd日(EEE)", { locale: ja })}の予約可能時間
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-2">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
              </div>
            ) : availableTimeSlots.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                {availableTimeSlots.map((slot, index) => (
                  <Button
                    key={index}
                    variant={selectedTimeSlot?.startTime === slot.startTime ? "default" : "outline"}
                    className={`
                      flex items-center justify-center
                      ${selectedTimeSlot?.startTime === slot.startTime ? "bg-manary-pink hover:bg-[#f78989]" : ""}
                    `}
                    onClick={() => handleTimeSlotSelect(slot.startTime, slot.endTime)}
                  >
                    <Clock className="h-3.5 w-3.5 mr-1" />
                    {slot.startTime}
                  </Button>
                ))}
              </div>
            ) : (
              <div className="text-center py-4 text-gray-500">この日に予約可能な時間はありません</div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
