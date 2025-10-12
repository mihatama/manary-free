import { Suspense } from "react"
import Image from "next/image"
import Link from "next/link"

import { LoginForm } from "@/components/login-form"

export default function Home() {
  return (
    <div className="min-h-screen bg-white">
      <header className="border-b border-slate-300">
        <div className="container mx-auto flex items-center justify-between px-4 py-4">
          <div className="flex items-center">
            <Image src="/manary-logo.png" alt="Manary Logo" width={60} height={60} />
            <h1 className="ml-2 text-xl font-bold text-[#f8a0a0]">Manary</h1>
          </div>
          <div>
            <Link href="/reservation" className="text-sm text-[#f8a0a0] hover:underline">
              Reservation form
            </Link>
          </div>
        </div>
      </header>

      <main className="container mx-auto flex flex-col items-center bg-[#ffeaed] px-4 py-12">
        <div className="w-full max-w-4xl space-y-10">
          <section className="space-y-4 text-center">
            <h2 className="text-3xl font-bold text-[#f8a0a0]">Manary local-storage edition</h2>
            <p className="text-muted-foreground">
              This edition keeps reservation and client data in the browser localStorage, so no external database is
              required. Authentication is handled by Amplify Auth (Amazon Cognito under the hood), so any user that you
              allow through Amplify can sign in.
            </p>
            <p className="text-sm text-muted-foreground">
              Anyone can submit the reservation form; submitted data becomes visible on the admin dashboard
              immediately and can be updated from there.
            </p>
          </section>

          <div className="mx-auto w-full max-w-md">
            <Suspense fallback={<div className="text-center text-muted-foreground">Loading sign-in…</div>}>
              <LoginForm />
            </Suspense>
          </div>
        </div>
      </main>

      <footer className="mt-auto border-t border-slate-300 py-6">
        <div className="container mx-auto px-4 text-center text-sm text-gray-500">
          &copy; {new Date().getFullYear()} Manary. All rights reserved.
        </div>
      </footer>
    </div>
  )
}
