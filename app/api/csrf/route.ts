import { NextResponse } from "next/server"
import { generateCSRFToken } from "@/lib/csrf"

export async function GET() {
  try {
    const csrfToken = await generateCSRFToken()

    return NextResponse.json({ csrfToken })
  } catch (error) {
    console.error("Error generating CSRF token:", error)
    return NextResponse.json({ error: "CSRFトークンの生成に失敗しました" }, { status: 500 })
  }
}
