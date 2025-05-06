import { type NextRequest, NextResponse } from "next/server"
import { validateCSRFToken } from "@/lib/csrf"
import { verifyCode } from "@/lib/twilio"

export async function POST(request: NextRequest) {
  try {
    console.log("[API] Received verification check request")

    // リクエストデータの取得
    let formData: FormData
    try {
      formData = await request.formData()
    } catch (error) {
      console.error("[API] Failed to parse form data:", error)
      return NextResponse.json({ success: false, error: "リクエストデータの解析に失敗しました" }, { status: 400 })
    }

    const phoneNumber = formData.get("phone_number") as string
    const code = formData.get("code") as string
    const csrfToken = formData.get("csrf_token") as string | null

    console.log("[API] Phone number received:", phoneNumber)
    console.log("[API] Code received:", code ? "******" : "missing")

    // 必要な環境変数のチェック
    if (!process.env.TWILIO_ACCOUNT_SID || !process.env.TWILIO_AUTH_TOKEN) {
      console.error("[API] Twilio credentials not configured")
      return NextResponse.json(
        {
          success: false,
          error: "SMS送信サービスが正しく設定されていません",
          details: "管理者に連絡してください",
        },
        { status: 500 },
      )
    }

    if (!process.env.TWILIO_VERIFY_SERVICE_SID && process.env.MOCK_SMS !== "true") {
      console.error("[API] Twilio Verify Service SID not configured")
      return NextResponse.json(
        {
          success: false,
          error: "SMS認証サービスが正しく設定されていません",
          details: "管理者に連絡してください",
        },
        { status: 500 },
      )
    }

    // CSRFトークンがある場合のみ検証
    if (csrfToken && !validateCSRFToken(csrfToken)) {
      console.error("[API] CSRF token validation failed")
      return NextResponse.json({ success: false, error: "セキュリティトークンが無効です" }, { status: 403 })
    }

    if (!phoneNumber) {
      console.error("[API] Phone number missing in request")
      return NextResponse.json({ success: false, error: "電話番号が必要です" }, { status: 400 })
    }

    if (!code) {
      console.error("[API] Verification code missing in request")
      return NextResponse.json({ success: false, error: "認証コードが必要です" }, { status: 400 })
    }

    // ハイフンを削除して標準化
    const normalizedPhone = phoneNumber.replace(/-/g, "")
    console.log("[API] Normalized phone:", normalizedPhone)

    // Verify APIを使用して認証コードを検証
    console.log("[API] Verifying code via Verify API")

    let verifyResult
    try {
      verifyResult = await verifyCode(normalizedPhone, code)
      console.log("[API] Verification check result:", verifyResult)
    } catch (error: any) {
      console.error("[API] Exception during verification check:", error)
      return NextResponse.json(
        {
          success: false,
          error: "認証コードの検証中にエラーが発生しました",
          details: error.message || "Unknown error",
          debug: { stack: error.stack },
        },
        { status: 500 },
      )
    }

    if (!verifyResult.success) {
      console.error("[API] Verification check failed:", verifyResult.error)
      return NextResponse.json(
        {
          success: false,
          error: verifyResult.error || "認証コードが無効です",
          details: "正しい認証コードを入力してください。",
          debug: verifyResult.debug,
        },
        { status: 400 },
      )
    }

    // 検証成功時
    return NextResponse.json({
      success: true,
      message: "認証が完了しました",
      status: verifyResult.status,
      debug: verifyResult?.debug || null,
    })
  } catch (error: any) {
    // 最終的なエラーハンドリング
    console.error("[API] Unhandled error in verification check:", error)
    return NextResponse.json(
      {
        success: false,
        error: "認証コードの検証に失敗しました",
        details: error.message || "Unknown error",
        stack: process.env.NODE_ENV !== "production" ? error.stack : undefined,
      },
      { status: 500 },
    )
  }
}
