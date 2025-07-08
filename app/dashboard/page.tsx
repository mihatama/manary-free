import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card"
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { format } from "date-fns"
import { ja } from "date-fns/locale"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Calendar, AlertCircle } from "lucide-react"

// Helper function to safely format dates and times
const safeFormat = (dateStr: string, timeStr: string | null, formatStr: string) => {
  if (!dateStr || !timeStr) return "無効な日時"
  try {
    const date = new Date(`${dateStr}T${timeStr}`)
    if (isNaN(date.getTime())) {
      // Log the error and the invalid data for debugging
      console.error("Invalid date/time value encountered in dashboard:", { dateStr, timeStr })
      return "無効な日時"
    }
    return format(date, formatStr, { locale: ja })
  } catch (e) {
    console.error("Error formatting date/time in dashboard:", e, { dateStr, timeStr })
    return "フォーマットエラー"
  }
}

export default async function DashboardPage() {
  const supabase = createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return redirect("/")
  }

  const today = format(new Date(), "yyyy-MM-dd")

  const { data: appointments, error } = await supabase
    .from("reservations")
    .select(
      `
      id,
      reservation_date,
      start_time,
      end_time,
      status,
      service_types (name),
      patients (name)
    `,
    )
    .gte("reservation_date", today)
    .order("reservation_date", { ascending: true })
    .order("start_time", { ascending: true })
    .limit(10)

  if (error) {
    return (
      <div className="p-4">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>予約情報の読み込み中にエラーが発生しました: {error.message}</AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">ダッシュボード</h2>
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">本日の予約</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {appointments?.filter((a) => a.reservation_date === today).length ?? 0}
            </div>
            <p className="text-xs text-muted-foreground">件</p>
          </CardContent>
        </Card>
        {/* Other summary cards can go here */}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>今後の予約</CardTitle>
          <CardDescription>直近10件の予約が表示されています。</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>日時</TableHead>
                <TableHead>患者名</TableHead>
                <TableHead>診療内容</TableHead>
                <TableHead>ステータス</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {appointments && appointments.length > 0 ? (
                appointments.map((apt) => (
                  <TableRow key={apt.id}>
                    <TableCell>
                      <div className="font-medium">
                        {safeFormat(apt.reservation_date, apt.start_time, "M月d日 (E)")}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {safeFormat(apt.reservation_date, apt.start_time, "HH:mm")} -{" "}
                        {safeFormat(apt.reservation_date, apt.end_time, "HH:mm")}
                      </div>
                    </TableCell>
                    <TableCell>{(apt.patients as any)?.name || "N/A"}</TableCell>
                    <TableCell>{(apt.service_types as any)?.name || "N/A"}</TableCell>
                    <TableCell>
                      <Badge
                      variant="outline"
                      className={
                        apt.status === "confirmed"
                        ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                        : apt.status === "cancelled"
                        ? 'bg-rose-50 border-rose-200 text-rose-700'
                        : 'bg-pink-50 border-pink-200 text-pink-700'
                        }
                        >
                          {apt.status === "confirmed" ? "確認済み" : apt.status === "cancelled" ? "キャンセル" : apt.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={4} className="text-center">
                    今後の予約はありません。
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
