"use client"

import { useState, useEffect } from "react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { getClinics } from "@/app/actions/schedule-actions"
import type { Database } from "@/lib/supabase/database.types"

type Clinic = Database["public"]["Tables"]["clinics"]["Row"]

interface ClinicSelectorProps {
  selectedClinicId: number | null
  onSelectClinic: (clinicId: number) => void
}

export function ClinicSelector({ selectedClinicId, onSelectClinic }: ClinicSelectorProps) {
  const [clinics, setClinics] = useState<Clinic[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function loadClinics() {
      try {
        setIsLoading(true)
        const data = await getClinics()
        setClinics(data)

        // 初期選択
        if (data.length > 0 && !selectedClinicId) {
          onSelectClinic(data[0].id)
        }
      } catch (err) {
        setError("助産院の読み込みに失敗しました")
        console.error(err)
      } finally {
        setIsLoading(false)
      }
    }

    loadClinics()
  }, [selectedClinicId, onSelectClinic])

  if (isLoading) {
    return <div className="text-sm text-gray-500">読み込み中...</div>
  }

  if (error) {
    return <div className="text-sm text-red-500">{error}</div>
  }

  return (
    <Select
      value={selectedClinicId?.toString() || ""}
      onValueChange={(value) => onSelectClinic(Number.parseInt(value))}
    >
      <SelectTrigger className="w-full md:w-[300px]">
        <SelectValue placeholder="助産院を選択" />
      </SelectTrigger>
      <SelectContent>
        {clinics.map((clinic) => (
          <SelectItem key={clinic.id} value={clinic.id.toString()}>
            {clinic.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
