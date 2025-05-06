import { type NextRequest, NextResponse } from "next/server"
import { validateCSRFToken } from "@/lib/csrf"
import { verifyCode } from "@/lib/verification-code"

export async function POST(request: NextRequest) {
  try {
    console.log("Received verification code check request")

    const formData = await request.formData()
    const phoneNumber = formData.get("phone_number") as string
    const code = formData.get("code") as string
    const csrfToken = formData.get("csrf_token") as string | null

    console.log("Phone number:", phoneNumber, "Code:", code ? "******" : "missing")

    // CSRFトークンがある場合のみ検証
    if (csrfToken && !validateCSRFToken(csrfToken)) {
      console.error("CSRF token validation failed")
      return NextResponse.json({ success: false, error: "セキュリティトークンが無効です" }, { status: 403 })
    }

    if (!phoneNumber || !code) {
      console.error("Phone number or code missing in request")
      return NextResponse.json({ success: false, error: "電話番号と認証コードが必要です" }, { status: 400 })
    }

    // 開発環境では常にテストモードを使用
    if (process.env.NODE_ENV !== "production" && code === "123456") {
      console.log("[DEV MODE] Using test verification code")
      return NextResponse.json({
        success: true,
        message: "開発環境: 認証に成功しました",
      })
    }

    // 認証コードを検証
    const isValid = await verifyCode(phoneNumber, code)

    if (!isValid) {
      return NextResponse.json({ success: false, error: "認証コードが無効です" }, { status: 400 })
    }

    // 認証成功
    return NextResponse.json({
      success: true,
      message: "認証に成功しました",
    })
  } catch (error: any) {
    console.error("Verification code checking error:", error)
    return NextResponse.json(
      {
        success: false,
        error: "認証コードの検証に失敗しました",
        details: error.message || "Unknown error",
      },
      { status: 500 },
    )
  }
}
