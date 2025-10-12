"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { signIn, useSession } from "next-auth/react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"

const ERROR_MESSAGES: Record<string, string> = {
  AccessDenied: "Access was denied. Please verify your account permissions.",
  Configuration: "Authentication is misconfigured. Contact an administrator.",
  OAuthSignin: "Cognito sign-in failed. Please try again.",
  OAuthCallback: "Failed to process the Cognito callback. Please retry later.",
  OAuthAccountNotLinked: "This account is linked to another provider. Contact an administrator.",
  EmailSignin: "Email based sign-in is not available.",
  CredentialsSignin: "The supplied credentials were rejected.",
  Default: "Authentication failed. Please try again later.",
}

export function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { status } = useSession()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const errorKey = searchParams?.get("error")
  const error = useMemo(() => {
    if (!errorKey) {
      return null
    }
    return ERROR_MESSAGES[errorKey] ?? ERROR_MESSAGES.Default
  }, [errorKey])

  useEffect(() => {
    if (status === "authenticated") {
      router.replace("/dashboard")
    }
  }, [status, router])

  const handleSignIn = async () => {
    setIsSubmitting(true)
    await signIn("cognito", { callbackUrl: "/dashboard" })
  }

  const isLoading = status === "loading" || isSubmitting

  return (
    <Card className="w-full shadow-md border-border">
      <CardHeader>
        <CardTitle className="text-xl text-center text-foreground">Sign in with Cognito</CardTitle>
        <CardDescription className="text-center text-muted-foreground">
          You will be redirected to the Cognito Hosted UI.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="space-y-2 text-sm text-muted-foreground">
          <p>You will be sent back to the dashboard automatically after sign-in.</p>
          <p>Valid accounts are managed in your Cognito user pool.</p>
        </div>

        <Button
          onClick={handleSignIn}
          className="w-full bg-red-300 hover:bg-red-400 text-white font-semibold py-3 px-6 rounded-lg transition duration-200 ease-in-out transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
          disabled={isLoading}
        >
          {isLoading ? "Redirecting..." : "Continue with Cognito"}
        </Button>
      </CardContent>
    </Card>
  )
}
