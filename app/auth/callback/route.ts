import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get("code")

  if (code) {
    const supabase = createClient()

    try {
      // コードをセッションに交換
      const { error } = await supabase.auth.exchangeCodeForSession(code)

      if (error) {
        console.error("Error exchanging code for session:", error)
        return NextResponse.redirect(new URL("/?error=auth_callback_error", request.url))
      }

      // セッションが確立されたか確認
      const { data: sessionData } = await supabase.auth.getSession()

      if (sessionData.session) {
        console.log("Session established successfully in callback")
      } else {
        console.error("Failed to establish session in callback")
        return NextResponse.redirect(new URL("/?error=no_session", request.url))
      }
    } catch (error) {
      console.error("Exception in auth callback:", error)
      return NextResponse.redirect(new URL("/?error=auth_exception", request.url))
    }
  } else {
    console.error("No code provided to auth callback")
    return NextResponse.redirect(new URL("/?error=no_code", request.url))
  }

  // ダッシュボードにリダイレクト
  return NextResponse.redirect(new URL("/dashboard", request.url))
}
