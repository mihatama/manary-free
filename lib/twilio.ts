import twilio from "twilio"

// Twilioクライアントの初期化
let twilioClient: twilio.Twilio | null = null

// シングルトンパターンでTwilioクライアントを取得
export function getTwilioClient(): twilio.Twilio {
  if (!twilioClient) {
    const accountSid = process.env.TWILIO_ACCOUNT_SID
    const authToken = process.env.TWILIO_AUTH_TOKEN

    if (!accountSid || !authToken) {
      console.error("Twilio credentials missing:", {
        accountSid: !!accountSid,
        authToken: !!authToken,
      })
      throw new Error("Twilio credentials are not configured")
    }

    console.log("Initializing Twilio client with SID:", accountSid.substring(0, 5) + "...")
    twilioClient = twilio(accountSid, authToken)
  }
  return twilioClient
}

// 日本の電話番号を国際形式に変換
export function formatJapanesePhoneNumber(phoneNumber: string): string {
  // ハイフンを削除
  const normalizedPhone = phoneNumber.replace(/-/g, "")

  // 先頭の0を+81に置き換え
  if (normalizedPhone.startsWith("0")) {
    return `+81${normalizedPhone.substring(1)}`
  }

  return normalizedPhone
}

// SMS送信関数
export async function sendSMS(phoneNumber: string, message: string): Promise<{ success: boolean; error?: string }> {
  try {
    // 開発環境ではコンソールに出力するだけ
    if (process.env.NODE_ENV !== "production") {
      console.log(`[DEV] SMS to ${phoneNumber}: ${message}`)
      return { success: true }
    }

    const client = getTwilioClient()
    const formattedPhone = formatJapanesePhoneNumber(phoneNumber)

    const twilioPhone = process.env.TWILIO_PHONE_NUMBER
    if (!twilioPhone) {
      throw new Error("Twilio phone number is not configured")
    }

    const result = await client.messages.create({
      body: message,
      from: twilioPhone,
      to: formattedPhone,
    })

    console.log(`SMS sent with SID: ${result.sid}`)
    return { success: true }
  } catch (error: any) {
    console.error("Failed to send SMS:", error)
    return {
      success: false,
      error: error.message || "Failed to send SMS",
    }
  }
}

// 認証コードを生成
export function generateVerificationCode(): string {
  // 6桁のランダムな数字を生成
  return Math.floor(100000 + Math.random() * 900000).toString()
}
