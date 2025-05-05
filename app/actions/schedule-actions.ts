"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import type { Database } from "@/lib/supabase/database.types"

type Clinic = Database["public"]["Tables"]["clinics"]["Row"]
type ServiceType = Database["public"]["Tables"]["service_types"]["Row"]
type AvailabilitySetting = Database["public"]["Tables"]["availability_settings"]["Row"]

// 全ての助産院を取得
export async function getClinics() {
  const supabase = createClient()
  const { data, error } = await supabase.from("clinics").select("*").order("name")

  if (error) {
    console.error("Error fetching clinics:", error)
    throw new Error("助産院の取得に失敗しました")
  }

  return data
}

// 特定の助産院の診療種別を取得
export async function getServiceTypes(clinicId: number) {
  const supabase = createClient()
  const { data, error } = await supabase.from("service_types").select("*").eq("clinic_id", clinicId).order("name")

  if (error) {
    console.error("Error fetching service types:", error)
    throw new Error("診療種別の取得に失敗しました")
  }

  return data
}

// 特定の診療種別の予約可能時間を取得
export async function getAvailabilitySettings(serviceTypeId: number) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from("availability_settings")
    .select("*")
    .eq("service_type_id", serviceTypeId)
    .order("day_of_week")

  if (error) {
    console.error("Error fetching availability settings:", error)
    throw new Error("予約可能時間の取得に失敗しました")
  }

  return data
}

// 診療種別を作成
export async function createServiceType(serviceType: Omit<ServiceType, "id" | "created_at" | "updated_at">) {
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
    console.error("Error creating service type:", error)
    throw new Error("診療種別の作成に失敗しました")
  }

  revalidatePath("/dashboard/schedule-settings")
  return data[0]
}

// 診療種別を更新
export async function updateServiceType(
  id: number,
  serviceType: Partial<Omit<ServiceType, "id" | "created_at" | "updated_at">>,
) {
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
    console.error("Error updating service type:", error)
    throw new Error("診療種別の更新に失敗しました")
  }

  revalidatePath("/dashboard/schedule-settings")
  return data[0]
}

// 診療種別を削除
export async function deleteServiceType(id: number) {
  const supabase = createClient()
  const { error } = await supabase.from("service_types").delete().eq("id", id)

  if (error) {
    console.error("Error deleting service type:", error)
    throw new Error("診療種別の削除に失敗しました")
  }

  revalidatePath("/dashboard/schedule-settings")
  return { success: true }
}

// 予約可能時間を作成または更新
export async function upsertAvailabilitySetting(
  setting: Omit<AvailabilitySetting, "id" | "created_at" | "updated_at">,
) {
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
      console.error("Error updating availability setting:", error)
      throw new Error("予約可能時間の更新に失敗しました")
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
      console.error("Error creating availability setting:", error)
      throw new Error("予約可能時間の作成に失敗しました")
    }

    revalidatePath("/dashboard/schedule-settings")
    return data[0]
  }
}

// 予約可能時間を削除
export async function deleteAvailabilitySetting(id: number) {
  const supabase = createClient()
  const { error } = await supabase.from("availability_settings").delete().eq("id", id)

  if (error) {
    console.error("Error deleting availability setting:", error)
    throw new Error("予約可能時間の削除に失敗しました")
  }

  revalidatePath("/dashboard/schedule-settings")
  return { success: true }
}
