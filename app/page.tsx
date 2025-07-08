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
          </div>
          <div>
            <Link href="/reservation" className="text-sm text-[#f8a0a0] hover:underline">
              予約ページ
            </Link>
          </div>
        </div>
      </header>


      <main className="container mx-auto px-4 flex flex-col items-center bg-[#ffeaed] py-12">
        <div className="w-full max-w-md">
          {/* <h1 className="text-3xl font-bold text-[#f8a0a0] text-center mb-8 text-[rgba(159,118,77,1)]">ログイン</h1> */}
          <LoginForm />
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
