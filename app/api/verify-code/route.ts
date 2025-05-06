import { type NextRequest, NextResponse } from "next/server"
import { validateCSRFToken } from "@/lib/csrf"
import { createClient } from "@/lib/supabase/server"

export async function POST(request: NextRequest) {
  try {
    console.log("Received verification code check request")

    const formData = await request.formData()
    const phoneNumber = formData.get("phone_number") as string
    const code = formData.get("code") as string
    const csrfToken = formData.get("csrf_token") as string | null

    console.log("Phone number received:", phoneNumber)
    console.log("Code received:", code ? "******" : "missing")

    // CSRFトークンがある場合のみ検証
    if (csrfToken && !validateCSRFToken(csrfToken)) {
      console.error("CSRF token validation failed")
      return NextResponse.json({ success: false, error: "セキュリティトークンが無効です" }, { status: 403 })
    }

    if (!phoneNumber) {
      console.error("Phone number missing in request")
      return NextResponse.json({ success: false, error: "電話番号が必要です" }, { status: 400 })
    }

    if (!code) {
      console.error("Verification code missing in request")
      return NextResponse.json({ success: false, error: "認証コードが必要です" }, { status: 400 })
    }

    // 開発環境では常にテストモードを使用
    if (process.env.NODE_ENV !== "production") {
      console.log("[DEV MODE] Checking test verification code")
      const isValid = code === "123456"
      return NextResponse.json({
        success: isValid,
        message: isValid ? "認証に成功しました" : "認証コードが無効です",
      })
    }

    // ハイフンを削除して標準化
    const normalizedPhone = phoneNumber.replace(/-/g, "")

    // データベースから認証コードを取得
    const supabase = createClient()
    const { data, error } = await supabase
      .from("verification_codes")
      .select("*")
      .eq("phone_number", normalizedPhone)
      .eq("code", code)
      .single()

    if (error || !data) {
      console.error("Database error or code not found:", error)
      return NextResponse.json({ success: false, error: "認証コードが無効です" }, { status: 400 })
    }

    // 有効期限をチェック
    const expiresAt = new Date(data.expires_at)
    if (expiresAt < new Date()) {
      console.error("Verification code expired")
      return NextResponse.json({ success: false, error: "認証コードの有効期限が切れています" }, { status: 400 })
    }

    // 認証成功
    return NextResponse.json({
      success: true,
      message: "認証に成功しました",
    })
  } catch (error: any) {
    console.error("Verification code check error:", error)
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
