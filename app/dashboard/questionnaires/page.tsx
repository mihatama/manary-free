import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { FeatureDisabledMessage } from "@/components/feature-disabled-message"

export const dynamic = "force-dynamic"

export default function QuestionnairesPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>問診票一覧</CardTitle>
        <CardDescription>問診票機能は現在提供していません。</CardDescription>
      </CardHeader>
      <CardContent>
        <FeatureDisabledMessage
          title="問診票は利用できません"
          description="オンライン問診票機能はシステムから削除されたため、データの閲覧や編集は行えません。"
          backHref="/dashboard"
          backLabel="ダッシュボードに戻る"
        />
      </CardContent>
    </Card>
  )
}
