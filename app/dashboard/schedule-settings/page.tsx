import { requireAuth } from "@/lib/auth"
import { ScheduleSettingsClient } from "@/components/schedule-settings-client"

export default async function ScheduleSettingsPage() {
  // サーバーサイドで認証チェック
  await requireAuth()

  return <ScheduleSettingsClient />
}
