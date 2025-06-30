"use client"

import { useState } from "react"
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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { BreastCareChart } from "./breast-care-chart"
import { PostpartumCareChart } from "./postpartum-care-chart"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { ChevronDown } from "lucide-react"

type AppointmentWithDetails = Tables<"appointments"> & {
  questionnaires: Tables<"questionnaires"> | null
  service_types: Tables<"service_types"> | null
  clinics: Tables<"clinics"> | null
}

interface AppointmentsClientProps {
  appointments: AppointmentWithDetails[]
}

export function AppointmentsClient({ appointments }: AppointmentsClientProps) {
  const [selectedAppointment, setSelectedAppointment] = useState<AppointmentWithDetails | null>(null)
  const [isDetailsOpen, setIsDetailsOpen] = useState(false)
  const [activeChart, setActiveChart] = useState<"breast" | "postpartum" | null>(null)

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
    setSelectedAppointment(null) // Also clear selected appointment
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

  if (!appointments || appointments.length === 0) {
    return (
      <Card>
        <CardContent className="text-center py-8">
          <p className="text-muted-foreground">予約がありません。</p>
        </CardContent>
      </Card>
    )
  }

  const renderChart = () => {
    if (!selectedAppointment) return null

    switch (activeChart) {
      case "breast":
        return <BreastCareChart appointment={selectedAppointment} onClose={handleCloseChart} />
      case "postpartum":
        return <PostpartumCareChart appointment={selectedAppointment} onClose={handleCloseChart} />
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
      <Card>
        <CardHeader>
          <CardTitle>予約一覧 ({appointments.length}件)</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>日時</TableHead>
                <TableHead>患者名</TableHead>
                <TableHead>電話番号</TableHead>
                <TableHead>診療種別</TableHead>
                <TableHead>ステータス</TableHead>
                <TableHead>アクション</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {appointments.map((appointment) => (
                <TableRow key={appointment.id}>
                  <TableCell>
                    <div>
                      <div className="font-medium">{formatDate(appointment.appointment_date)}</div>
                      <div className="text-sm text-muted-foreground">
                        {formatTime(appointment.start_time)} - {formatTime(appointment.end_time)}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div>
                      <div className="font-medium">{appointment.patient_name}</div>
                      {appointment.questionnaires && (
                        <div className="text-sm text-muted-foreground">
                          問診票: {appointment.questionnaires.mother_last_name}{" "}
                          {appointment.questionnaires.mother_first_name}
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>{appointment.patient_phone}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{appointment.service_types?.name || "未設定"}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        appointment.status === "confirmed"
                          ? "default"
                          : appointment.status === "cancelled"
                            ? "destructive"
                            : "secondary"
                      }
                    >
                      {appointment.status === "confirmed"
                        ? "確定"
                        : appointment.status === "cancelled"
                          ? "キャンセル"
                          : appointment.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="outline" size="sm">
                          アクション
                          <ChevronDown className="ml-2 h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent>
                        <DropdownMenuItem onClick={() => handleViewDetails(appointment)}>詳細を表示</DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => handleOpenChart("breast", appointment)}>
                          乳房ケアカルテ
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleOpenChart("postpartum", appointment)}>
                          産後ケアカルテ
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

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
                      {selectedAppointment.questionnaires.baby_last_name}{" "}
                      {selectedAppointment.questionnaires.baby_first_name}
                    </p>
                    {selectedAppointment.questionnaires.baby_birth_date && (
                      <p>
                        <span className="font-medium">生年月日:</span>{" "}
                        {selectedAppointment.questionnaires.baby_birth_date}
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
