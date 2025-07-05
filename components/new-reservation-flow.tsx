"use client"

import { useState, useEffect, Suspense } from "react"
import { useSearchParams } from "next/navigation"
import { ClinicSelector } from "@/components/clinic-selector"
import { ReservationCalendar, type CalendarEvent } from "@/components/reservation-calendar"
import { NewReservationForm } from "@/components/new-reservation-form"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { getClinics, getServiceTypesForClinic } from "@/app/actions/clinic-actions"
import type { Database } from "@/lib/supabase/database.types"
import { Skeleton } from "@/components/ui/skeleton"
import { format } from "date-fns"
import { ja } from "date-fns/locale"

type Clinic = Database["public"]["Tables"]["clinics"]["Row"]
type ServiceType = Database["public"]["Tables"]["service_types"]["Row"]

function NewReservationFlowContent() {
  const searchParams = useSearchParams()
  const [step, setStep] = useState(1)
  const [clinics, setClinics] = useState<Clinic[]>([])
  const [serviceTypes, setServiceTypes] = useState<ServiceType[]>([])
  const [selectedClinic, setSelectedClinic] = useState<Clinic | null>(null)
  const [selectedServiceType, setSelectedServiceType] = useState<ServiceType | null>(null)
  const [selectedSlot, setSelectedSlot] = useState<CalendarEvent | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function fetchClinics() {
      setIsLoading(true)
      const fetchedClinics = await getClinics()
      setClinics(fetchedClinics)

      const urlClinicId = searchParams.get("clinicId")
      if (urlClinicId) {
        const preselectedClinic = fetchedClinics.find((c) => c.id === Number.parseInt(urlClinicId, 10))
        if (preselectedClinic) {
          handleClinicSelect(preselectedClinic)
        }
      }
      setIsLoading(false)
    }
    fetchClinics()
  }, [searchParams])

  const handleClinicSelect = async (clinic: Clinic) => {
    setSelectedClinic(clinic)
    setIsLoading(true)
    const fetchedServiceTypes = await getServiceTypesForClinic(clinic.id)
    setServiceTypes(fetchedServiceTypes)
    setStep(2)
    setIsLoading(false)
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
  }

  const renderStep = () => {
    if (isLoading) {
      return <Skeleton className="w-full h-64" />
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
              <CardDescription>{selectedClinic?.name}で受けられるメニューです。</CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {serviceTypes.map((st) => (
                <Button
                  key={st.id}
                  variant="outline"
                  className="h-auto py-4 bg-transparent"
                  onClick={() => handleServiceTypeSelect(st)}
                  style={{ borderColor: st.color || undefined }}
                >
                  <div className="flex flex-col items-start w-full">
                    <span className="font-bold">{st.name}</span>
                    <span className="text-sm text-gray-500">{st.description}</span>
                    <span className="text-sm font-semibold mt-2">
                      {st.price?.toLocaleString()}円 / {st.duration}分
                    </span>
                  </div>
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
          最初からやり直す
        </Button>
      )}
      {renderStep()}
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
