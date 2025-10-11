"use client"

import { useCallback, useEffect, useState } from "react"
import { useSearchParams } from "next/navigation"
import { Loader2 } from "lucide-react"

import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export function LoginForm() {
  const searchParams = useSearchParams()
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [infoMessage, setInfoMessage] = useState<string | null>(null)
  const [isRedirecting, setIsRedirecting] = useState(false)
  const [missingConfig, setMissingConfig] = useState<string[] | null>(null)
  const [configCheckError, setConfigCheckError] = useState<string | null>(null)

  useEffect(() => {
    const error = searchParams.get("error")
    const info = searchParams.get("message")
    const loggedOut = searchParams.get("logged_out")

    setErrorMessage(error)

    if (info) {
      setInfoMessage(info)
    } else if (loggedOut) {
      setInfoMessage("ログアウトしました。再度ログインしてください。")
    } else if (!error) {
      setInfoMessage(null)
    }
  }, [searchParams])

  useEffect(() => {
    let cancelled = false

    const checkConfigStatus = async () => {
      try {
        const response = await fetch("/api/auth/config-status", { cache: "no-store" })

        if (!response.ok) {
          throw new Error("Failed to fetch Cognito configuration status")
        }

        const data = (await response.json()) as { ok: boolean; missing: string[] }

        if (!cancelled) {
          if (data.ok) {
            setMissingConfig([])
            setConfigCheckError(null)
          } else {
            setMissingConfig(data.missing)
            setConfigCheckError(null)
          }
        }
      } catch (error) {
        console.error("Failed to verify Cognito configuration:", error)

        if (!cancelled) {
          setConfigCheckError("認証設定の確認に失敗しました。時間をおいて再度お試しください。")
          setMissingConfig(null)
        }
      }
    }

    void checkConfigStatus()

    return () => {
      cancelled = true
    }
  }, [])

  const handleLogin = useCallback(() => {
    if (missingConfig && missingConfig.length > 0) {
      return
    }

    setIsRedirecting(true)
    setErrorMessage(null)
    setInfoMessage(null)
    window.location.assign("/api/auth/authorize")
  }, [missingConfig])

  return (
    <Card className="w-full shadow-md border-border">
      <CardHeader>
        <CardTitle className="text-xl text-center text-foreground">ログイン</CardTitle>
        <CardDescription className="text-center text-muted-foreground">
          Cognito の認証ページに遷移してログインします。
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {errorMessage ? (
          <Alert variant="destructive">
            <AlertDescription>{errorMessage}</AlertDescription>
          </Alert>
        ) : null}

        {missingConfig && missingConfig.length > 0 ? (
          <Alert variant="destructive">
            <AlertDescription>
              認証に必要な環境変数が不足しています。
              <ul className="mt-2 list-disc space-y-1 pl-4 text-left text-sm">
                {missingConfig.map((variable) => (
                  <li key={variable}>{variable}</li>
                ))}
              </ul>
            </AlertDescription>
          </Alert>
        ) : null}

        {configCheckError ? (
          <Alert variant="destructive">
            <AlertDescription>{configCheckError}</AlertDescription>
          </Alert>
        ) : null}

        {infoMessage ? (
          <Alert>
            <AlertDescription>{infoMessage}</AlertDescription>
          </Alert>
        ) : null}

        <Button
          className="w-full"
          size="lg"
          onClick={handleLogin}
          disabled={isRedirecting || Boolean(missingConfig && missingConfig.length > 0)}
        >
          {isRedirecting ? (
            <span className="flex items-center justify-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              Cognito にリダイレクトしています...
            </span>
          ) : (
            "Cognitoでログイン"
          )}
        </Button>
      </CardContent>
    </Card>
  )
}
