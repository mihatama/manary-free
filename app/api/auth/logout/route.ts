import { NextResponse } from "next/server"

import {
  ACCESS_TOKEN_COOKIE,
  ID_TOKEN_COOKIE,
  OIDC_NONCE_COOKIE,
  OIDC_STATE_COOKIE,
  REFRESH_TOKEN_COOKIE,
} from "@/lib/auth/cookies"
import { getCognitoOidcConfig, getMissingCognitoOidcConfig } from "@/lib/cognito"

export const runtime = "nodejs"

function clearAuthCookies(response: NextResponse) {
  const cookiesToClear = [
    ACCESS_TOKEN_COOKIE,
    ID_TOKEN_COOKIE,
    REFRESH_TOKEN_COOKIE,
    OIDC_STATE_COOKIE,
    OIDC_NONCE_COOKIE,
  ]

  for (const name of cookiesToClear) {
    response.cookies.set({ name, value: "", maxAge: 0, path: "/" })
  }
}

export async function GET(request: Request) {
  const config = getCognitoOidcConfig()
  const requestUrl = new URL(request.url)

  if (!config) {
    const missing = getMissingCognitoOidcConfig()
    console.error("Cognito OIDC configuration missing:", missing.join(", "))
    const redirectUrl = new URL("/", requestUrl.origin)
    redirectUrl.searchParams.set(
      "error",
      "認証設定に問題があるためログアウト処理を完了できませんでした。",
    )

    const response = NextResponse.redirect(redirectUrl)
    clearAuthCookies(response)
    return response
  }

  const logoutUrl = new URL("/logout", config.hostedDomain)
  logoutUrl.searchParams.set("client_id", config.clientId)
  logoutUrl.searchParams.set("logout_uri", config.logoutRedirectUri)

  const response = NextResponse.redirect(logoutUrl)
  clearAuthCookies(response)
  return response
}
