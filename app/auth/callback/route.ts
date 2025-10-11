import { NextResponse } from "next/server"
export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const target = requestUrl.searchParams.get("redirect") || "/dashboard"
  return NextResponse.redirect(new URL(target, request.url))
}
