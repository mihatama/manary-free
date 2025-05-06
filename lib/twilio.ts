import twilio from "twilio"

// Twilioクライアントの初期化
let twilioClient: twilio.Twilio | null = null

// シングルトンパターンでTwilioクライアントを取得
export function getTwilioClient(): twilio.Twilio {
  if (!twilioClient) {
    const accountSid = process.env.TWILIO_ACCOUNT_SID
    const authToken = process.env.TWILIO_AUTH_TOKEN

    if (!accountSid || !authToken) {
      throw new Error("Twilio credentials are not configured")
    }

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

// SMSを送信する関数
export async function sendSMS(phoneNumber: string, message: string): Promise<boolean> {
  try {
    // 開発環境ではコンソールに出力するだけ
    if (process.env.NODE_ENV !== "production") {
      console.log(`[DEV] SMS to ${phoneNumber}: ${message}`)
      return true
    }

    const client = getTwilioClient()
    const twilioPhoneNumber = process.env.TWILIO_PHONE_NUMBER

    if (!twilioPhoneNumber) {
      throw new Error("Twilio phone number is not configured")
    }

    // 電話番号を国際形式に変換
    const formattedPhoneNumber = formatJapanesePhoneNumber(phoneNumber)

    // SMSを送信
    const result = await client.messages.create({
      body: message,
      from: twilioPhoneNumber,
      to: formattedPhoneNumber,
    })

    console.log(`SMS sent with SID: ${result.sid}`)
    return true
  } catch (error) {
    console.error("Failed to send SMS:", error)
    return false
  }
}
