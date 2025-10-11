"use server"

import { redirect } from "next/navigation"
import { cookies } from "next/headers"
import { createServerActionClient } from "@supabase/auth-helpers-nextjs"

import type { AuthError } from "@/lib/auth"
import type { Database } from "@/lib/supabase/database.types"
import { validateCSRFToken } from "@/lib/csrf"
import { registerWithCognito, validateRegisterInput } from "@/lib/auth/register"

// CSRF検証を行うヘルパー関数
async function validateCSRF(formData: FormData) {
  const csrfToken = formData.get("csrf_token")
  if (!csrfToken || typeof csrfToken !== "string") {
    return {
      success: false,
      error: "セキュリティトークンが無効です。ページを再読み込みしてください。",
    }
  }

  const isValid = await validateCSRFToken(csrfToken)
  if (!isValid) {
    return {
      success: false,
      error: "セキュリティトークンが無効です。ページを再読み込みしてください。",
    }
  }
  return { success: true }
}

export async function logoutAction(formData: FormData) {
  try {
    // CSRF検証 - エラーをログに記録するが、処理は続行する
    const csrfValidation = await validateCSRF(formData)
    if (!csrfValidation.success) {
      console.error("CSRF validation failed during logout - proceeding anyway")
    }

    const cookieStore = cookies()
    const supabase = createServerActionClient<Database>({ cookies: () => cookieStore })

    await supabase.auth.signOut()

    // Always redirect to the login page
    redirect("/")
  } catch (error) {
    console.error("Logout error:", error)
    // Even if there's an error, try to redirect to the login page
    redirect("/")
  }
}

export async function logOut() {
  const cookieStore = cookies()
  const supabase = createServerActionClient<Database>({ cookies: () => cookieStore })
  await supabase.auth.signOut()
  redirect("/")
}

type RegisterActionState = {
  status: "idle" | "error" | "success"
  errors?: AuthError & { confirmPassword?: string[] }
  message?: string
}

export async function registerAction(prevState: RegisterActionState, formData: FormData) {
  const csrfValidation = await validateCSRF(formData)
  if (!csrfValidation.success) {
    return {
      status: "error",
      errors: {
        general: ["セキュリティ検証に失敗しました。ページを再読み込みしてください。"],
      },
    }
  }

  const validation = validateRegisterInput({
    email: formData.get("email"),
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
  })

  if (!validation.success) {
    return {
      status: "error",
      errors: validation.errors,
    }
  }

  const { email, password } = validation
  try {
    return await registerWithCognito({ email, password })
  } catch (error) {
    console.error("Register action unexpected error:", error)
    return {
      status: "error",
      errors: {
        general: ["アカウントの作成中にエラーが発生しました。時間をおいて再度お試しください。"],
      },
    }
  }
}
