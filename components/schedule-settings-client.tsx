"use client"

import { useState, useEffect, useMemo } from "react"
import { ClinicManager } from "@/components/clinic-manager"
import { ServiceTypeManager } from "@/components/service-type-manager"
import { AvailabilityScheduler } from "@/components/availability-scheduler"
import { ScheduleCalendar } from "@/components/schedule-calendar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import type { Database } from "@/lib/supabase/database.types"
import { getClinics, getServiceTypes } from "@/app/actions/schedule-actions"

type Clinic = Database["public"]["Tables"]["clinics"]["Row"]
type ServiceType = Database["public"]["Tables"]["service_types"]["Row"]

export function ScheduleSettingsClient() {
  // Clinics state
  const [clinics, setClinics] = useState<Clinic[]>([])
  const [isLoadingClinics, setIsLoadingClinics] = useState(true)
  const [clinicsError, setClinicsError] = useState<string | null>(null)
  const [selectedClinicId, setSelectedClinicId] = useState<number | null>(null)

  // Service Types state
  const [serviceTypes, setServiceTypes] = useState<ServiceType[]>([])
  const [isLoadingServiceTypes, setIsLoadingServiceTypes] = useState(false)
  const [serviceTypesError, setServiceTypesError] = useState<string | null>(null)
  const [selectedServiceTypeId, setSelectedServiceTypeId] = useState<number | null>(null)

  // Derived state
  const selectedClinic = useMemo(
    () => clinics.find((c) => c.id === selectedClinicId) || null,
    [clinics, selectedClinicId],
  )
  const selectedServiceType = useMemo(
    () => serviceTypes.find((st) => st.id === selectedServiceTypeId) || null,
    [serviceTypes, selectedServiceTypeId],
  )

  // Fetch clinics on mount
  useEffect(() => {
    refreshClinics()
  }, [])

  // Fetch service types when clinic changes
  useEffect(() => {
    if (selectedClinicId) {
      refreshServiceTypes(selectedClinicId)
    } else {
      setServiceTypes([])
      setSelectedServiceTypeId(null)
    }
  }, [selectedClinicId])

  // Auto-select first service type if none is selected
  useEffect(() => {
    if (!isLoadingServiceTypes && serviceTypes.length > 0 && !selectedServiceTypeId) {
      setSelectedServiceTypeId(serviceTypes[0].id)
    }
  }, [serviceTypes, isLoadingServiceTypes, selectedServiceTypeId])

  const refreshClinics = async () => {
    setIsLoadingClinics(true)
    setClinicsError(null)
    try {
      const data = await getClinics()
      setClinics(data)
      if (selectedClinicId && !data.some((c) => c.id === selectedClinicId)) {
        setSelectedClinicId(null)
      }
    } catch (err) {
      setClinicsError(err instanceof Error ? err.message : "助産院の読み込み中に不明なエラーが発生しました。")
    } finally {
      setIsLoadingClinics(false)
    }
  }

  const refreshServiceTypes = async (clinicId: number) => {
    setIsLoadingServiceTypes(true)
    setServiceTypesError(null)
    try {
      const data = await getServiceTypes(clinicId)
      setServiceTypes(data)
      if (selectedServiceTypeId && !data.some((st) => st.id === selectedServiceTypeId)) {
        setSelectedServiceTypeId(null)
      }
    } catch (err) {
      setServiceTypesError(err instanceof Error ? err.message : "診療種別の読み込み中に不明なエラーが発生しました。")
    } finally {
      setIsLoadingServiceTypes(false)
    }
  }

  const handleSelectClinic = (clinicId: number | null) => {
    if (clinicId !== selectedClinicId) {
      setSelectedClinicId(clinicId)
      // Reset service type selection, will be auto-selected by useEffect
      setSelectedServiceTypeId(null)
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
          <Tabs defaultValue="service-types" className="w-full">
            <TabsList className="mb-6">
              <TabsTrigger value="service-types">診療種別</TabsTrigger>
              <TabsTrigger value="availability">予約可能時間</TabsTrigger>
              <TabsTrigger value="calendar">カレンダー表示</TabsTrigger>
            </TabsList>

            <TabsContent value="service-types">
              {selectedClinic ? (
                <ServiceTypeManager
                  clinic={selectedClinic}
                  serviceTypes={serviceTypes}
                  isLoading={isLoadingServiceTypes}
                  error={serviceTypesError}
                  onUpdate={() => refreshServiceTypes(selectedClinic.id)}
                  selectedServiceTypeId={selectedServiceTypeId}
                  onSelectServiceType={(st) => setSelectedServiceTypeId(st ? st.id : null)}
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
