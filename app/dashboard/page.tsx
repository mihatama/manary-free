import { requireAuth } from "@/lib/auth"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"
import { Calendar, Users, MessageSquare } from "lucide-react"
import { redirect } from "next/navigation"

export default async function DashboardPage() {
  try {
    // 認証チェック
    const session = await requireAuth()
    const user = session?.user || { name: "ユーザー", role: "admin" }

    return (
      <div className="min-h-screen bg-gray-50">
        <main className="container mx-auto px-4 py-8">
          <h1 className="text-2xl font-bold mb-6">ダッシュボード</h1>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Link href="/dashboard/schedule-settings">
              <Card className="cursor-pointer hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>予約設定</CardTitle>
                    <Calendar className="h-5 w-5 text-manary-pink" />
                  </div>
                  <CardDescription>診療種別と予約可能時間の設定</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold">{/* 数値データがあれば表示 */}</p>
                </CardContent>
              </Card>
            </Link>

            <Link href="/dashboard/users">
              <Card className="cursor-pointer hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>利用者管理</CardTitle>
                    <Users className="h-5 w-5 text-manary-green" />
                  </div>
                  <CardDescription>システム全体の利用者数</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold">128</p>
                </CardContent>
              </Card>
            </Link>

            <Link href="/dashboard/messages">
              <Card className="cursor-pointer hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>未読メッセージ</CardTitle>
                    <MessageSquare className="h-5 w-5 text-manary-lightgreen" />
                  </div>
                  <CardDescription>未対応のお問い合わせ</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold">5</p>
                </CardContent>
              </Card>
            </Link>
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
  } catch (error) {
    console.error("Error in DashboardPage:", error)
    // エラーが発生した場合はログインページにリダイレクト
    redirect("/")
  }
}
