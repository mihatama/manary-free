import { type NextRequest, NextResponse } from "next/server"
import { validateCSRFToken } from "@/lib/csrf"
import { sendVerificationCode } from "@/lib/twilio"

export async function POST(request: NextRequest) {
  try {
    console.log("[API] Received verification code request")

    // リクエストデータの取得
    let formData: FormData
    try {
      formData = await request.formData()
    } catch (error) {
      console.error("[API] Failed to parse form data:", error)
      return NextResponse.json({ success: false, error: "リクエストデータの解析に失敗しました" }, { status: 400 })
    }

    const phoneNumber = formData.get("phone_number") as string
    const csrfToken = formData.get("csrf_token") as string | null

    console.log("[API] Phone number received:", phoneNumber)
    console.log("[API] Environment:", process.env.NODE_ENV)
    console.log("[API] TWILIO_ACCOUNT_SID exists:", !!process.env.TWILIO_ACCOUNT_SID)
    console.log("[API] TWILIO_AUTH_TOKEN exists:", !!process.env.TWILIO_AUTH_TOKEN)
    console.log("[API] TWILIO_VERIFY_SERVICE_SID exists:", !!process.env.TWILIO_VERIFY_SERVICE_SID)
    console.log("[API] MOCK_SMS:", process.env.MOCK_SMS)

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

    // 電話番号のフォーマットをチェック
    const phoneRegex = /^(0[0-9]{9,10}|0[0-9]{1,4}-[0-9]{1,4}-[0-9]{2,4})$/
    if (!phoneRegex.test(phoneNumber)) {
      console.error("[API] Invalid phone number format:", phoneNumber)
      return NextResponse.json({ success: false, error: "有効な日本の電話番号を入力してください" }, { status: 400 })
    }

    // ハイフンを削除して標準化
    const normalizedPhone = phoneNumber.replace(/-/g, "")
    console.log("[API] Normalized phone:", normalizedPhone)

    // Verify APIを使用して認証コードを送信
    console.log("[API] Sending verification code via Verify API")

    let verifyResult
    try {
      verifyResult = await sendVerificationCode(normalizedPhone)
      console.log("[API] Verification result:", verifyResult)
    } catch (error: any) {
      console.error("[API] Exception during verification sending:", error)
      return NextResponse.json(
        {
          success: false,
          error: "認証コードの送信中にエラーが発生しました",
          details: error.message || "Unknown error",
          debug: { stack: error.stack },
        },
        { status: 500 },
      )
    }

    if (!verifyResult.success) {
      console.error("[API] Verification sending failed:", verifyResult.error)

      // 開発環境では失敗してもモックコードを返す
      if (process.env.NODE_ENV !== "production" && process.env.MOCK_SMS === "true") {
        return NextResponse.json({
          success: true,
          message: "開発環境: 認証コードを送信しました（モックモード）",
          devMode: true,
          mockCode: "123456",
          verifyStatus: "failed",
          verifyError: verifyResult.error,
          debug: verifyResult.debug || null,
        })
      }

      // 本番環境ではエラーを返す
      return NextResponse.json(
        {
          success: false,
          error: verifyResult.error || "認証コードの送信に失敗しました",
          details: "しばらく経ってから再試行してください。",
          debug: verifyResult.debug,
        },
        { status: 500 },
      )
    }

    // 送信成功時
    return NextResponse.json({
      success: true,
      message: "認証コードを送信しました。SMSをご確認ください。",
      devMode: process.env.NODE_ENV !== "production",
      mockCode: process.env.NODE_ENV !== "production" && process.env.MOCK_SMS === "true" ? "123456" : undefined,
      verifyStatus: "sent",
      debug: verifyResult?.debug || null,
    })
  } catch (error: any) {
    // 最終的なエラーハンドリング
    console.error("[API] Unhandled error in verification code sending:", error)
    return NextResponse.json(
      {
        success: false,
        error: "認証コードの送信に失敗しました",
        details: error.message || "Unknown error",
        stack: process.env.NODE_ENV !== "production" ? error.stack : undefined,
      },
      { status: 500 },
    )
  }
}
