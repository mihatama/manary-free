import { Suspense } from "react"
import Image from "next/image"
import Link from "next/link"

import { LoginForm } from "@/components/login-form"

export default function Home() {
  return (
    <div className="min-h-screen bg-accent">
      <header className="border-b border-slate-200 bg-white/95 backdrop-blur">
        <div className="container mx-auto flex items-center justify-between px-4 py-4">
          <div className="flex items-center">
            <Image src="/manary-logo.png" alt="Manary Logo" width={60} height={60} />
            <h1 className="ml-2 text-xl font-bold text-primary">Manary</h1>
          </div>
        </div>
      </header>

      <main className="container mx-auto flex flex-col items-center px-4 py-12">
        <div className="w-full max-w-4xl space-y-10">
          <section className="mx-auto w-full max-w-xl space-y-4 rounded-lg border border-slate-200 bg-white/95 p-8 text-center shadow-sm">
            <h2 className="text-3xl font-bold text-primary">無料ローカル保存エディション</h2>
            <p className="text-muted-foreground">
              このエディションは30日間無料でご利用いただけます。カルテ情報は暗号化された状態でブラウザのローカルストレージに保存され、外部サーバーには送信されません。
            </p>
            <p className="text-sm text-muted-foreground">
              予約管理や事前問診フォームなどのクラウド連携機能をご希望の場合は、別契約のプランが必要です。詳細は担当窓口までお問い合わせください。
            </p>
          </section>

          <div className="mx-auto w-full max-w-xl">
            <Suspense fallback={<div className="text-center text-muted-foreground">サインイン画面を読み込み中です…</div>}>
              <LoginForm />
            </Suspense>
          </div>
        </div>
      </main>

      <footer className="mt-auto border-t border-slate-200 bg-white/95 py-6">
        <div className="container mx-auto px-4 text-center text-sm text-gray-500">
          &copy; {new Date().getFullYear()} Manary. All rights reserved.
        </div>
      </footer>
    </div>
  )
}
