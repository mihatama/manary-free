import Image from "next/image"
import { LoginForm } from "@/components/login-form"
import Link from "next/link"

export default function Home() {
  return (
    <div className="min-h-screen bg-white">
      <header className="border-b border-slate-300">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center">
            <Image src="/manary-logo.png" alt="Manary Logo" width={60} height={60} />
            <h1 className="text-xl font-bold text-[#f8a0a0] ml-2">Manary</h1>
          </div>
          <div>
            <Link href="/reservation" className="text-sm text-[#f8a0a0] hover:underline">
              予約ページ
            </Link>
          </div>
        </div>
      </header>


      <main className="container mx-auto px-4 flex flex-col items-center bg-[#ffeaed] py-12">
        <div className="w-full max-w-4xl space-y-10">
          <section className="text-center space-y-4">
            <h2 className="text-3xl font-bold text-[#f8a0a0]">ローカル保存版 Manary</h2>
            <p className="text-muted-foreground">
              このバージョンのManaryはデータベースを使わず、ブラウザのローカルストレージに予約やユーザー情報を保存します。
              テスト用の管理者アカウントとして <span className="font-semibold">admin@manary.local</span> /
              <span className="font-semibold">password123</span> をご利用ください。
            </p>
            <p className="text-sm text-muted-foreground">
              予約フォームは誰でも利用でき、送信された内容は管理ダッシュボードで確認・更新できます。
            </p>
          </section>

          <div className="mx-auto w-full max-w-md">
            <LoginForm />
          </div>
        </div>
      </main>

      <footer className="mt-auto py-6 border-t border-slate-300">
        <div className="container mx-auto px-4 text-center text-gray-500 text-sm">
          &copy; {new Date().getFullYear()} Manary. All rights reserved.
        </div>
      </footer>
    </div>
  )
}
