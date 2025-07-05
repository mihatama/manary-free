"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import type { Database } from "@/lib/supabase/database.types"
import { validateCSRFToken } from "@/lib/csrf"

type Clinic = Database["public"]["Tables"]["clinics"]["Row"]
type ServiceType = Database["public"]["Tables"]["service_types"]["Row"]

// CSRF検証を行うヘルパー関数
async function validateCSRF(formData: FormData) {
  const csrfToken = formData.get("csrf_token") as string
  if (!validateCSRFToken(csrfToken)) {
    throw new Error("セキュリティトークンが無効です。ページを再読み込みしてください。")
  }
}

// 全ての助産院を取得
export async function getClinics(): Promise<Clinic[]> {
  const supabase = createClient()
  const { data, error } = await supabase.from("clinics").select("*").order("name", { ascending: true })

  if (error) {
    console.error("Error fetching clinics:", error)
    throw new Error("助産院の取得に失敗しました。")
  }
  return data
}

// 特定の助産院の診療種別を取得
export async function getServiceTypesForClinic(clinicId: number): Promise<ServiceType[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from("service_types")
    .select("*")
    .eq("clinic_id", clinicId)
    .order("name", { ascending: true })

  if (error) {
    console.error("Error fetching service types:", error)
    throw new Error("診療種別の取得に失敗しました。")
  }
  return data
}

// 助産院を作成
export async function createClinic(formData: FormData) {
  try {
    // CSRF検証
    await validateCSRF(formData)

    const clinic = {
      name: formData.get("name") as string,
      address: formData.get("address") as string,
      phone_number: formData.get("phone") as string,
    }

    const supabase = createClient()
    const { data, error } = await supabase
      .from("clinics")
      .insert([
        {
          ...clinic,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ])
      .select()

    if (error) {
      console.error("Database operation error:", error)
      throw new Error("助産院の保存に失敗しました")
    }

    revalidatePath("/dashboard/schedule-settings")
    return data[0]
  } catch (error) {
    console.error("Error in createClinic:", error)
    throw new Error("助産院の保存に失敗しました")
  }
}

// 助産院を更新
export async function updateClinic(formData: FormData) {
  try {
    // CSRF検証
    await validateCSRF(formData)

    const id = Number(formData.get("id"))
    const clinic = {
      name: formData.get("name") as string,
      address: formData.get("address") as string,
      phone_number: formData.get("phone") as string,
    }

    const supabase = createClient()
    const { data, error } = await supabase
      .from("clinics")
      .update({
        ...clinic,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select()

    if (error) {
      console.error("Database operation error:", error)
      throw new Error("助産院の更新に失敗しました")
    }

    revalidatePath("/dashboard/schedule-settings")
    return data[0]
  } catch (error) {
    console.error("Error in updateClinic:", error)
    throw new Error("助産院の更新に失敗しました")
  }
}

// 助産院を削除
export async function deleteClinic(formData: FormData) {
  try {
    // CSRF検証
    await validateCSRF(formData)

    const id = Number(formData.get("id"))

    const supabase = createClient()

    // 関連する診療種別を確認
    const { data: serviceTypes } = await supabase.from("service_types").select("id").eq("clinic_id", id)

    if (serviceTypes && serviceTypes.length > 0) {
      throw new Error("この助産院には診療種別が登録されています。先に診療種別を削除してください。")
    }

    const { error } = await supabase.from("clinics").delete().eq("id", id)

    if (error) {
      console.error("Database operation error:", error)
      throw new Error("助産院の削除に失敗しました")
    }

    revalidatePath("/dashboard/schedule-settings")
    return { success: true }
  } catch (error: any) {
    console.error("Error in deleteClinic:", error)
    throw new Error(error.message || "助産院の削除に失敗しました")
  }
}
