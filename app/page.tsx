import { Suspense } from "react"
import Image from "next/image"

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
            <h2 className="text-3xl font-bold text-primary">初月無料ローカル保存エディション</h2>
            <p className="text-muted-foreground text-lg font-semibold">Manary にサインイン</p>
          </section>

          <div className="mx-auto w-full max-w-xl">
            <Suspense fallback={<div className="text-center text-muted-foreground">繧ｵ繧､繝ｳ繧､繝ｳ逕ｻ髱｢繧定ｪｭ縺ｿ霎ｼ縺ｿ荳ｭ縺ｧ縺吮ｦ</div>}>
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






