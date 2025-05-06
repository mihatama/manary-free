"use client"

import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import type { Database } from "@/lib/supabase/database.types"

// グローバル変数としてクライアントインスタンスを保持
let supabaseClient: ReturnType<typeof createClientComponentClient<Database>> | null = null

// クライアントコンポーネント用のSupabaseクライアント
// シングルトンパターンを使用して一貫したインスタンスを保証
export const getSupabaseBrowser = () => {
  // ブラウザ環境でのみ実行
  if (typeof window === "undefined") {
    throw new Error("getSupabaseBrowser should only be called in browser environment")
  }

  // 既存のインスタンスがあればそれを返す
  if (supabaseClient) {
    return supabaseClient
  }

  // 新しいインスタンスを作成
  supabaseClient = createClientComponentClient<Database>({
    supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
    supabaseKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  })

  return supabaseClient
}

// 後方互換性のために残しておくが、内部では getSupabaseBrowser を使用
export const createClient = () => {
  return getSupabaseBrowser()
}
