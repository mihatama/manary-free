"use client"

import { PhoneAuthReservationManager } from "@/components/phone-auth-reservation-manager"
import { NewReservationFlow } from "@/components/new-reservation-flow"
import { useRouter } from "next/navigation"

export default function NewCalendarPage() {
  const router = useRouter()

  const handleReservationComplete = (token: string) => {
    router.push(`/reservation/confirmation?token=${token}`)
  }

  return (
    <div className="container mx-auto p-4">
      <PhoneAuthReservationManager>
        {({ phoneNumber, patientName, onBack }) => (
          <NewReservationFlow
            phoneNumber={phoneNumber}
            initialPatientName={patientName}
            onBack={onBack}
            onReservationComplete={handleReservationComplete}
          />
        )}
      </PhoneAuthReservationManager>
    </div>
  )
}
