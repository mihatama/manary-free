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
    sameSite: "lax", // Changed from "strict" to "lax" for better compatibility
    path: "/",
    maxAge: 60 * 60 * 24, // Extended to 24 hours for longer sessions
  })

  return token
}

// CSRFトークンを検証
export function validateCSRFToken(token: string): boolean {
  try {
    const cookieStore = cookies()
    const storedToken = cookieStore.get("csrf_token")?.value

    if (!storedToken || !token) {
      console.warn("CSRF validation failed: Missing token")
      return false
    }

    if (token !== storedToken) {
      console.warn("CSRF validation failed: Token mismatch")
      return false
    }

    return true
  } catch (error) {
    console.error("CSRF validation error:", error)
    return false
  }
}
