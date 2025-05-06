"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useCSRF } from "@/hooks/use-csrf"

interface PhoneVerificationProps {
  onVerified: (phoneNumber: string) => void
  buttonText?: string
}

export function PhoneVerification({ onVerified, buttonText = "認証する" }: PhoneVerificationProps) {
  const [phoneNumber, setPhoneNumber] = useState("")
  const [verificationCode, setVerificationCode] = useState("")
  const [isCodeSent, setIsCodeSent] = useState(false)
  const [isVerifying, setIsVerifying] = useState(false)
  const [isSending, setIsSending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [countdown, setCountdown] = useState(0)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [devCode, setDevCode] = useState<string | null>(null)

  const { csrfToken, isLoading: isLoadingCSRF } = useCSRF()

  // 電話番号のフォーマットをチェック
  const isValidPhoneNumber = (phone: string) => {
    // 日本の電話番号形式（ハイフンあり・なし両対応）
    return /^(0[0-9]{9,10}|0[0-9]{1,4}-[0-9]{1,4}-[0-9]{2,4})$/.test(phone)
  }

  // 認証コードを送信
  const handleSendCode = async () => {
    setError(null)
    setSuccessMessage(null)
    setDevCode(null)

    if (!isValidPhoneNumber(phoneNumber)) {
      setError("有効な電話番号を入力してください")
      return
    }

    setIsSending(true)

    try {
      const formData = new FormData()
      formData.append("phone_number", phoneNumber)

      // CSRFトークンがある場合のみ追加
      if (csrfToken) {
        formData.append("csrf_token", csrfToken)
      }

      const response = await fetch("/api/send-verification-code", {
        method: "POST",
        body: formData,
      })

      let data
      try {
        data = await response.json()
      } catch (jsonError) {
        console.error("JSON parsing error:", jsonError)
        const text = await response.text()
        throw new Error(`Response is not valid JSON: ${text.substring(0, 100)}...`)
      }

      if (data.success) {
        setIsCodeSent(true)
        setSuccessMessage("認証コードを送信しました。SMSをご確認ください。")

        // If we're in development and have a dev code, show it and auto-fill
        if (data.devCode) {
          setDevCode(data.devCode)
          setVerificationCode(data.devCode)
        }

        // カウントダウンを開始（60秒）
        setCountdown(60)
        const timer = setInterval(() => {
          setCountdown((prev) => {
            if (prev <= 1) {
              clearInterval(timer)
              return 0
            }
            return prev - 1
          })
        }, 1000)
      } else {
        setError(data.error || "認証コードの送信に失敗しました")
        console.error("API error details:", data.details || "No details provided")
      }
    } catch (err: any) {
      console.error("認証コード送信エラー:", err)
      setError(`認証コードの送信に失敗しました: ${err.message || "Unknown error"}`)
    } finally {
      setIsSending(false)
    }
  }

  // 認証コードを検証
  const handleVerifyCode = async () => {
    setError(null)
    setSuccessMessage(null)

    if (!verificationCode || verificationCode.length !== 6) {
      setError("6桁の認証コードを入力してください")
      return
    }

    setIsVerifying(true)

    try {
      const formData = new FormData()
      formData.append("phone_number", phoneNumber)
      formData.append("code", verificationCode)

      // CSRFトークンがある場合のみ追加
      if (csrfToken) {
        formData.append("csrf_token", csrfToken)
      }

      const response = await fetch("/api/verify-code", {
        method: "POST",
        body: formData,
      })

      let data
      try {
        data = await response.json()
      } catch (jsonError) {
        console.error("JSON parsing error:", jsonError)
        const text = await response.text()
        throw new Error(`Response is not valid JSON: ${text.substring(0, 100)}...`)
      }

      if (data.success) {
        // 認証成功
        setSuccessMessage("電話番号認証が完了しました")
        setTimeout(() => {
          onVerified(phoneNumber)
        }, 1000)
      } else {
        setError(data.error || "認証コードが無効です")
      }
    } catch (err: any) {
      console.error("認証コード検証エラー:", err)
      setError(`認証に失敗しました: ${err.message || "Unknown error"}`)
    } finally {
      setIsVerifying(false)
    }
  }

  // For development: auto-fill the verification code
  const handleAutoFill = () => {
    if (devCode) {
      setVerificationCode(devCode)
    }
  }

  return (
    <Card className="shadow-md border-gray-100">
      <CardHeader>
        <CardTitle className="text-xl text-center text-gray-800">電話番号認証</CardTitle>
        <CardDescription className="text-center">
          {isCodeSent ? "SMSで送信された6桁の認証コードを入力してください" : "予約には電話番号認証が必要です"}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {successMessage && (
          <Alert className="mb-4 bg-green-50 border-green-200">
            <AlertDescription className="text-green-700">{successMessage}</AlertDescription>
          </Alert>
        )}

        <div className="space-y-4">
          {!isCodeSent ? (
            <>
              <div className="space-y-2">
                <Label htmlFor="phone-number">電話番号</Label>
                <Input
                  id="phone-number"
                  type="tel"
                  placeholder="例: 09012345678"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  disabled={isSending}
                />
                <p className="text-xs text-gray-500">ハイフンあり・なしどちらでも入力できます</p>
              </div>
              <Button
                onClick={handleSendCode}
                className="w-full bg-[#f8a0a0] hover:bg-[#f78989] text-white"
                disabled={isSending || !phoneNumber || isLoadingCSRF}
              >
                {isSending ? "送信中..." : "認証コードを送信"}
              </Button>
            </>
          ) : (
            <>
              <div className="space-y-2">
                <Label htmlFor="verification-code">認証コード</Label>
                <Input
                  id="verification-code"
                  type="text"
                  placeholder="6桁の認証コード"
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value)}
                  maxLength={6}
                  disabled={isVerifying}
                />
                {countdown > 0 && <p className="text-xs text-gray-500">再送信まで {countdown} 秒</p>}
              </div>
              <div className="flex flex-col space-y-2">
                <Button
                  onClick={handleVerifyCode}
                  className="w-full bg-[#f8a0a0] hover:bg-[#f78989] text-white"
                  disabled={isVerifying || !verificationCode}
                >
                  {isVerifying ? "認証中..." : buttonText}
                </Button>
                {countdown === 0 && (
                  <Button variant="outline" onClick={handleSendCode} disabled={isSending} className="w-full">
                    {isSending ? "送信中..." : "認証コードを再送信"}
                  </Button>
                )}
              </div>
            </>
          )}
        </div>

        {/* Development mode helper */}
        {devCode && (
          <div className="mt-4 p-3 bg-yellow-50 rounded-md border border-yellow-200">
            <p className="text-sm text-yellow-700 font-medium">開発モード: 認証コード</p>
            <div className="flex items-center justify-between mt-1">
              <code className="bg-white px-2 py-1 rounded text-sm">{devCode}</code>
              <Button variant="outline" size="sm" onClick={handleAutoFill} className="text-xs">
                自動入力
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
