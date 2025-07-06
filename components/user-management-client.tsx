"use client"

import { useState, useEffect, useActionState } from "react"
import { useFormStatus } from "react-dom"
import type { User } from "@supabase/supabase-js"
import { createUser, updateUser } from "@/app/actions/user-actions"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useToast } from "@/hooks/use-toast"
import { PlusCircle, Edit } from "lucide-react"
import { useRouter } from "next/navigation"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"

interface UserManagementClientProps {
  users: User[]
}

function SubmitButton({ text = "作成", pendingText = "処理中..." }: { text?: string; pendingText?: string }) {
  const { pending } = useFormStatus()
  return (
    <Button type="submit" disabled={pending}>
      {pending ? pendingText : text}
    </Button>
  )
}

function AddUserForm({ closeDialog }: { closeDialog: () => void }) {
  const router = useRouter()
  const { toast } = useToast()
  const initialState = { message: null, errors: null, success: false }
  const [state, dispatch] = useActionState(createUser, initialState)

  useEffect(() => {
    if (state.message) {
      if (state.success) {
        toast({
          title: "成功",
          description: state.message,
        })
        router.refresh()
        closeDialog()
      } else {
        toast({
          title: "エラー",
          description: state.message,
          variant: "destructive",
        })
      }
    }
  }, [state, toast, closeDialog, router])

  return (
    <form action={dispatch}>
      <div className="grid gap-4 py-4">
        <div className="grid grid-cols-4 items-center gap-4">
          <Label htmlFor="email-add" className="text-right">
            メールアドレス
          </Label>
          <Input id="email-add" name="email" type="email" className="col-span-3" required />
        </div>
        {state.errors?.email && <p className="col-start-2 col-span-3 text-sm text-red-500">{state.errors.email[0]}</p>}
        <div className="grid grid-cols-4 items-center gap-4">
          <Label htmlFor="password-add" className="text-right">
            パスワード
          </Label>
          <Input id="password-add" name="password" type="password" className="col-span-3" required />
        </div>
        {state.errors?.password && (
          <p className="col-start-2 col-span-3 text-sm text-red-500">{state.errors.password[0]}</p>
        )}
        <div className="grid grid-cols-4 items-center gap-4">
          <Label htmlFor="phone-add" className="text-right">
            電話番号
          </Label>
          <Input id="phone-add" name="phone" type="tel" className="col-span-3" />
        </div>
        {state.errors?.phone && <p className="col-start-2 col-span-3 text-sm text-red-500">{state.errors.phone[0]}</p>}
        <div className="grid grid-cols-4 items-center gap-4">
          <Label htmlFor="isAdmin-add" className="text-right">
            役割
          </Label>
          <div className="col-span-3 flex items-center space-x-2">
            <Checkbox id="isAdmin-add" name="isAdmin" />
            <label
              htmlFor="isAdmin-add"
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              この利用者を管理者として登録する
            </label>
          </div>
        </div>
      </div>
      <DialogFooter>
        <DialogClose asChild>
          <Button type="button" variant="outline">
            キャンセル
          </Button>
        </DialogClose>
        <SubmitButton text="ユーザーを作成" pendingText="作成中..." />
      </DialogFooter>
    </form>
  )
}

function EditUserForm({ user, closeDialog }: { user: User; closeDialog: () => void }) {
  const router = useRouter()
  const { toast } = useToast()
  const initialState = { message: null, errors: null, success: false }
  const [state, dispatch] = useActionState(updateUser, initialState)

  useEffect(() => {
    if (state.message) {
      if (state.success) {
        toast({
          title: "成功",
          description: state.message,
        })
        router.refresh()
        closeDialog()
      } else {
        toast({
          title: "エラー",
          description: state.message,
          variant: "destructive",
        })
      }
    }
  }, [state, toast, closeDialog, router])

  return (
    <form action={dispatch}>
      <input type="hidden" name="userId" value={user.id} />
      <div className="grid gap-4 py-4">
        <div className="grid grid-cols-4 items-center gap-4">
          <Label htmlFor={`email-edit-${user.id}`} className="text-right">
            メールアドレス
          </Label>
          <Input
            id={`email-edit-${user.id}`}
            name="email"
            type="email"
            className="col-span-3"
            defaultValue={user.email}
            required
          />
        </div>
        {state.errors?.email && <p className="col-start-2 col-span-3 text-sm text-red-500">{state.errors.email[0]}</p>}

        <div className="grid grid-cols-4 items-center gap-4">
          <Label htmlFor={`phone-edit-${user.id}`} className="text-right">
            電話番号
          </Label>
          <Input
            id={`phone-edit-${user.id}`}
            name="phone"
            type="tel"
            className="col-span-3"
            defaultValue={user.user_metadata?.raw_phone || ""}
          />
        </div>
        {state.errors?.phone && <p className="col-start-2 col-span-3 text-sm text-red-500">{state.errors.phone[0]}</p>}

        <div className="grid grid-cols-4 items-center gap-4">
          <Label htmlFor={`password-edit-${user.id}`} className="text-right">
            パスワード
          </Label>
          <Input
            id={`password-edit-${user.id}`}
            name="password"
            type="password"
            className="col-span-3"
            placeholder="変更する場合のみ入力"
          />
        </div>
        {state.errors?.password && (
          <p className="col-start-2 col-span-3 text-sm text-red-500">{state.errors.password[0]}</p>
        )}

        <div className="grid grid-cols-4 items-center gap-4">
          <Label htmlFor={`isAdmin-edit-${user.id}`} className="text-right">
            役割
          </Label>
          <div className="col-span-3 flex items-center space-x-2">
            <Checkbox
              id={`isAdmin-edit-${user.id}`}
              name="isAdmin"
              defaultChecked={user.user_metadata?.role === "admin"}
            />
            <label
              htmlFor={`isAdmin-edit-${user.id}`}
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              この利用者を管理者として登録する
            </label>
          </div>
        </div>
      </div>
      <DialogFooter>
        <DialogClose asChild>
          <Button type="button" variant="outline">
            キャンセル
          </Button>
        </DialogClose>
        <SubmitButton text="更新" pendingText="更新中..." />
      </DialogFooter>
    </form>
  )
}

export function UserManagementClient({ users }: UserManagementClientProps) {
  const [isAddDialogOpen, setAddDialogOpen] = useState(false)
  const [editingUser, setEditingUser] = useState<User | null>(null)

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Dialog open={isAddDialogOpen} onOpenChange={setAddDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <PlusCircle className="mr-2 h-4 w-4" />
              利用者を追加
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>新しい利用者を追加</DialogTitle>
              <DialogDescription>新しい利用者のメールアドレスと初期パスワードを設定してください。</DialogDescription>
            </DialogHeader>
            <AddUserForm closeDialog={() => setAddDialogOpen(false)} />
          </DialogContent>
        </Dialog>
      </div>

      <Dialog open={!!editingUser} onOpenChange={(open) => !open && setEditingUser(null)}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>利用者情報を編集</DialogTitle>
            <DialogDescription>利用者の情報を変更します。</DialogDescription>
          </DialogHeader>
          {editingUser && <EditUserForm user={editingUser} closeDialog={() => setEditingUser(null)} />}
        </DialogContent>
      </Dialog>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>メールアドレス</TableHead>
              <TableHead>電話番号</TableHead>
              <TableHead>役割</TableHead>
              <TableHead>登録日時</TableHead>
              <TableHead className="text-right">操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.length > 0 ? (
              users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell className="font-medium">{user.email}</TableCell>
                  <TableCell>{user.user_metadata?.raw_phone || "ー"}</TableCell>
                  <TableCell>
                    {user.user_metadata?.role === "admin" && <Badge variant="outline">管理者</Badge>}
                  </TableCell>
                  <TableCell>{user.created_at ? new Date(user.created_at).toLocaleString("ja-JP") : "N/A"}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon" onClick={() => setEditingUser(user)}>
                      <Edit className="h-4 w-4" />
                      <span className="sr-only">編集</span>
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={5} className="text-center">
                  利用者が見つかりません。
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
