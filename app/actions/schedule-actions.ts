"use server"

import { createClient } from "@/lib/supabase/server"

// 助産院一覧を取得
export async function getClinics() {
  const supabase = createClient()

  try {
    const { data, error } = await supabase.from("clinics").select("*").order("name")

    if (error) {
      // テーブルが存在しない場合
      if (error.message.includes("does not exist")) {
        console.error("Error: clinics table does not exist")
        // デフォルトのクリニックを返す
        return [{ id: 1, name: "マナリー助産院", address: "東京都渋谷区1-1-1", phone: "03-1234-5678" }]
      }

      console.error("Error fetching clinics:", error)
      throw new Error("助産院の取得に失敗しました")
    }

    if (!data || data.length === 0) {
      // データがない場合はデフォルトのクリニックを返す
      return [{ id: 1, name: "マナリー助産院", address: "東京都渋谷区1-1-1", phone: "03-1234-5678" }]
    }

    return data
  } catch (error) {
    console.error("Error in getClinics:", error)
    // エラーが発生した場合はデフォルトのクリニックを返す
    return [{ id: 1, name: "マナリー助産院", address: "東京都渋谷区1-1-1", phone: "03-1234-5678" }]
  }
}

// 診療種別一覧を取得
export async function getServiceTypes(clinicId: number) {
  const supabase = createClient()

  try {
    const { data, error } = await supabase.from("service_types").select("*").eq("clinic_id", clinicId).order("name")

    if (error) {
      // テーブルが存在しない場合
      if (error.message.includes("does not exist")) {
        console.error("Error: service_types table does not exist")
        // デフォルトの診療種別を返す
        return [
          { id: 1, clinic_id: clinicId, name: "産後ケア", description: "産後のママと赤ちゃんのケア", duration: 60 },
          { id: 2, clinic_id: clinicId, name: "母乳相談", description: "授乳に関する相談", duration: 30 },
          { id: 3, clinic_id: clinicId, name: "産前相談", description: "出産前の相談", duration: 45 },
        ]
      }

      console.error("Error fetching service types:", error)
      throw new Error("診療種別の取得に失敗しました")
    }

    if (!data || data.length === 0) {
      // データがない場合はデフォルトの診療種別を返す
      return [
        { id: 1, clinic_id: clinicId, name: "産後ケア", description: "産後のママと赤ちゃんのケア", duration: 60 },
        { id: 2, clinic_id: clinicId, name: "母乳相談", description: "授乳に関する相談", duration: 30 },
        { id: 3, clinic_id: clinicId, name: "産前相談", description: "出産前の相談", duration: 45 },
      ]
    }

    return data
  } catch (error) {
    console.error("Error in getServiceTypes:", error)
    // エラーが発生した場合はデフォルトの診療種別を返す
    return [
      { id: 1, clinic_id: clinicId, name: "産後ケア", description: "産後のママと赤ちゃんのケア", duration: 60 },
      { id: 2, clinic_id: clinicId, name: "母乳相談", description: "授乳に関する相談", duration: 30 },
      { id: 3, clinic_id: clinicId, name: "産前相談", description: "出産前の相談", duration: 45 },
    ]
  }
}
