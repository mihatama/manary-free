"use client"

import type React from "react"

import { useState } from "react"
import { getSupabaseBrowser } from "@/lib/supabase/client"
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
      // 現在のURLからベースURLを取得（Vercel環境でも動作するように）
      const baseUrl = window.location.origin
      const supabase = getSupabaseBrowser()

      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${baseUrl}/update-password`,
      })

      if (error) {
        // 詳細なエラーはログにのみ記録
        console.error("Password reset request failed")
        throw new Error("パスワードリセットに失敗しました")
      }

      setMessage({
        type: "success",
        text: "パスワードリセットのリンクをメールで送信しました。メールをご確認ください。",
      })
    } catch (error: any) {
      // 詳細なエラーはログにのみ記録
      console.error("Password reset process error")

      // ユーザーには一般的なメッセージのみを表示
      setMessage({
        type: "error",
        text: "パスワードリセット処理に失敗しました。メールアドレスを確認してもう一度お試しください。",
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
