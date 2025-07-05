"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { format, isBefore, startOfDay } from "date-fns"
import { ja } from "date-fns/locale"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { CalendarIcon, Clock, MapPin, Phone, Loader2 } from "lucide-react"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { useToast } from "@/components/ui/use-toast"
import { cancelAndPrepareForNewReservation } from "@/app/actions/reservation-actions"
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

interface AppointmentListProps {
  appointments: any[]
  phoneNumber: string
  onUpdate: (phoneNumber: string) => Promise<void>
}

export function AppointmentList({ appointments, phoneNumber, onUpdate }: AppointmentListProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [isChanging, setIsChanging] = useState<number | null>(null)

  const handleChangeReservation = async (appointmentId: number) => {
    setIsChanging(appointmentId)

    try {
      const result = await cancelAndPrepareForNewReservation(appointmentId)

      if (result.success && result.data) {
        toast({
          title: "予約をキャンセルしました",
          description: "新しい予約のページへ移動します。",
        })

        const { clinicId, serviceTypeId, phoneNumber } = result.data
        const params = new URLSearchParams({
          clinicId: String(clinicId),
          serviceTypeId: String(serviceTypeId),
          phone: phoneNumber,
        })
        router.push(`/reservation/new?${params.toString()}`)
      } else {
        throw new Error(result.message || "予約の変更処理に失敗しました。")
      }
    } catch (error) {
      console.error("Failed to change reservation:", error)
      toast({
        variant: "destructive",
        title: "エラー",
        description: error instanceof Error ? error.message : "予約の変更処理に失敗しました。",
      })
      setIsChanging(null)
    }
  }

  const safeFormatDate = (dateString: string | null | undefined) => {
    if (!dateString) {
      return "日付情報なし"
    }
    try {
      const date = new Date(dateString)
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
    <div className="space-y-6">
      <Card className="w-full shadow-md border-gray-100">
        <CardHeader>
          <CardTitle className="text-xl text-center text-gray-800">予約一覧</CardTitle>
          <CardDescription className="text-center">電話番号 {phoneNumber} に関連する予約一覧です</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {appointments.map((appointment) => {
              const reservationDate = appointment.reservation_date ? new Date(appointment.reservation_date) : null
              const isChangeable = reservationDate ? isBefore(startOfDay(new Date()), reservationDate) : false

              return (
                <Card key={appointment.id} className="overflow-hidden">
                  <div className="h-2" style={{ backgroundColor: appointment.service_types?.color || "#f8a0a0" }}></div>
                  <CardContent className="p-4">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4">
                      <div>
                        <h3 className="text-lg font-semibold">{appointment.service_types?.name}</h3>
                        <p className="text-gray-500 text-sm">
                          {appointment.service_types?.duration}分 • {appointment.clinics?.name}
                        </p>
                      </div>
                      <Badge
                        className={
                          appointment.status === "confirmed" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
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
                          {appointment.start_time?.substring(0, 5)} - {appointment.end_time?.substring(0, 5)}
                        </span>
                      </div>
                      <div className="flex items-center">
                        <MapPin className="h-4 w-4 mr-2 text-gray-500" />
                        <span>{appointment.clinics?.address || "住所情報なし"}</span>
                      </div>
                      <div className="flex items-center">
                        <Phone className="h-4 w-4 mr-2 text-gray-500" />
                        <span>{appointment.clinics?.phone || "電話番号情報なし"}</span>
                      </div>
                    </div>

                    {appointment.status === "confirmed" && (
                      <div className="flex justify-end">
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <div className="inline-block">
                                <AlertDialog>
                                  <AlertDialogTrigger asChild>
                                    <Button
                                      variant="outline"
                                      className="text-[#f8a0a0] border-[#f8a0a0] hover:bg-[#fff5f5] bg-transparent disabled:opacity-50 disabled:cursor-not-allowed"
                                      disabled={!isChangeable || isChanging !== null}
                                    >
                                      予約を変更
                                    </Button>
                                  </AlertDialogTrigger>
                                  <AlertDialogContent>
                                    <AlertDialogHeader>
                                      <AlertDialogTitle>予約を変更しますか？</AlertDialogTitle>
                                      <AlertDialogDescription>
                                        現在の予約はキャンセルされます。その後、新しい予約作成ページへ移動します。この操作は元に戻せません。
                                      </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                      <AlertDialogCancel>戻る</AlertDialogCancel>
                                      <AlertDialogAction
                                        onClick={() => handleChangeReservation(appointment.id)}
                                        disabled={isChanging !== null}
                                        className="bg-[#f8a0a0] hover:bg-[#f78989]"
                                      >
                                        {isChanging === appointment.id ? (
                                          <>
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" /> 処理中...
                                          </>
                                        ) : (
                                          "はい、変更します"
                                        )}
                                      </AlertDialogAction>
                                    </AlertDialogFooter>
                                  </AlertDialogContent>
                                </AlertDialog>
                              </div>
                            </TooltipTrigger>
                            {!isChangeable && (
                              <TooltipContent>
                                <p>オンラインでの変更は前日までです。</p>
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
  )
}
