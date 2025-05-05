import { requireAuth } from "@/lib/auth"
import { LogoutButton } from "@/components/logout-button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default async function DashboardPage() {
  const { user } = await requireAuth()

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-xl font-bold text-[#f8a0a0]">マナリー管理システム</h1>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-600">
              {user.name} ({user.role})
            </span>
            <LogoutButton />
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-6">ダッシュボード</h1>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>利用者数</CardTitle>
              <CardDescription>システム全体の利用者数</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">128</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>本日の予約</CardTitle>
              <CardDescription>本日の予約件数</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">24</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>未読メッセージ</CardTitle>
              <CardDescription>未対応のお問い合わせ</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">5</p>
            </CardContent>
          </Card>
        </div>

        <div className="mt-8">
          <h2 className="text-xl font-bold mb-4">最近の活動</h2>
          <Card>
            <CardContent className="p-0">
              <ul className="divide-y divide-gray-200">
                {[
                  { id: 1, action: "新規ユーザー登録", user: "田中さん", time: "10分前" },
                  { id: 2, action: "予約変更", user: "佐藤さん", time: "30分前" },
                  { id: 3, action: "メッセージ送信", user: "鈴木さん", time: "1時間前" },
                  { id: 4, action: "予約キャンセル", user: "高橋さん", time: "2時間前" },
                  { id: 5, action: "新規予約", user: "伊藤さん", time: "3時間前" },
                ].map((activity) => (
                  <li key={activity.id} className="px-4 py-3 flex justify-between items-center">
                    <div>
                      <p className="font-medium">{activity.action}</p>
                      <p className="text-sm text-gray-500">{activity.user}</p>
                    </div>
                    <span className="text-sm text-gray-500">{activity.time}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
