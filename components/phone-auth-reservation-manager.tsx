"use client"

import { useState } from "react"
import { PhoneVerification } from "@/components/phone-verification"
import { getAppointmentsByPhone } from "@/app/actions/sms-auth-actions"
import { AppointmentList } from "@/components/appointment-list"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { NewReservationFlow } from "@/components/new-reservation-flow"

export function PhoneAuthReservationManager() {
  const [isVerified, setIsVerified] = useState(false)
  const [phoneNumber, setPhoneNumber] = useState("")
  const [appointments, setAppointments] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [viewMode, setViewMode] = useState<"list" | "new">("list")

  // 電話番号認証が完了したときの処理
  const handleVerified = async (verifiedPhoneNumber: string) => {
    setPhoneNumber(verifiedPhoneNumber)
    setIsVerified(true)
    await loadAppointments(verifiedPhoneNumber)
  }

  // 予約一覧を取得
  const loadAppointments = async (phone: string) => {
    setIsLoading(true)
    setError(null)

    try {
      const data = await getAppointmentsByPhone(phone)
      setAppointments(data)

      if (data.length === 0) {
        // This is not an error, just no appointments found.
        // The UI will handle displaying the message.
      }
    } catch (err: any) {
      setError(err.message || "予約情報の取得に失敗しました")
    } finally {
      setIsLoading(false)
    }
  }

  const handleReservationComplete = async () => {
    await loadAppointments(phoneNumber)
    setViewMode("list")
  }

  const getInitialPatientName = () => {
    if (appointments.length > 0) {
      return appointments[0].patient_name
    }
    return ""
  }

  return (
    <div className="space-y-6">
      {!isVerified ? (
        <PhoneVerification onVerified={handleVerified} buttonText="予約を確認・追加する" />
      ) : viewMode === "list" ? (
        <div className="space-y-6">
          <div className="flex justify-end">
            <Button onClick={() => setViewMode("new")} className="bg-[#f8a0a0] hover:bg-[#f78989]">
              新しい予約を追加する
            </Button>
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {isLoading ? (
            <div className="text-center py-8">
              <p className="text-gray-500">予約情報を読み込み中...</p>
            </div>
          ) : appointments.length > 0 ? (
            <AppointmentList appointments={appointments} phoneNumber={phoneNumber} onUpdate={loadAppointments} />
          ) : (
            <div className="text-center py-8 border rounded-lg bg-gray-50">
              <p className="text-gray-500">有効な予約が見つかりませんでした。</p>
            </div>
          )}
        </div>
      ) : (
        <NewReservationFlow
          phoneNumber={phoneNumber}
          initialPatientName={getInitialPatientName()}
          onBack={() => setViewMode("list")}
          onReservationComplete={handleReservationComplete}
        />
      )}
    </div>
  )
}
