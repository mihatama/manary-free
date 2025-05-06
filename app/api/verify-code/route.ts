import { type NextRequest, NextResponse } from "next/server"
import { validateCSRFToken } from "@/lib/csrf"
import twilio from "twilio"

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const phoneNumber = formData.get("phone_number") as string
    const code = formData.get("code") as string
    const csrfToken = formData.get("csrf_token") as string | null

    // CSRFトークンがある場合のみ検証
    if (csrfToken && !validateCSRFToken(csrfToken)) {
      return NextResponse.json({ success: false, error: "セキュリティトークンが無効です" }, { status: 403 })
    }

    // 電話番号と認証コードの処理部分の前に詳細なログを追加
    if (!phoneNumber || !code) {
      console.log(`検証に必要な情報が不足しています: 電話番号=${!!phoneNumber}, コード=${!!code}`)
      return NextResponse.json({ success: false, error: "電話番号と認証コードが必要です" }, { status: 400 })
    }

    // ハイフンを削除して標準化
    const normalizedPhone = phoneNumber.replace(/-/g, "")
    console.log(`標準化された電話番号: ${normalizedPhone}`)

    // 国際形式に変換（日本の場合は +81 + 電話番号の先頭の0を除いた番号）
    const internationalPhone = "+81" + normalizedPhone.substring(1)
    console.log(`国際形式の電話番号: ${internationalPhone}, 検証コード: ${code}`)

    // Twilioクライアントを初期化
    const accountSid = process.env.TWILIO_ACCOUNT_SID
    const authToken = process.env.TWILIO_AUTH_TOKEN
    const verifyServiceSid = process.env.TWILIO_VERIFY_SERVICE_SID || "VAcdb873f18d3b51de84cdc57d3d6dfecf"

    console.log(
      `Twilio検証設定: AccountSID=${accountSid?.substring(0, 5)}..., AuthToken=${authToken ? "設定済み" : "未設定"}, ServiceSID=${verifyServiceSid}`,
    )

    // 環境変数が設定されているか確認
    if (!accountSid || !authToken) {
      console.error("Twilio環境変数が設定されていません: AccountSID または AuthToken が未設定")
      return NextResponse.json({ success: false, error: "SMS検証の設定が不完全です" }, { status: 500 })
    }

    // 直接テストコードを追加
    console.log("直接Twilioクライアントを使用してテスト...")
    const directClient = twilio(accountSid, authToken)

    try {
      console.log(`直接テスト: to=${internationalPhone}, code=${code}, serviceSid=${verifyServiceSid}`)
      const directCheck = await directClient.verify.v2
        .services(verifyServiceSid)
        .verificationChecks.create({ to: internationalPhone, code })

      console.log("直接テスト結果:", JSON.stringify(directCheck, null, 2))
    } catch (directError) {
      console.error("直接テストエラー:", directError.message)
      console.error("直接テストエラー詳細:", JSON.stringify(directError, null, 2))
    }

    // Twilioクライアントを作成
    console.log("Twilioクライアントを作成します...")
    const client = twilio(accountSid, authToken)

    // Promise ベースの .then 構文を使用
    console.log(`Twilio Verify Check API を呼び出します: to=${internationalPhone}, code=${code}`)
    return client.verify.v2
      .services(verifyServiceSid)
      .verificationChecks.create({ to: internationalPhone, code })
      .then((verificationCheck) => {
        console.log(
          `Twilio Verification Check 結果: Status=${verificationCheck.status}, Valid=${verificationCheck.valid}`,
        )
        if (verificationCheck.status === "approved") {
          return NextResponse.json({ success: true })
        } else {
          console.log(`検証失敗: ステータス=${verificationCheck.status}`)
          return NextResponse.json({ success: false, error: "無効な認証コードまたは期限切れです" }, { status: 400 })
        }
      })
      .catch((error) => {
        console.error("Twilio API 検証エラー詳細:", error.message)
        console.error("Twilio エラーコード:", error.code)
        console.error("Twilio エラー詳細:", JSON.stringify(error, null, 2))
        return NextResponse.json(
          { success: false, error: `認証コードの検証に失敗しました: ${error.message}` },
          { status: 500 },
        )
      })
  } catch (error) {
    console.error("認証コード検証エラー:", error)
    return NextResponse.json({ success: false, error: "認証コードの検証に失敗しました" }, { status: 500 })
  }
}
