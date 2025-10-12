"use client"

import { useEffect, useMemo } from "react"
import { useRouter } from "next/navigation"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { useAppState, type ReservationStatus } from "@/components/providers/app-state-provider"

const statusLabels: Record<ReservationStatus, string> = {
  pending: "確認待ち",
  confirmed: "確定",
  cancelled: "キャンセル",
}

const statusBadgeVariant: Record<ReservationStatus, "default" | "secondary" | "destructive"> = {
  pending: "secondary",
  confirmed: "default",
  cancelled: "destructive",
}

export default function DashboardPage() {
  const router = useRouter()
  const { reservations, logout, updateReservationStatus, deleteReservation, currentUser, isReady } = useAppState()

  useEffect(() => {
    if (isReady && !currentUser) {
      router.replace("/")
    }
  }, [isReady, currentUser, router])

  const userDisplayName = currentUser?.name ?? currentUser?.email ?? "Cognito User"

  const summary = useMemo(() => {
    const total = reservations.length
    const confirmed = reservations.filter((reservation) => reservation.status === "confirmed").length
    const pending = reservations.filter((reservation) => reservation.status === "pending").length
    const cancelled = reservations.filter((reservation) => reservation.status === "cancelled").length

    return { total, confirmed, pending, cancelled }
  }, [reservations])

  if (!isReady || !currentUser) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-[#ffeaed]">
        <p className="text-lg text-muted-foreground">ダッシュボードを読み込み中です…</p>
      </div>
    )
  }

  const handleStatusChange = (id: string, status: ReservationStatus) => {
    updateReservationStatus(id, status)
  }

  return (
    <div className="min-h-screen bg-[#ffeaed]">
      <header className="border-b border-slate-300 bg-white">
        <div className="container mx-auto flex items-center justify-between px-4 py-4">
          <div>
            <h1 className="text-2xl font-bold text-[#f8a0a0]">Manary ダッシュボード</h1>
            <p className="text-sm text-muted-foreground">ローカルストレージで稼働するシンプルな予約管理</p>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-muted-foreground">{userDisplayName}</span>
            <Button
              variant="outline"
              onClick={() => {
                void logout()
              }}
            >
              Sign out
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-10">
        <section className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader>
              <CardDescription>総予約数</CardDescription>
              <CardTitle className="text-3xl">{summary.total}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader>
              <CardDescription>確定</CardDescription>
              <CardTitle className="text-3xl text-emerald-600">{summary.confirmed}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader>
              <CardDescription>確認待ち</CardDescription>
              <CardTitle className="text-3xl text-amber-600">{summary.pending}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader>
              <CardDescription>キャンセル</CardDescription>
              <CardTitle className="text-3xl text-rose-600">{summary.cancelled}</CardTitle>
            </CardHeader>
          </Card>
        </section>

        <section className="mt-10">
          <Card>
            <CardHeader>
              <CardTitle>予約一覧</CardTitle>
              <CardDescription>患者からの予約を確認してステータスを管理できます。</CardDescription>
            </CardHeader>
            <CardContent>
              {reservations.length === 0 ? (
                <p className="text-sm text-muted-foreground">まだ予約がありません。公開予約フォームから登録してみましょう。</p>
              ) : (
                <Table>
                  <TableCaption>ローカルストレージに保存された予約データ</TableCaption>
                  <TableHeader>
                    <TableRow>
                      <TableHead>患者名</TableHead>
                      <TableHead>連絡先</TableHead>
                      <TableHead>サービス</TableHead>
                      <TableHead>予約日時</TableHead>
                      <TableHead>ステータス</TableHead>
                      <TableHead className="text-right">操作</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {reservations.map((reservation) => (
                      <TableRow key={reservation.id}>
                        <TableCell>
                          <div className="font-medium">{reservation.patientName}</div>
                          <div className="text-xs text-muted-foreground">{reservation.patientEmail}</div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">{reservation.patientPhone}</div>
                          {reservation.notes ? (
                            <div className="text-xs text-muted-foreground">{reservation.notes}</div>
                          ) : null}
                        </TableCell>
                        <TableCell>{reservation.serviceTypeName}</TableCell>
                        <TableCell>
                          <div>{reservation.appointmentDate}</div>
                          <div className="text-xs text-muted-foreground">{reservation.appointmentTime}</div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={statusBadgeVariant[reservation.status]}>
                            {statusLabels[reservation.status]}
                          </Badge>
                        </TableCell>
                        <TableCell className="flex justify-end gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleStatusChange(reservation.id, "confirmed")}
                          >
                            確定
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleStatusChange(reservation.id, "pending")}
                          >
                            保留
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleStatusChange(reservation.id, "cancelled")}
                          >
                            キャンセル
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-destructive"
                            onClick={() => deleteReservation(reservation.id)}
                          >
                            削除
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </section>
      </main>
    </div>
  )
}
