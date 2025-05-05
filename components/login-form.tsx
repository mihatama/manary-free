"use client"

import { useState, useEffect } from "react"
import { useActionState } from "react"
import { useFormStatus } from "react-dom"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { EyeIcon, EyeOffIcon, Calendar, Home } from "lucide-react"
import { loginAction } from "@/app/actions/auth-actions"
import { Alert, AlertDescription } from "@/components/ui/alert"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"

const initialState = {
  status: "idle",
  errors: {},
}

export function LoginForm() {
  const [showPassword, setShowPassword] = useState(false)
  const [state, formAction] = useActionState(loginAction, initialState)
  const { pending } = useFormStatus()
  const router = useRouter()
  const [isRedirecting, setIsRedirecting] = useState(false)
  const [retryCount, setRetryCount] = useState(0)
  const [manualRedirect, setManualRedirect] = useState(false)

  // ログイン成功時にダッシュボードにリダイレクト
  useEffect(() => {
    if (state.status === "success" && !isRedirecting) {
      setIsRedirecting(true)

      // セッションが確実に設定されるのを待つ
      const checkSession = async () => {
        const supabase = createClient()
        const { data } = await supabase.auth.getSession()

        if (data.session) {
          console.log("Session confirmed, redirecting to dashboard")
          router.push("/dashboard")
          router.refresh()
        } else {
          console.log("No session found, retrying in 500ms")
          // 最大5回まで再試行
          if (retryCount < 5) {
            setRetryCount(retryCount + 1)
            setTimeout(checkSession, 500)
          } else {
            // 5回試行しても失敗した場合は手動リダイレクトを促す
            console.log("Max retries reached, suggesting manual navigation")
            setManualRedirect(true)
          }
        }
      }

      checkSession()
    }
  }, [state.status, router, isRedirecting, retryCount])

  if (isRedirecting) {
    return (
      <div className="text-center py-8 space-y-6">
        <div className="py-4">
          <p className="text-lg mb-2">
            {manualRedirect
              ? "自動リダイレクトに失敗しました。以下のリンクをクリックしてください。"
              : "ログインに成功しました。ダッシュボードにリダイレクトしています..."}
          </p>
          {!manualRedirect && (
            <div className="animate-spin w-8 h-8 border-4 border-manary-pink border-t-transparent rounded-full mx-auto"></div>
          )}
        </div>

        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            {manualRedirect
              ? "以下のリンクからページに移動してください："
              : "リダイレクトされない場合は、以下のリンクをクリックしてください："}
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/dashboard"
              className="flex items-center justify-center gap-2 px-4 py-2 bg-manary-pink text-white rounded-md hover:bg-[#f78989] transition-colors"
            >
              <Home className="h-4 w-4" />
              <span>ダッシュボード</span>
            </Link>

            <Link
              href="/dashboard/schedule-settings"
              className="flex items-center justify-center gap-2 px-4 py-2 bg-manary-green text-white rounded-md hover:bg-[#6a946c] transition-colors"
            >
              <Calendar className="h-4 w-4" />
              <span>予約設定画面</span>
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <Card className="w-full shadow-md border-gray-100">
      <CardHeader>
        <CardTitle className="text-xl text-center text-gray-800">マナリー管理システム</CardTitle>
        <CardDescription className="text-center">管理者アカウントでログインしてください</CardDescription>
      </CardHeader>
      <CardContent>
        {state.status === "error" && state.errors?.general && (
          <Alert variant="destructive" className="mb-4">
            <AlertDescription>{state.errors.general[0]}</AlertDescription>
          </Alert>
        )}

        <form action={formAction} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">メールアドレス</Label>
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="example@manary.care"
              required
              className={`border-gray-200 focus:border-[#f8a0a0] focus:ring-[#f8a0a0] ${
                state.errors?.email ? "border-red-500" : ""
              }`}
              aria-invalid={!!state.errors?.email}
              aria-errormessage={state.errors?.email ? "email-error" : undefined}
            />
            {state.errors?.email && (
              <p id="email-error" className="text-sm text-red-500 mt-1">
                {state.errors.email[0]}
              </p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">パスワード</Label>
            <div className="relative">
              <Input
                id="password"
                name="password"
                type={showPassword ? "text" : "password"}
                placeholder="パスワードを入力"
                required
                className={`border-gray-200 focus:border-[#f8a0a0] focus:ring-[#f8a0a0] pr-10 ${
                  state.errors?.password ? "border-red-500" : ""
                }`}
                aria-invalid={!!state.errors?.password}
                aria-errormessage={state.errors?.password ? "password-error" : undefined}
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
            {state.errors?.password && (
              <p id="password-error" className="text-sm text-red-500 mt-1">
                {state.errors.password[0]}
              </p>
            )}
          </div>
          <div className="flex items-center justify-between pt-2">
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="remember"
                name="remember"
                className="rounded border-gray-300 text-[#f8a0a0] focus:ring-[#f8a0a0]"
              />
              <Label htmlFor="remember" className="text-sm font-normal">
                ログイン状態を保存
              </Label>
            </div>
            <Link href="/reset-password" className="text-sm text-[#f8a0a0] hover:underline">
              パスワードをお忘れですか？
            </Link>
          </div>
          <Button type="submit" className="w-full bg-[#f8a0a0] hover:bg-[#f78989] text-white" disabled={pending}>
            {pending ? "ログイン中..." : "ログイン"}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
