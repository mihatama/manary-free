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

    try {
      const supabase = createClient()

      // データベースから認証コードを取得
      const { data, error } = await supabase
        .from("verification_codes")
        .select("*")
        .eq("phone_number", normalizedPhone)
        .eq("code", code)
        .single()

      if (error || !data) {
        console.error("認証コード検証エラー:", error)
        return NextResponse.json({ success: false, error: "認証コードが無効です" }, { status: 400 })
      }

      // 有効期限をチェック
      const expiresAt = new Date(data.expires_at)
      if (expiresAt < new Date()) {
        return NextResponse.json({ success: false, error: "認証コードの有効期限が切れています" }, { status: 400 })
      }

      // 認証成功
      return NextResponse.json({ success: true })
    } catch (dbError: any) {
      console.error("データベースエラー:", dbError)
      return NextResponse.json(
        {
          success: false,
          error: "データベース操作に失敗しました",
          details: dbError.message || "Unknown database error",
        },
        { status: 500 },
      )
    }
  } catch (error: any) {
    console.error("認証コード検証エラー:", error)
    return NextResponse.json(
      {
        success: false,
        error: "認証に失敗しました",
        details: error.message || "Unknown error",
      },
      { status: 500 },
    )
  }
}
