import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { createMiddlewareClient } from "@supabase/auth-helpers-nextjs"

export async function middleware(request: NextRequest) {
  // 新しいレスポンスオブジェクトを作成
  const res = NextResponse.next()

  // ミドルウェア用のSupabaseクライアントを作成
  const supabase = createMiddlewareClient({ req: request, res })

  // セッションを取得
  const {
    data: { session },
  } = await supabase.auth.getSession()

  // デバッグ用にコンソールログを追加
  console.log("Middleware session check:", !!session, "Path:", request.nextUrl.pathname)

  const isAuthPage = request.nextUrl.pathname === "/"
  const isResetPasswordPage = request.nextUrl.pathname.startsWith("/reset-password")
  const isUpdatePasswordPage = request.nextUrl.pathname.startsWith("/update-password")
  const isAuthCallbackPage = request.nextUrl.pathname.startsWith("/auth/callback")
  const isDashboardPage = request.nextUrl.pathname.startsWith("/dashboard")

  // 認証関連のページはセッションチェックをスキップ
  if (isResetPasswordPage || isUpdatePasswordPage || isAuthCallbackPage) {
    return res
  }

  // セッションがない場合
  if (!session) {
    // ダッシュボードページにアクセスしようとしている場合はログインページにリダイレクト
    if (isDashboardPage) {
      return NextResponse.redirect(new URL("/", request.url))
    }
    // それ以外の場合はそのまま処理を続行
    return res
  }

  // セッションがあり、ログインページにアクセスしようとしている場合はダッシュボードにリダイレクト
  if (isAuthPage) {
    return NextResponse.redirect(new URL("/dashboard", request.url))
  }

  // セッションを確実に次のリクエストに渡す
  return res
}

export const config = {
  matcher: ["/", "/dashboard/:path*", "/reset-password", "/update-password", "/auth/callback"],
}
