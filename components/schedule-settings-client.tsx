"use client"

import { useState } from "react"
import { ClinicSelector } from "@/components/clinic-selector"
import { ServiceTypeManager } from "@/components/service-type-manager"
import { AvailabilityScheduler } from "@/components/availability-scheduler"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import type { Database } from "@/lib/supabase/database.types"

type ServiceType = Database["public"]["Tables"]["service_types"]["Row"]

export function ScheduleSettingsClient() {
  const [selectedClinicId, setSelectedClinicId] = useState<number | null>(null)
  const [selectedServiceType, setSelectedServiceType] = useState<ServiceType | null>(null)

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200">
        <div className="container mx-auto px-4 py-4">
          <h1 className="text-xl font-bold text-[#f8a0a0]">予約設定</h1>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h2 className="text-lg font-bold mb-4">助産院を選択</h2>
          <ClinicSelector
            selectedClinicId={selectedClinicId}
            onSelectClinic={(clinicId) => {
              setSelectedClinicId(clinicId)
              setSelectedServiceType(null)
            }}
          />
        </div>

        {selectedClinicId && (
          <div className="bg-white rounded-lg shadow p-6">
            <Tabs defaultValue="service-types">
              <TabsList className="mb-6">
                <TabsTrigger value="service-types">診療種別</TabsTrigger>
                <TabsTrigger value="availability">予約可能時間</TabsTrigger>
              </TabsList>

              <TabsContent value="service-types">
                <ServiceTypeManager
                  clinicId={selectedClinicId}
                  selectedServiceTypeId={selectedServiceType?.id || null}
                  onSelectServiceType={setSelectedServiceType}
                />
              </TabsContent>

              <TabsContent value="availability">
                <AvailabilityScheduler serviceType={selectedServiceType} />
              </TabsContent>
            </Tabs>
          </div>
        )}
      </main>
    </div>
  )
}
