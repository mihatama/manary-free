import { type NextRequest, NextResponse } from "next/server"
import { validateCSRFToken } from "@/lib/csrf"
import { generateVerificationCode, saveVerificationCode } from "@/lib/verification-code"

export async function POST(request: NextRequest) {
  try {
    console.log("Received verification code request")

    const formData = await request.formData()
    const phoneNumber = formData.get("phone_number") as string
    const csrfToken = formData.get("csrf_token") as string | null

    console.log("Phone number received:", phoneNumber)

    // CSRFトークンがある場合のみ検証
    if (csrfToken && !validateCSRFToken(csrfToken)) {
      console.error("CSRF token validation failed")
      return NextResponse.json({ success: false, error: "セキュリティトークンが無効です" }, { status: 403 })
    }

    if (!phoneNumber) {
      console.error("Phone number missing in request")
      return NextResponse.json({ success: false, error: "電話番号が必要です" }, { status: 400 })
    }

    // 電話番号のフォーマットをチェック
    const phoneRegex = /^(0[0-9]{9,10}|0[0-9]{1,4}-[0-9]{1,4}-[0-9]{2,4})$/
    if (!phoneRegex.test(phoneNumber)) {
      console.error("Invalid phone number format:", phoneNumber)
      return NextResponse.json({ success: false, error: "有効な日本の電話番号を入力してください" }, { status: 400 })
    }

    // ハイフンを削除して標準化
    const normalizedPhone = phoneNumber.replace(/-/g, "")
    console.log("Normalized phone:", normalizedPhone)

    // 認証コードを生成
    const code = generateVerificationCode()
    console.log("Generated verification code:", code)

    // 認証コードをデータベースに保存
    const saved = await saveVerificationCode(normalizedPhone, code)

    if (!saved && process.env.NODE_ENV === "production") {
      console.error("Failed to save verification code")
      return NextResponse.json({ success: false, error: "認証コードの保存に失敗しました" }, { status: 500 })
    }

    // 開発環境では常にテストモードを使用
    console.log("[DEV MODE] Using test verification code:", code)
    return NextResponse.json({
      success: true,
      message: `認証コード ${code} を送信しました`,
      devMode: process.env.NODE_ENV !== "production",
    })
  } catch (error: any) {
    console.error("Verification code sending error:", error)
    return NextResponse.json(
      {
        success: false,
        error: "認証コードの送信に失敗しました",
        details: error.message || "Unknown error",
      },
      { status: 500 },
    )
  }
}
