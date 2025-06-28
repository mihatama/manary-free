"use server"

import { createClient } from "@supabase/supabase-js"
import { revalidatePath } from "next/cache"
import { z } from "zod"

// This action requires Supabase Admin privileges.
// Ensure SUPABASE_SERVICE_ROLE_KEY is set in your environment variables.
const supabaseAdmin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

export async function getUsers() {
  const { data, error } = await supabaseAdmin.auth.admin.listUsers({
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

  const { data, error } = await supabaseAdmin.auth.admin.createUser({
    email,
    password,
    email_confirm: true, // You can set this to false if you don't want to require email confirmation
  })

  if (error) {
    return {
      errors: null,
      message: `ユーザーの作成に失敗しました: ${error.message}`,
      success: false,
    }
  }

  revalidatePath("/dashboard/users")
  return {
    errors: null,
    message: `ユーザー ${data.user.email} を作成しました。`,
    success: true,
  }
}
