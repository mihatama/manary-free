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
import { CalendarReservation } from "@/components/calendar-reservation"
import { createAppointment } from "@/app/actions/reservation-actions"
import { getClinics, getServiceTypes } from "@/app/actions/schedule-actions"
import { PhoneVerification } from "@/components/phone-verification"
import { useCSRF } from "@/hooks/use-csrf"

export function ReservationForm() {
  const router = useRouter()
  const [clinics, setClinics] = useState<any[]>([])
  const { csrfToken, isLoading: isLoadingCSRF, error: csrfError } = useCSRF()
  const [serviceTypes, setServiceTypes] = useState<any[]>([])
  const [selectedClinic, setSelectedClinic] = useState<string>("")
  const [selectedServiceType, setSelectedServiceType] = useState<string>("")
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [selectedTime, setSelectedTime] = useState<{ start: string; end: string } | null>(null)
  const [patientName, setPatientName] = useState("")
  const [patientPhone, setPatientPhone] = useState("")
  const [patientEmail, setPatientEmail] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isVerified, setIsVerified] = useState(false)
  const [verifiedPhone, setVerifiedPhone] = useState("")
  const [activeTab, setActiveTab] = useState<string>("calendar")

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

  // 開発環境では電話番号認証をスキップするオプションを追加します
  useEffect(() => {
    if (process.env.NODE_ENV !== "production" && !isVerified) {
      // 開発環境では自動的に認証済みとするオプション
      // 必要に応じてコメントアウトを外してください
      // setIsVerified(true);
      // setVerifiedPhone("09012345678");
      // setPatientPhone("09012345678");
    }
  }, [isVerified])

  // 電話番号認証が完了したときの処理
  const handleVerified = (phoneNumber: string) => {
    setIsVerified(true)
    setVerifiedPhone(phoneNumber)
    setPatientPhone(phoneNumber)
  }

  // カレンダーから日時が選択されたときの処理
  const handleDateTimeSelect = (date: Date, startTime: string, endTime: string) => {
    setSelectedDate(date)
    setSelectedTime({ start: startTime, end: endTime })
  }

  // 予約を作成
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!isVerified) {
      setError("電話番号認証が必要です")
      return
    }

    if (!csrfToken) {
      setError("セキュリティトークンが利用できません。ページを再読み込みしてください。")
      return
    }

    if (!selectedClinic || !selectedServiceType || !selectedDate || !selectedTime || !patientName) {
      setError("すべての必須項目を入力してください")
      return
    }

    setIsLoading(true)

    try {
      const formData = new FormData()
      formData.append("csrf_token", csrfToken)
      formData.append("clinic_id", selectedClinic)
      formData.append("service_type_id", selectedServiceType)
      formData.append("appointment_date", format(selectedDate, "yyyy-MM-dd"))
      formData.append("start_time", selectedTime.start)
      formData.append("end_time", selectedTime.end)
      formData.append("patient_name", patientName)
      formData.append("patient_phone", verifiedPhone)
      formData.append("patient_email", patientEmail)

      const result = await createAppointment(formData)

      if (result.success) {
        router.push(`/reservation/confirmation?token=${result.appointment.token}`)
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
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
              </div>

              <div className="space-y-2">
                <Label>日時を選択</Label>
                <CalendarReservation
                  clinicId={Number(selectedClinic)}
                  serviceTypeId={Number(selectedServiceType)}
                  onSelectDateTime={handleDateTimeSelect}
                />
              </div>

              {selectedDate && selectedTime && (
                <div className="p-3 bg-blue-50 rounded-md border border-blue-100">
                  <p className="text-blue-700 font-medium">
                    選択された日時: {format(selectedDate, "yyyy年MM月dd日(EEE)")} {selectedTime.start} -{" "}
                    {selectedTime.end}
                  </p>
                </div>
              )}

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

              <Button
                type="submit"
                className="w-full bg-[#f8a0a0] hover:bg-[#f78989] text-white"
                disabled={isLoading || isLoadingCSRF || !selectedDate || !selectedTime}
              >
                {isLoading ? "送信中..." : "予約する"}
              </Button>
            </form>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
