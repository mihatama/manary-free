"use server"
import { createClient } from "@/lib/supabase/server"
import { unstable_noStore as noStore } from "next/cache"

export async function getCharts({
  query,
  sortBy,
  sortOrder,
}: {
  query?: string
  sortBy?: string
  sortOrder?: "asc" | "desc"
}) {
  noStore()
  const supabase = createClient()

  // Use `!inner` to ensure we only fetch records that have an associated user.
  // This prevents potential errors down the line if a user record is missing.
  let supabaseQuery = supabase.from("postpartum_care_records").select(
    `
      id,
      created_at,
      users!inner (
        id,
        full_name
      )
    `,
  )

  // Handle search query. The original code tried to search by name or ID.
  // We'll implement this logic robustly.
  if (query) {
    // A simple regex to check if the query is in UUID format.
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(query)

    if (isUUID) {
      // If the query looks like a UUID, search the user ID.
      supabaseQuery = supabaseQuery.eq("users.id", query)
    } else {
      // Otherwise, perform a case-insensitive search on the user's full name.
      supabaseQuery = supabaseQuery.ilike("users.full_name", `%${query}%`)
    }
  }

  // Handle sorting. The previous implementation was incomplete and could cause errors.
  if (sortBy) {
    const ascending = sortOrder === "asc"
    // We need to specify the foreign table for columns that belong to `users`.
    if (sortBy === "patient_name") {
      supabaseQuery = supabaseQuery.order("full_name", { foreignTable: "users", ascending })
    } else if (sortBy === "patient_id") {
      supabaseQuery = supabaseQuery.order("id", { foreignTable: "users", ascending })
    } else {
      // For columns on the primary table, like `created_at`.
      supabaseQuery = supabaseQuery.order(sortBy, { ascending })
    }
  } else {
    // Default sort order.
    supabaseQuery = supabaseQuery.order("created_at", { ascending: false })
  }

  const { data, error } = await supabaseQuery

  if (error) {
    // Log the detailed error for debugging, but throw a generic one to the client.
    console.error("Error fetching charts:", error)
    throw new Error("カルテ情報の取得に失敗しました。")
  }

  // Map the data to the expected format.
  // Because we used `!inner`, `item.users` is guaranteed to exist.
  return data.map((item) => ({
    id: item.id,
    patient_name: item.users.full_name,
    patient_id: item.users.id,
    creation_date: item.created_at,
    chart_type: "産後ケア", // This is a static value for now.
  }))
}
