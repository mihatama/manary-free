import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { FeatureDisabledMessage } from "@/components/feature-disabled-message"

export default function DashboardPage() {
  return (
    <div className="flex-1 space-y-4 p-4 pt-6 md:p-8">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">ダッシュボード</h2>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>ローカル管理モード</CardTitle>
          <CardDescription>すべてのデータはブラウザのローカルストレージに保存されます。</CardDescription>
        </CardHeader>
        <CardContent>
          <FeatureDisabledMessage
            title="この環境では外部データベースを利用していません"
            description="サンプルとしてローカルストレージにデータを保存し、ブラウザ内で助産院や診療種別、利用者情報を管理できます。データを初期化したい場合はサイドバーの『ローカルデータを削除』を使用してください。"
          />
        </CardContent>
      </Card>
    </div>
  )
}
