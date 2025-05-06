"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { format } from "date-fns"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { CalendarTimePicker } from "@/components/calendar-time-picker"
import { createAppointment } from "@/app/actions/reservation-actions"
import { getClinics, getServiceTypes, getAvailableTimeSlots } from "@/app/actions/schedule-actions"
import { PhoneVerification } from "@/components/phone-verification"

export function ReservationForm() {
  const router = useRouter()
  const [clinics, setClinics] = useState<any[]>([])
  const [serviceTypes, setServiceTypes] = useState<any[]>([])
  const [selectedClinic, setSelectedClinic] = useState<string>("")
  const [selectedServiceType, setSelectedServiceType] = useState<string>("")
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [selectedTime, setSelectedTime] = useState<string | null>(null)
  const [patientName, setPatientName] = useState("")
  const [patientPhone, setPatientPhone] = useState("")
  const [patientEmail, setPatientEmail] = useState("")
  const [availableTimeSlots, setAvailableTimeSlots] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isVerified, setIsVerified] = useState(false)
  const [verifiedPhone, setVerifiedPhone] = useState("")

  // クリニックを取得
  useEffect(() => {
    const fetchClinics = async () => {
      try {
        const clinicsData = await getClinics()
        setClinics(clinicsData)
        if (clinicsData.length > 0) {
          setSelectedClinic(clinicsData[0].id.toString())
        }
      } catch (error) {
        console.error("クリニック取得エラー:", error)
        setError("クリニックの取得に失敗しました")
      }
    }

    fetchClinics()
  }, [])

  // 選択されたクリニックの診療種別を取得
  useEffect(() => {
    if (!selectedClinic) return

    const fetchServiceTypes = async () => {
      try {
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
      }
    }

    fetchServiceTypes()
  }, [selectedClinic])

  // 利用可能な時間枠を取得
  useEffect(() => {
    if (!selectedServiceType || !selectedDate) return

    const fetchTimeSlots = async () => {
      try {
        setIsLoading(true)
        const formattedDate = format(selectedDate, "yyyy-MM-dd")
        const slots = await getAvailableTimeSlots(Number(selectedServiceType), formattedDate)
        setAvailableTimeSlots(slots)
      } catch (error) {
        console.error("時間枠取得エラー:", error)
        setError("利用可能な時間枠の取得に失敗しました")
      } finally {
        setIsLoading(false)
      }
    }

    fetchTimeSlots()
  }, [selectedServiceType, selectedDate])

  // 電話番号認証が完了したときの処理
  const handleVerified = (phoneNumber: string) => {
    setIsVerified(true)
    setVerifiedPhone(phoneNumber)
    setPatientPhone(phoneNumber)
  }

  // 予約を作成
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!isVerified) {
      setError("電話番号認証が必要です")
      return
    }

    if (!selectedClinic || !selectedServiceType || !selectedDate || !selectedTime || !patientName) {
      setError("すべての必須項目を入力してください")
      return
    }

    setIsLoading(true)

    try {
      // 選択された時間枠から終了時間を取得
      const selectedTimeSlot = availableTimeSlots.find((slot) => slot.startTime === selectedTime)
      if (!selectedTimeSlot) {
        throw new Error("選択された時間枠が見つかりません")
      }

      const formData = new FormData()
      formData.append("clinic_id", selectedClinic)
      formData.append("service_type_id", selectedServiceType)
      formData.append("appointment_date", format(selectedDate, "yyyy-MM-dd"))
      formData.append("start_time", selectedTimeSlot.startTime)
      formData.append("end_time", selectedTimeSlot.endTime)
      formData.append("patient_name", patientName)
      formData.append("patient_phone", verifiedPhone)
      formData.append("patient_email", patientEmail)

      const result = await createAppointment(formData)

      if (result.success) {
        router.push(`/reservation/confirmation?phone=${encodeURIComponent(verifiedPhone)}`)
      } else {
        setError(result.error || "予約の作成に失敗しました")
      }
    } catch (error: any) {
      console.error("予約作成エラー:", error)
      setError(error.message || "予約の作成に失敗しました")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      {!isVerified ? (
        <PhoneVerification onVerified={handleVerified} buttonText="次へ進む" />
      ) : (
        <Card className="shadow-md border-gray-100">
          <CardHeader>
            <CardTitle className="text-xl text-center text-gray-800">予約フォーム</CardTitle>
            <CardDescription className="text-center">希望の日時と詳細を入力してください</CardDescription>
          </CardHeader>
          <CardContent>
            {error && (
              <Alert variant="destructive" className="mb-4">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="clinic">クリニック</Label>
                <Select value={selectedClinic} onValueChange={setSelectedClinic}>
                  <SelectTrigger id="clinic">
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
                <Label htmlFor="service-type">診療種別</Label>
                <Select value={selectedServiceType} onValueChange={setSelectedServiceType}>
                  <SelectTrigger id="service-type">
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

              <div className="space-y-2">
                <Label>日時を選択</Label>
                <CalendarTimePicker
                  selectedDate={selectedDate}
                  onDateChange={setSelectedDate}
                  selectedTime={selectedTime}
                  onTimeChange={setSelectedTime}
                  availableTimeSlots={availableTimeSlots}
                  serviceTypeId={selectedServiceType ? Number(selectedServiceType) : null}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="name">お名前</Label>
                <Input
                  id="name"
                  value={patientName}
                  onChange={(e) => setPatientName(e.target.value)}
                  placeholder="例: 山田 花子"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">電話番号</Label>
                <Input id="phone" value={patientPhone} disabled className="bg-gray-50" />
                <p className="text-xs text-gray-500">認証済みの電話番号を使用します</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">メールアドレス (任意)</Label>
                <Input
                  id="email"
                  type="email"
                  value={patientEmail}
                  onChange={(e) => setPatientEmail(e.target.value)}
                  placeholder="例: example@example.com"
                />
              </div>

              <Button type="submit" className="w-full bg-[#f8a0a0] hover:bg-[#f78989] text-white" disabled={isLoading}>
                {isLoading ? "送信中..." : "予約する"}
              </Button>
            </form>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
