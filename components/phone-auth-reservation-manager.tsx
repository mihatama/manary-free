"use client"

import { useState, useEffect, Suspense } from "react"
import { PhoneVerification } from "@/components/phone-verification"
import { getAppointmentsByPhone } from "@/app/actions/sms-auth-actions"
import { AppointmentList } from "@/components/appointment-list"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useSearchParams } from "next/navigation"

// Create a client component that uses useSearchParams
function PhoneAuthContent() {
  const [isVerified, setIsVerified] = useState(false)
  const [phoneNumber, setPhoneNumber] = useState("")
  const [appointments, setAppointments] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // useSearchParams hook
  const searchParams = useSearchParams()

  // 予約一覧を取得する関数
  const loadAppointments = async (phone: string) => {
    setIsLoading(true)
    setError(null)

    try {
      const data = await getAppointmentsByPhone(phone)
      setAppointments(data)

      if (data.length === 0) {
        setError("予約が見つかりませんでした")
      }
    } catch (err: any) {
      setError(err.message || "予約情報の取得に失敗しました")
    } finally {
      setIsLoading(false)
    }
  }

  // 電話番号認証が完了したときの処理
  const handleVerified = async (verifiedPhoneNumber: string) => {
    setPhoneNumber(verifiedPhoneNumber)
    setIsVerified(true)
    await loadAppointments(verifiedPhoneNumber)
  }

  // URLから電話番号を取得して自動認証
  useEffect(() => {
    const phoneParam = searchParams?.get("phone")
    if (phoneParam && !isVerified) {
      handleVerified(phoneParam)
    }
  }, [searchParams, isVerified])

  return (
    <div className="space-y-6">
      {!isVerified ? (
        <PhoneVerification onVerified={handleVerified} buttonText="予約を確認" />
      ) : (
        <div className="space-y-6">
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
            <div className="text-center py-8">
              <p className="text-gray-500">予約が見つかりませんでした</p>
              <button
                className="mt-4 text-[#f8a0a0] hover:underline"
                onClick={() => {
                  setIsVerified(false)
                  setPhoneNumber("")
                }}
              >
                別の電話番号で確認する
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// Main component that wraps the content in Suspense
export function PhoneAuthReservationManager() {
  return (
    <Suspense fallback={<div className="text-center py-8">読み込み中...</div>}>
      <PhoneAuthContent />
    </Suspense>
  )
}
