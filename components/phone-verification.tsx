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
  const [testCode, setTestCode] = useState<string | null>(null)
  const [debugInfo, setDebugInfo] = useState<any>(null)

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
    setTestCode(null)
    setDebugInfo(null)

    if (!isValidPhoneNumber(phoneNumber)) {
      setError("有効な電話番号を入力してください")
      return
    }

    setIsSending(true)

    try {
      console.log("Sending verification code to:", phoneNumber)

      const formData = new FormData()
      formData.append("phone_number", phoneNumber)

      // CSRFトークンがある場合のみ追加
      if (csrfToken) {
        formData.append("csrf_token", csrfToken)
      }

      console.log("Sending request to /api/send-verification-code")
      const response = await fetch("/api/send-verification-code", {
        method: "POST",
        body: formData,
      })

      console.log("Response status:", response.status)

      // レスポンスデータを取得
      let data
      try {
        data = await response.json()
        console.log("Response data:", data)

        // デバッグ情報を保存
        if (data.debug) {
          setDebugInfo(data.debug)
        }
      } catch (jsonError) {
        console.error("Failed to parse JSON response:", jsonError)
        throw new Error("サーバーからの応答を解析できませんでした")
      }

      // レスポンスが正常でない場合のエラーハンドリング
      if (!response.ok) {
        let errorMessage = data?.error || "認証コードの送信に失敗しました"

        // 詳細なエラー情報があれば追加
        if (data?.details) {
          errorMessage += `: ${data.details}`
        }

        throw new Error(errorMessage)
      }

      if (data.success) {
        setIsCodeSent(true)

        // 開発環境のモックモードの場合はコードを表示
        if (data.mockCode) {
          setTestCode(data.mockCode)
        }

        // 送信ステータスを確認
        if (data.verifyStatus === "failed") {
          setSuccessMessage(
            `認証コードを送信しました。問題が発生した場合は、表示されたテストコードを使用してください。`,
          )
          if (data.verifyError) {
            console.warn("Verification error:", data.verifyError)
          }
        } else {
          setSuccessMessage(data.message || "認証コードを送信しました。SMSをご確認ください。")
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
        console.error("API error:", data.error)
        let errorMessage = data.error || "認証コードの送信に失敗しました"

        // 詳細なエラー情報があれば追加
        if (data.details) {
          errorMessage += `: ${data.details}`
        }

        setError(errorMessage)
      }
    } catch (err: any) {
      console.error("認証コード送信エラー:", err)
      setError(err.message || "認証コードの送信に失敗しました")
    } finally {
      setIsSending(false)
    }
  }

  // 認証コードを検証
  const handleVerifyCode = async () => {
    setError(null)
    setSuccessMessage(null)

    if (!verificationCode || verificationCode.length < 4) {
      setError("有効な認証コードを入力してください")
      return
    }

    setIsVerifying(true)

    try {
      console.log("Verifying code for:", phoneNumber, "Code:", verificationCode)

      const formData = new FormData()
      formData.append("phone_number", phoneNumber)
      formData.append("code", verificationCode)

      // CSRFトークンがある場合のみ追加
      if (csrfToken) {
        formData.append("csrf_token", csrfToken)
      }

      console.log("Sending request to /api/verify-code")
      const response = await fetch("/api/verify-code", {
        method: "POST",
        body: formData,
      })

      console.log("Response status:", response.status)

      // レスポンスデータを取得
      let data
      try {
        data = await response.json()
        console.log("Response data:", data)
      } catch (jsonError) {
        console.error("Failed to parse JSON response:", jsonError)
        throw new Error("サーバーからの応答を解析できませんでした")
      }

      // レスポンスが正常でない場合のエラーハンドリング
      if (!response.ok) {
        let errorMessage = data?.error || "認証に失敗しました"

        // 詳細なエラー情報があれば追加
        if (data?.details) {
          errorMessage += `: ${data.details}`
        }

        throw new Error(errorMessage)
      }

      if (data.success) {
        // 認証成功
        setSuccessMessage("電話番号認証が完了しました")
        setTimeout(() => {
          onVerified(phoneNumber)
        }, 1000)
      } else {
        console.error("API error:", data.error)
        let errorMessage = data.error || "認証コードが無効です"

        // 詳細なエラー情報があれば追加
        if (data.details) {
          errorMessage += `: ${data.details}`
        }

        setError(errorMessage)
      }
    } catch (err: any) {
      console.error("認証コード検証エラー:", err)
      setError(err.message || "認証に失敗しました")
    } finally {
      setIsVerifying(false)
    }
  }

  return (
    <Card className="shadow-md border-gray-100">
      <CardHeader>
        <CardTitle className="text-xl text-center text-gray-800">電話番号認証</CardTitle>
        <CardDescription className="text-center">
          {isCodeSent ? "SMSで送信された認証コードを入力してください" : "予約には電話番号認証が必要です"}
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

        {testCode && (
          <Alert className="mb-4 bg-blue-50 border-blue-200">
            <AlertDescription className="text-blue-700">
              開発環境: テスト認証コード「{testCode}」を使用してください
            </AlertDescription>
          </Alert>
        )}

        {debugInfo && process.env.NODE_ENV !== "production" && (
          <div className="mb-4 p-2 bg-gray-100 rounded text-xs overflow-auto max-h-40">
            <p className="font-bold mb-1">デバッグ情報:</p>
            <pre>{JSON.stringify(debugInfo, null, 2)}</pre>
          </div>
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
                  placeholder="認証コード"
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
      </CardContent>
    </Card>
  )
}
