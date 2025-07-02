"use client"

import { useState, useTransition } from "react"
import { Plus, Edit, Trash2, MoreHorizontal } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { toast } from "sonner"
import { createClinic, updateClinic, deleteClinic } from "@/app/actions/clinic-actions"
import type { Database } from "@/lib/supabase/database.types"
import { useCSRF } from "@/hooks/use-csrf"

type Clinic = Database["public"]["Tables"]["clinics"]["Row"]

interface ClinicManagerProps {
  clinics: Clinic[]
  selectedClinicId: number | null
  onSelectClinic: (id: number | null) => void
}

export function ClinicManager({ clinics, selectedClinicId, onSelectClinic }: ClinicManagerProps) {
  const [isPending, startTransition] = useTransition()
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingClinic, setEditingClinic] = useState<Clinic | null>(null)
  const { csrfToken } = useCSRF()

  const handleOpenDialog = (clinic: Clinic | null) => {
    setEditingClinic(clinic)
    setIsDialogOpen(true)
  }

  const handleSubmit = (formData: FormData) => {
    if (!csrfToken) {
      toast.error("セキュリティトークンがありません。ページを再読み込みしてください。")
      return
    }
    formData.append("csrf_token", csrfToken)

    startTransition(async () => {
      try {
        if (editingClinic) {
          formData.append("id", editingClinic.id.toString())
          await updateClinic(formData)
          toast.success("助産院を更新しました。")
        } else {
          await createClinic(formData)
          toast.success("助産院を追加しました。")
        }
        setIsDialogOpen(false)
        setEditingClinic(null)
      } catch (error) {
        toast.error((error as Error).message)
      }
    })
  }

  const handleDelete = (formData: FormData) => {
    if (!csrfToken) {
      toast.error("セキュリティトークンがありません。ページを再読み込みしてください。")
      return
    }
    formData.append("csrf_token", csrfToken)

    startTransition(async () => {
      try {
        await deleteClinic(formData)
        toast.success("助産院を削除しました。")
      } catch (error) {
        toast.error((error as Error).message)
      }
    })
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">助産院管理</h2>
        <Button onClick={() => handleOpenDialog(null)}>
          <Plus className="mr-2 h-4 w-4" />
          新規作成
        </Button>
      </div>

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>助産院名</TableHead>
              <TableHead>住所</TableHead>
              <TableHead>電話番号</TableHead>
              <TableHead className="w-[50px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {clinics.map((clinic) => (
              <TableRow
                key={clinic.id}
                onClick={() => onSelectClinic(clinic.id)}
                className={`cursor-pointer ${selectedClinicId === clinic.id ? "bg-pink-50" : ""}`}
              >
                <TableCell className="font-medium">{clinic.name}</TableCell>
                <TableCell>{clinic.address}</TableCell>
                <TableCell>{clinic.phone}</TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="h-8 w-8 p-0">
                        <span className="sr-only">メニューを開く</span>
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => handleOpenDialog(clinic)}>
                        <Edit className="mr-2 h-4 w-4" />
                        編集
                      </DropdownMenuItem>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="text-red-600">
                            <Trash2 className="mr-2 h-4 w-4" />
                            削除
                          </DropdownMenuItem>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <form action={handleDelete}>
                            <input type="hidden" name="id" value={clinic.id} />
                            <AlertDialogHeader>
                              <AlertDialogTitle>本当に削除しますか？</AlertDialogTitle>
                              <AlertDialogDescription>
                                この操作は元に戻せません。「{clinic.name}」を削除します。
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>キャンセル</AlertDialogCancel>
                              <AlertDialogAction type="submit" disabled={isPending}>
                                {isPending ? "削除中..." : "削除"}
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </form>
                        </AlertDialogContent>
                      </AlertDialog>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <form action={handleSubmit}>
            <DialogHeader>
              <DialogTitle>{editingClinic ? "助産院を編集" : "新しい助産院"}</DialogTitle>
              <DialogDescription>
                {editingClinic ? "助産院の情報を更新します。" : "新しい助産院の詳細情報を入力してください。"}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">助産院名</Label>
                <Input id="name" name="name" defaultValue={editingClinic?.name ?? ""} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="address">住所</Label>
                <Input id="address" name="address" defaultValue={editingClinic?.address ?? ""} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">電話番号</Label>
                <Input id="phone" name="phone" defaultValue={editingClinic?.phone ?? ""} />
              </div>
            </div>
            <DialogFooter>
              <DialogClose asChild>
                <Button type="button" variant="outline">
                  キャンセル
                </Button>
              </DialogClose>
              <Button type="submit" disabled={isPending}>
                {isPending ? "保存中..." : "保存"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
