"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { Authenticator, useAuthenticator } from "@aws-amplify/ui-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export function LoginForm() {
  const router = useRouter()
  const { authStatus, user } = useAuthenticator((context) => ({
    authStatus: context.authStatus,
    user: context.user,
  }))

  useEffect(() => {
    if (authStatus === "authenticated") {
      router.replace("/dashboard")
    }
  }, [authStatus, router])

  return (
    <Card className="w-full border-border shadow-md">
      <CardHeader>
        <CardTitle className="text-center text-xl text-foreground">Sign in</CardTitle>
        <CardDescription className="text-center text-muted-foreground">
          Use your Amplify Auth account to access the dashboard.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <Authenticator hideSignUp>
          {({ signOut }) => (
            <div className="space-y-4">
              <p className="text-center text-sm text-muted-foreground">
                {user?.signInDetails?.loginId ?? user?.username} is signed in. You will be redirected shortly.
              </p>
              <div className="flex flex-col gap-2">
                <Button
                  className="w-full bg-red-300 text-white hover:bg-red-400"
                  onClick={() => router.replace("/dashboard")}
                >
                  Go to dashboard
                </Button>
                <Button variant="outline" className="w-full" onClick={() => void signOut()}>
                  Sign out
                </Button>
              </div>
            </div>
          )}
        </Authenticator>
      </CardContent>
    </Card>
  )
}
