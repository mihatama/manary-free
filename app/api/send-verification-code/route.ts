import { type NextRequest, NextResponse } from "next/server"
import { validateCSRFToken } from "@/lib/csrf"
import twilio from "twilio"

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const phoneNumber = formData.get("phone_number") as string
    const csrfToken = formData.get("csrf_token") as string | null

    // CSRFトークンがある場合のみ検証
    if (csrfToken && !validateCSRFToken(csrfToken)) {
      return NextResponse.json({ success: false, error: "セキュリティトークンが無効です" }, { status: 403 })
    }

    // 電話番号の処理部分の前に詳細なログを追加
    if (!phoneNumber) {
      console.log("電話番号が提供されていません")
      return NextResponse.json({ success: false, error: "電話番号が必要です" }, { status: 400 })
    }

    // 電話番号のフォーマットをチェック
    const phoneRegex = /^(0[0-9]{9,10}|0[0-9]{1,4}-[0-9]{1,4}-[0-9]{2,4})$/
    if (!phoneRegex.test(phoneNumber)) {
      console.log(`無効な電話番号フォーマット: ${phoneNumber}`)
      return NextResponse.json({ success: false, error: "有効な電話番号を入力してください" }, { status: 400 })
    }

    // ハイフンを削除して標準化
    const normalizedPhone = phoneNumber.replace(/-/g, "")
    console.log(`標準化された電話番号: ${normalizedPhone}`)

    // 国際形式に変換（日本の場合は +81 + 電話番号の先頭の0を除いた番号）
    const internationalPhone = "+81" + normalizedPhone.substring(1)
    console.log(`国際形式の電話番号: ${internationalPhone}`)

    // Twilioクライアントを初期化
    const accountSid = process.env.TWILIO_ACCOUNT_SID
    const authToken = process.env.TWILIO_AUTH_TOKEN
    const verifyServiceSid = process.env.TWILIO_VERIFY_SERVICE_SID || "VAcdb873f18d3b51de84cdc57d3d6dfecf"

    console.log(
      `Twilio設定: AccountSID=${accountSid?.substring(0, 5)}..., AuthToken=${authToken ? "設定済み" : "未設定"}, ServiceSID=${verifyServiceSid}`,
    )

    // 環境変数が設定されているか確認
    if (!accountSid || !authToken) {
      console.error("Twilio環境変数が設定されていません: AccountSID または AuthToken が未設定")
      return NextResponse.json({ success: false, error: "SMS送信の設定が不完全です" }, { status: 500 })
    }

    // 直接テストコードを追加
    console.log("直接Twilioクライアントを使用してテスト...")
    const directClient = twilio(accountSid, authToken)

    try {
      console.log(`直接テスト: to=${internationalPhone}, channel=sms, serviceSid=${verifyServiceSid}`)
      const directVerification = await directClient.verify.v2
        .services(verifyServiceSid)
        .verifications.create({ to: internationalPhone, channel: "sms" })

      console.log("直接テスト結果:", JSON.stringify(directVerification, null, 2))
    } catch (directError) {
      console.error("直接テストエラー:", directError.message)
      console.error("直接テストエラー詳細:", JSON.stringify(directError, null, 2))
    }

    // Twilioクライアントを作成
    console.log("Twilioクライアントを作成します...")
    const client = twilio(accountSid, authToken)

    // Promise ベースの .then 構文を使用
    console.log(
      `Twilio Verify API を呼び出します: to=${internationalPhone}, channel=sms, serviceSid=${verifyServiceSid}`,
    )
    return client.verify.v2
      .services(verifyServiceSid)
      .verifications.create({ to: internationalPhone, channel: "sms" })
      .then((verification) => {
        console.log(`Twilio Verification 成功: SID=${verification.sid}, Status=${verification.status}`)
        return NextResponse.json({ success: true })
      })
      .catch((error) => {
        console.error("Twilio API エラー詳細:", error.message)
        console.error("Twilio エラーコード:", error.code)
        console.error("Twilio エラー詳細:", JSON.stringify(error, null, 2))
        return NextResponse.json(
          { success: false, error: `認証コードの送信に失敗しました: ${error.message}` },
          { status: 500 },
        )
      })
  } catch (error) {
    console.error("認証コード送信エラー:", error)
    return NextResponse.json({ success: false, error: "認証コードの送信に失敗しました" }, { status: 500 })
  }
}
