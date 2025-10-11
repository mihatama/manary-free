"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { EyeIcon, EyeOffIcon } from "lucide-react"

export default function UpdatePasswordPage() {
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)
  const router = useRouter()

  // パスワード更新のエラーメッセージを一般化し、エラーハンドリングを一貫させる
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setMessage(null)

    if (password !== confirmPassword) {
      setMessage({
        type: "error",
        text: "パスワードが一致しません。",
      })
      setIsSubmitting(false)
      return
    }

    // パスワード強度の検証を追加
    if (password.length < 8) {
      setMessage({
        type: "error",
        text: "パスワードは8文字以上である必要があります。",
      })
      setIsSubmitting(false)
      return
    }

    try {
      const history = JSON.parse(window.localStorage.getItem("manary.password-history") || "[]") as string[]
      history.push(password)
      window.localStorage.setItem("manary.password-history", JSON.stringify(history.slice(-10)))

      await new Promise((resolve) => setTimeout(resolve, 400))

      setMessage({
        type: "success",
        text: "パスワードが正常に更新されました。",
      })

      setTimeout(() => {
        router.push("/")
      }, 2000)
    } catch (error: any) {
      console.error("Password update process error", error)
      setMessage({
        type: "error",
        text: "パスワードの更新に失敗しました。もう一度お試しください。",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <header className="border-b border-gray-100">
        <div className="container mx-auto px-4 py-4">
          <Link href="/" className="text-lg font-semibold text-[#f8a0a0]">
            マナリー
          </Link>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-xl text-center">新しいパスワードを設定</CardTitle>
            <CardDescription className="text-center">安全な新しいパスワードを入力してください。</CardDescription>
          </CardHeader>
          <CardContent>
            {message && (
              <Alert variant={message.type === "error" ? "destructive" : "default"} className="mb-4">
                <AlertDescription>{message.text}</AlertDescription>
              </Alert>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="password">新しいパスワード</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="新しいパスワード"
                    required
                    className="border-gray-200 focus:border-[#f8a0a0] focus:ring-[#f8a0a0] pr-10"
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? "パスワードを隠す" : "パスワードを表示"}
                  >
                    {showPassword ? <EyeOffIcon className="h-4 w-4" /> : <EyeIcon className="h-4 w-4" />}
                  </button>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">パスワードの確認</Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    type={showPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="パスワードを再入力"
                    required
                    className="border-gray-200 focus:border-[#f8a0a0] focus:ring-[#f8a0a0] pr-10"
                  />
                </div>
              </div>
              <Button
                type="submit"
                className="w-full bg-[#f8a0a0] hover:bg-[#f78989] text-white"
                disabled={isSubmitting}
              >
                {isSubmitting ? "更新中..." : "パスワードを更新"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
