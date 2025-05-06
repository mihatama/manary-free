"use client"

import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import type { Database } from "@/lib/supabase/database.types"

// グローバル変数としてクライアントインスタンスを保持
let clientInstance: ReturnType<typeof createClientComponentClient<Database>> | null = null

// クライアントコンポーネント用のSupabaseクライアント
// シングルトンパターンを使用して一貫したインスタンスを保証
export const getSupabaseBrowser = () => {
  // ブラウザ環境でのみ実行
  if (typeof window === "undefined") {
    throw new Error("getSupabaseBrowser should only be called in browser environment")
  }

  // 既存のインスタンスがあればそれを返す
  if (clientInstance) {
    return clientInstance
  }

  // 新しいインスタンスを作成
  clientInstance = createClientComponentClient<Database>({
    supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
    supabaseKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  })

  return clientInstance
}

// Make sure the client is properly initialized as a singleton
// Add this check at the top of the createClient function:

let supabaseClient: ReturnType<typeof createClientComponentClient<Database>> | null = null

// 後方互換性のために残しておくが、内部では getSupabaseBrowser を使用
export const createClient = () => {
  if (supabaseClient) {
    return supabaseClient
  }

  const client = getSupabaseBrowser()

  // Before returning, store the client
  supabaseClient = clientInstance
  return client
}
