import { type NextRequest, NextResponse } from "next/server"
import { validateCSRFToken } from "@/lib/csrf"
import { sendVerificationCode } from "@/lib/twilio"

export const dynamic = "force-dynamic"

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const phoneNumber = formData.get("phone_number") as string
    const csrfToken = formData.get("csrf_token") as string | null

    // CSRFトークンがある場合のみ検証
    if (csrfToken && !validateCSRFToken(csrfToken)) {
      return NextResponse.json({ success: false, error: "セキュリティトークンが無効です" }, { status: 403 })
    }

    if (!phoneNumber) {
      return NextResponse.json({ success: false, error: "電話番号が必要です" }, { status: 400 })
    }

    // 電話番号のフォーマットをチェック
    const phoneRegex = /^(0[0-9]{9,10}|0[0-9]{1,4}-[0-9]{1,4}-[0-9]{2,4})$/
    if (!phoneRegex.test(phoneNumber)) {
      return NextResponse.json({ success: false, error: "有効な日本の電話番号を入力してください" }, { status: 400 })
    }

    // ハイフンを削除して標準化
    const normalizedPhone = phoneNumber.replace(/-/g, "")

    // Twilio Verify APIを使用して認証コードを送信
    const smsSent = await sendVerificationCode(normalizedPhone)

    if (!smsSent) {
      return NextResponse.json({ success: false, error: "認証コードの送信に失敗しました" }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("認証コード送信エラー:", error)
    return NextResponse.json({ success: false, error: "認証コードの送信に失敗しました" }, { status: 500 })
  }
}
