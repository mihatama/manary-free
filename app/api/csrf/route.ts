// CSRFトークンを提供するAPIエンドポイントを作成
import { NextResponse } from "next/server"
import { generateCSRFToken } from "@/lib/csrf"

export async function GET() {
  try {
    const csrfToken = await generateCSRFToken() // Ensure await is used

    return NextResponse.json(
      { csrfToken },
      {
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
          Pragma: "no-cache",
          Expires: "0",
        },
      },
    )
  } catch (error) {
    console.error("Error generating CSRF token in API route:", error)
    return NextResponse.json({ error: "Failed to generate CSRF token" }, { status: 500 })
  }
}
