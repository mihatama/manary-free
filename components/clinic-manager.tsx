"use client"

import { useState, useTransition } from "react"
import { Plus, Edit, Trash2, MoreHorizontal, MapPin, Phone } from "lucide-react"
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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { toast } from "sonner"
import { createClinic, updateClinic, deleteClinic } from "@/app/actions/clinic-actions"
import type { Database } from "@/lib/supabase/database.types"
import { useCSRF } from "@/hooks/use-csrf"
import { cn } from "@/lib/utils"

type Clinic = Database["public"]["Tables"]["clinics"]["Row"]

interface ClinicManagerProps {
  clinics: Clinic[]
  isLoading: boolean
  error: string | null
  onUpdate: () => void
  selectedClinicId: number | null
  onSelectClinic: (id: number | null) => void
}

export function ClinicManager({
  clinics,
  isLoading,
  error: initialError,
  onUpdate,
  selectedClinicId,
  onSelectClinic,
}: ClinicManagerProps) {
  const [isPending, startTransition] = useTransition()
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingClinic, setEditingClinic] = useState<Clinic | null>(null)
  const { csrfToken, error: csrfError } = useCSRF()

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
        onUpdate() // Notify parent to refresh data
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
        onUpdate() // Notify parent to refresh data
      } catch (error) {
        toast.error((error as Error).message)
      }
    })
  }

  if (isLoading) {
    return <div className="text-sm text-gray-500">助産院を読み込み中...</div>
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">助産院を選択・管理</h3>
        <Button onClick={() => handleOpenDialog(null)} size="sm" className="bg-manary-pink hover:bg-[#f78989]">
          <Plus className="h-4 w-4 mr-1" />
          新規作成
        </Button>
      </div>

      {(initialError || csrfError) && (
        <Alert variant="destructive" className="mb-4">
          <AlertDescription>{initialError || csrfError}</AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {clinics.map((clinic) => (
          <Card
            key={clinic.id}
            className={cn(
              "cursor-pointer transition-all hover:shadow-md",
              selectedClinicId === clinic.id && "ring-2 ring-manary-pink",
            )}
            onClick={() => onSelectClinic(clinic.id)}
          >
            <CardHeader className="pb-2">
              <div className="flex justify-between items-start">
                <CardTitle className="text-base">{clinic.name}</CardTitle>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="h-8 w-8 p-0 -mt-1 -mr-2">
                      <span className="sr-only">メニューを開く</span>
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem
                      onClick={(e) => {
                        e.stopPropagation()
                        handleOpenDialog(clinic)
                      }}
                    >
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
                            <AlertDialogCancel onClick={(e) => e.stopPropagation()}>キャンセル</AlertDialogCancel>
                            <AlertDialogAction type="submit" disabled={isPending} onClick={(e) => e.stopPropagation()}>
                              {isPending ? "削除中..." : "削除"}
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </form>
                      </AlertDialogContent>
                    </AlertDialog>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </CardHeader>
            <CardContent className="pb-4">
              {clinic.address && (
                <div className="flex items-center text-sm text-gray-500 mb-1">
                  <MapPin className="h-3.5 w-3.5 mr-1.5 flex-shrink-0" />
                  <span>{clinic.address}</span>
                </div>
              )}
              {clinic.phone && (
                <div className="flex items-center text-sm text-gray-500">
                  <Phone className="h-3.5 w-3.5 mr-1.5 flex-shrink-0" />
                  <span>{clinic.phone}</span>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {clinics.length === 0 && !isLoading && (
        <div className="text-center py-8 border rounded-lg bg-gray-50">
          <p className="text-gray-500 mb-4">助産院がまだ登録されていません</p>
          <Button onClick={() => handleOpenDialog(null)} className="bg-manary-pink hover:bg-[#f78989]">
            <Plus className="h-4 w-4 mr-1" />
            助産院を作成
          </Button>
        </div>
      )}

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
