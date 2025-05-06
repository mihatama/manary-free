"use client"

import { useState, useEffect } from "react"
import { ReservationCalendar } from "@/components/reservation-calendar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { getClinics, getServiceTypes } from "@/app/actions/schedule-actions"
import { Alert, AlertDescription } from "@/components/ui/alert"

export function ReservationCalendarView() {
  const [clinics, setClinics] = useState<any[]>([])
  const [serviceTypes, setServiceTypes] = useState<any[]>([])
  const [selectedClinic, setSelectedClinic] = useState<string>("")
  const [selectedServiceType, setSelectedServiceType] = useState<string>("")
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // クリニックを取得
  useEffect(() => {
    const fetchClinics = async () => {
      try {
        setIsLoading(true)
        const clinicsData = await getClinics()
        setClinics(clinicsData)
        if (clinicsData.length > 0) {
          setSelectedClinic(clinicsData[0].id.toString())
        }
      } catch (error) {
        console.error("クリニック取得エラー:", error)
        setError("クリニックの取得に失敗しました")
      } finally {
        setIsLoading(false)
      }
    }

    fetchClinics()
  }, [])

  // 選択されたクリニックの診療種別を取得
  useEffect(() => {
    if (!selectedClinic) return

    const fetchServiceTypes = async () => {
      try {
        setIsLoading(true)
        const serviceTypesData = await getServiceTypes(Number(selectedClinic))
        setServiceTypes(serviceTypesData)
        if (serviceTypesData.length > 0) {
          setSelectedServiceType(serviceTypesData[0].id.toString())
        } else {
          setSelectedServiceType("")
        }
      } catch (error) {
        console.error("診療種別取得エラー:", error)
        setError("診療種別の取得に失敗しました")
      } finally {
        setIsLoading(false)
      }
    }

    fetchServiceTypes()
  }, [selectedClinic])

  return (
    <div className="space-y-6">
      <Card className="shadow-md border-gray-100">
        <CardHeader>
          <CardTitle className="text-xl text-center text-gray-800">予約カレンダー</CardTitle>
          <CardDescription className="text-center">希望の日時を選択して予約を行ってください</CardDescription>
        </CardHeader>
        <CardContent>
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">クリニック</label>
                <Select value={selectedClinic} onValueChange={setSelectedClinic} disabled={isLoading}>
                  <SelectTrigger>
                    <SelectValue placeholder="クリニックを選択" />
                  </SelectTrigger>
                  <SelectContent>
                    {clinics.map((clinic) => (
                      <SelectItem key={clinic.id} value={clinic.id.toString()}>
                        {clinic.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">診療種別</label>
                <Select
                  value={selectedServiceType}
                  onValueChange={setSelectedServiceType}
                  disabled={isLoading || !selectedClinic || serviceTypes.length === 0}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="診療種別を選択" />
                  </SelectTrigger>
                  <SelectContent>
                    {serviceTypes.map((type) => (
                      <SelectItem key={type.id} value={type.id.toString()}>
                        {type.name} ({type.duration}分)
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {selectedClinic && selectedServiceType ? (
              <ReservationCalendar clinicId={Number(selectedClinic)} serviceTypeId={Number(selectedServiceType)} />
            ) : (
              <div className="text-center py-8 text-gray-500">クリニックと診療種別を選択してください</div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
