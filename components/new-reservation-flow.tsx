"use client"

import { useState, useEffect } from "react"
import { format } from "date-fns"
import { ja } from "date-fns/locale"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog"
import { ReservationCalendar, type CalendarEvent } from "@/components/reservation-calendar"
import { getClinics, getServiceTypes } from "@/app/actions/schedule-actions"
import { createAppointment } from "@/app/actions/reservation-actions"
import type { Database } from "@/lib/supabase/database.types"

type Clinic = Database["public"]["Tables"]["clinics"]["Row"]
type ServiceType = Database["public"]["Tables"]["service_types"]["Row"]

interface NewReservationFlowProps {
  phoneNumber: string
  initialPatientName?: string
  onBack: () => void
  onReservationComplete: () => void
}

export function NewReservationFlow({
  phoneNumber,
  initialPatientName = "",
  onBack,
  onReservationComplete,
}: NewReservationFlowProps) {
  const [clinics, setClinics] = useState<Clinic[]>([])
  const [serviceTypes, setServiceTypes] = useState<ServiceType[]>([])
  const [selectedClinicId, setSelectedClinicId] = useState<string>("")
  const [selectedServiceTypeId, setSelectedServiceTypeId] = useState<string>("")
  const [selectedSlot, setSelectedSlot] = useState<CalendarEvent | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [patientName, setPatientName] = useState(initialPatientName)
  const [patientEmail, setPatientEmail] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const selectedServiceType = serviceTypes.find((st) => st.id.toString() === selectedServiceTypeId) || null

  useEffect(() => {
    async function fetchClinics() {
      try {
        const data = await getClinics()
        setClinics(data)
        if (data.length > 0) {
          setSelectedClinicId(data[0].id.toString())
        }
      } catch (err) {
        setError("クリニックの読み込みに失敗しました。")
      }
    }
    fetchClinics()
  }, [])

  useEffect(() => {
    if (!selectedClinicId) {
      setServiceTypes([])
      setSelectedServiceTypeId("")
      return
    }
    async function fetchServiceTypes() {
      try {
        const data = await getServiceTypes(Number(selectedClinicId))
        setServiceTypes(data)
        if (data.length > 0) {
          setSelectedServiceTypeId(data[0].id.toString())
        } else {
          setSelectedServiceTypeId("")
        }
      } catch (err) {
        setError("診療種別の読み込みに失敗しました。")
      }
    }
    fetchServiceTypes()
  }, [selectedClinicId])

  const handleSelectSlot = (event: CalendarEvent) => {
    setSelectedSlot(event)
    setIsModalOpen(true)
  }

  const handleConfirmReservation = async () => {
    if (!selectedClinicId || !selectedServiceTypeId || !selectedSlot || !patientName) {
      setError("すべての必須項目を入力してください。")
      return
    }
    setIsLoading(true)
    setError(null)

    try {
      const formData = new FormData()
      formData.append("clinic_id", selectedClinicId)
      formData.append("service_type_id", selectedServiceTypeId)
      formData.append("reservation_date", format(selectedSlot.start as Date, "yyyy-MM-dd"))
      formData.append("start_time", format(selectedSlot.start as Date, "HH:mm:ss"))
      formData.append("end_time", format(selectedSlot.end as Date, "HH:mm:ss"))
      formData.append("patient_name", patientName)
      formData.append("patient_phone", phoneNumber)
      formData.append("patient_email", patientEmail)
      formData.append("status", "confirmed")
      formData.append("note", "患者による予約")

      const result = await createAppointment(formData)

      if (result.success) {
        setIsModalOpen(false)
        onReservationComplete()
      } else {
        setError(result.error || "予約の作成に失敗しました。")
      }
    } catch (err: any) {
      setError(err.message || "予約の作成中にエラーが発生しました。")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-start">
        <Button variant="outline" onClick={onBack}>
          予約一覧に戻る
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>ステップ1: クリニックと診療内容を選択</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="clinic-select">クリニック</Label>
            <Select value={selectedClinicId} onValueChange={setSelectedClinicId}>
              <SelectTrigger id="clinic-select">
                <SelectValue placeholder="クリニックを選択" />
              </SelectTrigger>
              <SelectContent>
                {clinics.map((clinic) => (
                  <SelectItem key={clinic.id} value={clinic.id.toString()}>
                    {clinic.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="service-type-select">診療内容</Label>
            <Select value={selectedServiceTypeId} onValueChange={setSelectedServiceTypeId} disabled={!selectedClinicId}>
              <SelectTrigger id="service-type-select">
                <SelectValue placeholder="診療内容を選択" />
              </SelectTrigger>
              <SelectContent>
                {serviceTypes.map((st) => (
                  <SelectItem key={st.id} value={st.id.toString()}>
                    {st.name} ({st.duration}分)
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {selectedServiceType && (
        <Card>
          <CardHeader>
            <CardTitle>ステップ2: ご希望の日時を選択</CardTitle>
            <CardDescription>カレンダーからご希望の予約枠をクリックしてください。</CardDescription>
          </CardHeader>
          <CardContent>
            <ReservationCalendar
              serviceType={selectedServiceType}
              onSelectSlot={handleSelectSlot}
              selectedSlot={selectedSlot}
            />
          </CardContent>
        </Card>
      )}

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>予約内容の確認</DialogTitle>
            <DialogDescription>お名前を入力して予約を確定してください。</DialogDescription>
          </DialogHeader>
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          <div className="space-y-4 py-4">
            <Card className="p-4 bg-gray-50">
              <CardContent className="space-y-2 text-sm">
                <p>
                  <strong>日時:</strong>{" "}
                  {selectedSlot?.start && format(selectedSlot.start, "yyyy年MM月dd日 (E) HH:mm", { locale: ja })}
                </p>
                <p>
                  <strong>診療内容:</strong> {selectedServiceType?.name}
                </p>
              </CardContent>
            </Card>
            <div className="space-y-2">
              <Label htmlFor="patient-name">お名前</Label>
              <Input
                id="patient-name"
                value={patientName}
                onChange={(e) => setPatientName(e.target.value)}
                placeholder="山田 花子"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="patient-email">メールアドレス (任意)</Label>
              <Input
                id="patient-email"
                type="email"
                value={patientEmail}
                onChange={(e) => setPatientEmail(e.target.value)}
                placeholder="example@example.com"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsModalOpen(false)}>
              キャンセル
            </Button>
            <Button onClick={handleConfirmReservation} disabled={isLoading} className="bg-[#f8a0a0] hover:bg-[#f78989]">
              {isLoading ? "処理中..." : "予約を確定する"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
