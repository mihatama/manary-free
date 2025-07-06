"use client"

import { useState, useEffect, useMemo } from "react"
import type { User } from "@supabase/supabase-js"
import { getAppointments } from "@/app/actions/reservation-actions"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { format } from "date-fns"
import { ja } from "date-fns/locale"

// Define a more specific type for appointments based on the expected return type
type Appointment = Awaited<ReturnType<typeof getAppointments>>[number]

interface AppointmentsViewProps {
  user: User
  selectedDate?: Date
}

export function AppointmentsView({ user, selectedDate }: AppointmentsViewProps) {
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")

  useEffect(() => {
    async function fetchAppointments() {
      setLoading(true)
      try {
        const dateString = selectedDate ? format(selectedDate, "yyyy-MM-dd") : undefined
        const data = await getAppointments({ date: dateString })
        // Ensure data is an array before setting state
        if (Array.isArray(data)) {
          setAppointments(data)
        } else {
          setAppointments([])
        }
      } catch (error) {
        console.error("Error fetching appointments:", error)
        setAppointments([])
      } finally {
        setLoading(false)
      }
    }
    fetchAppointments()
  }, [selectedDate])

  const filteredAppointments = useMemo(() => {
    if (!searchTerm) return appointments

    return appointments.filter((appt) => {
      const patientName = `${appt.patient_last_name || ""} ${appt.patient_first_name || ""}`
      const patientNameKana = `${appt.patient_last_name_kana || ""} ${appt.patient_first_name_kana || ""}`
      return (
        patientName.includes(searchTerm) ||
        patientNameKana.includes(searchTerm) ||
        appt.patient_phone_number?.includes(searchTerm)
      )
    })
  }, [appointments, searchTerm])

  return (
    <div className="space-y-4">
      <Input
        placeholder="患者名、かな、電話番号で検索..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        className="max-w-sm"
      />
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>予約日時</TableHead>
              <TableHead>患者名</TableHead>
              <TableHead>電話番号</TableHead>
              <TableHead>コース</TableHead>
              <TableHead>ステータス</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell colSpan={5}>
                    <Skeleton className="h-8 w-full" />
                  </TableCell>
                </TableRow>
              ))
            ) : filteredAppointments.length > 0 ? (
              filteredAppointments.map((appt) => (
                <TableRow key={appt.id}>
                  <TableCell>
                    {format(new Date(appt.reservation_date), "yyyy/MM/dd (E) HH:mm", { locale: ja })}
                  </TableCell>
                  <TableCell>
                    {appt.patient_last_name} {appt.patient_first_name}
                    <br />
                    <span className="text-xs text-muted-foreground">
                      {appt.patient_last_name_kana} {appt.patient_first_name_kana}
                    </span>
                  </TableCell>
                  <TableCell>{appt.patient_phone_number}</TableCell>
                  <TableCell>{appt.service_name}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{appt.status}</Badge>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={5} className="text-center">
                  {selectedDate
                    ? `${format(selectedDate, "yyyy年M月d日")}の予約はありません。`
                    : "予約が見つかりません。"}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
