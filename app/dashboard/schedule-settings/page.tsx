import { requireAuth } from "@/lib/auth"
import { hasSupabaseAuthConfig } from "@/lib/supabase/env"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { FeatureDisabledMessage } from "@/components/feature-disabled-message"

export default async function ScheduleSettingsPage() {
  if (hasSupabaseAuthConfig()) {
    await requireAuth()
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>予約設定</CardTitle>
        <CardDescription>予約可能時間の設定機能は削除されました。</CardDescription>
      </CardHeader>
      <CardContent>
        <FeatureDisabledMessage
          title="予約設定は利用できません"
          description="オンライン予約を停止したため、予約枠やスケジュールに関する設定は不要となりました。"
          backHref="/dashboard"
          backLabel="ダッシュボードに戻る"
        />
      </CardContent>
    </Card>
  )
}
