"use client"

import { useState, useEffect } from "react"
import { Calendar, momentLocalizer, type SlotInfo } from "react-big-calendar"
import moment from "moment"
import "moment/locale/ja"
import "react-big-calendar/lib/css/react-big-calendar.css"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight, Info } from "lucide-react"
import {
  getServiceTypes,
  getAvailabilitySettings,
  upsertAvailabilitySetting,
  deleteAvailabilitySetting,
} from "@/app/actions/schedule-actions"
import type { Database } from "@/lib/supabase/database.types"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useCSRF } from "@/hooks/use-csrf"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { CalendarIcon } from "lucide-react"
import { format } from "date-fns"
import { ja } from "date-fns/locale"
import { Switch } from "@/components/ui/switch"

// 日本語ロケールを設定
moment.locale("ja")
const localizer = momentLocalizer(moment)

type ServiceType = Database["public"]["Tables"]["service_types"]["Row"]
type AvailabilitySetting = Database["public"]["Tables"]["availability_settings"]["Row"]
type Clinic = Database["public"]["Tables"]["clinics"]["Row"]

interface ScheduleCalendarProps {
  clinicId: number | null
}

// カレンダーイベントの型定義
interface CalendarEvent {
  id: string
  title: string
  start: Date
  end: Date
  serviceTypeId: number
  color: string
  availabilityId?: number // 既存の予約可能時間ID
  isRecurring: boolean // 定期的な予約可能時間かどうか
  dayOfWeek: number // 曜日（0: 日曜日, 1: 月曜日, ...）
  specificDate?: string // 特定の日付
}

// 時間オプションの生成
const TIME_OPTIONS = Array.from({ length: 24 * 4 }).map((_, i) => {
  const hour = Math.floor(i / 4)
  const minute = (i % 4) * 15
  return {
    value: `${hour.toString().padStart(2, "0")}:${minute.toString().padStart(2, "0")}`,
    label: `${hour.toString().padStart(2, "0")}:${minute.toString().padStart(2, "0")}`,
  }
})

export function ScheduleCalendar({ clinicId }: ScheduleCalendarProps) {
  const [serviceTypes, setServiceTypes] = useState<ServiceType[]>([])
  const [availabilitySettings, setAvailabilitySettings] = useState<AvailabilitySetting[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [currentDate, setCurrentDate] = useState(new Date())
  const [events, setEvents] = useState<CalendarEvent[]>([])
  const [selectedServiceTypes, setSelectedServiceTypes] = useState<number[]>([])

  // 編集ダイアログの状態
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isNewEventDialogOpen, setIsNewEventDialogOpen] = useState(false)
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null)
  const [newEventSlot, setNewEventSlot] = useState<SlotInfo | null>(null)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)

  // 編集フォームの状態
  const [editServiceTypeId, setEditServiceTypeId] = useState<string>("")
  const [editStartTime, setEditStartTime] = useState<string>("")
  const [editEndTime, setEditEndTime] = useState<string>("")
  const [editIsRecurring, setEditIsRecurring] = useState<boolean>(true)
  const [editSpecificDate, setEditSpecificDate] = useState<Date | undefined>(undefined)

  const { csrfToken, isLoading: isLoadingCSRF, error: csrfError } = useCSRF()

  // 診療種別を取得
  useEffect(() => {
    if (!clinicId) return

    async function loadServiceTypes() {
      try {
        setIsLoading(true)
        const data = await getServiceTypes(clinicId)
        setServiceTypes(data)
        // 初期状態ですべての診療種別を選択
        setSelectedServiceTypes(data.map((st) => st.id))
      } catch (err) {
        setError("診療種別の読み込みに失敗しました")
        console.error(err)
      } finally {
        setIsLoading(false)
      }
    }

    loadServiceTypes()
  }, [clinicId])

  // 選択された診療種別の予約可能時間を取得
  useEffect(() => {
    async function loadAllAvailabilitySettings() {
      if (!selectedServiceTypes.length) {
        setAvailabilitySettings([])
        return
      }

      try {
        setIsLoading(true)
        const allSettings: AvailabilitySetting[] = []

        // 選択された各診療種別の予約可能時間を取得
        for (const serviceTypeId of selectedServiceTypes) {
          const settings = await getAvailabilitySettings(serviceTypeId)
          allSettings.push(...settings)
        }

        // 完全に新しい配列で置き換え、古いデータを残さない
        setAvailabilitySettings(allSettings)
      } catch (err) {
        setError("予約可能時間の読み込みに失敗しました")
        console.error(err)
      } finally {
        setIsLoading(false)
      }
    }

    loadAllAvailabilitySettings()
  }, [selectedServiceTypes])

  // カレンダーイベントを生成
  useEffect(() => {
    if (!availabilitySettings.length) {
      setEvents([])
      return
    }

    // 現在の月の最初と最後の日を取得
    const firstDay = moment(currentDate).startOf("month").toDate()
    const lastDay = moment(currentDate).endOf("month").toDate()

    // 新しいイベント配列を作成（古いイベントは完全に破棄）
    const newEvents: CalendarEvent[] = []

    // 特定の日付の設定を先に処理
    const specificDateSettings = availabilitySettings.filter((setting) => setting.specific_date)

    // デバッグ用
    console.log("特定日の設定数:", specificDateSettings.length)
    if (specificDateSettings.length > 0) {
      console.log("特定日の設定例:", specificDateSettings[0])
    }

    specificDateSettings.forEach((setting) => {
      const serviceType = serviceTypes.find((st) => st.id === setting.service_type_id)
      if (!serviceType) return

      // 日付文字列を確実にパースするためにmomentを使用
      const specificDate = moment(setting.specific_date).toDate()

      // デバッグ用
      console.log("処理中の特定日:", setting.specific_date, "パース結果:", specificDate)

      // 現在の月の範囲内かチェック
      if (specificDate >= firstDay && specificDate <= lastDay) {
        // 開始時間と終了時間を解析
        const [startHour, startMinute] = setting.start_time.split(":").map(Number)
        const [endHour, endMinute] = setting.end_time.split(":").map(Number)

        // イベントの開始時間と終了時間を設定
        const start = moment(specificDate).hour(startHour).minute(startMinute).second(0).toDate()
        const end = moment(specificDate).hour(endHour).minute(endMinute).second(0).toDate()

        // 一意のIDを生成
        const uniqueId = `specific-${setting.id}`

        newEvents.push({
          id: uniqueId,
          title: `${serviceType.name} (特別設定)`,
          start,
          end,
          serviceTypeId: serviceType.id,
          color: serviceType.color,
          availabilityId: setting.id,
          isRecurring: false,
          dayOfWeek: specificDate.getDay(),
          specificDate: setting.specific_date,
        })

        // デバッグ用
        console.log("特定日のイベントを追加:", start, end, serviceType.name)
      }
    })

    // 曜日ベースの設定を処理
    const weeklySettings = availabilitySettings.filter((setting) => !setting.specific_date)

    // 現在の月の各日について
    for (let day = moment(firstDay); day.isSameOrBefore(lastDay); day.add(1, "days")) {
      const dayOfWeek = day.day() // 0: 日曜日, 1: 月曜日, ...
      const currentDateStr = day.format("YYYY-MM-DD")

      // その日に特定の日付設定があるかチェック
      const hasSpecificDateSetting = specificDateSettings.some((setting) => setting.specific_date === currentDateStr)

      // 特定の日付設定がない場合のみ、曜日ベースの設定を適用
      if (!hasSpecificDateSetting) {
        // その曜日の予約可能時間を取得
        const daySettings = weeklySettings.filter((setting) => setting.day_of_week === dayOfWeek)

        // 各予約可能時間をイベントに変換
        daySettings.forEach((setting) => {
          const serviceType = serviceTypes.find((st) => st.id === setting.service_type_id)
          if (!serviceType) return

          // 終了日のチェックを追加
          if (setting.end_date && new Date(setting.end_date) < day.toDate()) {
            return // 終了日を過ぎている場合はスキップ
          }

          // 開始時間と終了時間を解析
          const [startHour, startMinute] = setting.start_time.split(":").map(Number)
          const [endHour, endMinute] = setting.end_time.split(":").map(Number)

          // イベントの開始時間と終了時間を設定
          const start = moment(day).hour(startHour).minute(startMinute).second(0).toDate()
          const end = moment(day).hour(endHour).minute(endMinute).second(0).toDate()

          // 一意のIDを生成して重複を防ぐ
          const uniqueId = `weekly-${setting.id}-${day.format("YYYY-MM-DD")}`

          newEvents.push({
            id: uniqueId,
            title: serviceType.name,
            start,
            end,
            serviceTypeId: serviceType.id,
            color: serviceType.color,
            availabilityId: setting.id,
            isRecurring: true,
            dayOfWeek: dayOfWeek,
          })
        })
      }
    }

    // 完全に新しい配列で置き換え
    setEvents(newEvents)
  }, [availabilitySettings, currentDate, serviceTypes])

  // 診療種別の選択を切り替える
  const toggleServiceType = (serviceTypeId: number) => {
    setSelectedServiceTypes((prev) => {
      if (prev.includes(serviceTypeId)) {
        return prev.filter((id) => id !== serviceTypeId)
      } else {
        return [...prev, serviceTypeId]
      }
    })
  }

  // カスタムイベントスタイル
  const eventStyleGetter = (event: CalendarEvent) => {
    // 特定日付の設定は少し濃い色で表示
    const backgroundColor = event.specificDate ? event.color : `${event.color}CC` // CCは透明度80%

    return {
      style: {
        backgroundColor,
        borderRadius: "4px",
        opacity: 0.8,
        color: "#fff",
        border: "0px",
        display: "block",
        cursor: "pointer",
      },
    }
  }

  // 前月へ
  const goToPreviousMonth = () => {
    setCurrentDate((prev) => moment(prev).subtract(1, "month").toDate())
  }

  // 次月へ
  const goToNextMonth = () => {
    setCurrentDate((prev) => moment(prev).add(1, "month").toDate())
  }

  // 今月へ
  const goToToday = () => {
    setCurrentDate(new Date())
  }

  // イベントクリック時のハンドラー
  const handleSelectEvent = (event: CalendarEvent) => {
    setSelectedEvent(event)
    setEditServiceTypeId(event.serviceTypeId.toString())
    setEditStartTime(moment(event.start).format("HH:mm"))
    setEditEndTime(moment(event.end).format("HH:mm"))
    setEditIsRecurring(event.isRecurring)

    if (event.specificDate) {
      setEditSpecificDate(new Date(event.specificDate))
    } else {
      setEditSpecificDate(undefined)
    }

    setIsEditDialogOpen(true)
  }

  // 空白部分クリック時のハンドラー（新規作成用）
  const handleSelectSlot = (slotInfo: SlotInfo) => {
    setNewEventSlot(slotInfo)

    // デフォルト値を設定
    const startTime = moment(slotInfo.start).format("HH:mm")
    const endTime = moment(slotInfo.end).format("HH:mm")

    setEditServiceTypeId(serviceTypes.length > 0 ? serviceTypes[0].id.toString() : "")
    setEditStartTime(startTime)
    setEditEndTime(endTime)
    setEditIsRecurring(true)
    setEditSpecificDate(new Date(slotInfo.start))

    setIsNewEventDialogOpen(true)
  }

  // 予約可能時間の更新
  const handleUpdateAvailability = async () => {
    if (!selectedEvent || !csrfToken) return

    try {
      const formData = new FormData()
      formData.append("csrf_token", csrfToken)

      // 既存の予約可能時間を削除する
      if (selectedEvent.availabilityId) {
        const deleteFormData = new FormData()
        deleteFormData.append("csrf_token", csrfToken)
        deleteFormData.append("id", selectedEvent.availabilityId.toString())

        // 古い設定を削除
        await deleteAvailabilitySetting(deleteFormData)
      }

      // 新しい予約可能時間を作成する
      formData.append("service_type_id", editServiceTypeId)

      if (editIsRecurring) {
        // 曜日ベースの設定
        formData.append("day_of_week", selectedEvent.dayOfWeek.toString())
        // specific_dateは送信しない
      } else {
        // 特定日付の設定
        if (!editSpecificDate) {
          setError("日付を選択してください")
          return
        }
        formData.append("day_of_week", editSpecificDate.getDay().toString())
        formData.append("specific_date", format(editSpecificDate, "yyyy-MM-dd"))
      }

      formData.append("start_time", editStartTime)
      formData.append("end_time", editEndTime)
      formData.append("is_available", "true")

      await upsertAvailabilitySetting(formData)

      // 全ての選択された診療種別の予約可能時間を再読み込み
      const allSettings: AvailabilitySetting[] = []
      for (const serviceTypeId of selectedServiceTypes) {
        const settings = await getAvailabilitySettings(serviceTypeId)
        allSettings.push(...settings)
      }

      // 完全に新しい配列で置き換え
      setAvailabilitySettings(allSettings)

      setIsEditDialogOpen(false)
    } catch (err) {
      console.error("Failed to update availability", err)
      setError("予約可能時間の更新に失敗しました")
    }
  }

  // 予約可能時間の削除
  const handleDeleteAvailability = async () => {
    if (!selectedEvent?.availabilityId || !csrfToken) return

    try {
      const formData = new FormData()
      formData.append("csrf_token", csrfToken)
      formData.append("id", selectedEvent.availabilityId.toString())

      await deleteAvailabilitySetting(formData)

      // 全ての選択された診療種別の予約可能時間を再読み込み
      const allSettings: AvailabilitySetting[] = []
      for (const serviceTypeId of selectedServiceTypes) {
        const settings = await getAvailabilitySettings(serviceTypeId)
        allSettings.push(...settings)
      }

      // 完全に新しい配列で置き換え
      setAvailabilitySettings(allSettings)

      setIsDeleteDialogOpen(false)
      setIsEditDialogOpen(false)
    } catch (err) {
      console.error("Failed to delete availability", err)
      setError("予約可能時間の削除に失敗しました")
    }
  }

  // 新しい予約可能時間の作成
  const handleCreateAvailability = async () => {
    if (!newEventSlot || !csrfToken) return

    try {
      const formData = new FormData()
      formData.append("csrf_token", csrfToken)
      formData.append("service_type_id", editServiceTypeId)

      if (editIsRecurring) {
        // 曜日ベースの設定
        const dayOfWeek = moment(newEventSlot.start).day()
        formData.append("day_of_week", dayOfWeek.toString())
        // specific_dateは送信しない
      } else {
        // 特定日付の設定
        if (!editSpecificDate) {
          setError("日付を選択してください")
          return
        }
        formData.append("day_of_week", editSpecificDate.getDay().toString())
        formData.append("specific_date", format(editSpecificDate, "yyyy-MM-dd"))
      }

      formData.append("start_time", editStartTime)
      formData.append("end_time", editEndTime)
      formData.append("is_available", "true")

      await upsertAvailabilitySetting(formData)

      // 全ての選択された診療種別の予約可能時間を再読み込み
      const allSettings: AvailabilitySetting[] = []
      for (const serviceTypeId of selectedServiceTypes) {
        const settings = await getAvailabilitySettings(serviceTypeId)
        allSettings.push(...settings)
      }

      // 完全に新しい配列で置き換え
      setAvailabilitySettings(allSettings)

      setIsNewEventDialogOpen(false)
    } catch (err) {
      console.error("Failed to create availability", err)
      setError("予約可能時間の作成に失敗しました")
    }
  }

  if (!clinicId) {
    return (
      <div className="text-center py-8 border rounded-lg bg-gray-50">
        <p className="text-gray-500">助産院を選択してください</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">予約可能時間カレンダー</h3>
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm" onClick={goToPreviousMonth}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={goToToday}>
            今月
          </Button>
          <Button variant="outline" size="sm" onClick={goToNextMonth}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {error && (
        <Alert variant="destructive" className="mb-4">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="md:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">診療種別</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="text-sm text-gray-500">読み込み中...</div>
              ) : (
                <div className="space-y-2">
                  {serviceTypes.map((serviceType) => (
                    <div key={serviceType.id} className="flex items-center">
                      <input
                        type="checkbox"
                        id={`service-type-${serviceType.id}`}
                        checked={selectedServiceTypes.includes(serviceType.id)}
                        onChange={() => toggleServiceType(serviceType.id)}
                        className="mr-2 rounded border-gray-300 text-manary-pink focus:ring-manary-pink"
                      />
                      <label htmlFor={`service-type-${serviceType.id}`} className="flex items-center text-sm">
                        <span
                          className="inline-block w-3 h-3 mr-2 rounded-full"
                          style={{ backgroundColor: serviceType.color }}
                        />
                        {serviceType.name}
                      </label>
                    </div>
                  ))}

                  {serviceTypes.length === 0 && (
                    <div className="text-sm text-gray-500">診療種別が登録されていません</div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-100">
            <div className="flex items-start">
              <Info className="h-5 w-5 text-blue-500 mr-2 mt-0.5" />
              <div className="text-sm text-blue-700">
                <p className="font-medium mb-1">カレンダーの操作方法</p>
                <ul className="list-disc pl-5 space-y-1">
                  <li>イベントをクリックして編集</li>
                  <li>空白部分をクリックして新規作成</li>
                  <li>左側のチェックボックスで表示を切り替え</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        <div className="md:col-span-3">
          <Card>
            <CardContent className="p-4">
              <div style={{ height: "600px" }}>
                <Calendar
                  localizer={localizer}
                  events={events}
                  startAccessor="start"
                  endAccessor="end"
                  style={{ height: "100%" }}
                  date={currentDate}
                  onNavigate={(date) => setCurrentDate(date)}
                  views={["month", "week", "day"]}
                  defaultView="month"
                  eventPropGetter={eventStyleGetter}
                  onSelectEvent={handleSelectEvent}
                  onSelectSlot={handleSelectSlot}
                  selectable={true}
                  formats={{
                    monthHeaderFormat: "YYYY年M月",
                    weekdayFormat: "ddd",
                    dayHeaderFormat: "M月D日(ddd)",
                    dayRangeHeaderFormat: ({ start, end }) =>
                      `${moment(start).format("YYYY年M月D日")} - ${moment(end).format("M月D日")}`,
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
                    noEventsInRange: "この期間に予約可能な時間はありません",
                    showMore: (total) => `他 ${total} 件`,
                  }}
                />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* 編集ダイアログ */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>予約可能時間を編集</DialogTitle>
            <DialogDescription>選択した予約可能時間の詳細を編集できます。</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-service-type">診療種別</Label>
              <Select value={editServiceTypeId} onValueChange={setEditServiceTypeId}>
                <SelectTrigger>
                  <SelectValue placeholder="診療種別を選択" />
                </SelectTrigger>
                <SelectContent>
                  {serviceTypes.map((serviceType) => (
                    <SelectItem key={serviceType.id} value={serviceType.id.toString()}>
                      {serviceType.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="edit-is-recurring">繰り返し設定</Label>
                <div className="flex items-center space-x-2">
                  <Switch id="edit-is-recurring" checked={editIsRecurring} onCheckedChange={setEditIsRecurring} />
                  <Label htmlFor="edit-is-recurring" className="text-sm">
                    {editIsRecurring ? "毎週繰り返す" : "特定の日付のみ"}
                  </Label>
                </div>
              </div>
            </div>

            {!editIsRecurring && (
              <div className="space-y-2">
                <Label htmlFor="edit-specific-date">日付</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      id="edit-specific-date"
                      variant="outline"
                      className="w-full justify-start text-left font-normal"
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {editSpecificDate ? (
                        format(editSpecificDate, "yyyy年MM月dd日", { locale: ja })
                      ) : (
                        <span>日付を選択</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={editSpecificDate}
                      onSelect={setEditSpecificDate}
                      initialFocus
                      locale={ja}
                    />
                  </PopoverContent>
                </Popover>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-start-time">開始時間</Label>
                <Select value={editStartTime} onValueChange={setEditStartTime}>
                  <SelectTrigger>
                    <SelectValue placeholder="開始時間" />
                  </SelectTrigger>
                  <SelectContent>
                    {TIME_OPTIONS.map((time) => (
                      <SelectItem key={`start-${time.value}`} value={time.value}>
                        {time.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-end-time">終了時間</Label>
                <Select value={editEndTime} onValueChange={setEditEndTime}>
                  <SelectTrigger>
                    <SelectValue placeholder="終了時間" />
                  </SelectTrigger>
                  <SelectContent>
                    {TIME_OPTIONS.map((time) => (
                      <SelectItem key={`end-${time.value}`} value={time.value}>
                        {time.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter className="flex justify-between">
            <Button variant="destructive" onClick={() => setIsDeleteDialogOpen(true)}>
              削除
            </Button>
            <div className="space-x-2">
              <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                キャンセル
              </Button>
              <Button onClick={handleUpdateAvailability} className="bg-manary-pink hover:bg-[#f78989]">
                更新
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 削除確認ダイアログ */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>予約可能時間を削除</AlertDialogTitle>
            <AlertDialogDescription>
              この予約可能時間を削除してもよろしいですか？この操作は元に戻せません。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>キャンセル</AlertDialogCancel>
            <AlertDialogAction className="bg-red-500 hover:bg-red-600" onClick={handleDeleteAvailability}>
              削除
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* 新規作成ダイアログ */}
      <Dialog open={isNewEventDialogOpen} onOpenChange={setIsNewEventDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>新しい予約可能時間</DialogTitle>
            <DialogDescription>新しい予約可能時間の詳細を入力してください。</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="new-service-type">診療種別</Label>
              <Select value={editServiceTypeId} onValueChange={setEditServiceTypeId}>
                <SelectTrigger>
                  <SelectValue placeholder="診療種別を選択" />
                </SelectTrigger>
                <SelectContent>
                  {serviceTypes.map((serviceType) => (
                    <SelectItem key={serviceType.id} value={serviceType.id.toString()}>
                      {serviceType.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="new-is-recurring">繰り返し設定</Label>
                <div className="flex items-center space-x-2">
                  <Switch id="new-is-recurring" checked={editIsRecurring} onCheckedChange={setEditIsRecurring} />
                  <Label htmlFor="new-is-recurring" className="text-sm">
                    {editIsRecurring ? "毎週繰り返す" : "特定の日付のみ"}
                  </Label>
                </div>
              </div>
            </div>

            {!editIsRecurring && (
              <div className="space-y-2">
                <Label htmlFor="new-specific-date">日付</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      id="new-specific-date"
                      variant="outline"
                      className="w-full justify-start text-left font-normal"
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {editSpecificDate ? (
                        format(editSpecificDate, "yyyy年MM月dd日", { locale: ja })
                      ) : (
                        <span>日付を選択</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={editSpecificDate}
                      onSelect={setEditSpecificDate}
                      initialFocus
                      locale={ja}
                    />
                  </PopoverContent>
                </Popover>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="new-start-time">開始時間</Label>
                <Select value={editStartTime} onValueChange={setEditStartTime}>
                  <SelectTrigger>
                    <SelectValue placeholder="開始時間" />
                  </SelectTrigger>
                  <SelectContent>
                    {TIME_OPTIONS.map((time) => (
                      <SelectItem key={`new-start-${time.value}`} value={time.value}>
                        {time.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="new-end-time">終了時間</Label>
                <Select value={editEndTime} onValueChange={setEditEndTime}>
                  <SelectTrigger>
                    <SelectValue placeholder="終了時間" />
                  </SelectTrigger>
                  <SelectContent>
                    {TIME_OPTIONS.map((time) => (
                      <SelectItem key={`new-end-${time.value}`} value={time.value}>
                        {time.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsNewEventDialogOpen(false)}>
              キャンセル
            </Button>
            <Button onClick={handleCreateAvailability} className="bg-manary-pink hover:bg-[#f78989]">
              作成
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
