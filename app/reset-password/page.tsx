"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import Link from "next/link"

export default function ResetPasswordPage() {
  const [email, setEmail] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setMessage(null)

    try {
      const existing = JSON.parse(window.localStorage.getItem("manary.password-reset-requests") || "[]") as string[]
      if (!existing.includes(email)) {
        existing.push(email)
        window.localStorage.setItem("manary.password-reset-requests", JSON.stringify(existing))
      }

      await new Promise((resolve) => setTimeout(resolve, 400))

      setMessage({
        type: "success",
        text: "パスワードリセット依頼を記録しました。サポート担当者からの連絡をお待ちください。",
      })
    } catch (error: any) {
      console.error("Password reset process error", error)
      setMessage({
        type: "error",
        text: "パスワードリセットの記録に失敗しました。もう一度お試しください。",
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
            Manary
          </Link>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center bg-[#ffeaed] p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-xl text-center">パスワードをリセット</CardTitle>
            <CardDescription className="text-center">
              登録したメールアドレスを入力してください。パスワードリセット用のリンクを送信します。
            </CardDescription>
          </CardHeader>
          <CardContent>
            {message && (
              <Alert variant={message.type === "error" ? "destructive" : "default"} className="mb-4">
                <AlertDescription>{message.text}</AlertDescription>
              </Alert>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">メールアドレス</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="example@manary.care"
                  required
                  className="border-gray-200 focus:border-[#f8a0a0] focus:ring-[#f8a0a0]"
                />
              </div>
              <Button
                type="submit"
                className="w-full bg-[#f8a0a0] hover:bg-[#f78989] text-white"
                disabled={isSubmitting}
              >
                {isSubmitting ? "送信中..." : "リセットリンクを送信"}
              </Button>
              <div className="text-center mt-4">
                <Link href="/" className="text-sm text-[#f8a0a0] hover:underline">
                  ログインページに戻る
                </Link>
              </div>
            </form>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
