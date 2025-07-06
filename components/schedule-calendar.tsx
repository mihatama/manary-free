"use client"

import { useState, useEffect, useMemo } from "react"
import { Calendar, dateFnsLocalizer, type Event as BigCalendarEvent, type View } from "react-big-calendar"
import { format, parse, startOfWeek, getDay } from "date-fns"
import { ja } from "date-fns/locale"
import "react-big-calendar/lib/css/react-big-calendar.css"
import { getScheduleEventsForMonth, getServiceTypes } from "@/app/actions/schedule-actions"
import { Button } from "@/components/ui/button"
import { Check, ChevronLeft, ChevronRight, ChevronsUpDown, Loader2 } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Badge } from "@/components/ui/badge"
import type { Database } from "@/lib/supabase/database.types"

type ServiceType = Database["public"]["Tables"]["service_types"]["Row"]

const locales = {
  ja: ja,
}

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek: (date) => startOfWeek(date, { locale: ja }),
  getDay,
  locales,
})

interface ScheduleCalendarEvent extends BigCalendarEvent {
  isAvailable: boolean
  isSpecificDate: boolean
  color: string | null
}

interface ScheduleCalendarProps {
  clinicId: number | null
}

// Helper to parse ISO string robustly
const parseISO = (isoString: string | null): Date | null => {
  if (!isoString) return null
  const date = new Date(isoString)
  if (isNaN(date.getTime())) {
    console.error(`[ScheduleCalendar:parseISO] FAILED: Invalid Date for string: '${isoString}'`)
    return null
  }
  return date
}

const CustomToolbar = ({ label, onNavigate, onView, view, views }: any) => {
  const viewNames: { [key: string]: string } = {
    month: "月",
    week: "週",
    day: "日",
  }

  return (
    <div className="flex flex-col sm:flex-row justify-between items-center mb-4 gap-2">
      <div className="flex items-center space-x-2">
        <Button variant="outline" size="sm" onClick={() => onNavigate("PREV")}>
          <ChevronLeft className="h-4 w-4" />
          <span className="sr-only">前へ</span>
        </Button>
        <Button variant="outline" size="sm" onClick={() => onNavigate("TODAY")}>
          今日
        </Button>
        <Button variant="outline" size="sm" onClick={() => onNavigate("NEXT")}>
          <ChevronRight className="h-4 w-4" />
          <span className="sr-only">次へ</span>
        </Button>
      </div>
      <div className="text-lg font-bold order-first sm:order-none">{label}</div>
      <div className="flex items-center space-x-2">
        {(views as View[]).map((v) => (
          <Button key={v} variant={view === v ? "default" : "outline"} size="sm" onClick={() => onView(v)}>
            {viewNames[v]}
          </Button>
        ))}
      </div>
    </div>
  )
}

export function ScheduleCalendar({ clinicId }: ScheduleCalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [events, setEvents] = useState<ScheduleCalendarEvent[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [memoizedEvents, setMemoizedEvents] = useState<{ [key: string]: ScheduleCalendarEvent[] }>({})

  const [allServiceTypes, setAllServiceTypes] = useState<ServiceType[]>([])
  const [selectedServiceTypeIds, setSelectedServiceTypeIds] = useState<number[]>([])
  const [isFilterLoading, setIsFilterLoading] = useState(false)

  // Fetch all service types for the filter dropdown
  useEffect(() => {
    if (!clinicId) {
      setAllServiceTypes([])
      setSelectedServiceTypeIds([])
      return
    }

    const fetchServiceTypesForFilter = async () => {
      setIsFilterLoading(true)
      setError(null)
      try {
        const types = await getServiceTypes(clinicId)
        setAllServiceTypes(types)
        // By default, select all
        setSelectedServiceTypeIds(types.map((t) => t.id))
      } catch (error) {
        console.error("Failed to fetch service types for filter", error)
        setError("診療種別のフィルタの読み込みに失敗しました。")
      } finally {
        setIsFilterLoading(false)
      }
    }

    fetchServiceTypesForFilter()
  }, [clinicId])

  // Fetch calendar events when dependencies change
  useEffect(() => {
    if (!clinicId) {
      setEvents([])
      return
    }

    if (isFilterLoading) return

    if (selectedServiceTypeIds.length === 0) {
      setEvents([])
      return
    }

    const fetchEvents = async () => {
      const monthStr = format(currentDate, "yyyy-MM")
      const cacheKey = `${monthStr}-${selectedServiceTypeIds.sort().join(",")}`

      if (memoizedEvents[cacheKey]) {
        setEvents(memoizedEvents[cacheKey])
        return
      }

      setIsLoading(true)
      setError(null)
      try {
        const result = await getScheduleEventsForMonth(clinicId, monthStr, selectedServiceTypeIds)
        if (result.error) {
          throw new Error(result.error)
        }

        const processedEvents: ScheduleCalendarEvent[] = (result.events || [])
          .map((event) => {
            const startDate = parseISO(event.start)
            const endDate = parseISO(event.end)

            if (!startDate || !endDate) {
              console.error("[ScheduleCalendar] Skipping invalid event due to date parsing failure:", event)
              return null
            }

            return {
              ...event,
              start: startDate,
              end: endDate,
            }
          })
          .filter((e): e is ScheduleCalendarEvent => e !== null)

        setMemoizedEvents((prev) => ({ ...prev, [cacheKey]: processedEvents }))
        setEvents(processedEvents)
      } catch (err: any) {
        setError(err.message || "カレンダーの読み込みに失敗しました。")
        console.error(err)
      } finally {
        setIsLoading(false)
      }
    }

    fetchEvents()
  }, [clinicId, currentDate, memoizedEvents, selectedServiceTypeIds, isFilterLoading])

  const eventStyleGetter = (event: ScheduleCalendarEvent) => {
    const backgroundColor = event.color || (event.isAvailable ? "#a8d8ea" : "#f5c0c0")
    const textColor = "#212529"

    const style = {
      backgroundColor,
      borderRadius: "5px",
      opacity: event.isSpecificDate ? 1 : 0.7,
      color: textColor,
      border: event.isSpecificDate ? "2px solid #333" : "0px",
      display: "block",
      padding: "2px 5px",
    }
    return { style }
  }

  const selectedServiceTypes = useMemo(
    () => allServiceTypes.filter((st) => selectedServiceTypeIds.includes(st.id)),
    [allServiceTypes, selectedServiceTypeIds],
  )

  if (!clinicId) return <p>助産院を選択してください。</p>

  return (
    <div className="space-y-4">
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="flex flex-col sm:flex-row gap-4 items-center p-4 border rounded-md bg-gray-50">
        <span className="font-medium text-sm shrink-0">表示する診療種別:</span>
        <div className="flex-grow">
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" role="combobox" className="w-full sm:w-[400px] justify-between bg-transparent">
                <div className="flex gap-1 flex-wrap">
                  {isFilterLoading ? (
                    <span className="text-muted-foreground text-sm">読み込み中...</span>
                  ) : selectedServiceTypes.length > 0 ? (
                    selectedServiceTypes.length === allServiceTypes.length ? (
                      <span className="text-muted-foreground">すべて選択</span>
                    ) : (
                      selectedServiceTypes.map((st) => (
                        <Badge variant="secondary" key={st.id} style={{ backgroundColor: st.color, color: "white" }}>
                          {st.name}
                        </Badge>
                      ))
                    )
                  ) : (
                    "診療種別を選択..."
                  )}
                </div>
                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[400px] p-0">
              <Command>
                <CommandInput placeholder="診療種別を検索..." />
                <CommandList>
                  <CommandEmpty>見つかりません。</CommandEmpty>
                  <CommandGroup>
                    {allServiceTypes.map((st) => (
                      <CommandItem
                        key={st.id}
                        onSelect={() => {
                          const newSelection = selectedServiceTypeIds.includes(st.id)
                            ? selectedServiceTypeIds.filter((id) => id !== st.id)
                            : [...selectedServiceTypeIds, st.id]
                          setSelectedServiceTypeIds(newSelection)
                        }}
                      >
                        <Check
                          className={`mr-2 h-4 w-4 ${
                            selectedServiceTypeIds.includes(st.id) ? "opacity-100" : "opacity-0"
                          }`}
                        />
                        <div className="flex items-center">
                          <span
                            className="w-3 h-3 rounded-full mr-2"
                            style={{ backgroundColor: st.color || "#ccc" }}
                          ></span>
                          {st.name}
                        </div>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
        </div>
        <div className="flex gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSelectedServiceTypeIds(allServiceTypes.map((st) => st.id))}
            disabled={isFilterLoading || selectedServiceTypeIds.length === allServiceTypes.length}
          >
            すべて選択
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSelectedServiceTypeIds([])}
            disabled={isFilterLoading || selectedServiceTypeIds.length === 0}
          >
            すべて解除
          </Button>
        </div>
      </div>

      {isLoading && (
        <div className="flex justify-center items-center p-4">
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          カレンダーを読み込み中...
        </div>
      )}
      <div style={{ height: "700px" }} className={isLoading ? "opacity-50" : ""}>
        <Calendar
          localizer={localizer}
          events={events}
          startAccessor="start"
          endAccessor="end"
          style={{ height: "100%" }}
          date={currentDate}
          onNavigate={(date) => setCurrentDate(date)}
          views={["month", "week", "day"]}
          defaultView="week"
          eventPropGetter={eventStyleGetter}
          culture="ja"
          components={{
            toolbar: CustomToolbar,
          }}
          formats={{
            monthHeaderFormat: (date) => format(date, "yyyy年M月", { locale: ja }),
            weekdayFormat: (date) => format(date, "E", { locale: ja }),
            dayHeaderFormat: (date) => format(date, "M月d日(E)", { locale: ja }),
            timeGutterFormat: (date) => format(date, "H:mm", { locale: ja }),
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
            noEventsInRange: "この期間に設定はありません",
            showMore: (total) => `他 ${total} 件`,
          }}
        />
      </div>
    </div>
  )
}
