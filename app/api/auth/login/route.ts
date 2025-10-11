import { NextResponse } from "next/server"
import { cookies } from "next/headers"

import type { AuthError } from "@/lib/auth"
import { validateCSRFToken } from "@/lib/csrf"
import { loginWithCognito } from "@/lib/auth/login"

const ACCESS_TOKEN_COOKIE = "cognitoAccessToken"
const ID_TOKEN_COOKIE = "cognitoIdToken"
const REFRESH_TOKEN_COOKIE = "cognitoRefreshToken"

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => null)

    if (!body || typeof body !== "object") {
      return NextResponse.json(
        {
          status: "error",
          errors: {
            general: ["不正なリクエストです。"],
          } satisfies AuthError,
        },
        { status: 400 },
      )
    }

    const email = typeof body.email === "string" ? body.email.trim() : ""
    const password = typeof body.password === "string" ? body.password : ""
    const remember = Boolean(body.remember)
    const csrfToken = typeof body.csrfToken === "string" ? body.csrfToken : ""

    if (!csrfToken) {
      return NextResponse.json(
        {
          status: "error",
          errors: {
            general: ["セキュリティ検証に失敗しました。ページを再読み込みしてください。"],
          } satisfies AuthError,
        },
        { status: 400 },
      )
    }

    const isValidCSRF = await validateCSRFToken(csrfToken)
    if (!isValidCSRF) {
      return NextResponse.json(
        {
          status: "error",
          errors: {
            general: ["セキュリティ検証に失敗しました。ページを再読み込みしてください。"],
          } satisfies AuthError,
        },
        { status: 403 },
      )
    }

    if (!email || !password) {
      return NextResponse.json(
        {
          status: "error",
          errors: {
            ...(email ? {} : { email: ["メールアドレスを入力してください。"] }),
            ...(password ? {} : { password: ["パスワードを入力してください。"] }),
          },
        },
        { status: 400 },
      )
    }

    const loginResult = await loginWithCognito({ email, password })

    if (loginResult.status === "error") {
      return NextResponse.json({ status: "error", errors: loginResult.errors }, { status: 401 })
    }

    const cookieStore = cookies()
    const secure = process.env.NODE_ENV === "production"
    const accessTokenMaxAge = loginResult.tokens.expiresIn
    const refreshTokenMaxAge = remember ? 30 * 24 * 60 * 60 : 24 * 60 * 60

    cookieStore.set({
      name: ACCESS_TOKEN_COOKIE,
      value: loginResult.tokens.accessToken,
      httpOnly: true,
      secure,
      sameSite: "lax",
      path: "/",
      maxAge: accessTokenMaxAge,
    })

    cookieStore.set({
      name: ID_TOKEN_COOKIE,
      value: loginResult.tokens.idToken,
      httpOnly: true,
      secure,
      sameSite: "lax",
      path: "/",
      maxAge: accessTokenMaxAge,
    })

    if (loginResult.tokens.refreshToken) {
      cookieStore.set({
        name: REFRESH_TOKEN_COOKIE,
        value: loginResult.tokens.refreshToken,
        httpOnly: true,
        secure,
        sameSite: "lax",
        path: "/",
        maxAge: refreshTokenMaxAge,
      })
    } else if (cookieStore.has(REFRESH_TOKEN_COOKIE)) {
      cookieStore.delete(REFRESH_TOKEN_COOKIE)
    }

    return NextResponse.json({
      status: "success",
      user: {
        id: loginResult.user.id,
        email: loginResult.user.email,
      },
    })
  } catch (error) {
    console.error("Login process error:", error)
    return NextResponse.json(
      {
        status: "error",
        errors: {
          general: ["ログイン処理中にエラーが発生しました。後でもう一度お試しください。"],
        } satisfies AuthError,
      },
      { status: 500 },
    )
  }
}
