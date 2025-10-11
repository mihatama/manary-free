"use client"

import { useCallback, useEffect, useState } from "react"
import { Loader2 } from "lucide-react"

import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export interface LoginFormProps {
  defaultErrorMessage?: string | null
  defaultInfoMessage?: string | null
}

export function LoginForm({
  defaultErrorMessage = null,
  defaultInfoMessage = null,
}: LoginFormProps) {
  const [errorMessage, setErrorMessage] = useState<string | null>(defaultErrorMessage)
  const [infoMessage, setInfoMessage] = useState<string | null>(defaultInfoMessage)
  const [isRedirecting, setIsRedirecting] = useState(false)

  useEffect(() => {
    setErrorMessage(defaultErrorMessage ?? null)
  }, [defaultErrorMessage])

  useEffect(() => {
    setInfoMessage(defaultInfoMessage ?? null)
  }, [defaultInfoMessage])

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
