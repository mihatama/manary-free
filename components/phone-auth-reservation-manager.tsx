"use client"

import { useState, useEffect } from "react"
import { PhoneVerification } from "@/components/phone-verification"
import { getAppointmentsByPhone } from "@/app/actions/sms-auth-actions"
import { AppointmentList } from "@/components/appointment-list"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { NewReservationFlow } from "@/components/new-reservation-flow"

export function PhoneAuthReservationManager() {
  console.log("[Manager] Component rendering or re-rendering.")

  const [isVerified, setIsVerified] = useState(false)
  const [phoneNumber, setPhoneNumber] = useState("")
  const [appointments, setAppointments] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [viewMode, setViewMode] = useState<"list" | "new">("list")

  // On component mount, check for existing session verification
  useEffect(() => {
    try {
      const storedVerification = sessionStorage.getItem("phoneVerified")
      if (storedVerification) {
        const { phone, timestamp } = JSON.parse(storedVerification)
        // Verification is valid for 30 minutes
        const thirtyMinutes = 30 * 60 * 1000
        if (Date.now() - timestamp < thirtyMinutes) {
          console.log(`[Manager] Found valid session for ${phone}. Skipping SMS auth.`)
          // Set state to reflect verification and load data
          setPhoneNumber(phone)
          setIsVerified(true)
          loadAppointments(phone)
        } else {
          console.log("[Manager] Found expired session. Clearing it.")
          sessionStorage.removeItem("phoneVerified")
        }
      }
    } catch (e) {
      console.error("Could not read from sessionStorage", e)
    }
  }, []) // Empty dependency array ensures this runs only once on mount

  useEffect(() => {
    console.log("[Manager] State changed:", {
      isVerified,
      phoneNumber,
      appointmentsCount: appointments.length,
      isLoading,
      error,
      viewMode,
    })
  }, [isVerified, phoneNumber, appointments, isLoading, error, viewMode])

  // 電話番号認証が完了したときの処理
  const handleVerified = async (verifiedPhoneNumber: string) => {
    console.log(`[Manager] handleVerified called with phone: ${verifiedPhoneNumber}`)
    try {
      const verificationData = { phone: verifiedPhoneNumber, timestamp: Date.now() }
      sessionStorage.setItem("phoneVerified", JSON.stringify(verificationData))
      console.log("[Manager] Stored verification in session.")
    } catch (e) {
      console.error("Could not write to sessionStorage", e)
    }

    setPhoneNumber(verifiedPhoneNumber)
    setIsVerified(true)
    await loadAppointments(verifiedPhoneNumber)
  }

  // 予約一覧を取得
  const loadAppointments = async (phone: string) => {
    console.log(`[Manager] loadAppointments called for phone: ${phone}`)
    setIsLoading(true)
    setError(null)

    const result = await getAppointmentsByPhone(phone)

    if (result.success && result.data) {
      console.log("[Manager] Received data from server:", result.data)
      setAppointments(result.data)
      if (result.data.length === 0) {
        console.log("[Manager] No appointments found for this phone number.")
      }
    } else {
      console.error("[Manager] Error fetching appointments:", result.error)
      setError(result.error || "予約情報の取得に失敗しました")
      setAppointments([]) // エラー時にリストをクリア
    }

    console.log("[Manager] loadAppointments finished.")
    setIsLoading(false)
  }

  const handleReservationComplete = async () => {
    console.log("[Manager] handleReservationComplete called. Reloading appointments.")
    await loadAppointments(phoneNumber)
    setViewMode("list")
    console.log("[Manager] viewMode set to 'list'.")
  }

  const getInitialPatientName = () => {
    if (appointments.length > 0) {
      const name = appointments[0].patient_name
      console.log(`[Manager] getInitialPatientName found name: ${name}`)
      return name
    }
    console.log("[Manager] getInitialPatientName found no existing appointments.")
    return ""
  }

  const handleAddNewReservationClick = () => {
    console.log("[Manager] 'Add new reservation' button clicked. Changing viewMode to 'new'.")
    setViewMode("new")
  }

  const handleBackToListClick = () => {
    console.log("[Manager] 'Back' button clicked. Changing viewMode to 'list'.")
    setViewMode("list")
  }

  console.log("[Manager] Preparing to render UI based on state.")
  if (!isVerified) {
    console.log("[Manager] Rendering PhoneVerification component.")
  } else if (viewMode === "list") {
    console.log("[Manager] Rendering appointments list view.")
  } else {
    console.log("[Manager] Rendering new reservation flow.")
  }

  return (
    <div className="space-y-6">
      {!isVerified ? (
        <PhoneVerification onVerified={handleVerified} buttonText="予約を確認・追加する" />
      ) : viewMode === "list" ? (
        <div className="space-y-6">
          <div className="flex justify-end">
            <Button onClick={handleAddNewReservationClick} className="bg-[#f8a0a0] hover:bg-[#f78989]">
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
          onBack={handleBackToListClick}
          onReservationComplete={handleReservationComplete}
        />
      )}
    </div>
  )
}
