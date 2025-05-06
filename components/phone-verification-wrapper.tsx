"use client"

import { useRouter } from "next/navigation"
import { PhoneVerification } from "@/components/phone-verification"

interface PhoneVerificationWrapperProps {
  clinicId: string
  serviceTypeId: string
  date: string
  startTime: string
  endTime: string
  buttonText?: string
}

export function PhoneVerificationWrapper({
  clinicId,
  serviceTypeId,
  date,
  startTime,
  endTime,
  buttonText = "次へ進む",
}: PhoneVerificationWrapperProps) {
  const router = useRouter()

  const handleVerified = (phoneNumber: string) => {
    // 認証完了後、同じページに電話番号を付けてリダイレクト
    router.push(
      `/reservation/new?clinicId=${clinicId}&serviceTypeId=${serviceTypeId}&date=${date}&startTime=${startTime}&endTime=${endTime}&phone=${phoneNumber}&verified=true`,
    )
  }

  return <PhoneVerification onVerified={handleVerified} buttonText={buttonText} />
}
