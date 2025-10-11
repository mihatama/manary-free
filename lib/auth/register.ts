import { CognitoIdentityProviderClient, SignUpCommand } from "@aws-sdk/client-cognito-identity-provider"
import { createHmac } from "node:crypto"
import { z } from "zod"

import type { AuthError } from "@/lib/auth"
import { getCognitoConfig, getMissingCognitoConfig } from "@/lib/cognito"

export const registerSchema = z
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

export type RegisterErrors = AuthError & { confirmPassword?: string[] }

export type RegisterResult =
  | { status: "error"; errors: RegisterErrors }
  | { status: "success"; message: string }

export type RegisterValidationResult =
  | { success: true; email: string; password: string }
  | { success: false; errors: RegisterErrors }

export function validateRegisterInput(input: {
  email: unknown
  password: unknown
  confirmPassword: unknown
}): RegisterValidationResult {
  const parseResult = registerSchema.safeParse(input)

  if (parseResult.success) {
    const { email, password } = parseResult.data
    return { success: true, email, password }
  }

  const { fieldErrors, formErrors } = parseResult.error.flatten()
  const errors: RegisterErrors = {}

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

  return { success: false, errors }
}

function computeSecretHash(username: string, clientId: string, clientSecret: string) {
  return createHmac("sha256", clientSecret).update(username + clientId).digest("base64")
}

export async function registerWithCognito({
  email,
  password,
}: {
  email: string
  password: string
}): Promise<RegisterResult> {
  const missingConfig = getMissingCognitoConfig()
  if (missingConfig.length) {
    console.error("Missing Cognito configuration:", missingConfig.join(", "))

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
  const secretHash =
    cognitoConfig.clientSecret && computeSecretHash(email, cognitoConfig.clientId, cognitoConfig.clientSecret)

  try {
    const signUpCommand = new SignUpCommand({
      ClientId: cognitoConfig.clientId,
      Username: email,
      Password: password,
      UserAttributes: [{ Name: "email", Value: email }],
    })

    if (secretHash) {
      signUpCommand.input.SecretHash = secretHash
    }

    await client.send(signUpCommand)

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
