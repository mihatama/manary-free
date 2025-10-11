'use client'

import { useMemo, useState } from "react"
import { PlusCircle, Trash2 } from "lucide-react"

import {
  deleteUser as deleteStoredUser,
  saveUser as saveStoredUser,
  useLocalDataSelector,
} from "@/lib/storage/local-storage"
import type { StoredUser, UserRole } from "@/types/local-data"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Alert, AlertDescription } from "@/components/ui/alert"

const roleLabels: Record<UserRole, string> = {
  admin: "管理者",
  staff: "スタッフ",
}

function formatDate(timestamp?: string) {
  if (!timestamp) return "--"
  const date = new Date(timestamp)
  if (Number.isNaN(date.getTime())) {
    return "--"
  }
  return new Intl.DateTimeFormat("ja-JP", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date)
}

export function UserManagementClient() {
  const users = useLocalDataSelector((data) => data.users)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [email, setEmail] = useState("")
  const [role, setRole] = useState<UserRole>("staff")
  const [error, setError] = useState<string | null>(null)

  const sortedUsers = useMemo<StoredUser[]>(() => [...users].sort((a, b) => a.email.localeCompare(b.email)), [users])

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const trimmedEmail = email.trim()
    if (!trimmedEmail) {
      setError("メールアドレスを入力してください。")
      return
    }
    if (!trimmedEmail.includes("@")) {
      setError("有効なメールアドレスを入力してください。")
      return
    }
    saveStoredUser(trimmedEmail, role)
    setEmail("")
    setRole("staff")
    setError(null)
    setIsDialogOpen(false)
  }

  const handleDelete = (user: StoredUser) => {
    if (!confirm(`${user.email} を削除しますか？`)) {
      return
    }
    deleteStoredUser(user.id)
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <PlusCircle className="mr-2 h-4 w-4" /> 新しい利用者を追加
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[420px]">
            <form onSubmit={handleSubmit} className="space-y-4">
              <DialogHeader>
                <DialogTitle>利用者の追加</DialogTitle>
              </DialogHeader>
              <div className="space-y-3">
                <div className="space-y-2">
                  <Label htmlFor="user-email">メールアドレス</Label>
                  <Input
                    id="user-email"
                    type="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    placeholder="example@example.com"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="user-role">役割</Label>
                  <Select value={role} onValueChange={(value: UserRole) => setRole(value)}>
                    <SelectTrigger id="user-role">
                      <SelectValue placeholder="役割を選択" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="staff">スタッフ</SelectItem>
                      <SelectItem value="admin">管理者</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  キャンセル
                </Button>
                <Button type="submit">保存</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="rounded-md border bg-white">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>メールアドレス</TableHead>
              <TableHead>役割</TableHead>
              <TableHead>作成日時</TableHead>
              <TableHead className="w-24 text-right">操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedUsers.length > 0 ? (
              sortedUsers.map((user) => (
                <TableRow key={user.id}>
                  <TableCell className="font-medium">{user.email}</TableCell>
                  <TableCell>
                    <Badge variant={user.role === "admin" ? "default" : "outline"}>{roleLabels[user.role]}</Badge>
                  </TableCell>
                  <TableCell>{formatDate(user.updatedAt ?? user.createdAt)}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(user)}>
                      <Trash2 className="h-4 w-4 text-red-500" />
                      <span className="sr-only">削除</span>
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-6 text-gray-500">
                  利用者がまだ登録されていません。
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
