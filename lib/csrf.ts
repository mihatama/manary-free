// 新しいCSRF保護ライブラリを作成
import { cookies } from "next/headers"
import crypto from "crypto"

// CSRFトークンを生成
export function generateCSRFToken(): string {
  const token = crypto.randomBytes(32).toString("hex")
  const cookieStore = cookies()

  // HTTPOnly, Secure, SameSiteフラグ付きでCookieを設定
  cookieStore.set("csrf_token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge: 60 * 60, // 1時間
  })

  return token
}

// CSRFトークンを検証
export function validateCSRFToken(token: string): boolean {
  const cookieStore = cookies()
  const storedToken = cookieStore.get("csrf_token")?.value

  if (!storedToken || !token || token !== storedToken) {
    return false
  }

  return true
}
