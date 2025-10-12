import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"

import { verifySubscription } from "@/lib/server/billing-client"

const payloadSchema = z.object({
  unlockCode: z.string().min(1, "unlockCode is required"),
})

export async function POST(request: NextRequest) {
  try {
    const json = await request.json()
    const parsed = payloadSchema.safeParse(json)
    if (!parsed.success) {
      return NextResponse.json({ error: "unlockCode is required." }, { status: 400 })
    }

    const result = await verifySubscription(parsed.data.unlockCode)
    return NextResponse.json(result, { status: 200 })
  } catch (error) {
    console.error("Failed to handle subscription verification request", error)
    return NextResponse.json({ error: "Failed to verify subscription." }, { status: 500 })
  }
}
