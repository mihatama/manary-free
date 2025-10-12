"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { Authenticator, ThemeProvider, createTheme } from "@aws-amplify/ui-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

const loginTheme = createTheme({
  name: "manary-login",
  tokens: {
    colors: {
      brand: {
        primary: {
          10: "#f0f9ff",
          20: "#e0f2fe",
          40: "#7dd3fc",
          60: "#0ea5e9",
          80: "#0284c7",
          90: "#0369a1",
          100: "#0f172a",
        },
      },
      font: {
        interactive: { value: "#0369a1" },
        focus: { value: "#0f172a" },
      },
      border: {
        focus: { value: "#0ea5e9" },
      },
    },
    components: {
      button: {
        primary: {
          backgroundColor: { value: "{colors.brand.primary.60}" },
          borderColor: { value: "{colors.brand.primary.60}" },
          color: { value: "#ffffff" },
          _hover: {
            backgroundColor: { value: "{colors.brand.primary.80}" },
            borderColor: { value: "{colors.brand.primary.80}" },
          },
          _focus: {
            boxShadow: { value: "0 0 0 3px rgba(14, 165, 233, 0.35)" },
          },
        },
        link: {
          color: { value: "{colors.brand.primary.80}" },
          _hover: { color: { value: "{colors.brand.primary.60}" } },
          _focus: {
            outlineColor: { value: "{colors.brand.primary.60}" },
          },
        },
      },
    },
  },
})

export function LoginForm() {
  return (
    <Card className="w-full border border-slate-200 bg-white/95 shadow-lg">
      <CardHeader>
        <CardTitle className="text-center text-xl font-semibold text-slate-900">Manary にサインイン</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6 login-auth">
        <ThemeProvider theme={loginTheme} colorMode="light">
          <Authenticator>
            {({ signOut, user }) => (
              <RedirectToDashboard signOut={signOut} userName={user?.signInDetails?.loginId ?? user?.username} />
            )}
          </Authenticator>
        </ThemeProvider>
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
        {userName ? `${userName} さん、ダッシュボードへ移動します…` : "ダッシュボードへ移動します…"}
      </p>
      {signOut && (
        <Button variant="outline" className="w-full" onClick={() => void signOut()}>
          サインアウト
        </Button>
      )}
    </div>
  )
}
