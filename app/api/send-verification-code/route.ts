import { type NextRequest, NextResponse } from "next/server"
import { validateCSRFToken } from "@/lib/csrf"
import { generateVerificationCode, sendSMS } from "@/lib/twilio"
import { createClient } from "@/lib/supabase/server"

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

    // 認証コードをデータベースに保存
    const supabase = createClient()

    // 有効期限を設定（10分）
    const expiresAt = new Date()
    expiresAt.setMinutes(expiresAt.getMinutes() + 10)

    // 既存のコードを削除
    await supabase.from("verification_codes").delete().eq("phone_number", normalizedPhone)

    // 新しいコードを保存
    const { error: dbError } = await supabase.from("verification_codes").insert([
      {
        phone_number: normalizedPhone,
        code: code,
        expires_at: expiresAt.toISOString(),
        created_at: new Date().toISOString(),
      },
    ])

    if (dbError) {
      console.error("Database error:", dbError)
      return NextResponse.json({ success: false, error: "認証コードの保存に失敗しました" }, { status: 500 })
    }

    // 開発環境では常にテストモードを使用
    if (process.env.NODE_ENV !== "production") {
      console.log("[DEV MODE] Using test verification code:", code)
      return NextResponse.json({
        success: true,
        message: `開発環境: テスト認証コード ${code} を使用してください`,
      })
    }

    // SMSで認証コードを送信
    const message = `【マナリー】認証コード: ${code}\nこのコードは10分間有効です。`
    const smsResult = await sendSMS(normalizedPhone, message)

    if (!smsResult.success) {
      console.error("SMS sending failed:", smsResult.error)
      return NextResponse.json({ success: false, error: "SMSの送信に失敗しました" }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: "認証コードを送信しました",
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
