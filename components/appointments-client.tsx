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
import { ArrowUpDown, Search, FileText, History } from "lucide-react"
import { Input } from "@/components/ui/input"
import { getAppointments } from "@/app/actions/reservation-actions"
import {
  getQuestionnaireById,
  getQuestionnairesByPatientId,
  type DetailedQuestionnaireWithReservation,
} from "@/app/actions/questionnaire-actions"
import { useDebounce } from "use-debounce"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { QuestionnaireDetails } from "./questionnaire-details"
import { ScrollArea } from "@/components/ui/scroll-area"

type AppointmentsResponse = Awaited<ReturnType<typeof getAppointments>>
type Appointment = AppointmentsResponse["data"][number]
type AppointmentWithDetails = Tables<"reservations"> & {
  questionnaires: Tables<"questionnaires"> | null
  service_types: Tables<"service_types"> | null
  clinics: Tables<"clinics"> | null
}
type SortKey = "date" | "time" | "status" | "patient_name"

interface AppointmentsClientProps {
  initialAppointments: Appointment[]
  initialCount: number
  user: {
    id: string
    name: string | null
    email: string | undefined
  }
}

const PastQuestionnairesDialog = ({
  patientId,
  patientName,
  onClose,
  onSelectQuestionnaire,
}: {
  patientId: number
  patientName: string
  onClose: () => void
  onSelectQuestionnaire: (questionnaireId: number) => void
}) => {
  const [questionnaires, setQuestionnaires] = useState<DetailedQuestionnaireWithReservation[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchPastQuestionnaires = async () => {
      setIsLoading(true)
      const data = await getQuestionnairesByPatientId(patientId)
      setQuestionnaires(data)
      setIsLoading(false)
    }
    fetchPastQuestionnaires()
  }, [patientId])

  return (
    <Dialog open={true} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>過去の問診票: {patientName}</DialogTitle>
          <DialogDescription>過去に作成された問診票の一覧です。</DialogDescription>
        </DialogHeader>
        <ScrollArea className="h-[60vh] pr-4">
          {isLoading ? (
            <p>読み込み中...</p>
          ) : questionnaires.length > 0 ? (
            <div className="space-y-2">
              {questionnaires.map((q) => (
                <div key={q.id} className="flex justify-between items-center p-2 border rounded-md">
                  <span>
                    {q.reservations?.reservation_date
                      ? new Date(q.reservations.reservation_date).toLocaleDateString("ja-JP")
                      : "日付不明"}
                  </span>
                  <Button variant="outline" size="sm" onClick={() => onSelectQuestionnaire(q.id)}>
                    表示
                  </Button>
                </div>
              ))}
            </div>
          ) : (
            <p>過去の問診票はありません。</p>
          )}
        </ScrollArea>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            閉じる
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

const QuestionnaireDialog = ({
  questionnaireId,
  onClose,
}: {
  questionnaireId: number
  onClose: () => void
}) => {
  const [questionnaire, setQuestionnaire] = useState<DetailedQuestionnaireWithReservation | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchQuestionnaire = async () => {
      setIsLoading(true)
      const data = await getQuestionnaireById(questionnaireId)
      setQuestionnaire(data)
      setIsLoading(false)
    }
    fetchQuestionnaire()
  }, [questionnaireId])

  return (
    <Dialog open={true} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>問診票詳細</DialogTitle>
        </DialogHeader>
        <ScrollArea className="h-[80vh] pr-4">
          {isLoading ? (
            <p>読み込み中...</p>
          ) : questionnaire ? (
            <QuestionnaireDetails questionnaire={questionnaire} />
          ) : (
            <p>問診票が見つかりませんでした。</p>
          )}
        </ScrollArea>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            閉じる
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export function AppointmentsClient({ initialAppointments, initialCount, user }: AppointmentsClientProps) {
  const [appointments, setAppointments] = useState(initialAppointments)
  const [totalCount, setTotalCount] = useState(initialCount)
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null)
  const [activeChart, setActiveChart] = useState<"breast" | "postpartum" | null>(null)
  const [viewingQuestionnaireId, setViewingQuestionnaireId] = useState<number | null>(null)
  const [viewingPastPatient, setViewingPastPatient] = useState<{ id: number; name: string } | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [debouncedSearchTerm] = useDebounce(searchTerm, 500)
  const [sortConfig, setSortConfig] = useState<{ key: SortKey; direction: "asc" | "desc" } | null>({
    key: "date",
    direction: "desc",
  })
  const [view, setView] = useState<"today" | "all">("today")
  const [isPending, startTransition] = useTransition()

  const fetchAppointments = useCallback(() => {
    startTransition(async () => {
      const { data, count } = await getAppointments({
        search: debouncedSearchTerm,
        sortBy: sortConfig?.key,
        sortOrder: sortConfig?.direction,
        filterDate: view,
      })
      setAppointments(data || [])
      setTotalCount(count || 0)
    })
  }, [debouncedSearchTerm, sortConfig, view])

  useEffect(() => {
    fetchAppointments()
  }, [view, debouncedSearchTerm, sortConfig, fetchAppointments])

  const handleOpenChart = (chartType: "breast" | "postpartum", appointment: Appointment) => {
    setSelectedAppointment(appointment)
    setActiveChart(chartType)
  }

  const handleCloseChart = () => {
    setActiveChart(null)
    setSelectedAppointment(null)
  }

  const handleSelectPastQuestionnaire = (questionnaireId: number) => {
    setViewingPastPatient(null)
    setViewingQuestionnaireId(questionnaireId)
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "N/A"
    try {
      const date = new Date(dateString)
      return date.toLocaleDateString("ja-JP", { year: "numeric", month: "long", day: "numeric", weekday: "short" })
    } catch (error) {
      return dateString
    }
  }

  const formatTime = (timeString: string | null) => {
    if (!timeString) return "N/A"
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
    <Button variant="ghost" onClick={() => handleSort(sortKey)} className="px-0 hover:bg-transparent">
      {children}
      {sortConfig?.key === sortKey ? (
        <ArrowUpDown className="ml-2 h-4 w-4" />
      ) : (
        <ArrowUpDown className="ml-2 h-4 w-4 opacity-0 group-hover:opacity-50" />
      )}
    </Button>
  )

  const renderChart = () => {
    if (!selectedAppointment) return null
    const appointmentForChart = selectedAppointment as AppointmentWithDetails
    switch (activeChart) {
      case "breast":
        return <BreastCareChart appointment={appointmentForChart} onClose={handleCloseChart} user={user} />
      case "postpartum":
        return <PostpartumCareChart appointment={appointmentForChart} onClose={handleCloseChart} user={user} />
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

  const AppointmentsTable = () => (
    <div className="border rounded-md">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="group">
              <SortableHeader sortKey="patient_name">患者名</SortableHeader>
            </TableHead>
            <TableHead className="group">
              <SortableHeader sortKey="date">予約日</SortableHeader>
            </TableHead>
            <TableHead className="group">
              <SortableHeader sortKey="time">時間</SortableHeader>
            </TableHead>
            <TableHead>サービス</TableHead>
            <TableHead className="group">
              <SortableHeader sortKey="status">ステータス</SortableHeader>
            </TableHead>
            <TableHead>アクション</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {isPending ? (
            <TableRow>
              <TableCell colSpan={6} className="text-center h-24">
                読み込み中...
              </TableCell>
            </TableRow>
          ) : appointments.length > 0 ? (
            appointments.map((appointment) => (
              <TableRow key={appointment.id}>
                <TableCell className="font-medium">{appointment.patients.name}</TableCell>
                <TableCell>{formatDate(appointment.reservation_date)}</TableCell>
                <TableCell>{formatTime(appointment.start_time)}</TableCell>
                <TableCell>{appointment.service_types?.name}</TableCell>
                <TableCell>
                    <Badge
                    variant="outline"
                    className={
                      appointment.status === 'confirmed' 
                      ? 'bg-emerald-50 border-emerald-200 text-emerald-700' 
                      : 'bg-rose-50 border-rose-200 text-rose-700'
                    }
                    >
                      {appointment.status === 'confirmed' ? '確認済み' : 'キャンセル'}
                    </Badge>
                </TableCell>
                <TableCell className="flex items-center space-x-1 whitespace-nowrap">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setViewingQuestionnaireId(appointment.questionnaire_id)}
                    disabled={!appointment.questionnaire_id}
                    className="bg-white hover:bg-pink-50 border-pink-200 text-pink-700 hover:border-pink-300 disabled:opacity-50 disabled:bg-gray-50 disabled:border-gray-200 disabled:text-gray-400"
                  >
                    <FileText className="h-4 w-4 mr-1" /> 問診票
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      setViewingPastPatient({ id: appointment.patients.id, name: appointment.patients.name })
                    }
                    className="bg-white hover:bg-pink-50 border-pink-200 text-pink-700 hover:border-pink-300"
                  >
                    <History className="h-4 w-4 mr-1" /> 過去分
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => handleOpenChart("breast", appointment)}
                    className="bg-white hover:bg-pink-50 border-pink-200 text-pink-700 hover:border-pink-300"
                  >
                    乳房ケア
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => handleOpenChart("postpartum", appointment)}
                    className="bg-white hover:bg-pink-50 border-pink-200 text-pink-700 hover:border-pink-300"
                  >
                    産後ケア
                  </Button>
                </TableCell>
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={6} className="text-center h-24">
                データが見つかりません。
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  )

  return (
    <>
      <div className="space-y-4">
        <Tabs value={view} onValueChange={(value) => setView(value as "today" | "all")}>
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <TabsList>
              <TabsTrigger value="today">本日の予約</TabsTrigger>
              <TabsTrigger value="all">すべての予約</TabsTrigger>
            </TabsList>
            <div className="relative w-full md:w-1/3">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="患者名で検索..."
                className="pl-8"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          <TabsContent value="today" className="mt-4">
            <AppointmentsTable />
          </TabsContent>
          <TabsContent value="all" className="mt-4">
            <AppointmentsTable />
          </TabsContent>
        </Tabs>
      </div>

      {viewingQuestionnaireId && (
        <QuestionnaireDialog questionnaireId={viewingQuestionnaireId} onClose={() => setViewingQuestionnaireId(null)} />
      )}

      {viewingPastPatient && (
        <PastQuestionnairesDialog
          patientId={viewingPastPatient.id}
          patientName={viewingPastPatient.name}
          onClose={() => setViewingPastPatient(null)}
          onSelectQuestionnaire={handleSelectPastQuestionnaire}
        />
      )}

      {selectedAppointment && activeChart && (
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
