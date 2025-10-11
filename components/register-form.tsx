"use client"

import { useState, useActionState } from "react"
import Link from "next/link"
import { EyeIcon, EyeOffIcon } from "lucide-react"

import { registerAction } from "@/app/actions/auth-actions"
import { CSRFForm } from "@/components/csrf-form"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

type RegisterFormState = {
  status: "idle" | "error" | "success"
  errors?: {
    email?: string[]
    password?: string[]
    confirmPassword?: string[]
    general?: string[]
  }
  message?: string
}

const initialState: RegisterFormState = {
  status: "idle",
  errors: {},
  message: undefined,
}

export function RegisterForm() {
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [state, formAction, isPending] = useActionState(registerAction, initialState)

  const togglePasswordVisibility = () => setShowPassword((prev) => !prev)
  const toggleConfirmVisibility = () => setShowConfirmPassword((prev) => !prev)

  return (
    <Card className="w-full shadow-md border-border">
      <CardHeader>
        <CardTitle className="text-xl text-center text-foreground">アカウント登録</CardTitle>
        <CardDescription className="text-center text-muted-foreground">
          管理者アカウントを作成します。確認メールを受信できるメールアドレスを使用してください。
        </CardDescription>
      </CardHeader>
      <CardContent>
        {state.status === "success" && state.message && (
          <Alert className="mb-4" variant="default">
            <AlertTitle>登録を受け付けました</AlertTitle>
            <AlertDescription>{state.message}</AlertDescription>
          </Alert>
        )}

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
              autoComplete="email"
              required
              aria-invalid={!!state.errors?.email}
              aria-errormessage={state.errors?.email ? "register-email-error" : undefined}
            />
            {state.errors?.email && (
              <p id="register-email-error" className="text-sm text-destructive mt-1">
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
                autoComplete="new-password"
                required
                aria-invalid={!!state.errors?.password}
                aria-errormessage={state.errors?.password ? "register-password-error" : undefined}
              />
              <button
                type="button"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                onClick={togglePasswordVisibility}
                aria-label={showPassword ? "パスワードを隠す" : "パスワードを表示"}
              >
                {showPassword ? <EyeOffIcon className="h-4 w-4" /> : <EyeIcon className="h-4 w-4" />}
              </button>
            </div>
            {state.errors?.password && (
              <p id="register-password-error" className="text-sm text-destructive mt-1">
                {state.errors.password[0]}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword">パスワード（確認）</Label>
            <div className="relative">
              <Input
                id="confirmPassword"
                name="confirmPassword"
                type={showConfirmPassword ? "text" : "password"}
                placeholder="もう一度パスワードを入力"
                autoComplete="new-password"
                required
                aria-invalid={!!state.errors?.confirmPassword}
                aria-errormessage={
                  state.errors?.confirmPassword ? "register-confirm-password-error" : undefined
                }
              />
              <button
                type="button"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                onClick={toggleConfirmVisibility}
                aria-label={showConfirmPassword ? "パスワードを隠す" : "パスワードを表示"}
              >
                {showConfirmPassword ? <EyeOffIcon className="h-4 w-4" /> : <EyeIcon className="h-4 w-4" />}
              </button>
            </div>
            {state.errors?.confirmPassword && (
              <p id="register-confirm-password-error" className="text-sm text-destructive mt-1">
                {state.errors.confirmPassword[0]}
              </p>
            )}
          </div>

          <Button
            type="submit"
            className="w-full bg-red-300 hover:bg-red-400 text-white font-semibold py-3 px-6 rounded-lg transition duration-200 ease-in-out transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
            disabled={isPending}
          >
            {isPending ? "登録処理中..." : "登録する"}
          </Button>
        </CSRFForm>

        <p className="text-sm text-center text-muted-foreground mt-6">
          すでにアカウントをお持ちですか？{" "}
          <Link href="/" className="text-primary hover:underline">
            ログインはこちら
          </Link>
        </p>
      </CardContent>
    </Card>
  )
}
