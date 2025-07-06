"use client"

import { useState } from "react"
import { format } from "date-fns"
import { ja } from "date-fns/locale"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { cancelAppointment } from "@/app/actions/reservation-actions"
import { AppointmentEditor } from "./appointment-editor"
import { Loader2, Calendar, Edit, Trash2, CheckCircle, XCircle, Building } from "lucide-react"

type Appointment = {
  id: number
  reservation_date: string
  start_time: string
  end_time: string
  status: string
  service_types: {
    name: string
    duration: number
    price: number
  } | null
  clinics: {
    name: string
  } | null
  // Add other properties from appointment object if needed
  [key: string]: any
}

interface AppointmentListProps {
  appointments: Appointment[]
  phoneNumber: string
  onUpdate: (phone: string) => void
}

// Helper function to safely format date strings
const safeFormatDate = (dateStr: string | null | undefined): string => {
  if (!dateStr) return "日付不明"
  try {
    // Dates from Supabase are 'YYYY-MM-DD'. Appending 'T00:00:00' ensures they are parsed in the local timezone.
    const date = new Date(`${dateStr}T00:00:00`)
    if (isNaN(date.getTime())) {
      console.error(`Invalid date string received: "${dateStr}"`)
      return "無効な日付"
    }
    return format(date, "yyyy年M月d日(E)", { locale: ja })
  } catch (e) {
    console.error(`Error formatting date string "${dateStr}":`, e)
    return "日付表示エラー"
  }
}

// Helper function to safely format time strings
const safeFormatTime = (timeStr: string | null | undefined): string => {
  if (!timeStr || typeof timeStr !== "string" || timeStr.length < 5) {
    return "時刻不明"
  }
  return timeStr.substring(0, 5)
}

export function AppointmentList({ appointments, phoneNumber, onUpdate }: AppointmentListProps) {
  const [isCancelling, setIsCancelling] = useState<number | null>(null)
  const [cancelError, setCancelError] = useState<string | null>(null)
  const [editingAppointment, setEditingAppointment] = useState<Appointment | null>(null)

  const handleCancel = async (id: number) => {
    setIsCancelling(id)
    setCancelError(null)
    const result = await cancelAppointment(id)
    if (!result.success) {
      setCancelError(result.message || "予約のキャンセルに失敗しました。")
    } else {
      onUpdate(phoneNumber)
    }
    setIsCancelling(null)
  }

  const handleEditComplete = () => {
    setEditingAppointment(null)
    onUpdate(phoneNumber)
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "confirmed":
        return (
          <span className="flex items-center text-sm font-semibold text-green-600">
            <CheckCircle className="mr-1 h-4 w-4" />
            予約確定
          </span>
        )
      case "cancelled":
        return (
          <span className="flex items-center text-sm font-semibold text-red-600">
            <XCircle className="mr-1 h-4 w-4" />
            キャンセル済
          </span>
        )
      default:
        return <span className="text-sm font-semibold text-gray-500">{status}</span>
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>ご予約一覧</CardTitle>
          <CardDescription>お客様の今後のご予約と過去のご予約です。</CardDescription>
        </CardHeader>
        <CardContent>
          {appointments.length === 0 ? (
            <p className="text-center text-gray-500 py-8">予約情報がありません。</p>
          ) : (
            <div className="space-y-4">
              {appointments.map((appointment) => (
                <Card key={appointment.id} className="overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                  <div
                    className={`p-4 border-l-4 ${
                      appointment.status === "cancelled" ? "border-red-400 bg-red-50" : "border-pink-400 bg-white"
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <div className="font-bold text-lg text-gray-800">
                        {appointment.service_types?.name || "サービス不明"}
                      </div>
                      {getStatusBadge(appointment.status)}
                    </div>
                    <div className="mt-2 space-y-1 text-gray-600">
                      <p className="flex items-center">
                        <Calendar className="mr-2 h-4 w-4 text-gray-500" />
                        <strong>日時:</strong>
                        <span className="ml-2">
                          {safeFormatDate(appointment.reservation_date)} {safeFormatTime(appointment.start_time)}
                        </span>
                      </p>
                      <p className="flex items-center">
                        <Building className="mr-2 h-4 w-4 text-gray-500" />
                        <strong>クリニック:</strong>
                        <span className="ml-2">{appointment.clinics?.name || "クリニック不明"}</span>
                      </p>
                    </div>
                    {appointment.status !== "cancelled" && new Date(appointment.reservation_date) >= new Date() && (
                      <div className="mt-4 flex justify-end space-x-2">
                        <Button variant="outline" size="sm" onClick={() => setEditingAppointment(appointment)}>
                          <Edit className="mr-1 h-4 w-4" />
                          変更
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="destructive" size="sm" disabled={isCancelling === appointment.id}>
                              {isCancelling === appointment.id ? (
                                <Loader2 className="mr-1 h-4 w-4 animate-spin" />
                              ) : (
                                <Trash2 className="mr-1 h-4 w-4" />
                              )}
                              キャンセル
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>予約をキャンセルしますか？</AlertDialogTitle>
                              <AlertDialogDescription>
                                この操作は元に戻せません。本当にこの予約をキャンセルしてもよろしいですか？
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>いいえ</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleCancel(appointment.id)}
                                className="bg-red-600 hover:bg-red-700"
                              >
                                はい、キャンセルします
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    )}
                  </div>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {cancelError && (
        <Alert variant="destructive">
          <AlertTitle>エラー</AlertTitle>
          <AlertDescription>{cancelError}</AlertDescription>
        </Alert>
      )}

      {editingAppointment && (
        <AppointmentEditor
          appointment={editingAppointment}
          onClose={() => setEditingAppointment(null)}
          onComplete={handleEditComplete}
        />
      )}
    </div>
  )
}
