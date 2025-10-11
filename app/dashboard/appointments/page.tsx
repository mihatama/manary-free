import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { FeatureDisabledMessage } from "@/components/feature-disabled-message"

export const dynamic = "force-dynamic"

export default async function AppointmentsPage() {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login")
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>予約一覧</CardTitle>
        <CardDescription>オンライン予約機能は廃止されました。</CardDescription>
      </CardHeader>
      <CardContent>
        <FeatureDisabledMessage
          title="予約一覧は利用できません"
          description="オンライン予約機能を停止したため、予約データの表示や管理は行えません。"
          backHref="/dashboard"
          backLabel="ダッシュボードに戻る"
        />
      </CardContent>
    </Card>
  )
}
