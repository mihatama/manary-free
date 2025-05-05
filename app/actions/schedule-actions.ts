"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import type { Database } from "@/lib/supabase/database.types"
import { validateCSRFToken } from "@/lib/csrf"

type Clinic = Database["public"]["Tables"]["clinics"]["Row"]
type ServiceType = Database["public"]["Tables"]["service_types"]["Row"]
type AvailabilitySetting = Database["public"]["Tables"]["availability_settings"]["Row"]

// CSRF検証を行うヘルパー関数
async function validateCSRF(formData: FormData) {
  const csrfToken = formData.get("csrf_token") as string
  if (!validateCSRFToken(csrfToken)) {
    throw new Error("セキュリティトークンが無効です。ページを再読み込みしてください。")
  }
}

// 全ての助産院を取得
export async function getClinics() {
  const supabase = createClient()
  try {
    const { data, error } = await supabase.from("clinics").select("*").order("name")

    if (error) {
      console.error("Database query error")
      throw new Error("データの取得に失敗しました")
    }

    return data
  } catch (error) {
    console.error("Error in getClinics")
    throw new Error("データの取得に失敗しました")
  }
}

// 特定の助産院の診療種別を取得
export async function getServiceTypes(clinicId: number) {
  const supabase = createClient()
  try {
    const { data, error } = await supabase.from("service_types").select("*").eq("clinic_id", clinicId).order("name")

    if (error) {
      console.error("Database query error")
      throw new Error("データの取得に失敗しました")
    }

    return data
  } catch (error) {
    console.error("Error in getServiceTypes")
    throw new Error("データの取得に失敗しました")
  }
}

// 特定の診療種別の予約可能時間を取得
export async function getAvailabilitySettings(serviceTypeId: number) {
  const supabase = createClient()
  try {
    const { data, error } = await supabase
      .from("availability_settings")
      .select("*")
      .eq("service_type_id", serviceTypeId)
      .order("day_of_week")

    if (error) {
      console.error("Database query error")
      throw new Error("データの取得に失敗しました")
    }

    return data
  } catch (error) {
    console.error("Error in getAvailabilitySettings")
    throw new Error("データの取得に失敗しました")
  }
}

// 診療種別を作成
export async function createServiceType(formData: FormData) {
  // CSRF検証
  try {
    await validateCSRF(formData)

    const serviceType = {
      clinic_id: Number(formData.get("clinic_id")),
      name: formData.get("name") as string,
      description: formData.get("description") as string,
      duration: Number(formData.get("duration")),
      color: formData.get("color") as string,
    }

    const supabase = createClient()
    const { data, error } = await supabase
      .from("service_types")
      .insert([
        {
          ...serviceType,
          updated_at: new Date().toISOString(),
        },
      ])
      .select()

    if (error) {
      console.error("Database operation error")
      throw new Error("データの保存に失敗しました")
    }

    revalidatePath("/dashboard/schedule-settings")
    return data[0]
  } catch (error) {
    console.error("Error in createServiceType")
    throw new Error("データの保存に失敗しました")
  }
}

// 診療種別を更新
export async function updateServiceType(formData: FormData) {
  try {
    // CSRF検証
    await validateCSRF(formData)

    const id = Number(formData.get("id"))
    const serviceType = {
      name: formData.get("name") as string,
      description: formData.get("description") as string,
      duration: Number(formData.get("duration")),
      color: formData.get("color") as string,
    }

    const supabase = createClient()
    const { data, error } = await supabase
      .from("service_types")
      .update({
        ...serviceType,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select()

    if (error) {
      console.error("Database operation error")
      throw new Error("データの更新に失敗しました")
    }

    revalidatePath("/dashboard/schedule-settings")
    return data[0]
  } catch (error) {
    console.error("Error in updateServiceType")
    throw new Error("データの更新に失敗しました")
  }
}

// 診療種別を削除
export async function deleteServiceType(formData: FormData) {
  try {
    // CSRF検証
    await validateCSRF(formData)

    const id = Number(formData.get("id"))

    const supabase = createClient()
    const { error } = await supabase.from("service_types").delete().eq("id", id)

    if (error) {
      console.error("Database operation error")
      throw new Error("データの削除に失敗しました")
    }

    revalidatePath("/dashboard/schedule-settings")
    return { success: true }
  } catch (error) {
    console.error("Error in deleteServiceType")
    throw new Error("データの削除に失敗しました")
  }
}

// 予約可能時間を作成または更新
export async function upsertAvailabilitySetting(formData: FormData) {
  try {
    // CSRF検証
    await validateCSRF(formData)

    const setting = {
      service_type_id: Number(formData.get("service_type_id")),
      day_of_week: Number(formData.get("day_of_week")),
      start_time: formData.get("start_time") as string,
      end_time: formData.get("end_time") as string,
      is_available: formData.get("is_available") === "true",
    }

    const supabase = createClient()

    // 既存の設定を確認
    const { data: existingData } = await supabase
      .from("availability_settings")
      .select("id")
      .eq("service_type_id", setting.service_type_id)
      .eq("day_of_week", setting.day_of_week)
      .eq("start_time", setting.start_time)
      .eq("end_time", setting.end_time)

    if (existingData && existingData.length > 0) {
      // 既存の設定を更新
      const { data, error } = await supabase
        .from("availability_settings")
        .update({
          ...setting,
          updated_at: new Date().toISOString(),
        })
        .eq("id", existingData[0].id)
        .select()

      if (error) {
        console.error("Database operation error")
        throw new Error("データの更新に失敗しました")
      }

      revalidatePath("/dashboard/schedule-settings")
      return data[0]
    } else {
      // 新しい設定を作成
      const { data, error } = await supabase
        .from("availability_settings")
        .insert([
          {
            ...setting,
            updated_at: new Date().toISOString(),
          },
        ])
        .select()

      if (error) {
        console.error("Database operation error")
        throw new Error("データの保存に失敗しました")
      }

      revalidatePath("/dashboard/schedule-settings")
      return data[0]
    }
  } catch (error) {
    console.error("Error in upsertAvailabilitySetting")
    throw new Error("データの保存に失敗しました")
  }
}

// 予約可能時間を削除
export async function deleteAvailabilitySetting(formData: FormData) {
  try {
    // CSRF検証
    await validateCSRF(formData)

    const id = Number(formData.get("id"))

    const supabase = createClient()
    const { error } = await supabase.from("availability_settings").delete().eq("id", id)

    if (error) {
      console.error("Database operation error")
      throw new Error("データの削除に失敗しました")
    }

    revalidatePath("/dashboard/schedule-settings")
    return { success: true }
  } catch (error) {
    console.error("Error in deleteAvailabilitySetting")
    throw new Error("データの削除に失敗しました")
  }
}
