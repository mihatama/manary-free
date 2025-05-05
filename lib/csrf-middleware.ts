import { type NextRequest, NextResponse } from "next/server"
import { validateCSRFToken } from "@/lib/csrf"

// CSRFミドルウェアのエラーハンドリングを一貫させる
export function csrfProtection(handler: Function) {
  return async (request: NextRequest, ...args: any[]) => {
    // POSTリクエストの場合のみCSRF検証を行う
    if (request.method === "POST") {
      try {
        const formData = await request.formData()
        const csrfToken = formData.get("csrf_token") as string

        if (!csrfToken || !validateCSRFToken(csrfToken)) {
          console.error("CSRF validation failed")
          return NextResponse.json(
            { error: "セキュリティ検証に失敗しました。ページを再読み込みしてください。" },
            { status: 403 },
          )
        }

        // 元のリクエストにフォームデータを再設定
        const newRequest = new Request(request.url, {
          method: request.method,
          headers: request.headers,
          body: formData,
        })

        return handler(newRequest, ...args)
      } catch (error) {
        console.error("CSRF middleware error")
        return NextResponse.json({ error: "リクエスト処理中にエラーが発生しました。" }, { status: 500 })
      }
    }

    // GETリクエストなどの場合は検証をスキップ
    return handler(request, ...args)
  }
}
