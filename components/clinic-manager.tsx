"use client"

import { useState, useTransition } from "react"
import { Plus, Edit, MapPin, Phone, AlertCircle } from "lucide-react"
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
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { toast } from "sonner"
import { createClinic, updateClinic } from "@/app/actions/clinic-actions"
import type { Database } from "@/lib/supabase/database.types"
import { useCSRF } from "@/hooks/use-csrf"
import { cn } from "@/lib/utils"

type Clinic = Database["public"]["Tables"]["clinics"]["Row"]

// --- プラン設定 ---
// プランに応じて設定する助産院の最大数 (例: 1 or 3)
// この変数を変更することで、表示・編集可能な助産院の枠の数を制御します。
const MAX_CLINICS = 3
// --- /プラン設定 ---

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

  if (isLoading) {
    return <div className="text-sm text-gray-500">助産院を読み込み中...</div>
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">助産院を選択・管理</h3>
      </div>

      {(initialError || csrfError) && (
        <Alert variant="destructive" className="mb-4">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{initialError || csrfError}</AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: MAX_CLINICS }).map((_, index) => {
          const clinic = clinics[index]

          if (clinic) {
            return (
              <Card
                key={clinic.id}
                className={cn(
                  "cursor-pointer transition-all hover:shadow-md flex flex-col",
                  selectedClinicId === clinic.id && "ring-2 ring-manary-pink",
                )}
                onClick={() => onSelectClinic(clinic.id)}
              >
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">{clinic.name}</CardTitle>
                </CardHeader>
                <CardContent className="flex-grow pb-4">
                  {clinic.address && (
                    <div className="flex items-center text-sm text-gray-500 mb-1">
                      <MapPin className="h-3.5 w-3.5 mr-1.5 flex-shrink-0" />
                      <span>{clinic.address}</span>
                    </div>
                  )}
                  {clinic.phone_number && (
                    <div className="flex items-center text-sm text-gray-500">
                      <Phone className="h-3.5 w-3.5 mr-1.5 flex-shrink-0" />
                      <span>{clinic.phone_number}</span>
                    </div>
                  )}
                </CardContent>
                <CardFooter>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full bg-transparent"
                    onClick={(e) => {
                      e.stopPropagation()
                      handleOpenDialog(clinic)
                    }}
                  >
                    <Edit className="mr-2 h-4 w-4" />
                    編集
                  </Button>
                </CardFooter>
              </Card>
            )
          } else {
            return (
              <Card
                key={`slot-${index}`}
                className="flex items-center justify-center p-4 border-2 border-dashed bg-gray-50 hover:bg-gray-100 cursor-pointer transition-colors min-h-[180px]"
                onClick={() => handleOpenDialog(null)}
              >
                <div className="text-center text-gray-500">
                  <Plus className="mx-auto h-8 w-8 mb-2" />
                  <p>助産院を追加</p>
                </div>
              </Card>
            )
          }
        })}
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
                <Label htmlFor="phone_number">電話番号</Label>
                <Input id="phone_number" name="phone_number" defaultValue={editingClinic?.phone_number ?? ""} />
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
