"use client"

import { useState, useEffect } from "react"
import { Plus, Trash2, Clock, CalendarIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { format } from "date-fns"
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

const TIME_OPTIONS = Array.from({ length: 24 * 4 }).map((_, i) => {
  const hour = Math.floor(i / 4)
  const minute = (i % 4) * 15
  return {
    value: `${hour.toString().padStart(2, "0")}:${minute.toString().padStart(2, "0")}`,
    label: `${hour.toString().padStart(2, "0")}:${minute.toString().padStart(2, "0")}`,
  }
})

export function AvailabilityScheduler({ serviceType }: AvailabilitySchedulerProps) {
  const [availabilitySettings, setAvailabilitySettings] = useState<AvailabilitySetting[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<string>("weekly")

  // 曜日ベースの設定用の状態
  const [newDayOfWeek, setNewDayOfWeek] = useState<string>("1") // デフォルトは月曜日
  const [newStartTime, setNewStartTime] = useState<string>("09:00")
  const [newEndTime, setNewEndTime] = useState<string>("17:00")

  // 特定日付ベースの設定用の状態
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined)
  const [specificStartTime, setSpecificStartTime] = useState<string>("09:00")
  const [specificEndTime, setSpecificEndTime] = useState<string>("17:00")
  const [isCalendarOpen, setIsCalendarOpen] = useState(false)

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
      // specific_dateはnullのままで送信

      const newSetting = await upsertAvailabilitySetting(formData)
      setAvailabilitySettings([...availabilitySettings, newSetting])
      setError(null)
    } catch (err) {
      console.error("Availability setting error")
      setError("予約可能時間の追加に失敗しました。もう一度お試しください。")
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

      // デバッグ用
      console.log("特定日の予約枠を追加:", formattedDate, specificStartTime, specificEndTime)

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
      console.log("追加された特定日の設定:", newSetting) // デバッグ用

      // 新しい設定を追加
      setAvailabilitySettings([...availabilitySettings, newSetting])
      setSelectedDate(undefined) // 日付選択をリセット
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
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
                <div>
                  <label className="text-sm font-medium mb-1 block">日付</label>
                  <div className="relative">
                    <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className="w-full justify-start text-left font-normal"
                          onClick={() => setIsCalendarOpen(true)}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {selectedDate ? (
                            format(selectedDate, "yyyy年MM月dd日", { locale: ja })
                          ) : (
                            <span>日付を選択</span>
                          )}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={selectedDate}
                          onSelect={(date) => {
                            setSelectedDate(date)
                            setIsCalendarOpen(false)
                          }}
                          initialFocus
                          locale={ja}
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
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
