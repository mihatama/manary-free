import { Twilio } from "twilio"

// Twilioクライアントの初期化
let twilioClient: Twilio | null = null

function getTwilioClient(): Twilio {
  if (!twilioClient) {
    const accountSid = process.env.TWILIO_ACCOUNT_SID
    const authToken = process.env.TWILIO_AUTH_TOKEN

    if (!accountSid || !authToken) {
      throw new Error("Twilio credentials are not configured")
    }

    twilioClient = new Twilio(accountSid, authToken)
  }
  return twilioClient
}

// 日本の電話番号を国際形式に変換
function formatJapanesePhoneNumber(phoneNumber: string): string {
  // ハイフンを削除
  let normalized = phoneNumber.replace(/-/g, "")

  // 先頭の0を+81に置き換え
  if (normalized.startsWith("0")) {
    normalized = "+81" + normalized.substring(1)
  } else if (!normalized.startsWith("+")) {
    // +が付いていない場合は+81を追加
    normalized = "+81" + normalized
  }

  return normalized
}

// 認証コードを送信
export async function sendVerificationCode(phoneNumber: string) {
  try {
    // 開発環境でMOCK_SMSが有効な場合はモックレスポンスを返す
    if (process.env.NODE_ENV !== "production" && process.env.MOCK_SMS === "true") {
      console.log("[TWILIO] Using mock SMS mode for:", phoneNumber)
      return {
        success: true,
        sid: "MOCK_VERIFICATION_SID",
        status: "pending",
        debug: { mockMode: true, phoneNumber },
      }
    }

    const serviceSid = process.env.TWILIO_VERIFY_SERVICE_SID
    if (!serviceSid) {
      throw new Error("TWILIO_VERIFY_SERVICE_SID is not configured")
    }

    // 電話番号を国際形式に変換
    const formattedPhone = formatJapanesePhoneNumber(phoneNumber)
    console.log("[TWILIO] Formatted phone number:", formattedPhone)

    const client = getTwilioClient()

    // Verify APIを使用して認証コードを送信
    const verification = await client.verify.v2
      .services(serviceSid)
      .verifications.create({ to: formattedPhone, channel: "sms" })

    console.log("[TWILIO] Verification created:", verification.sid, "Status:", verification.status)

    return {
      success: true,
      sid: verification.sid,
      status: verification.status,
      debug: { sid: verification.sid, status: verification.status },
    }
  } catch (error: any) {
    console.error("[TWILIO] Error sending verification code:", error)
    return {
      success: false,
      error: error.message || "Failed to send verification code",
      debug: {
        code: error.code,
        status: error.status,
        moreInfo: error.moreInfo,
        details: error.details,
        stack: error.stack,
      },
    }
  }
}

// 認証コードを検証
export async function verifyCode(phoneNumber: string, code: string) {
  try {
    // 開発環境でMOCK_SMSが有効な場合はモックレスポンスを返す
    if (process.env.NODE_ENV !== "production" && process.env.MOCK_SMS === "true") {
      console.log("[TWILIO] Using mock verification mode for:", phoneNumber)
      // モックモードでは123456を正しいコードとして扱う
      const isValid = code === "123456"
      return {
        success: isValid,
        status: isValid ? "approved" : "pending",
        error: isValid ? null : "Invalid verification code",
        debug: { mockMode: true, phoneNumber, isValid },
      }
    }

    const serviceSid = process.env.TWILIO_VERIFY_SERVICE_SID
    if (!serviceSid) {
      throw new Error("TWILIO_VERIFY_SERVICE_SID is not configured")
    }

    // 電話番号を国際形式に変換
    const formattedPhone = formatJapanesePhoneNumber(phoneNumber)
    console.log("[TWILIO] Verifying code for:", formattedPhone)

    const client = getTwilioClient()

    // Verify APIを使用して認証コードを検証
    const verification = await client.verify.v2
      .services(serviceSid)
      .verificationChecks.create({ to: formattedPhone, code })

    console.log("[TWILIO] Verification result:", verification.status)

    return {
      success: verification.valid,
      status: verification.status,
      error: verification.valid ? null : "Invalid verification code",
      debug: { sid: verification.sid, status: verification.status, valid: verification.valid },
    }
  } catch (error: any) {
    console.error("[TWILIO] Error verifying code:", error)
    return {
      success: false,
      error: error.message || "Failed to verify code",
      debug: {
        code: error.code,
        status: error.status,
        moreInfo: error.moreInfo,
        details: error.details,
        stack: error.stack,
      },
    }
  }
}
