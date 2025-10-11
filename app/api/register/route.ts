import { NextResponse } from "next/server"

import { registerWithCognito, validateRegisterInput } from "@/lib/auth/register"
import { validateCSRFToken } from "@/lib/csrf"

export async function POST(request: Request) {
  try {
    const body = await request.json()

    const csrfToken = body?.csrfToken ?? body?.csrf_token
    if (typeof csrfToken !== "string") {
      return NextResponse.json(
        {
          status: "error",
          errors: {
            general: ["セキュリティ検証に失敗しました。ページを再読み込みしてください。"],
          },
        },
        { status: 400 },
      )
    }

    const isValidToken = await validateCSRFToken(csrfToken)
    if (!isValidToken) {
      return NextResponse.json(
        {
          status: "error",
          errors: {
            general: ["セキュリティ検証に失敗しました。ページを再読み込みしてください。"],
          },
        },
        { status: 400 },
      )
    }

    const validation = validateRegisterInput({
      email: body?.email,
      password: body?.password,
      confirmPassword: body?.confirmPassword,
    })

    if (!validation.success) {
      return NextResponse.json(
        {
          status: "error",
          errors: validation.errors,
        },
        { status: 400 },
      )
    }

    const result = await registerWithCognito({
      email: validation.email,
      password: validation.password,
    })

    const status = result.status === "success" ? 200 : 400
    return NextResponse.json(result, { status })
  } catch (error) {
    console.error("Register API error:", error)
    return NextResponse.json(
      {
        status: "error",
        errors: {
          general: ["アカウントの作成中にエラーが発生しました。時間をおいて再度お試しください。"],
        },
      },
      { status: 500 },
    )
  }
}
