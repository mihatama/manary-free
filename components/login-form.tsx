"use client"

import { useRouter } from "next/navigation"
import { Authenticator } from "@aws-amplify/ui-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export function LoginForm() {
  const router = useRouter()

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
          {({ signOut, user }) => (
            <div className="space-y-4">
              <p className="text-center text-sm text-muted-foreground">
                Hello {user?.signInDetails?.loginId ?? user?.username}! You&apos;re signed in with Amplify Auth.
              </p>
              <div className="flex flex-col gap-2">
                <Button
                  className="w-full bg-red-300 text-white hover:bg-red-400"
                  onClick={() => router.push("/dashboard")}
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
