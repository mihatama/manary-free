import { NextResponse } from "next/server"

export function POST() {
  return NextResponse.json(
    {
      status: "error",
      errors: {
        general: ["このログインエンドポイントは使用できません。ログインボタンから再度お試しください。"],
      },
    },
    { status: 410 },
  )
}
