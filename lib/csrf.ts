import { createHash, randomBytes } from "crypto"
import { cookies } from "next/headers"

const CSRF_SECRET = process.env.CSRF_SECRET || "default-csrf-secret-key-change-in-production"
const CSRF_COOKIE_NAME = "csrf_token"
const CSRF_COOKIE_MAX_AGE = 60 * 60 // 1時間

// CSRFトークンを生成
export async function generateCSRFToken(): Promise<string> {
  const cookieStore = cookies()

  // ランダムなトークンを生成
  const token = randomBytes(32).toString("hex")

  // トークンをハッシュ化してクッキーに保存
  const hashedToken = createHash("sha256").update(`${token}${CSRF_SECRET}`).digest("hex")

  cookieStore.set({
    name: CSRF_COOKIE_NAME,
    value: hashedToken,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: CSRF_COOKIE_MAX_AGE,
  })

  return token
}

// CSRFトークンを検証
export async function validateCSRFToken(token: string): Promise<boolean> {
  const cookieStore = cookies()
  const storedHash = cookieStore.get(CSRF_COOKIE_NAME)?.value

  if (!storedHash) {
    throw new Error("CSRFトークンが見つかりません")
  }

  // 送信されたトークンをハッシュ化
  const hashedToken = createHash("sha256").update(`${token}${CSRF_SECRET}`).digest("hex")

  // ハッシュ値を比較
  if (hashedToken !== storedHash) {
    throw new Error("CSRFトークンが一致しません")
  }

  return true
}
