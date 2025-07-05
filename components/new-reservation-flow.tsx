"use client"

import { useState, useEffect, Suspense } from "react"
import { useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { getClinics, getServiceTypesForClinic } from "@/app/actions/clinic-actions"
import { ReservationCalendar, type CalendarEvent } from "@/components/reservation-calendar"
import { NewReservationForm } from "@/components/new-reservation-form"
import { format } from "date-fns"
import { ja } from "date-fns/locale"
import type { Database } from "@/lib/supabase/database.types"

type Clinic = Database["public"]["Tables"]["clinics"]["Row"]
type ServiceType = Database["public"]["Tables"]["service_types"]["Row"]

// A simple, robust component to render a list of clinics as buttons.
const ClinicSelector = ({
  clinics,
  onSelectClinic,
}: {
  clinics: Clinic[]
  onSelectClinic: (clinic: Clinic) => void
}) => (
  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
    {clinics.map((clinic) => (
      <Button
        key={clinic.id}
        variant="outline"
        className="h-auto p-4 text-left bg-transparent"
        onClick={() => onSelectClinic(clinic)}
      >
        <span className="font-semibold">{clinic.name || "名称未設定"}</span>
      </Button>
    ))}
  </div>
)

function NewReservationFlowContent() {
  const searchParams = useSearchParams()
  const [step, setStep] = useState(1)
  const [clinics, setClinics] = useState<Clinic[]>([])
  const [serviceTypes, setServiceTypes] = useState<ServiceType[]>([])
  const [selectedClinic, setSelectedClinic] = useState<Clinic | null>(null)
  const [selectedServiceType, setSelectedServiceType] = useState<ServiceType | null>(null)
  const [selectedSlot, setSelectedSlot] = useState<CalendarEvent | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchClinics() {
      setIsLoading(true)
      setError(null)
      try {
        const fetchedClinics = await getClinics()
        setClinics(fetchedClinics)
      } catch (err) {
        setError("クリニックの読み込みに失敗しました。")
        console.error(err)
      } finally {
        setIsLoading(false)
      }
    }
    fetchClinics()
  }, [])

  const handleClinicSelect = async (clinic: Clinic) => {
    setSelectedClinic(clinic)
    setIsLoading(true)
    setError(null)
    try {
      const fetchedServiceTypes = await getServiceTypesForClinic(clinic.id)
      setServiceTypes(fetchedServiceTypes)
      setStep(2)
    } catch (err) {
      setError("診療メニューの読み込みに失敗しました。")
      console.error(err)
    } finally {
      setIsLoading(false)
    }
  }

  const handleServiceTypeSelect = (serviceType: ServiceType) => {
    setSelectedServiceType(serviceType)
    setStep(3)
  }

  const handleSlotSelect = (slot: CalendarEvent) => {
    setSelectedSlot(slot)
  }

  const resetFlow = () => {
    setStep(1)
    setSelectedClinic(null)
    setSelectedServiceType(null)
    setSelectedSlot(null)
    setError(null)
  }

  const renderStepContent = () => {
    if (isLoading) {
      return <Skeleton className="w-full h-64" />
    }
    if (error) {
      return (
        <div className="text-red-500 p-4 border border-red-200 bg-red-50 rounded-md">
          <p>{error}</p>
          <Button onClick={resetFlow} variant="outline" className="mt-2 bg-transparent">
            やり直す
          </Button>
        </div>
      )
    }

    switch (step) {
      case 1:
        return (
          <Card>
            <CardHeader>
              <CardTitle>ステップ1: ご希望のクリニックを選択</CardTitle>
              <CardDescription>施術を受けたいクリニックを選択してください。</CardDescription>
            </CardHeader>
            <CardContent>
              <ClinicSelector clinics={clinics} onSelectClinic={handleClinicSelect} />
            </CardContent>
          </Card>
        )
      case 2:
        return (
          <Card>
            <CardHeader>
              <CardTitle>ステップ2: ご希望のメニューを選択</CardTitle>
              <CardDescription>{selectedClinic?.name || ""}で受けられるメニューです。</CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {serviceTypes.map((st) => (
                <Button
                  key={st.id}
                  variant="outline"
                  className="h-auto py-4 bg-transparent text-left flex flex-col items-start"
                  onClick={() => handleServiceTypeSelect(st)}
                  style={{ borderColor: st.color || undefined }}
                >
                  <span className="font-bold">{st.name || "名称未設定"}</span>
                  <span className="text-sm text-gray-500 mt-1">{st.description || ""}</span>
                  <span className="text-sm font-semibold mt-2">
                    {typeof st.price === "number" ? `${st.price.toLocaleString()}円` : "価格未定"} /{" "}
                    {typeof st.duration === "number" ? `${st.duration}分` : ""}
                  </span>
                </Button>
              ))}
            </CardContent>
          </Card>
        )
      case 3:
        if (selectedClinic && selectedServiceType) {
          return (
            <div>
              <ReservationCalendar
                clinicId={selectedClinic.id}
                serviceType={selectedServiceType}
                onSelectSlot={handleSlotSelect}
                selectedSlot={selectedSlot}
              />
              {selectedSlot && (
                <div className="mt-4 p-4 border rounded-lg bg-gray-50">
                  <h3 className="font-bold text-lg mb-2">ご予約内容の確認</h3>
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
                  <Button className="w-full mt-4 bg-[#f8a0a0] hover:bg-[#f78989] text-white" onClick={() => setStep(4)}>
                    予約者情報の入力へ進む
                  </Button>
                </div>
              )}
            </div>
          )
        }
        return null
      case 4:
        if (selectedClinic && selectedServiceType && selectedSlot?.start) {
          return (
            <NewReservationForm
              clinic={selectedClinic}
              serviceType={selectedServiceType}
              slot={{
                date: format(selectedSlot.start, "yyyy-MM-dd"),
                time: format(selectedSlot.start, "HH:mm"),
              }}
            />
          )
        }
        return null
      default:
        return <div>不明なステップです。</div>
    }
  }

  return (
    <div className="w-full max-w-4xl mx-auto p-4">
      {step > 1 && (
        <Button variant="link" onClick={resetFlow} className="mb-4 px-0">
          ← クリニック選択に戻る
        </Button>
      )}
      {renderStepContent()}
    </div>
  )
}

export function NewReservationFlow() {
  return (
    <Suspense fallback={<Skeleton className="w-full h-96" />}>
      <NewReservationFlowContent />
    </Suspense>
  )
}
