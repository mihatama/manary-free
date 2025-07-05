import { createClient } from "@supabase/supabase-js"
import type { Database } from "./database.types"

// IMPORTANT: This client is for server-side use only.
// It uses the service_role_key to bypass Row Level Security.
// Never expose this client or its keys to the browser.

export const createAdminClient = () => {
  // These environment variables are essential.
  // They are configured in your Vercel project settings.
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !supabaseServiceRoleKey) {
    throw new Error("Missing Supabase environment variables (URL or Service Role Key).")
  }

  // Create and return the admin client.
  return createClient<Database>(supabaseUrl, supabaseServiceRoleKey, {
    auth: {
      // The admin client does not need to manage user sessions.
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}
