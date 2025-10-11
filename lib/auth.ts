import { redirect } from "next/navigation"
import { cookies } from "next/headers"
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs"

import type { Database } from "@/lib/supabase/database.types"
import { hasSupabaseAuthConfig } from "@/lib/supabase/env"

export type AuthError = {
  email?: string[]
  password?: string[]
  general?: string[]
  confirmPassword?: string[]
}

// エラーログの詳細度を下げ、一貫したエラーハンドリングを実装
export async function getSession() {
  if (!hasSupabaseAuthConfig()) {
    console.warn("Supabase authentication環境変数が設定されていないため、セッションを取得できません。")
    return null
  }

  try {
    const cookieStore = cookies()
    const supabase = createServerComponentClient<Database>({ cookies: () => cookieStore })

    // getUser() を使用して認証済みのユーザー情報を取得
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      console.log("No authenticated user found")
      return null
    }

    // セッション情報をログに出力（デバッグ用）- ユーザーIDのみを記録
    console.log("Authenticated user found")

    // プロファイルテーブルにアクセスせず、ユーザー情報からの基本情報のみを返す
    return {
      user: {
        id: user.id,
        email: user.email,
        // メールアドレスの@前の部分をユーザー名として使用
        name: user.email?.split("@")[0] || "ユーザー",
        // デフォルトロールを設定
        role: "admin", // すべてのユーザーをadminとして扱う
      },
    }
  } catch (error) {
    console.error("Authentication error occurred")
    return null
  }
}

export async function requireAuth() {
  if (!hasSupabaseAuthConfig()) {
    console.warn("Supabase認証の設定がないため、認証チェックをスキップします。")
    return null
  }

  const session = await getSession()

  if (!session) {
    redirect("/")
  }

  return session
}
