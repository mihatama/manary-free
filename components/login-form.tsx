"use client"

import { useState } from "react"
import { useFormState, useFormStatus } from "react-dom"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { EyeIcon, EyeOffIcon } from "lucide-react"
import { loginAction } from "@/app/actions/auth-actions"
import { Alert, AlertDescription } from "@/components/ui/alert"

const initialState = {
  status: "idle",
  errors: {},
}

export function LoginForm() {
  const [showPassword, setShowPassword] = useState(false)
  const [state, formAction] = useFormState(loginAction, initialState)
  const { pending } = useFormStatus()
  const router = useRouter()

  // ログイン成功時にダッシュボードにリダイレクト
  if (state.status === "success") {
    router.push("/dashboard")
    return null
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
            <a href="#" className="text-sm text-[#f8a0a0] hover:underline">
              パスワードをお忘れですか？
            </a>
          </div>
          <Button type="submit" className="w-full bg-[#f8a0a0] hover:bg-[#f78989] text-white" disabled={pending}>
            {pending ? "ログイン中..." : "ログイン"}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
