"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { Authenticator } from "@aws-amplify/ui-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export function LoginForm() {
  return (
    <Card className="w-full border-border shadow-md">
      <CardHeader>
        <CardTitle className="text-center text-xl text-foreground">Sign in</CardTitle>
        <CardDescription className="text-center text-muted-foreground">
          Use your Amplify Auth account to access the dashboard.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <Authenticator>
          {({ signOut, user }) => <RedirectToDashboard signOut={signOut} userName={user?.signInDetails?.loginId ?? user?.username} />}
        </Authenticator>
      </CardContent>
    </Card>
  )
}

type RedirectProps = {
  signOut?: () => Promise<void>
  userName?: string | null
}

function RedirectToDashboard({ signOut, userName }: RedirectProps) {
  const router = useRouter()

  useEffect(() => {
    void router.replace("/dashboard")
  }, [router])

  return (
    <div className="space-y-4 text-center">
      <p className="text-sm text-muted-foreground">
        {userName ? `Hello ${userName}! Redirecting to the dashboard...` : "Redirecting to the dashboard..."}
      </p>
      {signOut && (
        <Button variant="outline" className="w-full" onClick={() => void signOut()}>
          Sign out
        </Button>
      )}
    </div>
  )
}
