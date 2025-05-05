import { cookies } from "next/headers"
import { redirect } from "next/navigation"

// 実際のアプリケーションでは、これらの値はデータベースから取得します
// これはデモ用の簡易的な実装です
const ADMIN_USERS = [
  {
    email: "admin@manary.care",
    // 実際のアプリケーションでは、パスワードはハッシュ化して保存します
    password: "admin123",
    name: "管理者",
    role: "admin",
  },
  {
    email: "manager@manary.care",
    password: "manager123",
    name: "マネージャー",
    role: "manager",
  },
]

// セッショントークンを生成する関数
function generateSessionToken() {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)
}

// セッションの有効期限を設定（24時間）
const SESSION_EXPIRY = 24 * 60 * 60 * 1000

// セッション情報を保存するオブジェクト
// 実際のアプリケーションでは、これはデータベースに保存します
const SESSIONS: Record<string, { userId: string; expires: number }> = {}

export type AuthError = {
  email?: string[]
  password?: string[]
  general?: string[]
}

export async function login(email: string, password: string) {
  // 入力検証
  const errors: AuthError = {}

  if (!email) {
    errors.email = ["メールアドレスを入力してください"]
  } else if (!/^\S+@\S+\.\S+$/.test(email)) {
    errors.email = ["有効なメールアドレスを入力してください"]
  }

  if (!password) {
    errors.password = ["パスワードを入力してください"]
  }

  if (Object.keys(errors).length > 0) {
    return { success: false, errors }
  }

  // ユーザー認証
  const user = ADMIN_USERS.find((u) => u.email === email && u.password === password)

  if (!user) {
    return {
      success: false,
      errors: {
        general: ["メールアドレスまたはパスワードが正しくありません"],
      },
    }
  }

  // セッショントークンを生成
  const sessionToken = generateSessionToken()
  const expires = Date.now() + SESSION_EXPIRY

  // セッション情報を保存
  SESSIONS[sessionToken] = {
    userId: user.email,
    expires,
  }

  // Cookieにセッショントークンを保存
  cookies().set("session_token", sessionToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    expires: new Date(expires),
    path: "/",
  })

  return {
    success: true,
    user: {
      email: user.email,
      name: user.name,
      role: user.role,
    },
  }
}

export async function logout() {
  const sessionToken = cookies().get("session_token")?.value

  if (sessionToken && SESSIONS[sessionToken]) {
    // セッション情報を削除
    delete SESSIONS[sessionToken]
  }

  // Cookieを削除
  cookies().delete("session_token")

  // ログインページにリダイレクト
  redirect("/")
}

export async function getSession() {
  const sessionToken = cookies().get("session_token")?.value

  if (!sessionToken || !SESSIONS[sessionToken]) {
    return null
  }

  const session = SESSIONS[sessionToken]

  // セッションの有効期限をチェック
  if (session.expires < Date.now()) {
    delete SESSIONS[sessionToken]
    cookies().delete("session_token")
    return null
  }

  const user = ADMIN_USERS.find((u) => u.email === session.userId)

  if (!user) {
    return null
  }

  return {
    user: {
      email: user.email,
      name: user.name,
      role: user.role,
    },
  }
}

export async function requireAuth() {
  const session = await getSession()

  if (!session) {
    redirect("/")
  }

  return session
}
