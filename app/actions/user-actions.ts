"use server"

import { z } from "zod"
import { createServerClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

// Helper function to format phone number to E.164
function formatPhoneNumber(phone: string): string {
  if (!phone) return ""
  // Remove non-digit characters
  let digits = phone.replace(/\D/g, "")
  // If it starts with 0, replace with +81
  if (digits.startsWith("0")) {
    digits = "81" + digits.substring(1)
  }
  // If it doesn't start with +, add it
  if (!digits.startsWith("+")) {
    digits = "+" + digits
  }
  return digits
}

export async function getUsers() {
  const supabase = createServerClient()
  const { data, error } = await supabase.auth.admin.listUsers({
    page: 1,
    perPage: 100,
  })

  if (error) {
    console.error("Error fetching users:", error.message)
    return []
  }

  return data.users
}

const userSchema = z.object({
  email: z.string().email({ message: "有効なメールアドレスを入力してください。" }),
  password: z.string().min(6, { message: "パスワードは6文字以上で入力してください。" }),
  phone: z.string().optional(),
  isAdmin: z.boolean(),
})

export async function createUser(prevState: any, formData: FormData) {
  const supabase = createServerClient()

  const validatedFields = userSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
    phone: formData.get("phone"),
    isAdmin: formData.get("isAdmin") === "on",
  })

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      message: "入力内容に誤りがあります。",
      success: false,
    }
  }

  const { email, password, phone, isAdmin } = validatedFields.data

  const formattedPhone = phone ? formatPhoneNumber(phone) : undefined

  const { data: user, error } = await supabase.auth.admin.createUser({
    email,
    password,
    phone: formattedPhone,
    email_confirm: true, // Automatically confirm user
    user_metadata: {
      role: isAdmin ? "admin" : null,
      raw_phone: phone || null, // Store original phone number
    },
  })

  if (error) {
    console.error("Error creating user:", error)
    return { message: `ユーザーの作成に失敗しました: ${error.message}`, success: false }
  }

  revalidatePath("/dashboard/users")
  return { message: "新しい利用者を正常に作成しました。", success: true }
}

const updateUserSchema = z.object({
  userId: z.string(),
  email: z.string().email({ message: "有効なメールアドレスを入力してください。" }),
  phone: z.string().optional(),
  password: z.string().optional(),
  isAdmin: z.boolean(),
})

export async function updateUser(prevState: any, formData: FormData) {
  const supabase = createServerClient()

  const validatedFields = updateUserSchema.safeParse({
    userId: formData.get("userId"),
    email: formData.get("email"),
    phone: formData.get("phone"),
    password: formData.get("password"),
    isAdmin: formData.get("isAdmin") === "on",
  })

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      message: "入力内容に誤りがあります。",
      success: false,
    }
  }

  const { userId, email, phone, password, isAdmin } = validatedFields.data

  const updateData: { email?: string; phone?: string; password?: string; user_metadata?: any } = {
    email,
    user_metadata: {
      role: isAdmin ? "admin" : null,
      raw_phone: phone || null, // Store original phone number
    },
  }

  if (phone) {
    const formattedPhone = formatPhoneNumber(phone)
    updateData.phone = formattedPhone
  } else {
    updateData.phone = "" // Clear the phone number if empty
  }

  if (password) {
    if (password.length < 6) {
      return {
        errors: { password: ["パスワードは6文字以上で入力してください。"] },
        message: "パスワードが短すぎます。",
        success: false,
      }
    }
    updateData.password = password
  }

  const { error } = await supabase.auth.admin.updateUserById(userId, updateData)

  if (error) {
    console.error("Error updating user:", error)
    return {
      message: `ユーザー情報の更新に失敗しました: ${error.message}`,
      success: false,
    }
  }

  revalidatePath("/dashboard/users")
  return { message: "ユーザー情報を正常に更新しました。", success: true }
}
