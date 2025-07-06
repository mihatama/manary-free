"use client"
import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { AppointmentsPageClient } from "@/components/appointments-page-client"

export const dynamic = "force-dynamic"

export default async function AppointmentsPage() {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login")
  }

  return <AppointmentsPageClient user={user} />
}
