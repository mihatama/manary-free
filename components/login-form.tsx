"use client"

import { useState, useEffect, useCallback, type FormEvent } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { EyeIcon, EyeOffIcon } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import Link from "next/link"
import { CSRFForm } from "@/components/csrf-form"
import type { AuthError } from "@/lib/auth"

type LoginState = {
  status: "idle" | "error" | "success"
  errors: AuthError
  user?: {
    id: string
    email: string | null
  }
}

type LoginApiResponse =
  | {
      status: "success"
      user: {
        id: string
        email: string | null
      }
    }
  | {
      status: "error"
      errors: AuthError
    }

const initialState: LoginState = {
  status: "idle",
  errors: {},
}

export function LoginForm() {
  const [showPassword, setShowPassword] = useState(false)
  const [state, setState] = useState<LoginState>(initialState)
  const [pending, setPending] = useState(false)
  const [isRedirecting, setIsRedirecting] = useState(false)

  // ログイン成功時にダッシュボードにリダイレクト
  useEffect(() => {
    if (state.status === "success" && !isRedirecting) {
      setIsRedirecting(true)

      // 直接ダッシュボードにリダイレクト
      window.location.href = "/dashboard"
    }
  }, [state.status, isRedirecting])

  const handleSubmit = useCallback(
    async (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault()
      if (pending) {
        return
      }

      setPending(true)
      setState({ ...initialState })

      const form = event.currentTarget
      const formData = new FormData(form)

      const email = formData.get("email")?.toString().trim() ?? ""
      const password = formData.get("password")?.toString() ?? ""
      const remember = formData.get("remember") === "on"
      const csrfToken = formData.get("csrf_token")?.toString()

      if (!csrfToken) {
        setState({
          status: "error",
          errors: {
            general: ["セキュリティ検証に失敗しました。ページを再読み込みしてください。"],
          },
        })
        setPending(false)
        return
      }

      if (!email || !password) {
        setState({
          status: "error",
          errors: {
            ...(email ? {} : { email: ["メールアドレスを入力してください。"] }),
            ...(password ? {} : { password: ["パスワードを入力してください。"] }),
          },
        })
        setPending(false)
        return
      }

      try {
        const response = await fetch("/api/auth/login", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ email, password, remember, csrfToken }),
        })

        const result = (await response.json()) as LoginApiResponse

        if (!response.ok || result.status !== "success") {
          setState({
            status: "error",
            errors:
              result.status === "error"
                ? result.errors
                : {
                    general: ["ログイン処理中にエラーが発生しました。後でもう一度お試しください。"],
                  },
          })
          return
        }

        setState({
          status: "success",
          errors: {},
          user: result.user,
        })
      } catch (error) {
        console.error("Login request failed:", error)
        setState({
          status: "error",
          errors: {
            general: ["ログイン処理中にエラーが発生しました。後でもう一度お試しください。"],
          },
        })
      } finally {
        setPending(false)
      }
    },
    [pending],
  )

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

        <CSRFForm onSubmit={handleSubmit} className="space-y-4">
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
          <Button
            type="submit"
            className="w-full bg-red-300 hover:bg-red-400 text-white font-semibold py-3 px-6 rounded-lg transition duration-200 ease-in-out transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
            disabled={pending}
          >
            {pending ? "ログイン中..." : "ログイン"}
          </Button>
        </CSRFForm>

        <p className="text-sm text-center text-muted-foreground mt-6">
          アカウントをお持ちでない場合は{" "}
          <Link href="/register" className="text-primary hover:underline">
            新規登録はこちら
          </Link>
        </p>
      </CardContent>
    </Card>
  )
}
