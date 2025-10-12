"use client"

import { useMemo } from "react"
import type { AuthUser } from "aws-amplify/auth"
import { Authenticator } from "@aws-amplify/ui-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
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
  pending: "Pending",
  confirmed: "Confirmed",
  cancelled: "Cancelled",
}

const statusBadgeVariant: Record<ReservationStatus, "default" | "secondary" | "destructive"> = {
  pending: "secondary",
  confirmed: "default",
  cancelled: "destructive",
}

export default function DashboardPage() {
  return (
    <Authenticator>
      {({ user, signOut }) => <DashboardContent user={user} onSignOut={signOut} />}
    </Authenticator>
  )
}

type DashboardContentProps = {
  user?: AuthUser
  onSignOut: () => void | Promise<void>
}

function DashboardContent({ user, onSignOut }: DashboardContentProps) {
  const { reservations, updateReservationStatus, deleteReservation, isReady } = useAppState()

  const userDisplayName = user?.signInDetails?.loginId ?? user?.username ?? "Amplify User"

  const summary = useMemo(() => {
    const total = reservations.length
    const confirmed = reservations.filter((reservation) => reservation.status === "confirmed").length
    const pending = reservations.filter((reservation) => reservation.status === "pending").length
    const cancelled = reservations.filter((reservation) => reservation.status === "cancelled").length

    return { total, confirmed, pending, cancelled }
  }, [reservations])

  if (!isReady) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-[#ffeaed]">
        <p className="text-lg text-muted-foreground">Loading dashboard…</p>
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
            <h1 className="text-2xl font-bold text-[#f8a0a0]">Manary Dashboard</h1>
            <p className="text-sm text-muted-foreground">
              Manage reservations stored locally in your browser.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-muted-foreground">{userDisplayName}</span>
            <Button
              variant="outline"
              onClick={() => {
                void onSignOut()
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
              <CardDescription>Total reservations</CardDescription>
              <CardTitle className="text-3xl">{summary.total}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader>
              <CardDescription>Confirmed</CardDescription>
              <CardTitle className="text-3xl text-emerald-600">{summary.confirmed}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader>
              <CardDescription>Pending</CardDescription>
              <CardTitle className="text-3xl text-amber-600">{summary.pending}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader>
              <CardDescription>Cancelled</CardDescription>
              <CardTitle className="text-3xl text-rose-600">{summary.cancelled}</CardTitle>
            </CardHeader>
          </Card>
        </section>

        <section className="mt-10">
          <Card>
            <CardHeader>
              <CardTitle>Reservation list</CardTitle>
              <CardDescription>
                Review incoming reservations and adjust their status as needed.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {reservations.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No reservations yet. Try submitting the public reservation form.
                </p>
              ) : (
                <Table>
                  <TableCaption>Reservations stored in local storage</TableCaption>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Client</TableHead>
                      <TableHead>Contact</TableHead>
                      <TableHead>Service</TableHead>
                      <TableHead>Appointment</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
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
                            Confirm
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleStatusChange(reservation.id, "pending")}
                          >
                            Pending
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleStatusChange(reservation.id, "cancelled")}
                          >
                            Cancel
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-destructive"
                            onClick={() => deleteReservation(reservation.id)}
                          >
                            Delete
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
