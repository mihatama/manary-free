"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { I18n } from "aws-amplify"
import { Authenticator, ThemeProvider, createTheme, translations } from "@aws-amplify/ui-react"

import { PwaInstallButton } from "@/components/pwa-install-button"

const loginTheme = createTheme({
  name: "manary-login",
  tokens: {
    colors: {
      brand: {
        primary: {
          10: "#fff6f5",
          20: "#fde7e4",
          40: "#fbd2ce",
          60: "#f69896",
          80: "#ef706d",
          90: "#d95753",
          100: "#8c2d2b",
        },
      },
      font: {
        interactive: { value: "#d95753" },
        focus: { value: "#8c2d2b" },
      },
      border: {
        focus: { value: "#fbd2ce" },
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
            boxShadow: { value: "0 0 0 3px rgba(246, 152, 150, 0.35)" },
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

let hasConfiguredI18n = false

function configureAuthenticatorLocale() {
  if (!hasConfiguredI18n) {
    I18n.putVocabularies(translations)
    I18n.setLanguage("ja")
    hasConfiguredI18n = true
  }
}

export function LoginForm() {
  configureAuthenticatorLocale()

  return (
    <section className="w-full max-w-xl rounded-3xl bg-white/95 p-10 shadow-xl shadow-[0_25px_60px_-25px_rgba(246,152,150,0.6)] ring-1 ring-[rgba(246,152,150,0.25)] backdrop-blur">
      <div className="mb-8 space-y-3 text-center">
        <p className="text-xs font-semibold uppercase tracking-widest text-primary">初月無料ローカル保存エディション</p>
        <h1 className="text-2xl font-bold text-primary">Manary にサインイン</h1>
      </div>
      <div className="login-auth space-y-6">
        <ThemeProvider theme={loginTheme} colorMode="light">
          <Authenticator>
            {({ signOut, user }) => (
              <RedirectToDashboard signOut={signOut} userName={user?.signInDetails?.loginId ?? user?.username} />
            )}
          </Authenticator>
        </ThemeProvider>
      </div>
      <div className="mt-6 space-y-2 text-center">
        <PwaInstallButton />
      </div>
    </section>
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
        <button
          type="button"
          className="w-full rounded-full border border-primary/30 bg-white px-3 py-2 text-sm font-medium text-primary transition hover:border-primary/40 hover:text-primary/80 focus:outline-none focus:ring-2 focus:ring-primary/30"
          onClick={() => {
            void signOut()
          }}
        >
          サインアウト
        </button>
      )}
    </div>
  )
}

