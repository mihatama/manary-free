"use server"

import { redirect } from "next/navigation"
import { cookies } from "next/headers"
import { createServerActionClient } from "@supabase/auth-helpers-nextjs"
import { CognitoIdentityProviderClient, SignUpCommand } from "@aws-sdk/client-cognito-identity-provider"
import { createHmac } from "node:crypto"
import { z } from "zod"

import type { AuthError } from "@/lib/auth"
import type { Database } from "@/lib/supabase/database.types"
import { validateCSRFToken } from "@/lib/csrf"
import { getCognitoConfig, getMissingCognitoConfig } from "@/lib/cognito"

const registerSchema = z
  .object({
    email: z
      .string()
      .min(1, "メールアドレスを入力してください。")
      .email("有効なメールアドレスを入力してください。"),
    password: z
      .string()
      .min(8, "パスワードは8文字以上で入力してください。")
      .max(64, "パスワードは64文字以内で入力してください。"),
    confirmPassword: z.string().min(1, "確認用パスワードを入力してください。"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "パスワードが一致しません。",
    path: ["confirmPassword"],
  })

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
      console.error("Authentication error occurred:", error.message)

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
      console.error("Failed to get authenticated user:", userError?.message)
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
  } catch (error: any) {
    console.error("Login process error:", error.message)
    return {
      status: "error",
      errors: {
        general: ["ログイン処理中にエラーが発生しました。後でもう一度お試しください。"],
      } as AuthError,
    }
  }
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

function computeSecretHash(username: string, clientId: string, clientSecret: string) {
  return createHmac("sha256", clientSecret).update(username + clientId).digest("base64")
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

  const parseResult = registerSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
  })

  if (!parseResult.success) {
    const { fieldErrors, formErrors } = parseResult.error.flatten()
    const errors: NonNullable<RegisterActionState["errors"]> = {}

    if (fieldErrors.email?.length) {
      errors.email = fieldErrors.email
    }

    if (fieldErrors.password?.length) {
      errors.password = fieldErrors.password
    }

    if (fieldErrors.confirmPassword?.length) {
      errors.confirmPassword = fieldErrors.confirmPassword
    }

    if (formErrors.length) {
      errors.general = formErrors
    }

    return {
      status: "error",
      errors,
    }
  }

  const { email, password } = parseResult.data

  const missingConfig = getMissingCognitoConfig()
  if (missingConfig.length) {
    console.error(
      "Missing Cognito configuration:",
      missingConfig.join(", "),
    )

    return {
      status: "error",
      errors: {
        general: [
          "現在アカウントの新規作成を行うことができません。管理者にお問い合わせください。",
        ],
      },
    }
  }

  const cognitoConfig = getCognitoConfig()
  if (!cognitoConfig) {
    console.error("Cognito configuration could not be loaded even though no values appear missing.")

    return {
      status: "error",
      errors: {
        general: [
          "現在アカウントの新規作成を行うことができません。管理者にお問い合わせください。",
        ],
      },
    }
  }

  const client = new CognitoIdentityProviderClient({ region: cognitoConfig.region })
  const secretHash = computeSecretHash(
    email,
    cognitoConfig.clientId,
    cognitoConfig.clientSecret,
  )

  try {
    await client.send(
      new SignUpCommand({
        ClientId: cognitoConfig.clientId,
        Username: email,
        Password: password,
        SecretHash: secretHash,
        UserAttributes: [
          { Name: "email", Value: email },
        ],
      }),
    )

    return {
      status: "success",
      message: "アカウントの仮登録が完了しました。確認メールをご確認ください。",
    }
  } catch (error: any) {
    console.error("Cognito sign up error:", error)

    if (error?.name === "UsernameExistsException") {
      return {
        status: "error",
        errors: {
          general: ["このメールアドレスは既に登録されています。ログインをお試しください。"],
        },
      }
    }

    if (error?.name === "InvalidPasswordException") {
      return {
        status: "error",
        errors: {
          password: [
            "パスワードの要件を満たしていません。大文字・小文字・数字・記号を含む8文字以上のパスワードを設定してください。",
          ],
        },
      }
    }

    return {
      status: "error",
      errors: {
        general: ["アカウントの作成中にエラーが発生しました。時間をおいて再度お試しください。"],
      },
    }
  }
}
