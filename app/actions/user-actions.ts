"use server"

import { createClient } from "@supabase/supabase-js"
import { revalidatePath } from "next/cache"
import { z } from "zod"

import { getSupabaseAdminCredentials } from "@/lib/supabase/env"

let supabaseAdmin: ReturnType<typeof createClient> | null = null

function getSupabaseAdminClient() {
  if (supabaseAdmin) {
    return supabaseAdmin
  }

  const credentials = getSupabaseAdminCredentials()

  if (!credentials) {
    return null
  }

  supabaseAdmin = createClient(credentials.url, credentials.serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })

  return supabaseAdmin
}

export async function getUsers() {
  const adminClient = getSupabaseAdminClient()

  if (!adminClient) {
    console.warn("Supabase admin credentials are not configured; returning an empty user list.")
    return []
  }

  const { data, error } = await adminClient.auth.admin.listUsers({
    page: 1,
    perPage: 100,
  })

  if (error) {
    console.error("Error fetching users:", error.message)
    return []
  }

  return data.users
}

const CreateUserSchema = z.object({
  email: z.string().email({ message: "有効なメールアドレスを入力してください。" }),
  password: z.string().min(8, { message: "パスワードは8文字以上である必要があります。" }),
})

export async function createUser(prevState: any, formData: FormData) {
  const adminClient = getSupabaseAdminClient()

  if (!adminClient) {
    return {
      errors: null,
      message: "Supabaseの管理者権限が構成されていません。環境変数を設定してください。",
      success: false,
    }
  }

  const validatedFields = CreateUserSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  })

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      message: "入力内容に誤りがあります。",
      success: false,
    }
  }

  const { email, password } = validatedFields.data
  const isAdmin = formData.get("isAdmin") === "on"

  const userMetadata = isAdmin ? { role: "admin" } : {}

  const { data, error } = await adminClient.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: userMetadata,
  })

  if (error) {
    return {
      errors: null,
      message: `ユーザーの作成に失敗しました: ${error.message}`,
      success: false,
    }
  }

  if (!data.user) {
    return {
      errors: null,
      message: "ユーザーの作成に失敗しました: 予期せぬエラーが発生しました。",
      success: false,
    }
  }

  revalidatePath("/dashboard/users")
  return {
    errors: null,
    message: `ユーザー ${data.user.email} を作成しました。${isAdmin ? " (管理者)" : ""}`,
    success: true,
  }
}
