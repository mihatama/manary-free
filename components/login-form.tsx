"use client"

import { useState, useEffect, useActionState } from "react"
import { useFormStatus } from "react-dom"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { EyeIcon, EyeOffIcon } from "lucide-react"
import { loginAction } from "@/app/actions/auth-actions"
import { Alert, AlertDescription } from "@/components/ui/alert"
import Link from "next/link"
import { CSRFForm } from "@/components/csrf-form"

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

  // ログイン成功時にダッシュボードにリダイレクト
  useEffect(() => {
    if (state.status === "success" && !isRedirecting) {
      setIsRedirecting(true)

      // 直接ダッシュボードにリダイレクト
      window.location.href = "/dashboard"
    }
  }, [state.status, isRedirecting])

  if (isRedirecting) {
    return (
      <div className="text-center py-8 space-y-6">
        <div className="py-4">
          <p className="text-lg mb-2">ログインに成功しました。ダッシュボードにリダイレクトしています...</p>
          <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto"></div>
        </div>
      </div>
    )
  }

  return (
    <Card className="w-full shadow-md border-border">
      <CardHeader>
        <CardTitle className="text-xl text-center text-foreground">ログイン</CardTitle>
        <CardDescription className="text-center text-muted-foreground">
          管理者アカウントでログインしてください。
        </CardDescription>
      </CardHeader>
      <CardContent>
        {state.status === "error" && state.errors?.general && (
          <Alert variant="destructive" className="mb-4">
            <AlertDescription>{state.errors.general[0]}</AlertDescription>
          </Alert>
        )}

        <CSRFForm action={formAction} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">メールアドレス</Label>
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="example@manary.care"
              required
              aria-invalid={!!state.errors?.email}
              aria-errormessage={state.errors?.email ? "email-error" : undefined}
            />
            {state.errors?.email && (
              <p id="email-error" className="text-sm text-destructive mt-1">
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
                className={`pr-10 ${state.errors?.password ? "border-destructive" : ""}`}
                aria-invalid={!!state.errors?.password}
                aria-errormessage={state.errors?.password ? "password-error" : undefined}
              />
              <button
                type="button"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? "パスワードを隠す" : "パスワードを表示"}
              >
                {showPassword ? <EyeOffIcon className="h-4 w-4" /> : <EyeIcon className="h-4 w-4" />}
              </button>
            </div>
            {state.errors?.password && (
              <p id="password-error" className="text-sm text-destructive mt-1">
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
                className="rounded border-gray-300 text-primary focus:ring-ring"
              />
              <Label htmlFor="remember" className="text-sm font-normal">
                ログイン状態を保存
              </Label>
            </div>
            <Link href="/reset-password" className="text-sm text-primary hover:underline">
              パスワードをお忘れですか？
            </Link>
          </div>
          <Button type="submit" 
          className="w-full bg-red-300 hover:bg-red-400 text-white font-semibold py-3 px-6 rounded-lg transition duration-200 ease-in-out transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
          disabled={pending}>
            {pending ? "ログイン中..." : "ログイン"}
          </Button>
        </CSRFForm>
      </CardContent>
    </Card>
  )
}
