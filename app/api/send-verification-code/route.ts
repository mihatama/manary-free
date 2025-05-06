import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { validateCSRFToken } from "@/lib/csrf"
import { sendSMS } from "@/lib/twilio"

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

    // 6桁のランダムな認証コードを生成
    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString()

    // 有効期限を設定（10分後）
    const expiresAt = new Date()
    expiresAt.setMinutes(expiresAt.getMinutes() + 10)

    // Supabaseに認証コードを保存
    const supabase = createClient()

    // 既存のコードを削除（同じ電話番号に対する古いコードを削除）
    await supabase.from("verification_codes").delete().eq("phone_number", normalizedPhone)

    // 新しいコードを保存
    const { error } = await supabase.from("verification_codes").insert([
      {
        phone_number: normalizedPhone,
        code: verificationCode,
        expires_at: expiresAt.toISOString(),
      },
    ])

    if (error) {
      console.error("認証コード保存エラー:", error)
      return NextResponse.json({ success: false, error: "認証コードの保存に失敗しました" }, { status: 500 })
    }

    // SMSメッセージを作成
    const message = `【マナリー】認証コード: ${verificationCode}\nこのコードは10分間有効です。`

    // SMSを送信
    const smsSent = await sendSMS(normalizedPhone, message)

    if (!smsSent) {
      return NextResponse.json({ success: false, error: "SMSの送信に失敗しました" }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("認証コード送信エラー:", error)
    return NextResponse.json({ success: false, error: "認証コードの送信に失敗しました" }, { status: 500 })
  }
}
