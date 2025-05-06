"use client"

import { useState, useEffect } from "react"
import { Plus, Trash2, Clock, ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { format, addMonths, subMonths } from "date-fns"
import { ja } from "date-fns/locale"
import {
  getAvailabilitySettings,
  upsertAvailabilitySetting,
  deleteAvailabilitySetting,
} from "@/app/actions/schedule-actions"
import type { Database } from "@/lib/supabase/database.types"
import { useCSRF } from "@/hooks/use-csrf"

type ServiceType = Database["public"]["Tables"]["service_types"]["Row"]
type AvailabilitySetting = Database["public"]["Tables"]["availability_settings"]["Row"]

interface AvailabilitySchedulerProps {
  serviceType: ServiceType | null
}

const DAYS_OF_WEEK = [
  { value: 0, label: "日曜日" },
  { value: 1, label: "月曜日" },
  { value: 2, label: "火曜日" },
  { value: 3, label: "水曜日" },
  { value: 4, label: "木曜日" },
  { value: 5, label: "金曜日" },
  { value: 6, label: "土曜日" },
]

const DAYS_OF_WEEK_SHORT = ["日", "月", "火", "水", "木", "金", "土"]

const TIME_OPTIONS = Array.from({ length: 24 * 4 }).map((_, i) => {
  const hour = Math.floor(i / 4)
  const minute = (i % 4) * 15
  return {
    value: `${hour.toString().padStart(2, "0")}:${minute.toString().padStart(2, "0")}`,
    label: `${hour.toString().padStart(2, "0")}:${minute.toString().padStart(2, "0")}`,
  }
})

// SimpleCalendarコンポーネントを更新して折りたたみ機能を追加します
function SimpleCalendar({
  selectedDate,
  onSelectDate,
  disablePastDates = true,
}: {
  selectedDate: Date | undefined
  onSelectDate: (date: Date) => void
  disablePastDates?: boolean
}) {
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [isOpen, setIsOpen] = useState(false)

  // 月を前後に移動する関数
  const goToPreviousMonth = () => setCurrentMonth(subMonths(currentMonth, 1))
  const goToNextMonth = () => setCurrentMonth(addMonths(currentMonth, 1))

  // 現在の月のカレンダーデータを生成
  const generateCalendarDays = () => {
    const year = currentMonth.getFullYear()
    const month = currentMonth.getMonth()

    // 月の最初の日
    const firstDayOfMonth = new Date(year, month, 1)
    // 月の最後の日
    const lastDayOfMonth = new Date(year, month + 1, 0)

    // 最初の日の曜日（0: 日曜日, 1: 月曜日, ...）
    const firstDayOfWeek = firstDayOfMonth.getDay()

    // カレンダーに表示する日数（前月の日 + 当月の日 + 次月の日）
    const daysInMonth = lastDayOfMonth.getDate()

    // 前月の日を追加
    const prevMonthDays = []
    for (let i = 0; i < firstDayOfWeek; i++) {
      const day = new Date(year, month, 0 - i)
      prevMonthDays.unshift(day)
    }

    // 当月の日を追加
    const currentMonthDays = []
    for (let i = 1; i <= daysInMonth; i++) {
      currentMonthDays.push(new Date(year, month, i))
    }

    // 次月の日を追加（6週間分になるように）
    const nextMonthDays = []
    const totalDays = prevMonthDays.length + currentMonthDays.length
    const remainingDays = 42 - totalDays // 6週間 = 42日

    for (let i = 1; i <= remainingDays; i++) {
      nextMonthDays.push(new Date(year, month + 1, i))
    }

    return [...prevMonthDays, ...currentMonthDays, ...nextMonthDays]
  }

  const calendarDays = generateCalendarDays()

  // 日付が選択可能かどうかを判定
  const isDateDisabled = (date: Date) => {
    if (!disablePastDates) return false

    const today = new Date()
    today.setHours(0, 0, 0, 0)
    return date < today
  }

  // 日付が現在の月かどうかを判定
  const isCurrentMonth = (date: Date) => {
    return date.getMonth() === currentMonth.getMonth()
  }

  // 日付が選択されているかどうかを判定
  const isSelected = (date: Date) => {
    if (!selectedDate) return false
    return (
      date.getDate() === selectedDate.getDate() &&
      date.getMonth() === selectedDate.getMonth() &&
      date.getFullYear() === selectedDate.getFullYear()
    )
  }

  // カレンダーを開閉するトグル関数
  const toggleCalendar = () => {
    setIsOpen(!isOpen)
  }

  // 日付を選択したときの処理
  const handleSelectDate = (date: Date) => {
    onSelectDate(date)
    setIsOpen(false) // 日付を選択したらカレンダーを閉じる
  }

  return (
    <div className="w-full max-w-sm">
      <button
        onClick={toggleCalendar}
        className="w-full flex items-center justify-between p-2 border rounded-md bg-white hover:bg-gray-50"
      >
        <span>{selectedDate ? format(selectedDate, "yyyy年MM月dd日", { locale: ja }) : "日付を選択"}</span>
        <ChevronRight className={`h-4 w-4 transition-transform ${isOpen ? "rotate-90" : ""}`} />
      </button>

      {isOpen && (
        <div className="mt-1 border rounded-md overflow-hidden bg-white shadow-md">
          <div className="p-2 bg-gray-50 flex justify-between items-center">
            <div className="font-medium">{format(currentMonth, "yyyy年M月", { locale: ja })}</div>
            <div className="flex space-x-1">
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={goToPreviousMonth}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={goToNextMonth}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="p-2">
            <div className="grid grid-cols-7 gap-1 mb-1">
              {DAYS_OF_WEEK_SHORT.map((day, index) => (
                <div
                  key={index}
                  className="text-center text-sm font-medium text-gray-500 h-8 flex items-center justify-center"
                >
                  {day}
                </div>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-1">
              {calendarDays.map((date, index) => (
                <button
                  key={index}
                  className={`
                    h-8 w-full flex items-center justify-center rounded-sm text-sm
                    ${isSelected(date) ? "bg-blue-500 text-white" : ""}
                    ${!isCurrentMonth(date) ? "text-gray-400" : ""}
                    ${isDateDisabled(date) ? "opacity-50 cursor-not-allowed" : "hover:bg-gray-100"}
                  `}
                  onClick={() => !isDateDisabled(date) && handleSelectDate(date)}
                  disabled={isDateDisabled(date)}
                >
                  {date.getDate()}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {selectedDate && (
        <div className="mt-2 text-sm">終了日: {format(selectedDate, "yyyy年MM月dd日", { locale: ja })}</div>
      )}
    </div>
  )
}

export function AvailabilityScheduler({ serviceType }: AvailabilitySchedulerProps) {
  const [availabilitySettings, setAvailabilitySettings] = useState<AvailabilitySetting[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<string>("weekly")

  // 曜日ベースの設定用の状態
  const [newDayOfWeek, setNewDayOfWeek] = useState<string>("1") // デフォルトは月曜日
  const [newStartTime, setNewStartTime] = useState<string>("09:00")
  const [newEndTime, setNewEndTime] = useState<string>("17:00")
  const [weeklyEndDate, setWeeklyEndDate] = useState<Date | undefined>(undefined)

  // 特定日付ベースの設定用の状態
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined)
  const [specificStartTime, setSpecificStartTime] = useState<string>("09:00")
  const [specificEndTime, setSpecificEndTime] = useState<string>("17:00")

  const [isAdding, setIsAdding] = useState(false)

  const { csrfToken, isLoading: isLoadingCSRF, error: csrfError } = useCSRF()

  useEffect(() => {
    if (!serviceType) return

    async function loadAvailabilitySettings() {
      try {
        setIsLoading(true)
        const data = await getAvailabilitySettings(serviceType.id)
        setAvailabilitySettings(data)
      } catch (err) {
        setError("予約可能時間の読み込みに失敗しました")
        console.error(err)
      } finally {
        setIsLoading(false)
      }
    }

    loadAvailabilitySettings()
  }, [serviceType])

  // 曜日ベースの予約可能時間を追加
  const handleAddWeeklyAvailability = async () => {
    if (!serviceType) return

    try {
      setIsAdding(true)

      if (!csrfToken) {
        setError("セキュリティトークンが利用できません。ページを再読み込みしてください。")
        return
      }

      const dayOfWeekNum = Number.parseInt(newDayOfWeek)

      // 時間の検証
      if (newStartTime >= newEndTime) {
        setError("開始時間は終了時間より前である必要があります")
        return
      }

      // 重複チェック
      const hasOverlap = availabilitySettings.some(
        (setting) =>
          setting.day_of_week === dayOfWeekNum &&
          !setting.specific_date && // 曜日ベースの設定のみをチェック
          ((newStartTime >= setting.start_time && newStartTime < setting.end_time) ||
            (newEndTime > setting.start_time && newEndTime <= setting.end_time) ||
            (newStartTime <= setting.start_time && newEndTime >= setting.end_time)),
      )

      if (hasOverlap) {
        setError("選択した時間帯は既存の設定と重複しています")
        return
      }

      const formData = new FormData()
      formData.append("csrf_token", csrfToken)
      formData.append("service_type_id", serviceType.id.toString())
      formData.append("day_of_week", dayOfWeekNum.toString())
      formData.append("start_time", newStartTime)
      formData.append("end_time", newEndTime)
      formData.append("is_available", "true")

      // 終了日を追加
      if (weeklyEndDate) {
        console.log("Adding end date to form:", format(weeklyEndDate, "yyyy-MM-dd"))
        formData.append("end_date", format(weeklyEndDate, "yyyy-MM-dd"))
      }

      const newSetting = await upsertAvailabilitySetting(formData)
      setAvailabilitySettings([...availabilitySettings, newSetting])
      setError(null)

      // 成功メッセージを表示
      if (weeklyEndDate) {
        const endDateStr = format(weeklyEndDate, "yyyy年MM月dd日", { locale: ja })
        setError(
          `${DAYS_OF_WEEK.find((d) => d.value.toString() === newDayOfWeek)?.label}の予約枠を${endDateStr}まで追加しました`,
        )
        setTimeout(() => setError(null), 3000)
      } else {
        setError("予約枠を追加しました")
        setTimeout(() => setError(null), 3000)
      }
    } catch (err: any) {
      console.error("Availability setting error:", err)
      // エラーメッセージをより詳細に表示
      setError(`予約可能時間の追加に失敗しました: ${err.message || "不明なエラー"}`)
    } finally {
      setIsAdding(false)
    }
  }

  // 特定日付の予約可能時間を追加
  const handleAddSpecificDateAvailability = async () => {
    if (!serviceType || !selectedDate) return

    try {
      setIsAdding(true)

      if (!csrfToken) {
        setError("セキュリティトークンが利用できません。ページを再読み込みしてください。")
        return
      }

      // 時間の検証
      if (specificStartTime >= specificEndTime) {
        setError("開始時間は終了時間より前である必要があります")
        return
      }

      // 日付をYYYY-MM-DD形式に変換
      const formattedDate = format(selectedDate, "yyyy-MM-dd")

      // 重複チェック
      const hasOverlap = availabilitySettings.some(
        (setting) =>
          setting.specific_date === formattedDate && // 特定日付の設定のみをチェック
          ((specificStartTime >= setting.start_time && specificStartTime < setting.end_time) ||
            (specificEndTime > setting.start_time && specificEndTime <= setting.end_time) ||
            (specificStartTime <= setting.start_time && specificEndTime >= setting.end_time)),
      )

      if (hasOverlap) {
        setError("選択した時間帯は既存の設定と重複しています")
        return
      }

      const formData = new FormData()
      formData.append("csrf_token", csrfToken)
      formData.append("service_type_id", serviceType.id.toString())
      formData.append("day_of_week", new Date(selectedDate).getDay().toString()) // 曜日も設定
      formData.append("start_time", specificStartTime)
      formData.append("end_time", specificEndTime)
      formData.append("is_available", "true")
      formData.append("specific_date", formattedDate)

      const newSetting = await upsertAvailabilitySetting(formData)

      // 新しい設定を追加
      setAvailabilitySettings([...availabilitySettings, newSetting])
      setError(null)
    } catch (err) {
      console.error("Specific date availability setting error")
      setError("予約可能時間の追加に失敗しました。もう一度お試しください。")
    } finally {
      setIsAdding(false)
    }
  }

  const handleDeleteAvailability = async (id: number) => {
    try {
      if (!csrfToken) {
        setError("セキュリティトークンが利用できません。ページを再読み込みしてください。")
        return
      }

      const formData = new FormData()
      formData.append("csrf_token", csrfToken)
      formData.append("id", id.toString())

      await deleteAvailabilitySetting(formData)
      setAvailabilitySettings(availabilitySettings.filter((setting) => setting.id !== id))
    } catch (err) {
      console.error("Availability deletion error")
      setError("予約可能時間の削除に失敗しました。もう一度お試しください。")
    }
  }

  // 特定日付の設定を表示するための関数
  const getSpecificDateSettings = () => {
    // specific_dateがnullでない設定を取得し、日付でグループ化
    const specificDateSettings: Record<string, AvailabilitySetting[]> = {}

    availabilitySettings
      .filter((setting) => setting.specific_date)
      .forEach((setting) => {
        if (!specificDateSettings[setting.specific_date!]) {
          specificDateSettings[setting.specific_date!] = []
        }
        specificDateSettings[setting.specific_date!].push(setting)
      })

    // 日付の降順でソート
    return Object.entries(specificDateSettings).sort(
      ([dateA], [dateB]) => new Date(dateB).getTime() - new Date(dateA).getTime(),
    )
  }

  if (!serviceType) {
    return (
      <div className="text-center py-8 border rounded-lg bg-gray-50">
        <p className="text-gray-500">診療種別を選択してください</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium">
          <span style={{ color: serviceType.color }}>{serviceType.name}</span> の予約可能時間
        </h3>
      </div>

      {error && <div className="text-sm text-red-500">{error}</div>}

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-4">
          <TabsTrigger value="weekly">毎週の予約枠</TabsTrigger>
          <TabsTrigger value="specific">特定日の予約枠</TabsTrigger>
        </TabsList>

        <TabsContent value="weekly">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">新しい予約可能時間を追加（毎週）</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                <div>
                  <label className="text-sm font-medium mb-1 block">曜日</label>
                  <Select value={newDayOfWeek} onValueChange={setNewDayOfWeek}>
                    <SelectTrigger>
                      <SelectValue placeholder="曜日を選択" />
                    </SelectTrigger>
                    <SelectContent>
                      {DAYS_OF_WEEK.map((day) => (
                        <SelectItem key={day.value} value={day.value.toString()}>
                          {day.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">開始時間</label>
                  <Select value={newStartTime} onValueChange={setNewStartTime}>
                    <SelectTrigger>
                      <SelectValue placeholder="開始時間" />
                    </SelectTrigger>
                    <SelectContent>
                      {TIME_OPTIONS.map((time) => (
                        <SelectItem key={time.value} value={time.value}>
                          {time.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">終了時間</label>
                  <Select value={newEndTime} onValueChange={setNewEndTime}>
                    <SelectTrigger>
                      <SelectValue placeholder="終了時間" />
                    </SelectTrigger>
                    <SelectContent>
                      {TIME_OPTIONS.map((time) => (
                        <SelectItem key={time.value} value={time.value}>
                          {time.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                {/* 毎週の予約枠の部分を更新 */}
                {/* 「いつまで設定」の部分を更新します */}
                <div>
                  <label className="text-sm font-medium mb-1 block">いつまで設定</label>
                  <SimpleCalendar
                    selectedDate={weeklyEndDate}
                    onSelectDate={setWeeklyEndDate}
                    disablePastDates={true}
                  />
                </div>
                <div className="flex items-end">
                  <Button
                    onClick={handleAddWeeklyAvailability}
                    disabled={isAdding}
                    className="w-full bg-manary-pink hover:bg-[#f78989]"
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    追加
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="space-y-4 mt-6">
            <h4 className="text-base font-medium">毎週の予約可能時間</h4>

            {isLoading ? (
              <div className="text-sm text-gray-500">読み込み中...</div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {DAYS_OF_WEEK.map((day) => {
                  const daySettings = availabilitySettings
                    .filter((setting) => setting.day_of_week === day.value && !setting.specific_date)
                    .sort((a, b) => a.start_time.localeCompare(b.start_time))

                  if (daySettings.length === 0) return null

                  return (
                    <Card key={day.value}>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-base">{day.label}</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <ul className="space-y-2">
                          {daySettings.map((setting) => (
                            <li key={setting.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                              <div className="flex items-center">
                                <Clock className="h-4 w-4 mr-2 text-gray-500" />
                                <span>
                                  {setting.start_time.substring(0, 5)} - {setting.end_time.substring(0, 5)}
                                  {setting.end_date && (
                                    <span className="ml-2 text-xs text-gray-500">
                                      ({format(new Date(setting.end_date), "yyyy/MM/dd")}まで)
                                    </span>
                                  )}
                                </span>
                              </div>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-red-500"
                                onClick={() => handleDeleteAvailability(setting.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </li>
                          ))}
                        </ul>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            )}

            {availabilitySettings.filter((s) => !s.specific_date).length === 0 && !isLoading && (
              <div className="text-center py-8 border rounded-lg bg-gray-50">
                <p className="text-gray-500">毎週の予約可能時間が設定されていません</p>
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="specific">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">特定の日付の予約可能時間を追加</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {/* 特定日の予約枠の部分も同様に更新 */}
                <div>
                  <label className="text-sm font-medium mb-1 block">日付</label>
                  <SimpleCalendar selectedDate={selectedDate} onSelectDate={setSelectedDate} />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">開始時間</label>
                  <Select value={specificStartTime} onValueChange={setSpecificStartTime}>
                    <SelectTrigger>
                      <SelectValue placeholder="開始時間" />
                    </SelectTrigger>
                    <SelectContent>
                      {TIME_OPTIONS.map((time) => (
                        <SelectItem key={`specific-start-${time.value}`} value={time.value}>
                          {time.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">終了時間</label>
                  <Select value={specificEndTime} onValueChange={setSpecificEndTime}>
                    <SelectTrigger>
                      <SelectValue placeholder="終了時間" />
                    </SelectTrigger>
                    <SelectContent>
                      {TIME_OPTIONS.map((time) => (
                        <SelectItem key={`specific-end-${time.value}`} value={time.value}>
                          {time.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-end">
                  <Button
                    onClick={handleAddSpecificDateAvailability}
                    disabled={isAdding || !selectedDate}
                    className="w-full bg-manary-pink hover:bg-[#f78989]"
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    追加
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="space-y-4 mt-6">
            <h4 className="text-base font-medium">特定日の予約可能時間</h4>

            {isLoading ? (
              <div className="text-sm text-gray-500">読み込み中...</div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {getSpecificDateSettings().map(([date, settings]) => (
                  <Card key={date}>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base">
                        {format(new Date(date), "yyyy年MM月dd日(EEE)", { locale: ja })}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-2">
                        {settings
                          .sort((a, b) => a.start_time.localeCompare(b.start_time))
                          .map((setting) => (
                            <li key={setting.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                              <div className="flex items-center">
                                <Clock className="h-4 w-4 mr-2 text-gray-500" />
                                <span>
                                  {setting.start_time.substring(0, 5)} - {setting.end_time.substring(0, 5)}
                                </span>
                              </div>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-red-500"
                                onClick={() => handleDeleteAvailability(setting.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </li>
                          ))}
                      </ul>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            {availabilitySettings.filter((s) => s.specific_date).length === 0 && !isLoading && (
              <div className="text-center py-8 border rounded-lg bg-gray-50">
                <p className="text-gray-500">特定日の予約可能時間が設定されていません</p>
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
