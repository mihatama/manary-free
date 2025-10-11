import {
  CognitoIdentityProviderClient,
  InitiateAuthCommand,
  type InitiateAuthCommandOutput,
} from "@aws-sdk/client-cognito-identity-provider"

import type { AuthError } from "@/lib/auth"
import { getCognitoConfig, getMissingCognitoConfig } from "@/lib/cognito"
import { computeSecretHash, decodeIdToken } from "@/lib/auth/cognito"

export type LoginResult =
  | {
      status: "success"
      tokens: {
        accessToken: string
        idToken: string
        refreshToken?: string
        expiresIn: number
        tokenType?: string
      }
      user: {
        id: string
        email: string | null
      }
    }
  | { status: "error"; errors: AuthError }

function buildAuthError(message: string): AuthError {
  return { general: [message] }
}

function handleMissingConfig(missing: string[]): LoginResult {
  console.error("Missing Cognito configuration:", missing.join(", "))
  return {
    status: "error",
    errors: buildAuthError("現在ログイン処理を実行できません。管理者にお問い合わせください。"),
  }
}

function createClient() {
  const config = getCognitoConfig()
  if (!config) {
    return null
  }
  return {
    client: new CognitoIdentityProviderClient({ region: config.region }),
    config,
  }
}

function extractUserInfo(response: InitiateAuthCommandOutput) {
  const idToken = response.AuthenticationResult?.IdToken
  if (!idToken) {
    return { id: "", email: null }
  }

  const payload = decodeIdToken(idToken)
  const email = typeof payload?.email === "string" ? payload.email : null
  const sub = typeof payload?.sub === "string" ? payload.sub : null
  return {
    id: sub || email || "",
    email,
  }
}

export async function loginWithCognito({
  email,
  password,
}: {
  email: string
  password: string
}): Promise<LoginResult> {
  const missingConfig = getMissingCognitoConfig()
  if (missingConfig.length) {
    return handleMissingConfig(missingConfig)
  }

  const resources = createClient()
  if (!resources) {
    console.error("Cognito configuration could not be loaded even though no values appear missing.")
    return {
      status: "error",
      errors: buildAuthError("現在ログイン処理を実行できません。管理者にお問い合わせください。"),
    }
  }

  const { client, config } = resources
  const secretHash = computeSecretHash(email, config.clientId, config.clientSecret)

  try {
    const response = await client.send(
      new InitiateAuthCommand({
        AuthFlow: "USER_PASSWORD_AUTH",
        ClientId: config.clientId,
        AuthParameters: {
          USERNAME: email,
          PASSWORD: password,
          SECRET_HASH: secretHash,
        },
      }),
    )

    const authResult = response.AuthenticationResult
    if (!authResult?.AccessToken || !authResult?.IdToken) {
      console.error("Cognito login failed: AuthenticationResult is missing tokens.")
      return {
        status: "error",
        errors: buildAuthError("ログインに失敗しました。もう一度お試しください。"),
      }
    }

    const user = extractUserInfo(response)

    return {
      status: "success",
      tokens: {
        accessToken: authResult.AccessToken,
        idToken: authResult.IdToken,
        refreshToken: authResult.RefreshToken,
        expiresIn: authResult.ExpiresIn ?? 3600,
        tokenType: authResult.TokenType,
      },
      user: {
        id: user.id,
        email: user.email,
      },
    }
  } catch (error: any) {
    console.error("Cognito login error:", error)

    if (error?.name === "UserNotConfirmedException") {
      return {
        status: "error",
        errors: buildAuthError("メールアドレスの確認が完了していません。確認メールをご確認ください。"),
      }
    }

    if (error?.name === "NotAuthorizedException") {
      return {
        status: "error",
        errors: {
          password: ["メールアドレスまたはパスワードが正しくありません。"],
        },
      }
    }

    if (error?.name === "UserNotFoundException") {
      return {
        status: "error",
        errors: {
          email: ["このメールアドレスは登録されていません。"],
        },
      }
    }

    if (error?.name === "PasswordResetRequiredException") {
      return {
        status: "error",
        errors: buildAuthError("パスワードのリセットが必要です。管理者にお問い合わせください。"),
      }
    }

    if (error?.name === "TooManyRequestsException" || error?.name === "LimitExceededException") {
      return {
        status: "error",
        errors: buildAuthError("試行回数が多すぎます。時間をおいてから再度お試しください。"),
      }
    }

    return {
      status: "error",
      errors: buildAuthError("ログイン処理中にエラーが発生しました。時間をおいて再度お試しください。"),
    }
  }
}
