"use client"

import { useState, useEffect, useActionState } from "react"
import { useFormStatus } from "react-dom"
import type { User } from "@supabase/supabase-js"
import { createUser } from "@/app/actions/user-actions"
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
import { PlusCircle } from "lucide-react"
import { useRouter } from "next/navigation"

interface UserManagementClientProps {
  users: User[]
}

function SubmitButton() {
  const { pending } = useFormStatus()
  return (
    <Button type="submit" disabled={pending}>
      {pending ? "作成中..." : "ユーザーを作成"}
    </Button>
  )
}

// Form logic is encapsulated in its own component
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
        router.refresh() // Refresh the page to show the new user
        closeDialog() // Close dialog on success
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
          <Label htmlFor="email" className="text-right">
            メールアドレス
          </Label>
          <Input id="email" name="email" type="email" className="col-span-3" required />
        </div>
        {state.errors?.email && <p className="col-start-2 col-span-3 text-sm text-red-500">{state.errors.email[0]}</p>}
        <div className="grid grid-cols-4 items-center gap-4">
          <Label htmlFor="password" className="text-right">
            パスワード
          </Label>
          <Input id="password" name="password" type="password" className="col-span-3" required />
        </div>
        {state.errors?.password && (
          <p className="col-start-2 col-span-3 text-sm text-red-500">{state.errors.password[0]}</p>
        )}
      </div>
      <DialogFooter>
        <DialogClose asChild>
          <Button type="button" variant="outline">
            キャンセル
          </Button>
        </DialogClose>
        <SubmitButton />
      </DialogFooter>
    </form>
  )
}

export function UserManagementClient({ users }: UserManagementClientProps) {
  const [open, setOpen] = useState(false)

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Dialog open={open} onOpenChange={setOpen}>
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
            <AddUserForm closeDialog={() => setOpen(false)} />
          </DialogContent>
        </Dialog>
      </div>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>メールアドレス</TableHead>
              <TableHead>登録日時</TableHead>
              <TableHead>最終サインイン</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.length > 0 ? (
              users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell className="font-medium">{user.email}</TableCell>
                  <TableCell>{user.created_at ? new Date(user.created_at).toLocaleString("ja-JP") : "N/A"}</TableCell>
                  <TableCell>
                    {user.last_sign_in_at ? new Date(user.last_sign_in_at).toLocaleString("ja-JP") : "N/A"}
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={3} className="text-center">
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
