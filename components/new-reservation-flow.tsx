"use client"

import { useState, useTransition } from "react"
import { format, parseISO } from "date-fns"
import { ja } from "date-fns/locale"
import { ClinicSelector } from "@/components/clinic-selector"
import { ReservationCalendar } from "@/components/reservation-calendar"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { createReservation } from "@/app/actions/reservation-actions"
import { useRouter } from "next/navigation"
import type { Clinic, ServiceType, AvailableSlot } from "@/lib/types"

interface NewReservationFlowProps {
  clinics: Clinic[]
  serviceTypes: ServiceType[]
  initialClinicId?: number
  initialServiceTypeId?: number
}

export function NewReservationFlow({
  clinics,
  serviceTypes,
  initialClinicId,
  initialServiceTypeId,
}: NewReservationFlowProps) {
  const [selectedClinic, setSelectedClinic] = useState<Clinic | null>(
    clinics.find((c) => c.id === initialClinicId) || null,
  )
  const [selectedServiceType, setSelectedServiceType] = useState<ServiceType | null>(
    serviceTypes.find((st) => st.id === initialServiceTypeId) || null,
  )
  const [selectedSlot, setSelectedSlot] = useState<AvailableSlot | null>(null)
  const [isConfirmationOpen, setConfirmationOpen] = useState(false)
  const [patientName, setPatientName] = useState("")
  const [patientEmail, setPatientEmail] = useState("")
  const [patientPhone, setPatientPhone] = useState("")
  const [note, setNote] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  const handleSlotSelect = (slot: AvailableSlot) => {
    setSelectedSlot(slot)
    setConfirmationOpen(true)
  }

  const handleConfirmReservation = () => {
    if (!selectedClinic || !selectedServiceType || !selectedSlot || !patientName || !patientPhone) {
      setError("必須項目を入力してください。")
      return
    }

    startTransition(async () => {
      setError(null)
      const formData = new FormData()
      formData.append("clinic_id", String(selectedClinic.id))
      formData.append("service_type_id", String(selectedServiceType.id))
      const slotStartDate = new Date(selectedSlot.start_time)
      formData.append("reservation_date", format(slotStartDate, "yyyy-MM-dd"))
      formData.append("start_time", format(slotStartDate, "HH:mm:ss"))
      formData.append("end_time", format(new Date(selectedSlot.end_time), "HH:mm:ss"))
      formData.append("patient_name", patientName)
      formData.append("patient_email", patientEmail)
      formData.append("patient_phone", patientPhone)
      formData.append("note", note)

      const result = await createReservation(formData)

      if (result.success && result.data?.access_token) {
        setConfirmationOpen(false)
        router.push(`/reservation/confirmation?token=${result.data.access_token}`)
      } else {
        setError(result.message || "予約の作成に失敗しました。")
      }
    })
  }

  const japaneseDay = (date: Date) => {
    return format(date, "E", { locale: ja })
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold mb-2">1. クリニックを選択</h2>
        <ClinicSelector
          clinics={clinics}
          selectedClinic={selectedClinic}
          onClinicSelect={setSelectedClinic}
          serviceTypes={serviceTypes}
          selectedServiceType={selectedServiceType}
          onServiceTypeSelect={setSelectedServiceType}
        />
      </div>

      {selectedClinic && selectedServiceType && (
        <div>
          <h2 className="text-lg font-semibold mb-2">2. ご希望の日時を選択</h2>
          <ReservationCalendar
            serviceTypeId={selectedServiceType.id}
            onSlotSelect={handleSlotSelect}
            key={`${selectedClinic.id}-${selectedServiceType.id}`}
          />
        </div>
      )}

      {selectedSlot && (
        <Dialog open={isConfirmationOpen} onOpenChange={setConfirmationOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>予約内容の確認</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              {error && (
                <Alert variant="destructive">
                  <AlertTitle>エラー</AlertTitle>
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              <div className="p-4 border rounded-md bg-gray-50">
                <p>
                  <strong>日時:</strong>{" "}
                  {format(
                    parseISO(selectedSlot.start_time),
                    `yyyy年MM月dd日 (${japaneseDay(parseISO(selectedSlot.start_time))}) HH:mm`,
                  )}
                </p>
                <p>
                  <strong>クリニック:</strong> {selectedClinic?.name}
                </p>
                <p>
                  <strong>診療内容:</strong> {selectedServiceType?.name}
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="patientName">お名前</Label>
                <Input
                  id="patientName"
                  value={patientName}
                  onChange={(e) => setPatientName(e.target.value)}
                  placeholder="山田 花子"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="patientPhone">電話番号</Label>
                <Input
                  id="patientPhone"
                  value={patientPhone}
                  onChange={(e) => setPatientPhone(e.target.value)}
                  placeholder="09012345678"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="patientEmail">メールアドレス (任意)</Label>
                <Input
                  id="patientEmail"
                  type="email"
                  value={patientEmail}
                  onChange={(e) => setPatientEmail(e.target.value)}
                  placeholder="hanako@example.com"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="note">備考 (任意)</Label>
                <Input
                  id="note"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="何かあればご記入ください"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setConfirmationOpen(false)} disabled={isPending}>
                キャンセル
              </Button>
              <Button onClick={handleConfirmReservation} disabled={isPending || !patientName || !patientPhone}>
                {isPending ? "処理中..." : "予約を確定する"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}
