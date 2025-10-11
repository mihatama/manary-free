import Image from "next/image"
import { use } from "react"

import { LoginForm } from "@/components/login-form"

type SearchParamValue = string | string[] | undefined

function toStringParam(value: SearchParamValue): string | null {
  if (!value) {
    return null
  }

  return Array.isArray(value) ? value[0] ?? null : value
}

type SearchParamsRecord = Record<string, SearchParamValue> & {
  error?: SearchParamValue
  message?: SearchParamValue
  logged_out?: SearchParamValue
}

type HomePageProps = {
  searchParams?: Promise<SearchParamsRecord> | SearchParamsRecord
}

function resolveSearchParams(searchParams: HomePageProps["searchParams"]): SearchParamsRecord {
  if (!searchParams) {
    return {}
  }

  if (typeof (searchParams as Promise<unknown>).then === "function") {
    return use(searchParams as Promise<SearchParamsRecord>)
  }

  return searchParams
}

export default function Home({ searchParams }: HomePageProps) {
  const params = resolveSearchParams(searchParams)

  const errorParam = toStringParam(params.error)
  const messageParam = toStringParam(params.message)
  const loggedOutParam = toStringParam(params.logged_out)

  const defaultInfoMessage = messageParam
    ? messageParam
    : loggedOutParam
      ? "ログアウトしました。再度ログインしてください。"
      : null

  return (
    <div className="min-h-screen bg-white">
      <header className="border-b border-slate-300">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center">
            <Image src="/manary-logo.png" alt="Manary Logo" width={60} height={60} />
            <h1 className="text-xl font-bold text-[#f8a0a0] ml-2">Manary</h1>
          </div>
          <div className="text-sm text-[#f8a0a0]">&nbsp;</div>
        </div>
      </header>


      <main className="container mx-auto px-4 flex flex-col items-center bg-[#ffeaed] py-12">
        <div className="w-full max-w-md">
          {/* <h1 className="text-3xl font-bold text-[#f8a0a0] text-center mb-8 text-[rgba(159,118,77,1)]">ログイン</h1> */}
          <LoginForm defaultErrorMessage={errorParam} defaultInfoMessage={defaultInfoMessage} />
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
