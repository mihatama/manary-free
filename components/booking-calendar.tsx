"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { format, addDays, startOfWeek, addWeeks, subWeeks } from "date-fns"
import { ja } from "date-fns/locale"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, ChevronLeft, ChevronRight, Clock } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { getClinics, getServiceTypes } from "../app/actions/schedule-actions"
import { getAvailableTimeSlots, createBooking } from "../app/actions/booking-actions"
import { useCSRF } from "@/hooks/use-csrf"
import type { Database } from "@/lib/supabase/database.types"
import { cn } from "@/lib/utils"

type Clinic = Database["public"]["Tables"]["clinics"]["Row"]
type ServiceType = Database["public"]["Tables"]["service_types"]["Row"]

interface BookingCalendarProps {
  clinicId: number
}

export function BookingCalendar({ clinicId }: BookingCalendarProps) {
  const router = useRouter()
  const { csrfToken, isLoading: isLoadingCSRF, error: csrfError } = useCSRF()

  // 状態
  const [clinics, setClinics] = useState<Clinic[]>([])
  const [serviceTypes, setServiceTypes] = useState<ServiceType[]>([])
  const [selectedClinic, setSelectedClinic] = useState<number>(clinicId)
  const [selectedServiceType, setSelectedServiceType] = useState<number | null>(null)
  const [currentWeekStart, setCurrentWeekStart] = useState<Date>(startOfWeek(new Date(), { weekStartsOn: 1 }))
  const [availableSlotsByDate, setAvailableSlotsByDate] = useState<Record<string, { start: string; end: string }[]>>({})
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // 予約フォーム状態
  const [isBookingDialogOpen, setIsBookingDialogOpen] = useState(false)
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<string | null>(null)
  const [patientName, setPatientName] = useState("")
  const [patientEmail, setPatientEmail] = useState("")
  const [patientPhone, setPatientPhone] = useState("")
  const [notes, setNotes] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  // クリニック一覧を取得
  useEffect(() => {
    async function loadClinics() {
      try {
        setIsLoading(true)
        const data = await getClinics()
        setClinics(data)
      } catch (err) {
        setError("助産院の読み込みに失敗しました")
        console.error(err)
      } finally {
        setIsLoading(false)
      }
    }

    loadClinics()
  }, [])

  // 診療種別を取得
  useEffect(() => {
    if (!selectedClinic) return

    async function loadServiceTypes() {
      try {
        setIsLoading(true)
        const data = await getServiceTypes(selectedClinic)
        setServiceTypes(data)
        setSelectedServiceType(data.length > 0 ? data[0].id : null)
      } catch (err) {
        setError("診療種別の読み込みに失敗しました")
        console.error(err)
      } finally {
        setIsLoading(false)
      }
    }

    loadServiceTypes()
  }, [selectedClinic])

  // 選択された診療種別と週が変わったら予約可能時間を取得
  useEffect(() => {
    if (!selectedServiceType) return

    async function loadAvailableSlots() {
      try {
        setIsLoading(true)
        setError(null)
        const newAvailableSlots: Record<string, { start: string; end: string }[]> = {}

        // 1週間分の予約可能時間を取得
        for (let i = 0; i < 7; i++) {
          const date = addDays(currentWeekStart, i)
          const formattedDate = format(date, "yyyy-MM-dd")
          try {
            const slots = await getAvailableTimeSlots(selectedClinic, selectedServiceType, formattedDate)
            newAvailableSlots[formattedDate] = slots
          } catch (err) {
            console.error(`Error loading slots for ${formattedDate}:`, err)
            // エラーが発生した日付には空の配列を設定
            newAvailableSlots[formattedDate] = []
          }
        }

        setAvailableSlotsByDate(newAvailableSlots)
      } catch (err) {
        console.error("Error loading available slots:", err)
        setError("予約可能時間の読み込みに失敗しました。データベースが正しく設定されていない可能性があります。")
      } finally {
        setIsLoading(false)
      }
    }

    loadAvailableSlots()
  }, [selectedServiceType, currentWeekStart, selectedClinic])

  // 前の週へ
  const goToPreviousWeek = () => {
    setCurrentWeekStart(subWeeks(currentWeekStart, 1))
  }

  // 次の週へ
  const goToNextWeek = () => {
    setCurrentWeekStart(addWeeks(currentWeekStart, 1))
  }

  // 今週へ
  const goToCurrentWeek = () => {
    setCurrentWeekStart(startOfWeek(new Date(), { weekStartsOn: 1 }))
  }

  // 時間枠をクリックしたときの処理
  const handleTimeSlotClick = (date: Date, timeSlot: { start: string; end: string }) => {
    setSelectedDate(date)
    setSelectedTimeSlot(`${timeSlot.start} - ${timeSlot.end}`)
    setIsBookingDialogOpen(true)
  }

  // 予約フォームの送信
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!csrfToken) {
      setError("セキュリティトークンが利用できません。ページを再読み込みしてください。")
      return
    }

    if (
      !selectedClinic ||
      !selectedServiceType ||
      !selectedDate ||
      !selectedTimeSlot ||
      !patientName ||
      !patientPhone
    ) {
      setError("必須項目を入力してください")
      return
    }

    try {
      setIsSubmitting(true)
      setError(null)

      const formData = new FormData()
      formData.append("csrf_token", csrfToken)
      formData.append("clinic_id", selectedClinic.toString())
      formData.append("service_type_id", selectedServiceType.toString())
      formData.append("booking_date", format(selectedDate, "yyyy-MM-dd"))

      const [startTime, endTime] = selectedTimeSlot.split(" - ")
      formData.append("start_time", startTime)
      formData.append("end_time", endTime)

      formData.append("patient_name", patientName)
      formData.append("patient_email", patientEmail)
      formData.append("patient_phone", patientPhone)
      formData.append("notes", notes)

      const booking = await createBooking(formData)

      // 予約完了ページにリダイレクト
      router.push(`/booking/confirmation?token=${booking.access_token}`)
    } catch (err: any) {
      setError(err.message || "予約の作成に失敗しました")
      console.error(err)
    } finally {
      setIsSubmitting(false)
    }
  }

  // 曜日の配列
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(currentWeekStart, i))

  // 時間帯の表示（8時から20時まで）
  const timeLabels = Array.from({ length: 13 }, (_, i) => `${i + 8}:00`)

  return (
    <div className="p-4">
      <div className="mb-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex flex-col md:flex-row gap-4 w-full md:w-auto">
          <div className="w-full md:w-64">
            <Label htmlFor="clinic" className="mb-1 block">
              助産院
            </Label>
            <Select
              value={selectedClinic?.toString()}
              onValueChange={(value) => setSelectedClinic(Number(value))}
              disabled={isLoading}
            >
              <SelectTrigger>
                <SelectValue placeholder="助産院を選択" />
              </SelectTrigger>
              <SelectContent>
                {clinics.map((clinic) => (
                  <SelectItem key={clinic.id} value={clinic.id.toString()}>
                    {clinic.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="w-full md:w-64">
            <Label htmlFor="serviceType" className="mb-1 block">
              診療種別
            </Label>
            <Select
              value={selectedServiceType?.toString() || ""}
              onValueChange={(value) => setSelectedServiceType(Number(value))}
              disabled={isLoading || serviceTypes.length === 0}
            >
              <SelectTrigger>
                <SelectValue placeholder="診療種別を選択" />
              </SelectTrigger>
              <SelectContent>
                {serviceTypes.map((serviceType) => (
                  <SelectItem key={serviceType.id} value={serviceType.id.toString()}>
                    {serviceType.name} ({serviceType.duration}分)
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm" onClick={goToPreviousWeek} disabled={isLoading}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={goToCurrentWeek} disabled={isLoading}>
            今週
          </Button>
          <Button variant="outline" size="sm" onClick={goToNextWeek} disabled={isLoading}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {error && (
        <Alert variant="destructive" className="mb-4">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="relative">
        {isLoading && (
          <div className="absolute inset-0 bg-white/80 flex items-center justify-center z-10">
            <Loader2 className="h-8 w-8 animate-spin text-manary-pink" />
          </div>
        )}

        <div className="rounded-lg border overflow-hidden">
          {/* カレンダーヘッダー */}
          <div className="grid grid-cols-8 bg-gray-50 border-b">
            <div className="p-3 text-center font-medium text-gray-500 border-r"></div>
            {weekDays.map((day, index) => (
              <div
                key={index}
                className={cn(
                  "p-3 text-center font-medium border-r last:border-r-0",
                  format(day, "yyyy-MM-dd") === format(new Date(), "yyyy-MM-dd")
                    ? "bg-manary-pink/10 text-manary-pink"
                    : "text-gray-700",
                )}
              >
                <div>{format(day, "EEE", { locale: ja })}</div>
                <div className="text-lg">{format(day, "d")}</div>
              </div>
            ))}
          </div>

          {/* カレンダー本体 */}
          <div className="grid grid-cols-8">
            {/* 時間ラベル */}
            <div className="border-r">
              {timeLabels.map((time, index) => (
                <div
                  key={index}
                  className="h-16 flex items-center justify-center text-sm text-gray-500 border-b last:border-b-0"
                >
                  {time}
                </div>
              ))}
            </div>

            {/* 各日の予約枠 */}
            {weekDays.map((day, dayIndex) => {
              const formattedDate = format(day, "yyyy-MM-dd")
              const slots = availableSlotsByDate[formattedDate] || []

              return (
                <div key={dayIndex} className="border-r last:border-r-0">
                  {timeLabels.map((time, timeIndex) => {
                    const hour = Number.parseInt(time.split(":")[0])
                    const matchingSlots = slots.filter((slot) => {
                      const slotHour = Number.parseInt(slot.start.split(":")[0])
                      return slotHour === hour
                    })

                    return (
                      <div key={timeIndex} className="h-16 border-b last:border-b-0 p-1 relative">
                        {matchingSlots.map((slot, slotIndex) => (
                          <Button
                            key={slotIndex}
                            variant="outline"
                            size="sm"
                            className="w-full h-auto py-1 text-xs bg-manary-pink/10 text-manary-pink border-manary-pink hover:bg-manary-pink hover:text-white"
                            onClick={() => handleTimeSlotClick(day, slot)}
                          >
                            <Clock className="h-3 w-3 mr-1" />
                            {slot.start}〜{slot.end}
                          </Button>
                        ))}
                      </div>
                    )
                  })}
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* 予約ダイアログ */}
      <Dialog open={isBookingDialogOpen} onOpenChange={setIsBookingDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>予約情報の入力</DialogTitle>
            <DialogDescription>
              {selectedDate && selectedTimeSlot && (
                <span className="font-medium text-manary-pink">
                  {format(selectedDate, "yyyy年MM月dd日(EEE)", { locale: ja })} {selectedTimeSlot}
                </span>
              )}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="patientName">
                お名前 <span className="text-red-500">*</span>
              </Label>
              <Input
                id="patientName"
                value={patientName}
                onChange={(e) => setPatientName(e.target.value)}
                placeholder="例: 山田 花子"
                required
                disabled={isSubmitting}
              />
            </div>

            <div>
              <Label htmlFor="patientEmail">メールアドレス</Label>
              <Input
                id="patientEmail"
                type="email"
                value={patientEmail}
                onChange={(e) => setPatientEmail(e.target.value)}
                placeholder="例: example@email.com"
                disabled={isSubmitting}
              />
            </div>

            <div>
              <Label htmlFor="patientPhone">
                電話番号 <span className="text-red-500">*</span>
              </Label>
              <Input
                id="patientPhone"
                value={patientPhone}
                onChange={(e) => setPatientPhone(e.target.value)}
                placeholder="例: 090-1234-5678"
                required
                disabled={isSubmitting}
              />
            </div>

            <div>
              <Label htmlFor="notes">備考</Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="ご要望やご質問などがあればご記入ください"
                rows={3}
                disabled={isSubmitting}
              />
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsBookingDialogOpen(false)}
                disabled={isSubmitting}
              >
                キャンセル
              </Button>
              <Button
                type="submit"
                className="bg-manary-pink hover:bg-[#f78989]"
                disabled={isSubmitting || !patientName || !patientPhone}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    予約処理中...
                  </>
                ) : (
                  "予約する"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
