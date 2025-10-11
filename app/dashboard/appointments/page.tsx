import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { FeatureDisabledMessage } from "@/components/feature-disabled-message"

export const dynamic = "force-dynamic"

export default function AppointmentsPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>予約一覧 (ローカル)</CardTitle>
        <CardDescription>オンライン予約機能の代わりに、ローカルストレージを利用したサンプル運用です。</CardDescription>
      </CardHeader>
      <CardContent>
        <FeatureDisabledMessage
          title="外部システムとの連携は停止中"
          description="予約の保存は未実装です。必要に応じてローカルストレージを利用したカレンダー機能を追加してください。"
          backHref="/dashboard"
          backLabel="ダッシュボードに戻る"
        />
      </CardContent>
    </Card>
  )
}
