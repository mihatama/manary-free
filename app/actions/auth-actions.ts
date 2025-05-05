"use server"
import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import type { AuthError } from "@/lib/auth"

export async function loginAction(prevState: any, formData: FormData) {
  const email = formData.get("email") as string
  const password = formData.get("password") as string
  const remember = formData.get("remember") === "on"

  try {
    const supabase = createClient()

    // ログイン処理
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
      options: {
        // remember meの場合は長いセッション期間を設定
        expiresIn: remember ? 30 * 24 * 60 * 60 : 60 * 60, // 30日 or 1時間
      },
    })

    if (error) {
      // 詳細なエラーはログにのみ記録
      console.error("Login error from Supabase:", error)

      // ユーザーには一般的なメッセージのみを表示
      return {
        status: "error",
        errors: {
          general: ["ログイン情報が正しくないか、アカウントが存在しません。"],
        } as AuthError,
      }
    }

    // セッションが正しく設定されたか確認
    const { data: sessionData } = await supabase.auth.getSession()
    console.log("Session after login:", !!sessionData.session)

    // ログイン成功
    return {
      status: "success",
      user: {
        id: data.user.id,
        email: data.user.email,
      },
    }
  } catch (error) {
    console.error("Login error:", error)
    return {
      status: "error",
      errors: {
        general: ["ログイン処理中にエラーが発生しました。後でもう一度お試しください。"],
      } as AuthError,
    }
  }
}

export async function logoutAction() {
  const supabase = createClient()
  await supabase.auth.signOut()
  redirect("/")
}
