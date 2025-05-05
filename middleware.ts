import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export function middleware(request: NextRequest) {
  const sessionToken = request.cookies.get("session_token")?.value
  const isAuthPage = request.nextUrl.pathname === "/"
  const isDashboardPage = request.nextUrl.pathname.startsWith("/dashboard")

  // セッショントークンがない場合
  if (!sessionToken) {
    // ダッシュボードページにアクセスしようとしている場合はログインページにリダイレクト
    if (isDashboardPage) {
      return NextResponse.redirect(new URL("/", request.url))
    }
    // それ以外の場合はそのまま処理を続行
    return NextResponse.next()
  }

  // セッショントークンがあり、ログインページにアクセスしようとしている場合はダッシュボードにリダイレクト
  if (isAuthPage) {
    return NextResponse.redirect(new URL("/dashboard", request.url))
  }

  // それ以外の場合はそのまま処理を続行
  return NextResponse.next()
}

export const config = {
  matcher: ["/", "/dashboard/:path*"],
}
