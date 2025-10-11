import { cookies } from "next/headers"
import { NextResponse } from "next/server"

import { getOidcClient } from "@/lib/auth/oidc-client"
import {
  ACCESS_TOKEN_COOKIE,
  ID_TOKEN_COOKIE,
  OIDC_NONCE_COOKIE,
  OIDC_STATE_COOKIE,
  REFRESH_TOKEN_COOKIE,
  REFRESH_TOKEN_MAX_AGE,
} from "@/lib/auth/cookies"
import { getCognitoOidcConfig, getMissingCognitoOidcConfig } from "@/lib/cognito"

export const runtime = "nodejs"

function redirectWithMessage(requestUrl: URL, params: Record<string, string | undefined>) {
  const redirectUrl = new URL("/", requestUrl.origin)

  for (const [key, value] of Object.entries(params)) {
    if (value) {
      redirectUrl.searchParams.set(key, value)
    }
  }

  return NextResponse.redirect(redirectUrl)
}

function clearTransientCookies(response: NextResponse) {
  response.cookies.set({ name: OIDC_STATE_COOKIE, value: "", maxAge: 0, path: "/" })
  response.cookies.set({ name: OIDC_NONCE_COOKIE, value: "", maxAge: 0, path: "/" })
}

export async function GET(request: Request) {
  const config = getCognitoOidcConfig()

  if (!config) {
    const missing = getMissingCognitoOidcConfig()
    console.error("Cognito OIDC configuration missing:", missing.join(", "))
    const response = redirectWithMessage(new URL(request.url), {
      error: "認証設定に問題が発生しました。管理者にお問い合わせください。",
    })
    clearTransientCookies(response)
    return response
  }

  const requestUrl = new URL(request.url)
  const errorParam = requestUrl.searchParams.get("error")
  if (errorParam) {
    const response = redirectWithMessage(requestUrl, {
      error: "Cognitoの認証がキャンセルされました。もう一度お試しください。",
    })
    clearTransientCookies(response)
    return response
  }

  const cookieStore = cookies()
  const stateCookie = cookieStore.get(OIDC_STATE_COOKIE)
  const nonceCookie = cookieStore.get(OIDC_NONCE_COOKIE)

  if (!stateCookie?.value || !nonceCookie?.value) {
    const response = redirectWithMessage(requestUrl, {
      error: "セッション情報が見つかりませんでした。もう一度ログインをお試しください。",
    })
    clearTransientCookies(response)
    return response
  }

  try {
    const client = await getOidcClient()
    const params = client.callbackParams(requestUrl)
    const tokenSet = await client.callback(config.redirectUri, params, {
      state: stateCookie.value,
      nonce: nonceCookie.value,
    })

    if (!tokenSet.access_token || !tokenSet.id_token) {
      console.error("Cognito callback missing tokens:", tokenSet)
      const response = redirectWithMessage(requestUrl, {
        error: "ログインに必要なトークンを取得できませんでした。もう一度お試しください。",
      })
      clearTransientCookies(response)
      return response
    }

    const response = NextResponse.redirect(new URL("/dashboard", requestUrl.origin))
    const secure = requestUrl.protocol === "https:"
    const accessTokenMaxAge = tokenSet.expires_in ?? 60 * 60

    response.cookies.set({
      name: ACCESS_TOKEN_COOKIE,
      value: tokenSet.access_token,
      httpOnly: true,
      secure,
      sameSite: "lax",
      maxAge: accessTokenMaxAge,
      path: "/",
    })

    response.cookies.set({
      name: ID_TOKEN_COOKIE,
      value: tokenSet.id_token,
      httpOnly: true,
      secure,
      sameSite: "lax",
      maxAge: accessTokenMaxAge,
      path: "/",
    })

    if (tokenSet.refresh_token) {
      response.cookies.set({
        name: REFRESH_TOKEN_COOKIE,
        value: tokenSet.refresh_token,
        httpOnly: true,
        secure,
        sameSite: "lax",
        maxAge: REFRESH_TOKEN_MAX_AGE,
        path: "/",
      })
    } else {
      response.cookies.set({
        name: REFRESH_TOKEN_COOKIE,
        value: "",
        maxAge: 0,
        path: "/",
      })
    }

    clearTransientCookies(response)

    return response
  } catch (error) {
    console.error("Cognito callback processing failed:", error)
    const response = redirectWithMessage(requestUrl, {
      error: "ログイン処理中にエラーが発生しました。時間をおいて再度お試しください。",
    })
    clearTransientCookies(response)
    return response
  }
}
