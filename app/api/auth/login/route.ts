import { NextResponse } from "next/server"

/**
 * Legacy authentication endpoint retained for backwards compatibility.
 * Always responds with HTTP 410 to indicate the resource is gone.
 */
export async function POST() {
  return NextResponse.json(
    {
      error: "This authentication route has been deprecated.",
    },
    { status: 410 },
  )
}

export async function GET() {
  return NextResponse.json(
    {
      error: "This authentication route has been deprecated.",
    },
    { status: 410 },
  )
}
