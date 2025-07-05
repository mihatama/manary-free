"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { ReservationCalendar, type CalendarEvent } from "./reservation-calendar"
import { NewReservationForm } from "./new-reservation-form"
import type { Database } from "@/lib/supabase/database.types"
import { createReservation } from "@/app/actions/reservation-actions"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { ClinicSelector } from "./clinic-selector"
import { ServiceTypeSelector } from "./service-type-selector"

type Clinic = Database["public"]["Tables"]["clinics"]["Row"]
type ServiceType = Database["public"]["Tables"]["service_types"]["Row"]

export function NewReservationFlow() {
  const [selectedClinic, setSelectedClinic] = useState<Clinic | null>(null)
  const [selectedServiceType, setSelectedServiceType] = useState<ServiceType | null>(null)
  const [selectedSlot, setSelectedSlot] = useState<CalendarEvent | null>(null)
  const [step, setStep] = useState(1)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const handleClinicSelect = (clinic: Clinic) => {
    setSelectedClinic(clinic)
    setSelectedServiceType(null)
    setSelectedSlot(null)
  }

  const handleServiceTypeSelect = (serviceType: ServiceType) => {
    setSelectedServiceType(serviceType)
    setSelectedSlot(null)
    setStep(1)
  }

  const handleSlotSelect = (slot: CalendarEvent) => {
    setSelectedSlot(slot)
    setStep(2)
  }

  const handleBack = () => {
    if (step === 2) {
      setStep(1)
    }
  }

  const handleSubmit = async (formData: FormData) => {
    if (!selectedClinic || !selectedServiceType || !selectedSlot) {
      setError("予約情報が不完全です。")
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const result = await createReservation(formData)
      if (result.success && result.data?.access_token) {
        router.push(`/reservation/confirmation?token=${result.data.access_token}`)
      } else {
        setError(result.message || "予約の作成に失敗しました。")
      }
    } catch (err) {
      setError("予期せぬエラーが発生しました。")
      console.error(err)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-xl font-semibold mb-2">ステップ1: 助産院と診療内容を選択</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <ClinicSelector onClinicSelect={handleClinicSelect} selectedClinicId={selectedClinic?.id ?? null} />
          {selectedClinic && (
            <ServiceTypeSelector
              clinicId={selectedClinic.id}
              onServiceTypeSelect={handleServiceTypeSelect}
              selectedServiceTypeId={selectedServiceType?.id ?? null}
            />
          )}
        </div>
      </div>

      {selectedServiceType && (
        <div>
          <h2 className="text-xl font-semibold mb-2">
            {step === 1 ? "ステップ2: 日時を選択" : "ステップ3: 予約者情報を入力"}
          </h2>
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          {step === 1 ? (
            <ReservationCalendar
              serviceType={selectedServiceType}
              onSelectSlot={handleSlotSelect}
              selectedSlot={selectedSlot}
            />
          ) : (
            <NewReservationForm
              clinic={selectedClinic}
              serviceType={selectedServiceType}
              slot={selectedSlot}
              onSubmit={handleSubmit}
              onBack={handleBack}
              isLoading={isLoading}
            />
          )}
        </div>
      )}
    </div>
  )
}
