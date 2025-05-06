"use client"

import { useState } from "react"
import { format } from "date-fns"
import { ja } from "date-fns/locale"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { CalendarIcon, Clock, MapPin, Phone } from "lucide-react"
import { AppointmentEditor } from "@/components/appointment-editor"

interface AppointmentListProps {
  appointments: any[]
  phoneNumber: string
  onUpdate: (phoneNumber: string) => Promise<void>
}

export function AppointmentList({ appointments, phoneNumber, onUpdate }: AppointmentListProps) {
  const [editingAppointment, setEditingAppointment] = useState<any | null>(null)

  // 予約の編集が完了したときの処理
  const handleEditComplete = async () => {
    setEditingAppointment(null)
    await onUpdate(phoneNumber)
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
            {appointments.map((appointment) => (
              <Card key={appointment.id} className="overflow-hidden">
                <div className="h-2" style={{ backgroundColor: appointment.service_types.color || "#f8a0a0" }}></div>
                <CardContent className="p-4">
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4">
                    <div>
                      <h3 className="text-lg font-semibold">{appointment.service_types.name}</h3>
                      <p className="text-gray-500 text-sm">
                        {appointment.service_types.duration}分 • {appointment.clinics.name}
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
                      <span>
                        {format(new Date(appointment.appointment_date), "yyyy年MM月dd日(EEE)", { locale: ja })}
                      </span>
                    </div>
                    <div className="flex items-center">
                      <Clock className="h-4 w-4 mr-2 text-gray-500" />
                      <span>
                        {appointment.start_time.substring(0, 5)} - {appointment.end_time.substring(0, 5)}
                      </span>
                    </div>
                    <div className="flex items-center">
                      <MapPin className="h-4 w-4 mr-2 text-gray-500" />
                      <span>{appointment.clinics.address || "住所情報なし"}</span>
                    </div>
                    <div className="flex items-center">
                      <Phone className="h-4 w-4 mr-2 text-gray-500" />
                      <span>{appointment.clinics.phone || "電話番号情報なし"}</span>
                    </div>
                  </div>

                  {appointment.status === "confirmed" && (
                    <div className="flex justify-end">
                      <Button
                        variant="outline"
                        className="text-[#f8a0a0] border-[#f8a0a0] hover:bg-[#fff5f5]"
                        onClick={() => setEditingAppointment(appointment)}
                      >
                        予約を変更
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

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
