import { NextResponse } from "next/server"

export async function GET() {
  try {
    // Twilioの設定を確認
    const accountSid = process.env.TWILIO_ACCOUNT_SID
    const authToken = process.env.TWILIO_AUTH_TOKEN
    const twilioPhone = process.env.TWILIO_PHONE_NUMBER

    // 設定の一部を隠す
    const maskedSid = accountSid
      ? `${accountSid.substring(0, 5)}...${accountSid.substring(accountSid.length - 5)}`
      : null
    const maskedAuth = authToken ? `${authToken.substring(0, 3)}...${authToken.substring(authToken.length - 3)}` : null
    const maskedPhone = twilioPhone ? twilioPhone : null

    // Twilioモジュールが正しく読み込めるか確認
    let twilioLoaded = false
    try {
      require("twilio")
      twilioLoaded = true
    } catch (e) {
      console.error("Failed to load twilio module:", e)
    }

    return NextResponse.json({
      success: true,
      config: {
        hasSid: !!accountSid,
        hasAuth: !!authToken,
        hasPhone: !!twilioPhone,
        maskedSid,
        maskedAuth,
        maskedPhone,
        twilioLoaded,
        nodeEnv: process.env.NODE_ENV,
      },
    })
  } catch (error: any) {
    console.error("Twilio test error:", error)
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to test Twilio configuration",
      },
      { status: 500 },
    )
  }
}
