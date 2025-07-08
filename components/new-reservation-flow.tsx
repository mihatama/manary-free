"use client"

import { useState, useEffect, useTransition } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { Skeleton } from "@/components/ui/skeleton"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { getClinics, getServiceTypesForClinic } from "@/app/actions/clinic-actions"
import { ReservationCalendar, type CalendarEvent } from "@/components/reservation-calendar"
import { NewReservationForm } from "@/components/new-reservation-form"
import { format } from "date-fns"
import { ja } from "date-fns/locale"
import { AlertCircle, CheckCircle, ArrowLeft } from "lucide-react"
import type { Database } from "@/lib/supabase/database.types"
import { Button } from "./ui/button"

type Clinic = Database["public"]["Tables"]["clinics"]["Row"]
type ServiceType = Database["public"]["Tables"]["service_types"]["Row"]

interface NewReservationFlowProps {
  phoneNumber?: string
  initialPatientName?: string
  onBack?: () => void
  onReservationComplete?: () => void
}

export function NewReservationFlow({
  phoneNumber,
  initialPatientName,
  onBack,
  onReservationComplete,
}: NewReservationFlowProps) {
  const [clinics, setClinics] = useState<Clinic[]>([])
  const [serviceTypes, setServiceTypes] = useState<ServiceType[]>([])
  const [selectedClinicId, setSelectedClinicId] = useState<string>("")
  const [selectedServiceTypeId, setSelectedServiceTypeId] = useState<string>("")
  const [selectedSlot, setSelectedSlot] = useState<CalendarEvent | null>(null)

  const [isClinicsLoading, startClinicsTransition] = useTransition()
  const [isServiceTypesLoading, startServiceTypesTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    startClinicsTransition(async () => {
      setError(null)
      try {
        const fetchedClinics = await getClinics()
        setClinics(fetchedClinics)
      } catch (err) {
        console.error(err)
        setError("クリニック一覧の読み込みに失敗しました。")
      }
    })
  }, [])

  useEffect(() => {
    if (!selectedClinicId) {
      setServiceTypes([])
      setSelectedServiceTypeId("")
      setSelectedSlot(null)
      return
    }

    startServiceTypesTransition(async () => {
      setError(null)
      setSelectedServiceTypeId("")
      setSelectedSlot(null)
      try {
        const fetchedServiceTypes = await getServiceTypesForClinic(Number(selectedClinicId))
        setServiceTypes(fetchedServiceTypes)
      } catch (err) {
        console.error(err)
        setError("メニュー一覧の読み込みに失敗しました。")
      }
    })
  }, [selectedClinicId])

  const selectedClinic = clinics.find((c) => c.id === Number(selectedClinicId))
  const selectedServiceType = serviceTypes.find((st) => st.id === Number(selectedServiceTypeId))

  const handleSlotSelect = (slot: CalendarEvent) => {
    setSelectedSlot(slot)
    // Scroll to the form after a slot is selected
    setTimeout(() => {
      document.getElementById("reservation-form-section")?.scrollIntoView({ behavior: "smooth" })
    }, 100)
  }

  return (
    <div className="space-y-8">
      {onBack && (
        <Button variant="outline" onClick={onBack} className="mb-4 bg-white shadow-sm">
          <ArrowLeft className="mr-2 h-4 w-4" />
          予約一覧に戻る
        </Button>
      )}

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>エラー</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle>ステップ1: クリニックとメニューを選択</CardTitle>
          <CardDescription>ご希望のクリニックと施術メニューを選択してください。</CardDescription>
        </CardHeader>
        <CardContent className="grid md:grid-cols-2 gap-8">
          <div className="space-y-4">
            <Label htmlFor="clinic-select" className="font-semibold">
              クリニック
            </Label>
            {isClinicsLoading ? (
              <Skeleton className="h-10 w-full" />
            ) : (
              <Select value={selectedClinicId} onValueChange={setSelectedClinicId} name="clinic-select">
                <SelectTrigger id="clinic-select">
                  <SelectValue placeholder="クリニックを選択してください" />
                </SelectTrigger>
                <SelectContent>
                  {clinics.map((clinic) => (
                    <SelectItem key={clinic.id} value={String(clinic.id)}>
                      {clinic.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
          <div className="space-y-4">
            <Label className="font-semibold">メニュー</Label>
            {isServiceTypesLoading ? (
              <div className="space-y-2">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
              </div>
            ) : (
              <RadioGroup
                value={selectedServiceTypeId}
                onValueChange={setSelectedServiceTypeId}
                className="space-y-2"
                disabled={!selectedClinicId || serviceTypes.length === 0}
              >
                {serviceTypes.length > 0 ? (
                  serviceTypes.map((st) => (
                    <Label
                      key={st.id}
                      htmlFor={`st-${st.id}`}
                      className={`flex items-center space-x-2 border rounded-md p-3 cursor-pointer hover:bg-gray-50 ${
                        selectedServiceTypeId === String(st.id) ? "border-pink-300 bg-pink-50" : ""
                      }`}
                    >
                      <RadioGroupItem value={String(st.id)} id={`st-${st.id}`} />
                      <div className="flex-1">
                        <p className="font-medium">{st.name}</p>
                        <p className="text-sm text-gray-500">{st.description}</p>
                        <p className="text-sm font-semibold mt-1">
                          {st.duration}分 / {st.price != null ? `${st.price.toLocaleString()}円` : "価格未定"}
                        </p>
                      </div>
                    </Label>
                  ))
                ) : selectedClinicId ? (
                  <p className="text-sm text-gray-500">このクリニックには現在利用可能なメニューがありません。</p>
                ) : (
                  <p className="text-sm text-gray-500">はじめにクリニックを選択してください。</p>
                )}
              </RadioGroup>
            )}
          </div>
        </CardContent>
      </Card>

      {selectedClinic && selectedServiceType && (
        <Card>
          <CardHeader>
            <CardTitle>ステップ2: ご希望の日時を選択</CardTitle>
            <CardDescription>カレンダーからご希望の予約可能な日時（水色の枠）をクリックしてください。</CardDescription>
          </CardHeader>
          <CardContent>
            <ReservationCalendar
              clinicId={selectedClinic.id}
              serviceType={selectedServiceType}
              onSelectSlot={handleSlotSelect}
              selectedSlot={selectedSlot}
            />
          </CardContent>
        </Card>
      )}

      {selectedClinic && selectedServiceType && selectedSlot && (
        <Card id="reservation-form-section">
          <CardHeader>
            <CardTitle>ステップ3: 予約者情報の入力</CardTitle>
            <CardDescription>以下の内容をご確認の上、お客様の情報を入力してください。</CardDescription>
          </CardHeader>
          <CardContent>
            <Alert className="mb-6 bg-green-50 border-green-200">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertTitle className="text-green-800">ご予約内容</AlertTitle>
              <AlertDescription className="text-green-700">
                <p>
                  <strong>クリニック:</strong> {selectedClinic.name}
                </p>
                <p>
                  <strong>メニュー:</strong> {selectedServiceType.name}
                </p>
                <p>
                  <strong>日時:</strong>{" "}
                  {selectedSlot.start ? format(selectedSlot.start, "yyyy年M月d日 (E) HH:mm", { locale: ja }) : ""}
                </p>
              </AlertDescription>
            </Alert>
            <NewReservationForm
              clinicId={selectedClinic.id}
              serviceTypeId={selectedServiceType.id}
              date={format(selectedSlot.start!, "yyyy-MM-dd")}
              startTime={format(selectedSlot.start!, "HH:mm")}
              endTime={format(selectedSlot.end!, "HH:mm")}
              phoneNumber={phoneNumber}
              initialPatientName={initialPatientName}
              onReservationComplete={onReservationComplete}
            />
          </CardContent>
        </Card>
      )}
    </div>
  )
}
