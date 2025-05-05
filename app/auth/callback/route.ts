import { NextResponse } from "next/server"
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import type { Database } from "@/lib/supabase/database.types"

// 認証コールバックのエラーメッセージを一般化し、エラーハンドリングを一貫させる
export async function GET(request: Request) {
  try {
    const requestUrl = new URL(request.url)
    const code = requestUrl.searchParams.get("code")

    if (code) {
      const cookieStore = cookies()
      const supabase = createRouteHandlerClient<Database>({ cookies: () => cookieStore })

      // コードをセッションに交換
      const { error } = await supabase.auth.exchangeCodeForSession(code)

      if (error) {
        console.error("Authentication callback error")
        return NextResponse.redirect(new URL("/?error=auth_error", request.url))
      }

      // セッションが確立されたか確認
      const { data: sessionData } = await supabase.auth.getSession()

      if (sessionData.session) {
        console.log("Authentication successful")
      } else {
        console.error("Session establishment failed")
        return NextResponse.redirect(new URL("/?error=auth_error", request.url))
      }
    } else {
      console.error("Missing authentication code")
      return NextResponse.redirect(new URL("/?error=auth_error", request.url))
    }

    // ダッシュボードにリダイレクト
    return NextResponse.redirect(new URL("/dashboard", request.url))
  } catch (error) {
    console.error("Authentication process error")
    return NextResponse.redirect(new URL("/?error=auth_error", request.url))
  }
}
