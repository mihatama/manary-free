import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { FeatureDisabledMessage } from "@/components/feature-disabled-message"

export default async function DashboardPage() {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return redirect("/")
  }

  return (
    <div className="flex-1 space-y-4 p-4 pt-6 md:p-8">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">ダッシュボード</h2>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>オンライン予約機能について</CardTitle>
          <CardDescription>
            予約および問診票の機能はシステムから削除されました。
          </CardDescription>
        </CardHeader>
        <CardContent>
          <FeatureDisabledMessage
            title="予約関連の管理機能は無効化されています"
            description="管理画面からは引き続きカルテやユーザー管理などの機能をご利用いただけます。オンライン予約や問診票に関する情報は今後表示されません。"
          />
        </CardContent>
      </Card>
    </div>
  )
}
