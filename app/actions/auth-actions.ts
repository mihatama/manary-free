"use server"

import { redirect } from "next/navigation"
import { cookies } from "next/headers"
import { createServerActionClient } from "@supabase/auth-helpers-nextjs"
import type { AuthError } from "@/lib/auth"
import type { Database } from "@/lib/supabase/database.types"
import { validateCSRFToken } from "@/lib/csrf"

// CSRF検証を行うヘルパー関数
async function validateCSRF(formData: FormData) {
  const csrfToken = formData.get("csrf_token") as string
  if (!validateCSRFToken(csrfToken)) {
    return {
      success: false,
      error: "セキュリティトークンが無効です。ページを再読み込みしてください。",
    }
  }
  return { success: true }
}

// ログイン処理のエラーメッセージを一般化し、エラーハンドリングを一貫させる
export async function loginAction(prevState: any, formData: FormData) {
  // CSRF検証
  const csrfValidation = await validateCSRF(formData)
  if (!csrfValidation.success) {
    return {
      status: "error",
      errors: {
        general: ["セキュリティ検証に失敗しました。ページを再読み込みしてください。"],
      } as AuthError,
    }
  }

  const email = formData.get("email") as string
  const password = formData.get("password") as string
  const remember = formData.get("remember") === "on"

  try {
    const cookieStore = cookies()
    const supabase = createServerActionClient<Database>({ cookies: () => cookieStore })

    // ログイン処理
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
      options: {
        // remember meの場合は7日間、それ以外は1時間のセッション期間を設定
        expiresIn: remember ? 7 * 24 * 60 * 60 : 60 * 60, // 7日 or 1時間
      },
    })

    if (error) {
      // 詳細なエラーはログにのみ記録 - エラーコードのみを記録し、詳細なメッセージは記録しない
      console.error("Authentication error occurred")

      // ユーザーには一般的なメッセージのみを表示
      return {
        status: "error",
        errors: {
          general: ["認証に失敗しました。入力情報を確認してください。"],
        } as AuthError,
      }
    }

    // getUser() を使用して認証済みのユーザー情報を取得
    const { data: userData, error: userError } = await supabase.auth.getUser()

    if (userError || !userData.user) {
      console.error("Failed to get authenticated user")
      return {
        status: "error",
        errors: {
          general: ["認証に失敗しました。もう一度お試しください。"],
        } as AuthError,
      }
    }

    console.log("Authentication successful")

    // ログイン成功
    return {
      status: "success",
      user: {
        id: userData.user.id,
        email: userData.user.email,
      },
    }
  } catch (error) {
    console.error("Login process error")
    return {
      status: "error",
      errors: {
        general: ["ログイン処理中にエラーが発生しました。後でもう一度お試しください。"],
      } as AuthError,
    }
  }
}

export async function logoutAction(formData: FormData) {
  // CSRF検証
  const csrfValidation = await validateCSRF(formData)
  if (!csrfValidation.success) {
    // エラーをログに記録して、ログインページにリダイレクト
    console.error("CSRF validation failed during logout")
    redirect("/?error=security_error")
  }

  const cookieStore = cookies()
  const supabase = createServerActionClient<Database>({ cookies: () => cookieStore })

  await supabase.auth.signOut()
  redirect("/")
}
