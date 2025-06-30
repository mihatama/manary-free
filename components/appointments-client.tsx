"use client"

import type React from "react"

import { useState, useEffect, useTransition, useCallback } from "react"
import type { Tables } from "@/lib/supabase/database.types"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { BreastCareChart } from "./breast-care-chart"
import { PostpartumCareChart } from "./postpartum-care-chart"
import { ArrowUpDown, Search } from "lucide-react"
import { Input } from "@/components/ui/input"
import { getAppointments } from "@/app/actions/reservation-actions"
import { useDebounce } from "use-debounce"

type AppointmentWithDetails = Tables<"appointments"> & {
  questionnaires: Tables<"questionnaires"> | null
  service_types: Tables<"service_types"> | null
  clinics: Tables<"clinics"> | null
}

type Appointment = Awaited<ReturnType<typeof getAppointments>>[0]

type SortKey = keyof Appointment | "patient_name"

interface AppointmentsClientProps {
  initialAppointments: Appointment[]
  user: {
    id: string
    name: string | null
    email: string | undefined
  }
}

export function AppointmentsClient({ initialAppointments, user }: AppointmentsClientProps) {
  const [appointments, setAppointments] = useState(initialAppointments)
  const [selectedAppointment, setSelectedAppointment] = useState<AppointmentWithDetails | null>(null)
  const [isDetailsOpen, setIsDetailsOpen] = useState(false)
  const [activeChart, setActiveChart] = useState<"breast" | "postpartum" | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [debouncedSearchTerm] = useDebounce(searchTerm, 500)
  const [sortConfig, setSortConfig] = useState<{ key: SortKey; direction: "asc" | "desc" } | null>({
    key: "date",
    direction: "desc",
  })
  const [isPending, startTransition] = useTransition()

  const fetchAppointments = useCallback(() => {
    startTransition(async () => {
      const data = await getAppointments({
        query: debouncedSearchTerm,
        sortBy: sortConfig?.key,
        sortOrder: sortConfig?.direction,
      })
      setAppointments(data)
    })
  }, [debouncedSearchTerm, sortConfig])

  useEffect(() => {
    fetchAppointments()
  }, [fetchAppointments])

  const handleViewDetails = (appointment: AppointmentWithDetails) => {
    setSelectedAppointment(appointment)
    setIsDetailsOpen(true)
  }

  const handleCloseDetails = () => {
    setIsDetailsOpen(false)
    setSelectedAppointment(null)
  }

  const handleOpenChart = (chartType: "breast" | "postpartum", appointment: AppointmentWithDetails) => {
    setSelectedAppointment(appointment)
    setActiveChart(chartType)
  }

  const handleCloseChart = () => {
    setActiveChart(null)
    setSelectedAppointment(null)
  }

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString)
      return date.toLocaleDateString("ja-JP", {
        year: "numeric",
        month: "long",
        day: "numeric",
        weekday: "short",
      })
    } catch (error) {
      return dateString
    }
  }

  const formatTime = (timeString: string) => {
    try {
      return timeString.substring(0, 5)
    } catch (error) {
      return timeString
    }
  }

  const handleSort = (key: SortKey) => {
    let direction: "asc" | "desc" = "asc"
    if (sortConfig && sortConfig.key === key && sortConfig.direction === "asc") {
      direction = "desc"
    }
    setSortConfig({ key, direction })
  }

  const SortableHeader = ({ sortKey, children }: { sortKey: SortKey; children: React.ReactNode }) => (
    <Button variant="ghost" onClick={() => handleSort(sortKey)} className="px-0">
      {children}
      {sortConfig?.key === sortKey ? (
        <ArrowUpDown className="ml-2 h-4 w-4" />
      ) : (
        <ArrowUpDown className="ml-2 h-4 w-4 opacity-0" />
      )}
    </Button>
  )

  const renderChart = () => {
    if (!selectedAppointment) return null

    switch (activeChart) {
      case "breast":
        return <BreastCareChart appointment={selectedAppointment} onClose={handleCloseChart} user={user} />
      case "postpartum":
        return <PostpartumCareChart appointment={selectedAppointment} onClose={handleCloseChart} user={user} />
      default:
        return null
    }
  }

  const getChartTitle = () => {
    switch (activeChart) {
      case "breast":
        return "乳房ケアカルテ"
      case "postpartum":
        return "産後ケアカルテ"
      default:
        return ""
    }
  }

  const getChartDescription = () => {
    switch (activeChart) {
      case "breast":
        return "乳房ケアに関する情報を入力します。"
      case "postpartum":
        return "産後ケアに関する情報を入力します。"
      default:
        return ""
    }
  }

  return (
    <>
      <div className="space-y-4">
        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="患者名またはIDで検索..."
            className="pl-8 w-full md:w-1/3"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="border rounded-md">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>
                  <SortableHeader sortKey="patient_name">患者名</SortableHeader>
                </TableHead>
                <TableHead>
                  <SortableHeader sortKey="date">予約日</SortableHeader>
                </TableHead>
                <TableHead>
                  <SortableHeader sortKey="time">時間</SortableHeader>
                </TableHead>
                <TableHead>
                  <SortableHeader sortKey="service">サービス</SortableHeader>
                </TableHead>
                <TableHead>
                  <SortableHeader sortKey="status">ステータス</SortableHeader>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isPending ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center h-24">
                    読み込み中...
                  </TableCell>
                </TableRow>
              ) : appointments.length > 0 ? (
                appointments.map((appointment) => (
                  <TableRow key={appointment.id}>
                    <TableCell className="font-medium">
                      {appointment.patient_name}{" "}
                      <span className="text-xs text-muted-foreground">({appointment.patient_id})</span>
                    </TableCell>
                    <TableCell>{new Date(appointment.date).toLocaleDateString("ja-JP")}</TableCell>
                    <TableCell>{appointment.time}</TableCell>
                    <TableCell>{appointment.service}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{appointment.status}</Badge>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5} className="text-center h-24">
                    データが見つかりません。
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {selectedAppointment && (
        <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>予約詳細</DialogTitle>
              <DialogDescription>選択された予約の詳細情報です。</DialogDescription>
            </DialogHeader>
            <div className="space-y-6 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">患者名</label>
                  <p className="mt-1">{selectedAppointment.patient_name}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">電話番号</label>
                  <p className="mt-1">{selectedAppointment.patient_phone}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">メールアドレス</label>
                  <p className="mt-1">{selectedAppointment.patient_email || "未入力"}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">診療種別</label>
                  <p className="mt-1">{selectedAppointment.service_types?.name || "未設定"}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">予約日</label>
                  <p className="mt-1">{formatDate(selectedAppointment.appointment_date)}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">時間</label>
                  <p className="mt-1">
                    {formatTime(selectedAppointment.start_time)} - {formatTime(selectedAppointment.end_time)}
                  </p>
                </div>
              </div>

              {selectedAppointment.notes && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">備考</label>
                  <p className="mt-1 p-3 bg-gray-50 rounded-md">{selectedAppointment.notes}</p>
                </div>
              )}

              {selectedAppointment.questionnaires && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">問診票情報</label>
                  <div className="mt-1 p-3 bg-gray-50 rounded-md space-y-2">
                    <p>
                      <span className="font-medium">母親名:</span> {selectedAppointment.questionnaires.mother_last_name}{" "}
                      {selectedAppointment.questionnaires.mother_first_name}
                    </p>
                    <p>
                      <span className="font-medium">赤ちゃん名:</span>{" "}
                      {selectedAppointment.questionnaires.child_last_name}{" "}
                      {selectedAppointment.questionnaires.child_first_name}
                    </p>
                    {selectedAppointment.questionnaires.child_birth_year && (
                      <p>
                        <span className="font-medium">生年月日:</span>{" "}
                        {`${selectedAppointment.questionnaires.child_birth_year}/${selectedAppointment.questionnaires.child_birth_month}/${selectedAppointment.questionnaires.child_birth_day}`}
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={handleCloseDetails}>
                閉じる
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {selectedAppointment && (
        <Dialog open={!!activeChart} onOpenChange={(isOpen) => !isOpen && handleCloseChart()}>
          <DialogContent className="max-w-4xl">
            <DialogHeader>
              <DialogTitle>{getChartTitle()}</DialogTitle>
              <DialogDescription>{getChartDescription()}</DialogDescription>
            </DialogHeader>
            {renderChart()}
          </DialogContent>
        </Dialog>
      )}
    </>
  )
}
