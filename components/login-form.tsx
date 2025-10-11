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

  const handleLogin = useCallback(() => {
    setIsRedirecting(true)
    setErrorMessage(null)
    setInfoMessage(null)
    window.location.href = "/api/auth/authorize"
  }, [])

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

        {infoMessage ? (
          <Alert>
            <AlertDescription>{infoMessage}</AlertDescription>
          </Alert>
        ) : null}

        <Button
          className="w-full"
          size="lg"
          onClick={handleLogin}
          disabled={isRedirecting}
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
