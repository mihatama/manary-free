"use client"

import type React from "react"

import { useState } from "react"
import { Plus, Edit, Trash2, Clock, Tag } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { createServiceType, updateServiceType, deleteServiceType } from "@/app/actions/schedule-actions"
import type { Database } from "@/lib/supabase/database.types"
import { useCSRF } from "@/hooks/use-csrf"

type ServiceType = Database["public"]["Tables"]["service_types"]["Row"]
type Clinic = Database["public"]["Tables"]["clinics"]["Row"]

interface ServiceTypeManagerProps {
  clinic: Clinic
  serviceTypes: ServiceType[]
  isLoading: boolean
  error: string | null
  onUpdate: () => void
  selectedServiceTypeId: number | null
  onSelectServiceType: (serviceType: ServiceType | null) => void
}

export function ServiceTypeManager({
  clinic,
  serviceTypes,
  isLoading,
  error,
  onUpdate,
  selectedServiceTypeId,
  onSelectServiceType,
}: ServiceTypeManagerProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingServiceType, setEditingServiceType] = useState<ServiceType | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  const { csrfToken, isLoading: isLoadingCSRF } = useCSRF()

  const resetForm = () => {
    setEditingServiceType(null)
    setFormError(null)
  }

  const handleOpenDialog = (serviceType?: ServiceType) => {
    setEditingServiceType(serviceType || null)
    setIsDialogOpen(true)
  }

  const handleCloseDialog = () => {
    setIsDialogOpen(false)
    resetForm()
  }

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!csrfToken) {
      setFormError("セキュリティトークンがありません。ページをリロードしてください。")
      return
    }

    setIsSubmitting(true)
    setFormError(null)

    const formData = new FormData(event.currentTarget)
    formData.append("csrf_token", csrfToken)
    formData.append("clinic_id", clinic.id.toString())
    if (editingServiceType) {
      formData.append("id", editingServiceType.id.toString())
    }

    try {
      const action = editingServiceType ? updateServiceType : createServiceType
      await action(formData)
      onUpdate() // Notify parent to refresh data
      handleCloseDialog()
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "保存中にエラーが発生しました。")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async (id: number) => {
    if (!window.confirm("この診療種別を削除しますか？関連する予約可能時間設定も全て削除されます。")) {
      return
    }
    if (!csrfToken) {
      alert("セキュリティトークンがありません。ページをリロードしてください。")
      return
    }

    const formData = new FormData()
    formData.append("id", id.toString())
    formData.append("csrf_token", csrfToken)

    try {
      await deleteServiceType(formData)
      onUpdate() // Notify parent to refresh data
    } catch (err) {
      alert(err instanceof Error ? err.message : "削除中にエラーが発生しました。")
    }
  }

  if (isLoading) {
    return <div className="text-sm text-gray-500">読み込み中...</div>
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">{clinic.name} の診療種別</h3>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button
              onClick={() => handleOpenDialog()}
              size="sm"
              className="bg-manary-pink hover:bg-[#f78989] text-foreground"
            >
              <Plus className="h-4 w-4 mr-1" />
              新規作成
            </Button>
          </DialogTrigger>
          <DialogContent>
            <form onSubmit={handleSubmit}>
              <DialogHeader>
                <DialogTitle>{editingServiceType ? "診療種別を編集" : "新しい診療種別"}</DialogTitle>
                <DialogDescription>診療種別の詳細情報を入力してください。</DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="name">名前</Label>
                  <Input
                    id="name"
                    name="name"
                    defaultValue={editingServiceType?.name}
                    placeholder="例: 初診相談"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">説明</Label>
                  <Textarea
                    id="description"
                    name="description"
                    defaultValue={editingServiceType?.description || ""}
                    placeholder="例: 初めての方向けの相談"
                    rows={3}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="duration">所要時間（分）</Label>
                    <Input
                      id="duration"
                      name="duration"
                      type="number"
                      min="5"
                      step="5"
                      defaultValue={editingServiceType?.duration || 60}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="interval_minutes">インターバル（分）</Label>
                    <Input
                      id="interval_minutes"
                      name="interval_minutes"
                      type="number"
                      min="0"
                      step="5"
                      defaultValue={editingServiceType?.interval_minutes || 0}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="price">価格（円）</Label>
                    <Input
                      id="price"
                      name="price"
                      type="number"
                      min="0"
                      defaultValue={editingServiceType?.price || 10000}
                      placeholder="例: 10000"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="color">表示色</Label>
                    <Input
                      id="color"
                      name="color"
                      type="color"
                      defaultValue={editingServiceType?.color || "#f8a0a0"}
                      className="w-full h-10 p-1"
                    />
                  </div>
                </div>
              </div>
              {formError && <p className="text-sm text-red-500">{formError}</p>}
              <DialogFooter>
                <Button type="button" variant="outline" onClick={handleCloseDialog}>
                  キャンセル
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmitting || isLoadingCSRF}
                  className="bg-manary-pink hover:bg-[#f78989] text-foreground"
                >
                  {isSubmitting ? "保存中..." : "保存"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {error && <div className="text-sm text-red-500">{error}</div>}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {serviceTypes.map((serviceType) => (
          <Card
            key={serviceType.id}
            className={`cursor-pointer transition-all ${
              selectedServiceTypeId === serviceType.id ? "ring-2 ring-manary-pink" : "hover:border-manary-pink"
            }`}
            onClick={() => onSelectServiceType(serviceType)}
          >
            <CardHeader className="pb-2">
              <div className="flex justify-between items-start">
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 rounded-full" style={{ backgroundColor: serviceType.color || "#ccc" }} />
                  <CardTitle className="text-base">{serviceType.name}</CardTitle>
                </div>
                <div className="flex space-x-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={(e) => {
                      e.stopPropagation()
                      handleOpenDialog(serviceType)
                    }}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-red-500"
                    onClick={(e) => {
                      e.stopPropagation()
                      handleDelete(serviceType.id)
                    }}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pb-2 min-h-[40px]">
              <CardDescription className="line-clamp-2">{serviceType.description || "説明なし"}</CardDescription>
            </CardContent>
            <CardFooter className="pt-2 flex justify-between items-center text-sm text-gray-600">
              <div className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                <span>
                  {serviceType.duration}分{" "}
                  {serviceType.interval_minutes > 0 ? `(+${serviceType.interval_minutes}分)` : ""}
                </span>
              </div>
              <div className="flex items-center gap-1">
                <Tag className="h-4 w-4" />
                <span className="font-semibold">{(serviceType.price ?? 0).toLocaleString()}円</span>
              </div>
            </CardFooter>
          </Card>
        ))}
      </div>

      {serviceTypes.length === 0 && !isLoading && (
        <div className="text-center py-8 border rounded-lg bg-gray-50">
          <p className="text-gray-500 mb-4">診療種別がまだ登録されていません</p>
          <Button onClick={() => handleOpenDialog()} className="bg-manary-pink hover:bg-[#f78989] text-foreground">
            <Plus className="h-4 w-4 mr-1" />
            診療種別を作成
          </Button>
        </div>
      )}
    </div>
  )
}
