"use server"

import { login as authLogin, logout as authLogout, type AuthError } from "@/lib/auth"
import { redirect } from "next/navigation"

export async function loginAction(prevState: any, formData: FormData) {
  const email = formData.get("email") as string
  const password = formData.get("password") as string
  const remember = formData.has("remember")

  try {
    const result = await authLogin(email, password)

    if (!result.success) {
      return {
        status: "error",
        errors: result.errors as AuthError,
      }
    }

    // ログイン成功
    return {
      status: "success",
      user: result.user,
    }
  } catch (error) {
    console.error("Login error:", error)
    return {
      status: "error",
      errors: {
        general: ["ログイン処理中にエラーが発生しました。後でもう一度お試しください。"],
      },
    }
  }
}

export async function logoutAction() {
  await authLogout()
  redirect("/")
}
