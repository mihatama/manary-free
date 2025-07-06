import { createServerComponentClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import type { Database } from "@/lib/supabase/database.types"

// サーバーコンポーネント用のSupabaseクライアント
export const createClient = () => {
  const cookieStore = cookies()
  // By removing the explicit supabaseUrl and supabaseKey,
  // the library will correctly use the server-side environment variables
  // (SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY) which have the necessary permissions.
  return createServerComponentClient<Database>({
    cookies: () => cookieStore,
  })
}
