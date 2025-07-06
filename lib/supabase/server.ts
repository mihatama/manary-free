import { createServerComponentClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import type { Database } from "@/lib/supabase/database.types"

// サーバーコンポーネント用のSupabaseクライアントを作成する内部関数
const createSupabaseServerClient = () => {
  const cookieStore = cookies()
  // By removing the explicit supabaseUrl and supabaseKey,
  // the library will correctly use the server-side environment variables
  // (SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY) which have the necessary permissions.
  return createServerComponentClient<Database>({
    cookies: () => cookieStore,
  })
}

/**
 * サーバーコンポーネント用のSupabaseクライアント
 *
 * プロジェクト内で 'createClient' と 'createServerClient' の両方の名前で
 * 参照されているため、両方の名前でエクスポートして互換性を保ちます。
 */
export const createClient = createSupabaseServerClient
export const createServerClient = createSupabaseServerClient
