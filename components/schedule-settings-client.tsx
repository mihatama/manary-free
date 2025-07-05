"use client"

import { useState, useEffect } from "react"
import { ClinicManager } from "@/components/clinic-manager"
import { ServiceTypeManager } from "@/components/service-type-manager"
import { AvailabilityScheduler } from "@/components/availability-scheduler"
import { ScheduleCalendar } from "@/components/schedule-calendar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import type { Database } from "@/lib/supabase/database.types"
import { getClinics } from "@/app/actions/schedule-actions"

type Clinic = Database["public"]["Tables"]["clinics"]["Row"]
type ServiceType = Database["public"]["Tables"]["service_types"]["Row"]

export function ScheduleSettingsClient() {
  const [clinics, setClinics] = useState<Clinic[]>([])
  const [isLoadingClinics, setIsLoadingClinics] = useState(true)
  const [clinicsError, setClinicsError] = useState<string | null>(null)

  const [selectedClinicId, setSelectedClinicId] = useState<number | null>(null)
  const [selectedServiceType, setSelectedServiceType] = useState<ServiceType | null>(null)

  const refreshClinics = async () => {
    try {
      setIsLoadingClinics(true)
      setClinicsError(null) // Reset error state
      const data = await getClinics()
      setClinics(data)
      // If the selected clinic was deleted, reset selection
      if (selectedClinicId && !data.some((c) => c.id === selectedClinicId)) {
        setSelectedClinicId(null)
        setSelectedServiceType(null)
      }
    } catch (err) {
      if (err instanceof Error) {
        setClinicsError(err.message)
      } else {
        setClinicsError("助産院の読み込み中に不明なエラーが発生しました。")
      }
      console.error(err)
    } finally {
      setIsLoadingClinics(false)
    }
  }

  useEffect(() => {
    refreshClinics()
  }, [])

  const handleSelectClinic = (clinicId: number | null) => {
    if (clinicId !== selectedClinicId) {
      setSelectedClinicId(clinicId)
      setSelectedServiceType(null)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200">
        <div className="container mx-auto px-4 py-4">
          <h1 className="text-xl font-bold text-[#f8a0a0]">予約設定</h1>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <ClinicManager
            clinics={clinics}
            isLoading={isLoadingClinics}
            error={clinicsError}
            onUpdate={refreshClinics}
            selectedClinicId={selectedClinicId}
            onSelectClinic={handleSelectClinic}
          />
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <Tabs defaultValue="service-types">
            <TabsList className="mb-6">
              <TabsTrigger value="service-types">診療種別</TabsTrigger>
              <TabsTrigger value="availability">予約可能時間</TabsTrigger>
              <TabsTrigger value="calendar">カレンダー表示</TabsTrigger>
            </TabsList>

            <TabsContent value="service-types">
              {selectedClinicId ? (
                <ServiceTypeManager
                  clinicId={selectedClinicId}
                  selectedServiceTypeId={selectedServiceType?.id || null}
                  onSelectServiceType={setSelectedServiceType}
                />
              ) : (
                <div className="text-center py-8 border rounded-lg bg-gray-50">
                  <p className="text-gray-500">上のリストから助産院を選択して、診療種別を管理してください</p>
                </div>
              )}
            </TabsContent>

            <TabsContent value="availability">
              <AvailabilityScheduler serviceType={selectedServiceType} />
            </TabsContent>

            <TabsContent value="calendar">
              {selectedClinicId ? (
                <ScheduleCalendar clinicId={selectedClinicId} />
              ) : (
                <div className="text-center py-8 border rounded-lg bg-gray-50">
                  <p className="text-gray-500">上のリストから助産院を選択して、カレンダーを表示してください</p>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  )
}
