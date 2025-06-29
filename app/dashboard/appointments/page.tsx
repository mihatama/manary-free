"use client"

import { useState, useEffect } from "react"
import { getAllAppointments } from "@/app/actions/reservation-actions"
import type { Tables } from "@/lib/supabase/database.types"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import { BreastCareChart } from "@/components/breast-care-chart"
import { Badge } from "@/components/ui/badge"

type AppointmentWithDetails = Tables<"appointments"> & {
  questionnaires: Tables<"questionnaires"> | null
  service_types: Tables<"service_types"> | null
}

export default function AppointmentsPage() {
  const [appointments, setAppointments] = useState<AppointmentWithDetails[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedAppointment, setSelectedAppointment] = useState<AppointmentWithDetails | null>(null)
  const [isChartOpen, setIsChartOpen] = useState(false)

  useEffect(() => {
    const fetchAppointments = async () => {
      setLoading(true)
      const { data } = await getAllAppointments()
      if (data) {
        setAppointments(data as AppointmentWithDetails[])
      }
      setLoading(false)
    }
    fetchAppointments()
  }, [isChartOpen]) // Refetch when chart is closed to show updated status

  const handleOpenChart = (appointment: AppointmentWithDetails) => {
    setSelectedAppointment(appointment)
    setIsChartOpen(true)
  }

  const handleCloseChart = () => {
    setIsChartOpen(false)
    setSelectedAppointment(null)
  }

  if (loading) {
    return <div>読み込み中...</div>
  }

  return (
    <div className="container mx-auto py-10">
      <h1 className="text-3xl font-bold mb-6">予約一覧</h1>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>日時</TableHead>
            <TableHead>患者名</TableHead>
            <TableHead>診療種別</TableHead>
            <TableHead>ステータス</TableHead>
            <TableHead>アクション</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {appointments.map((appointment) => (
            <TableRow key={appointment.id}>
              <TableCell>{new Date(appointment.start_time).toLocaleString("ja-JP")}</TableCell>
              <TableCell>
                {appointment.questionnaires
                  ? `${appointment.questionnaires.mother_last_name} ${appointment.questionnaires.mother_first_name}`
                  : "問診票未入力"}
              </TableCell>
              <TableCell>{appointment.service_types?.name || "N/A"}</TableCell>
              <TableCell>
                <Badge variant={appointment.status === "confirmed" ? "default" : "secondary"}>
                  {appointment.status}
                </Badge>
              </TableCell>
              <TableCell>
                {/* This is a simplified check. You might want a more robust way to identify breast care appointments. */}
                {appointment.service_types?.name?.includes("乳房ケア") && (
                  <Button onClick={() => handleOpenChart(appointment)}>カルテ入力</Button>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {selectedAppointment && (
        <Dialog open={isChartOpen} onOpenChange={setIsChartOpen}>
          <DialogContent className="max-w-4xl">
            <BreastCareChart appointment={selectedAppointment} onClose={handleCloseChart} />
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}
