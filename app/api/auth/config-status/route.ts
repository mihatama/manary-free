import { NextResponse } from "next/server"

import { getCognitoOidcConfig, getMissingCognitoOidcConfig } from "@/lib/cognito"

export const runtime = "nodejs"

export function GET() {
  const config = getCognitoOidcConfig()

  if (config) {
    return NextResponse.json({ ok: true, missing: [] })
  }

  const missing = getMissingCognitoOidcConfig()

  return NextResponse.json({
    ok: false,
    missing,
  })
}
