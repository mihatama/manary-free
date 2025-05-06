import { createClient } from "@/lib/supabase/server"

// 認証コードを生成
export function generateVerificationCode(): string {
  // 6桁のランダムな数字を生成
  return Math.floor(100000 + Math.random() * 900000).toString()
}

// 認証コードをデータベースに保存
export async function saveVerificationCode(phoneNumber: string, code: string): Promise<boolean> {
  try {
    const supabase = createClient()

    // ハイフンを削除して標準化
    const normalizedPhone = phoneNumber.replace(/-/g, "")

    // 有効期限を設定（10分）
    const expiresAt = new Date()
    expiresAt.setMinutes(expiresAt.getMinutes() + 10)

    // 既存のコードを削除
    try {
      await supabase.from("verification_codes").delete().eq("phone_number", normalizedPhone)
    } catch (deleteError) {
      console.error("Error deleting existing verification code:", deleteError)
      // 削除エラーは無視して続行
    }

    // 新しいコードを保存
    const { error } = await supabase.from("verification_codes").insert([
      {
        phone_number: normalizedPhone,
        code: code,
        expires_at: expiresAt.toISOString(),
        created_at: new Date().toISOString(),
      },
    ])

    if (error) {
      console.error("Database error:", error)
      return false
    }

    return true
  } catch (error) {
    console.error("Failed to save verification code:", error)
    return false
  }
}

// 認証コードを検証
export async function verifyCode(phoneNumber: string, code: string): Promise<boolean> {
  try {
    const supabase = createClient()

    // ハイフンを削除して標準化
    const normalizedPhone = phoneNumber.replace(/-/g, "")

    // データベースから認証コードを取得
    const { data, error } = await supabase
      .from("verification_codes")
      .select("*")
      .eq("phone_number", normalizedPhone)
      .eq("code", code)
      .single()

    if (error || !data) {
      console.error("Database error or no matching code:", error)
      return false
    }

    // 有効期限をチェック
    const expiresAt = new Date(data.expires_at)
    if (expiresAt < new Date()) {
      console.error("Verification code expired")
      return false
    }

    return true
  } catch (error) {
    console.error("Failed to verify code:", error)
    return false
  }
}
