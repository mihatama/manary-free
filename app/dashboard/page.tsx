import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { CalendarDays, Users, Clock, CheckCircle } from "lucide-react"

export const dynamic = "force-dynamic"

async function getDashboardStats() {
  try {
    const supabase = createClient()

    // Get total reservations
    const { count: totalAppointments } = await supabase.from("reservations").select("*", { count: "exact", head: true })

    // Get today's reservations
    const today = new Date().toISOString().split("T")[0]
    const { count: todayAppointments } = await supabase
      .from("reservations")
      .select("*", { count: "exact", head: true })
      .eq("reservation_date", today)
      .neq("status", "cancelled")

    // Get confirmed reservations
    const { count: confirmedAppointments } = await supabase
      .from("reservations")
      .select("*", { count: "exact", head: true })
      .eq("status", "confirmed")

    // Get total questionnaires
    const { count: totalQuestionnaires } = await supabase
      .from("questionnaires")
      .select("*", { count: "exact", head: true })

    return {
      totalAppointments: totalAppointments || 0,
      todayAppointments: todayAppointments || 0,
      confirmedAppointments: confirmedAppointments || 0,
      totalQuestionnaires: totalQuestionnaires || 0,
    }
  } catch (error) {
    console.error("Error fetching dashboard stats:", error)
    return {
      totalAppointments: 0,
      todayAppointments: 0,
      confirmedAppointments: 0,
      totalQuestionnaires: 0,
    }
  }
}

export default async function DashboardPage() {
  const stats = await getDashboardStats()

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">ダッシュボード</h2>
        <p className="text-muted-foreground">システムの概要と統計情報</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">総予約数</CardTitle>
            <CalendarDays className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalAppointments}</div>
            <p className="text-xs text-muted-foreground">全期間の予約数</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">本日の予約</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.todayAppointments}</div>
            <p className="text-xs text-muted-foreground">今日の予約数</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">確定予約</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.confirmedAppointments}</div>
            <p className="text-xs text-muted-foreground">確定済みの予約数</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">問診票</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalQuestionnaires}</div>
            <p className="text-xs text-muted-foreground">登録済み問診票数</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>最近の活動</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center">
                <div className="ml-4 space-y-1">
                  <p className="text-sm font-medium leading-none">予約システムが正常に動作しています</p>
                  <p className="text-sm text-muted-foreground">すべての機能が利用可能です</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="col-span-3">
          <CardHeader>
            <CardTitle>クイックアクション</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="text-sm">
              <a href="/dashboard/appointments" className="text-blue-600 hover:underline">
                予約一覧を見る
              </a>
            </div>
            <div className="text-sm">
              <a href="/dashboard/settings" className="text-blue-600 hover:underline">
                設定を変更する
              </a>
            </div>
            <div className="text-sm">
              <a href="/dashboard/users" className="text-blue-600 hover:underline">
                ユーザー管理
              </a>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
