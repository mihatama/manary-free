import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { validateCSRFToken } from "@/lib/csrf"

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

    if (!phoneNumber || !code) {
      return NextResponse.json({ success: false, error: "電話番号と認証コードが必要です" }, { status: 400 })
    }

    // ハイフンを削除して標準化
    const normalizedPhone = phoneNumber.replace(/-/g, "")

    // 開発環境では、コード "123456" を常に有効とする（テスト用）
    if (process.env.NODE_ENV !== "production" && code === "123456") {
      return NextResponse.json({ success: true })
    }

    // Supabaseから認証コードを取得
    const supabase = createClient()
    const { data, error } = await supabase
      .from("verification_codes")
      .select("*")
      .eq("phone_number", normalizedPhone)
      .eq("code", code)
      .gt("expires_at", new Date().toISOString())
      .order("created_at", { ascending: false })
      .limit(1)

    if (error) {
      console.error("認証コード検証エラー:", error)
      return NextResponse.json({ success: false, error: "認証コードの検証に失敗しました" }, { status: 500 })
    }

    if (!data || data.length === 0) {
      return NextResponse.json({ success: false, error: "無効な認証コードまたは期限切れです" }, { status: 400 })
    }

    // 認証成功
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("認証コード検証エラー:", error)
    return NextResponse.json({ success: false, error: "認証コードの検証に失敗しました" }, { status: 500 })
  }
}
