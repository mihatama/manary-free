"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { Authenticator, ThemeProvider, createTheme } from "@aws-amplify/ui-react"

import { PwaInstallButton } from "@/components/pwa-install-button"

const loginTheme = createTheme({
  name: "manary-login",
  tokens: {
    colors: {
      brand: {
        primary: {
          10: "#fdf2f8",
          20: "#fce7f3",
          40: "#fbcfe8",
          60: "#f472b6",
          80: "#ec4899",
          90: "#db2777",
          100: "#9d174d",
        },
      },
      font: {
        interactive: { value: "#db2777" },
        focus: { value: "#9d174d" },
      },
      border: {
        focus: { value: "#fbcfe8" },
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
            boxShadow: { value: "0 0 0 3px rgba(244, 114, 182, 0.35)" },
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
    <section className="w-full max-w-md rounded-3xl bg-white/95 p-10 shadow-xl shadow-rose-100 ring-1 ring-rose-50 backdrop-blur">
      <div className="mb-8 space-y-3 text-center">
        <p className="text-xs font-semibold uppercase tracking-widest text-rose-500">初月無料ローカル保存エディション</p>
        <h1 className="text-2xl font-bold text-rose-600">Manary にサインイン</h1>
        <p className="text-sm text-muted-foreground">このエディションは30日間無料でご利用いただけます。</p>
        <p className="text-sm text-muted-foreground">
          カルテ情報は暗号化された状態でブラウザのローカルストレージに保存され、外部サーバーには送信されません。
        </p>
        <p className="text-xs text-muted-foreground">
          予約管理や事前問診フォームなどのクラウド連携機能をご希望の場合は、別契約のプランが必要です。
        </p>
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
        {userName ? `${userName} さん、ダッシュボードへ移動します...` : "ダッシュボードへ移動します..."}
      </p>
      {signOut && (
        <button
          type="button"
          className="w-full rounded-full border border-rose-200 bg-white px-3 py-2 text-sm font-medium text-rose-600 transition hover:border-rose-300 hover:text-rose-700 focus:outline-none focus:ring-2 focus:ring-rose-200"
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
