"use server"

import { createClient } from "@/lib/supabase/server"
import { unstable_noStore as noStore } from "next/cache"
import type { Database } from "@/lib/supabase/database.types"

type Questionnaire = Database["public"]["Tables"]["questionnaires"]["Row"]
export type ChartData = Questionnaire & {
  patient_name: string
}

export async function getCharts({
  page = 1,
  limit = 10,
  sortBy = "created_at",
  sortOrder = "desc",
  search = "",
}: {
  page?: number
  limit?: number
  sortBy?: string
  sortOrder?: "asc" | "desc"
  search?: string
}): Promise<{ data: ChartData[]; count: number }> {
  noStore()
  const supabase = createClient()
  const offset = (page - 1) * limit

  try {
    // "Charts" are represented by "questionnaires" table in this context.
    let query = supabase.from("questionnaires").select("*", { count: "exact" })

    if (search) {
      query = query.or(`mother_last_name.ilike.%${search}%,mother_first_name.ilike.%${search}%,email.ilike.%${search}%`)
    }

    const validSortBy = ["created_at", "email", "mother_last_name"].includes(sortBy) ? sortBy : "created_at"
    query = query.order(validSortBy, { ascending: sortOrder === "asc" })

    query = query.range(offset, offset + limit - 1)

    const { data, error, count } = await query

    if (error) {
      console.error("Error fetching charts (questionnaires):", error.message)
      throw new Error("カルテ情報の取得に失敗しました。")
    }

    const formattedData: ChartData[] = data.map((q) => {
      const { mother_last_name, mother_first_name, ...rest } = q
      return {
        ...rest,
        patient_name: `${mother_last_name || ""} ${mother_first_name || ""}`.trim(),
      }
    })

    return { data: formattedData, count: count ?? 0 }
  } catch (error) {
    console.error(
      "An unexpected error occurred in getCharts:",
      error instanceof Error ? error.message : "Unknown error",
    )
    throw new Error("カルテ情報の取得に失敗しました。")
  }
}
