import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"

export type AuthError = {
  email?: string[]
  password?: string[]
  general?: string[]
}

export async function getSession() {
  const supabase = createClient()
  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) {
    console.log("No session found in getSession()")
    return null
  }

  try {
    // ユーザープロファイルを取得
    const { data: profile, error } = await supabase.from("profiles").select("*").eq("id", session.user.id).single()

    if (error) {
      console.error("Error fetching profile:", error)
    }

    return {
      user: {
        id: session.user.id,
        email: session.user.email,
        name: profile?.name || session.user.email?.split("@")[0] || "ユーザー",
        role: profile?.role || "user",
      },
    }
  } catch (error) {
    console.error("Error in getSession:", error)
    // セッションはあるがプロファイル取得でエラーが発生した場合は、最低限の情報を返す
    return {
      user: {
        id: session.user.id,
        email: session.user.email,
        name: session.user.email?.split("@")[0] || "ユーザー",
        role: "user",
      },
    }
  }
}

export async function requireAuth() {
  const session = await getSession()

  if (!session) {
    redirect("/")
  }

  return session
}
