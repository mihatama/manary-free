'use client'

import { useEffect, useMemo, useState } from "react"

import { ClinicManager } from "@/components/clinic-manager"
import { ServiceTypeManager } from "@/components/service-type-manager"
import { useLocalDataSelector } from "@/lib/storage/local-storage"
import type { Clinic, ServiceType } from "@/types/local-data"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export function ScheduleSettingsClient() {
  const clinics = useLocalDataSelector((data) => data.clinics)
  const serviceTypes = useLocalDataSelector((data) => data.serviceTypes)

  const [selectedClinicId, setSelectedClinicId] = useState<string | null>(null)
  const [selectedServiceTypeId, setSelectedServiceTypeId] = useState<string | null>(null)

  useEffect(() => {
    if (!selectedClinicId && clinics.length > 0) {
      setSelectedClinicId(clinics[0].id)
    }
  }, [clinics, selectedClinicId])

  useEffect(() => {
    if (selectedClinicId) {
      const clinicServiceTypes = serviceTypes.filter((type) => type.clinicId === selectedClinicId)
      if (clinicServiceTypes.length > 0) {
        if (!selectedServiceTypeId || !clinicServiceTypes.some((type) => type.id === selectedServiceTypeId)) {
          setSelectedServiceTypeId(clinicServiceTypes[0].id)
        }
      } else {
        setSelectedServiceTypeId(null)
      }
    } else {
      setSelectedServiceTypeId(null)
    }
  }, [selectedClinicId, serviceTypes, selectedServiceTypeId])

  const selectedClinic: Clinic | null = useMemo(
    () => clinics.find((clinic) => clinic.id === selectedClinicId) ?? null,
    [clinics, selectedClinicId],
  )

  const clinicServiceTypes: ServiceType[] = useMemo(
    () => (selectedClinicId ? serviceTypes.filter((type) => type.clinicId === selectedClinicId) : []),
    [serviceTypes, selectedClinicId],
  )

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200">
        <div className="container mx-auto px-4 py-4">
          <h1 className="text-xl font-bold text-[#f8a0a0]">予約設定</h1>
          <p className="text-sm text-gray-500 mt-1">助産院ごとのサービス内容をブラウザのローカルストレージに保存します。</p>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 space-y-8">
        <Card>
          <CardHeader>
            <CardTitle>助産院の管理</CardTitle>
          </CardHeader>
          <CardContent>
            <ClinicManager clinics={clinics} selectedClinicId={selectedClinicId} onSelectClinic={setSelectedClinicId} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>診療種別の管理</CardTitle>
          </CardHeader>
          <CardContent>
            {selectedClinic ? (
              <ServiceTypeManager
                clinic={selectedClinic}
                serviceTypes={clinicServiceTypes}
                selectedServiceTypeId={selectedServiceTypeId}
                onSelectServiceType={setSelectedServiceTypeId}
              />
            ) : (
              <div className="text-center py-8 border rounded-lg bg-gray-50 text-gray-500">
                助産院を選択すると診療種別を管理できます。
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
