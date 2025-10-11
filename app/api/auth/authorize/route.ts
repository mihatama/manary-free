import { NextResponse } from "next/server"

import { getCognitoOidcConfig, getMissingCognitoOidcConfig } from "@/lib/cognito"
import { getOidcClient, generateNonce, generateState } from "@/lib/auth/oidc-client"
import {
  OIDC_NONCE_COOKIE,
  OIDC_STATE_COOKIE,
  STATE_COOKIE_MAX_AGE,
} from "@/lib/auth/cookies"

export const runtime = "nodejs"

function buildErrorRedirect(request: Request, message: string) {
  const requestUrl = new URL(request.url)
  const redirectUrl = new URL("/", requestUrl.origin)
  redirectUrl.searchParams.set("error", message)

  const response = NextResponse.redirect(redirectUrl)
  response.cookies.set({
    name: OIDC_STATE_COOKIE,
    value: "",
    maxAge: 0,
    path: "/",
  })
  response.cookies.set({
    name: OIDC_NONCE_COOKIE,
    value: "",
    maxAge: 0,
    path: "/",
  })

  return response
}

export async function GET(request: Request) {
  const config = getCognitoOidcConfig()

  if (!config) {
    const missing = getMissingCognitoOidcConfig()
    console.error("Cognito OIDC configuration missing:", missing.join(", "))
    return buildErrorRedirect(
      request,
      "認証設定に問題が発生しました。管理者にお問い合わせください。",
    )
  }

  try {
    const requestUrl = new URL(request.url)
    const client = await getOidcClient()
    const state = generateState()
    const nonce = generateNonce()

    const authorizationUrl = client.authorizationUrl({
      scope: config.scopes.join(" "),
      state,
      nonce,
    })

    const response = NextResponse.redirect(authorizationUrl)
    const secure = requestUrl.protocol === "https:"

    response.cookies.set({
      name: OIDC_STATE_COOKIE,
      value: state,
      httpOnly: true,
      sameSite: "lax",
      secure,
      maxAge: STATE_COOKIE_MAX_AGE,
      path: "/",
    })

    response.cookies.set({
      name: OIDC_NONCE_COOKIE,
      value: nonce,
      httpOnly: true,
      sameSite: "lax",
      secure,
      maxAge: STATE_COOKIE_MAX_AGE,
      path: "/",
    })

    return response
  } catch (error) {
    console.error("Failed to initiate Cognito authorization flow:", error)
    return buildErrorRedirect(
      request,
      "Cognitoの認証ページに接続できませんでした。時間をおいて再度お試しください。",
    )
  }
}
