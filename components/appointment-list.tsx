"use client"

import { useState } from "react"
import { format, isBefore, startOfDay, parseISO } from "date-fns"
import { ja } from "date-fns/locale"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { CalendarIcon, Clock, MapPin, Phone, AlertCircle } from "lucide-react"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
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
import { cancelAppointment } from "@/app/actions/reservation-actions"
import { useToast } from "@/hooks/use-toast"

interface AppointmentListProps {
  appointments: any[]
  phoneNumber: string
  onUpdate: (phoneNumber: string) => Promise<void>
}

export function AppointmentList({ appointments, phoneNumber, onUpdate }: AppointmentListProps) {
  const [appointmentToCancel, setAppointmentToCancel] = useState<any | null>(null)
  const { toast } = useToast()

  const handleCancelClick = (appointment: any) => {
    setAppointmentToCancel(appointment)
  }

  const handleConfirmCancel = async () => {
    if (!appointmentToCancel) return

    const result = await cancelAppointment(appointmentToCancel.id)

    if (result.success) {
      toast({
        title: "予約がキャンセルされました",
      })
      await onUpdate(phoneNumber)
    } else {
      toast({
        variant: "destructive",
        title: "エラー",
        description: result.message || "予約のキャンセルに失敗しました。",
      })
    }
    setAppointmentToCancel(null)
  }

  // 日付を安全にフォーマットするヘルパー関数
  const safeFormatDate = (dateString: string | null | undefined) => {
    if (!dateString) {
      return "日付情報なし"
    }
    try {
      // 'YYYY-MM-DD' 形式を正しくパース
      const date = parseISO(dateString)
      if (isNaN(date.getTime())) {
        console.error("Invalid date value received in AppointmentList:", dateString)
        return "無効な日付"
      }
      return format(date, "yyyy年MM月dd日(EEE)", { locale: ja })
    } catch (error) {
      console.error("Error formatting date in AppointmentList:", dateString, error)
      return "日付表示エラー"
    }
  }

  return (
    <>
      <div className="space-y-6">
        <Card className="w-full shadow-md border-gray-100">
          <CardHeader>
            <CardTitle className="text-xl text-center text-gray-800">予約一覧</CardTitle>
            <CardDescription className="text-center">電話番号 {phoneNumber} に関連する予約一覧です</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {appointments.map((appointment) => {
                let reservationDate: Date | null = null
                try {
                  if (appointment.reservation_date) {
                    reservationDate = parseISO(appointment.reservation_date)
                    if (isNaN(reservationDate.getTime())) reservationDate = null
                  }
                } catch {
                  reservationDate = null
                }

                const isCancellable = reservationDate ? isBefore(startOfDay(new Date()), reservationDate) : false

                return (
                  <Card key={appointment.id} className="overflow-hidden">
                    <div
                      className="h-2"
                      style={{ backgroundColor: appointment.service_types?.color || "#f8a0a0" }}
                    ></div>
                    <CardContent className="p-4">
                      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4">
                        <div>
                          <h3 className="text-lg font-semibold">
                            {appointment.service_types?.name || "サービス情報なし"}
                          </h3>
                          <p className="text-gray-500 text-sm">
                            {appointment.service_types?.duration ? `${appointment.service_types.duration}分` : ""} •{" "}
                            {appointment.clinics?.name || "クリニック情報なし"}
                          </p>
                        </div>
                        <Badge
                          variant={appointment.status === "confirmed" ? "default" : "destructive"}
                          className={
                            appointment.status === "confirmed"
                              ? "bg-green-100 text-green-800"
                              : "bg-red-100 text-red-800"
                          }
                        >
                          {appointment.status === "confirmed" ? "予約確定" : "キャンセル済み"}
                        </Badge>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
                        <div className="flex items-center">
                          <CalendarIcon className="h-4 w-4 mr-2 text-gray-500" />
                          <span>{safeFormatDate(appointment.reservation_date)}</span>
                        </div>
                        <div className="flex items-center">
                          <Clock className="h-4 w-4 mr-2 text-gray-500" />
                          <span>
                            {appointment.start_time?.substring(0, 5) || "時刻不明"} -{" "}
                            {appointment.end_time?.substring(0, 5) || ""}
                          </span>
                        </div>
                        <div className="flex items-center">
                          <MapPin className="h-4 w-4 mr-2 text-gray-500" />
                          <span>{appointment.clinics?.address || "住所情報なし"}</span>
                        </div>
                        <div className="flex items-center">
                          <Phone className="h-4 w-4 mr-2 text-gray-500" />
                          <span>{appointment.clinics?.phone_number || "電話番号情報なし"}</span>
                        </div>
                      </div>

                      {appointment.status === "confirmed" && (
                        <div className="flex justify-end">
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <div className="inline-block">
                                  <Button
                                    variant="outline"
                                    className="text-red-500 border-red-200 hover:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed bg-transparent"
                                    onClick={() => handleCancelClick(appointment)}
                                    disabled={!isCancellable}
                                  >
                                    予約をキャンセル
                                  </Button>
                                </div>
                              </TooltipTrigger>
                              {!isCancellable && (
                                <TooltipContent>
                                  <p className="flex items-center">
                                    <AlertCircle className="h-4 w-4 mr-2" />
                                    オンラインでのキャンセルは前日までです。
                                  </p>
                                </TooltipContent>
                              )}
                            </Tooltip>
                          </TooltipProvider>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      <AlertDialog open={!!appointmentToCancel} onOpenChange={(open) => !open && setAppointmentToCancel(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>予約をキャンセルしますか？</AlertDialogTitle>
            <AlertDialogDescription>
              この操作は元に戻せません。キャンセル後、再度予約が必要な場合は、新しく予約を取り直してください。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>戻る</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmCancel} className="bg-red-500 hover:bg-red-600">
              はい、キャンセルする
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
