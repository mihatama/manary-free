"use server"

import { createClient } from "@/lib/supabase/server"
import { validateCSRFToken } from "@/lib/csrf"
import { sendVerificationCode as sendTwilioVerificationCode, verifyCode as verifyTwilioCode } from "@/lib/twilio"

// 認証コードを送信
export async function sendVerificationCodeAction(formData: FormData) {
  try {
    // CSRF検証 - 公開ページからのアクセスの場合は検証をスキップ
    const csrfToken = formData.get("csrf_token") as string
    // CSRFトークンが提供されている場合のみ検証
    if (csrfToken && !validateCSRFToken(csrfToken)) {
      throw new Error("セキュリティトークンが無効です")
    }

    const phoneNumber = formData.get("phone_number") as string

    if (!phoneNumber) {
      throw new Error("電話番号が入力されていません")
    }

    // 電話番号のフォーマットを検証
    const phoneRegex = /^0\d{1,4}-?\d{1,4}-?\d{4}$/
    if (!phoneRegex.test(phoneNumber)) {
      throw new Error("有効な日本の電話番号を入力してください")
    }

    // 認証コードを送信
    const success = await sendTwilioVerificationCode(phoneNumber)

    if (!success) {
      throw new Error("認証コードの送信に失敗しました")
    }

    return { success: true, message: "認証コードを送信しました" }
  } catch (error: any) {
    console.error("認証コード送信エラー:", error)
    return { success: false, error: error.message || "認証コードの送信に失敗しました" }
  }
}

// 認証コードを検証
export async function verifyCodeAction(formData: FormData) {
  try {
    // CSRF検証 - 公開ページからのアクセスの場合は検証をスキップ
    const csrfToken = formData.get("csrf_token") as string
    // CSRFトークンが提供されている場合のみ検証
    if (csrfToken && !validateCSRFToken(csrfToken)) {
      throw new Error("セキュリティトークンが無効です")
    }

    const phoneNumber = formData.get("phone_number") as string
    const code = formData.get("verification_code") as string

    if (!phoneNumber || !code) {
      throw new Error("電話番号または認証コードが入力されていません")
    }

    // 認証コードを検証
    const isVerified = await verifyTwilioCode(phoneNumber, code)

    if (!isVerified) {
      throw new Error("認証コードが無効です")
    }

    // 認証成功
    return { success: true, verified: true }
  } catch (error: any) {
    console.error("認証コード検証エラー:", error)
    return { success: false, error: error.message || "認証に失敗しました" }
  }
}

// 電話番号で予約を取得
export async function getAppointmentsByPhone(phoneNumber: string) {
  const supabase = createClient()
  try {
    const { data, error } = await supabase
      .from("appointments")
      .select(`
        *,
        service_types (
          name,
          duration,
          color
        ),
        clinics (
          name,
          address,
          phone
        )
      `)
      .eq("patient_phone", phoneNumber)
      .neq("status", "cancelled")
      .order("appointment_date", { ascending: true })
      .order("start_time", { ascending: true })

    if (error) {
      console.error("予約取得エラー:", error)
      throw new Error("予約情報の取得に失敗しました")
    }

    return data
  } catch (error) {
    console.error("Error in getAppointmentsByPhone:", error)
    throw new Error("予約情報の取得に失敗しました")
  }
}

// エイリアス関数を追加
export async function sendVerificationCode(phoneNumber: string) {
  try {
    return await sendTwilioVerificationCode(phoneNumber)
  } catch (error) {
    console.error("認証コード送信エラー:", error)
    return false
  }
}

export async function verifyCode(phoneNumber: string, code: string) {
  try {
    return await verifyTwilioCode(phoneNumber, code)
  } catch (error) {
    console.error("認証コード検証エラー:", error)
    return false
  }
}
