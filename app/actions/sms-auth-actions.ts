"use server"

import { createClient } from "@/lib/supabase/server"
import { validateCSRFToken } from "@/lib/csrf"

// SMS認証コードを生成
function generateVerificationCode(): string {
  // 6桁のランダムな数字を生成
  return Math.floor(100000 + Math.random() * 900000).toString()
}

// 認証コードをデータベースに保存
async function storeVerificationCode(phoneNumber: string, code: string) {
  const supabase = createClient()

  // 有効期限を設定（10分）
  const expiresAt = new Date()
  expiresAt.setMinutes(expiresAt.getMinutes() + 10)

  // 既存のコードを削除
  await supabase.from("verification_codes").delete().eq("phone_number", phoneNumber)

  // 新しいコードを保存
  const { error } = await supabase.from("verification_codes").insert([
    {
      phone_number: phoneNumber,
      code: code,
      expires_at: expiresAt.toISOString(),
      created_at: new Date().toISOString(),
    },
  ])

  if (error) {
    console.error("認証コード保存エラー:", error)
    throw new Error("認証コードの保存に失敗しました")
  }
}

// SMS送信関数（実際の実装ではTwilioなどのサービスを使用）
async function sendSMS(phoneNumber: string, message: string) {
  // 開発環境ではコンソールに出力
  console.log(`SMS to ${phoneNumber}: ${message}`)

  // 本番環境では実際のSMS送信サービスを使用
  if (process.env.NODE_ENV === "production") {
    // Twilioなどを使用したSMS送信の実装
    // 例: await twilioClient.messages.create({...})

    // 現在はモック実装
    return { success: true }
  }

  return { success: true }
}

// 認証コードを送信
export async function sendVerificationCode(formData: FormData) {
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

    // 認証コードを生成
    const code = generateVerificationCode()

    // 認証コードをデータベースに保存
    await storeVerificationCode(phoneNumber, code)

    // SMSで認証コードを送信
    const message = `【マナリー】認証コード: ${code}\nこのコードは10分間有効です。`
    await sendSMS(phoneNumber, message)

    return { success: true, message: "認証コードを送信しました" }
  } catch (error: any) {
    console.error("認証コード送信エラー:", error)
    return { success: false, error: error.message || "認証コードの送信に失敗しました" }
  }
}

// 認証コードを検証
export async function verifyCode(formData: FormData) {
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

    const supabase = createClient()

    // データベースから認証コードを取得
    const { data, error } = await supabase
      .from("verification_codes")
      .select("*")
      .eq("phone_number", phoneNumber)
      .eq("code", code)
      .single()

    if (error || !data) {
      throw new Error("認証コードが無効です")
    }

    // 有効期限をチェック
    const expiresAt = new Date(data.expires_at)
    if (expiresAt < new Date()) {
      throw new Error("認証コードの有効期限が切れています")
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
