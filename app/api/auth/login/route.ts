import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"

import type { Database } from "@/lib/supabase/database.types"
import type { AuthError } from "@/lib/auth"
import { validateCSRFToken } from "@/lib/csrf"

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

    const supabase = createRouteHandlerClient<Database>({ cookies })

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
      options: {
        expiresIn: remember ? 7 * 24 * 60 * 60 : 60 * 60,
      },
    })

    if (error) {
      console.error("Authentication error occurred:", error.message)
      return NextResponse.json(
        {
          status: "error",
          errors: {
            general: ["認証に失敗しました。入力情報を確認してください。"],
          } satisfies AuthError,
        },
        { status: 401 },
      )
    }

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      console.error("Failed to get authenticated user:", userError?.message)
      return NextResponse.json(
        {
          status: "error",
          errors: {
            general: ["認証に失敗しました。もう一度お試しください。"],
          } satisfies AuthError,
        },
        { status: 401 },
      )
    }

    return NextResponse.json({
      status: "success",
      user: {
        id: user.id,
        email: user.email,
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
