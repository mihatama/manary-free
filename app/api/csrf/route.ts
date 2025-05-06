// CSRFトークンを提供するAPIエンドポイントを作成
import { NextResponse } from "next/server"
import { generateCSRFToken } from "@/lib/csrf"

export const dynamic = "force-dynamic"

export async function GET() {
  const csrfToken = generateCSRFToken()

  return NextResponse.json(
    { csrfToken },
    {
      headers: {
        "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0",
        Pragma: "no-cache",
        Expires: "0",
      },
    },
  )
}
