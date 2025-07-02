"use client"

import { DialogTrigger } from "@/components/ui/dialog"

import { useState, useEffect } from "react"
import { Plus, Edit, Trash2 } from "lucide-react"
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
} from "@/components/ui/dialog"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import {
  getServiceTypes,
  createServiceType,
  updateServiceType,
  deleteServiceType,
} from "@/app/actions/schedule-actions"
import type { Database } from "@/lib/supabase/database.types"
import { useCSRF } from "@/hooks/use-csrf"

type ServiceType = Database["public"]["Tables"]["service_types"]["Row"]

interface ServiceTypeManagerProps {
  clinicId: number
  onSelectServiceType: (serviceType: ServiceType | null) => void
  selectedServiceTypeId: number | null
}

export function ServiceTypeManager({ clinicId, onSelectServiceType, selectedServiceTypeId }: ServiceTypeManagerProps) {
  const [serviceTypes, setServiceTypes] = useState<ServiceType[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingServiceType, setEditingServiceType] = useState<ServiceType | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // フォーム状態
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [duration, setDuration] = useState("60")
  const [color, setColor] = useState("#f8a0a0")

  const { csrfToken, isLoading: isLoadingCSRF, error: csrfError } = useCSRF()

  // 診療所IDが変更されたときに診療種別を読み込む
  useEffect(() => {
    if (!clinicId) {
      setServiceTypes([])
      setIsLoading(false)
      return
    }

    let isMounted = true
    async function loadServiceTypes() {
      setIsLoading(true)
      setError(null)
      try {
        const data = await getServiceTypes(clinicId)
        if (isMounted) {
          setServiceTypes(data)
        }
      } catch (err) {
        if (isMounted) {
          setError("診療種別の読み込みに失敗しました")
          console.error(err)
        }
      } finally {
        if (isMounted) {
          setIsLoading(false)
        }
      }
    }

    loadServiceTypes()

    return () => {
      isMounted = false
    }
  }, [clinicId])

  // 読み込み完了後、またはリストが変更された後に選択状態を管理する
  useEffect(() => {
    if (isLoading) return

    if (serviceTypes.length > 0) {
      const selectionExists = serviceTypes.some((st) => st.id === selectedServiceTypeId)
      if (!selectionExists) {
        onSelectServiceType(serviceTypes[0])
      }
    } else {
      onSelectServiceType(null)
    }
  }, [serviceTypes, isLoading, onSelectServiceType, selectedServiceTypeId])

  const resetForm = () => {
    setName("")
    setDescription("")
    setDuration("60")
    setColor("#f8a0a0")
    setEditingServiceType(null)
  }

  const handleOpenDialog = (serviceType?: ServiceType) => {
    if (serviceType) {
      setEditingServiceType(serviceType)
      setName(serviceType.name)
      setDescription(serviceType.description || "")
      setDuration(serviceType.duration.toString())
      setColor(serviceType.color)
    } else {
      resetForm()
    }
    setIsDialogOpen(true)
  }

  const handleCloseDialog = () => {
    setIsDialogOpen(false)
    resetForm()
  }

  const handleSubmit = async () => {
    if (!name.trim()) {
      // Prevent submission if name is empty
      return
    }

    setIsSubmitting(true)
    setError(null)
    try {
      if (!csrfToken) {
        setError("セキュリティトークンが利用できません。ページを再読み込みしてください。")
        return
      }

      const formData = new FormData()
      formData.append("csrf_token", csrfToken)

      if (editingServiceType) {
        // 更新
        formData.append("id", editingServiceType.id.toString())
        formData.append("name", name)
        formData.append("description", description)
        formData.append("duration", duration)
        formData.append("color", color)

        const updated = await updateServiceType(formData)
        setServiceTypes((prev) => prev.map((st) => (st.id === updated.id ? updated : st)))

        if (selectedServiceTypeId === updated.id) {
          onSelectServiceType(updated)
        }
      } else {
        // 新規作成
        formData.append("clinic_id", clinicId.toString())
        formData.append("name", name)
        formData.append("description", description)
        formData.append("duration", duration)
        formData.append("color", color)

        const created = await createServiceType(formData)
        setServiceTypes((prev) => [...prev, created])
      }
      handleCloseDialog()
    } catch (err) {
      console.error("Service type operation error", err)
      setError("データの保存に失敗しました。もう一度お試しください。")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async (id: number) => {
    // Store original state for potential rollback
    const originalServiceTypes = [...serviceTypes]

    // Optimistically update the UI
    setServiceTypes((prev) => prev.filter((st) => st.id !== id))

    try {
      if (!csrfToken) {
        setError("セキュリティトークンが利用できません。ページを再読み込みしてください。")
        setServiceTypes(originalServiceTypes) // Rollback
        return
      }

      const formData = new FormData()
      formData.append("csrf_token", csrfToken)
      formData.append("id", id.toString())

      await deleteServiceType(formData)
      // On success, the optimistic update is now confirmed.
    } catch (err) {
      console.error("Service type deletion error:", err)
      setError("データの削除に失敗しました。もう一度お試しください。")
      // Rollback on error
      setServiceTypes(originalServiceTypes)
    }
  }

  if (isLoading && !serviceTypes.length) {
    return <div className="text-sm text-gray-500">読み込み中...</div>
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">診療種別</h3>
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
            <DialogHeader>
              <DialogTitle>{editingServiceType ? "診療種別を編集" : "新しい診療種別"}</DialogTitle>
              <DialogDescription>診療種別の詳細情報を入力してください。</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">名前</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="例: 初診相談"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">説明</Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="例: 初めての方向けの相談"
                  rows={3}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="duration">所要時間（分）</Label>
                  <Input
                    id="duration"
                    type="number"
                    min="5"
                    step="5"
                    value={duration}
                    onChange={(e) => setDuration(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="color">表示色</Label>
                  <div className="flex items-center space-x-2">
                    <Input
                      id="color"
                      type="color"
                      value={color}
                      onChange={(e) => setColor(e.target.value)}
                      className="w-12 h-10 p-1"
                    />
                    <Input type="text" value={color} onChange={(e) => setColor(e.target.value)} className="flex-1" />
                  </div>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={handleCloseDialog}>
                キャンセル
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={isSubmitting || isLoadingCSRF || !name.trim()}
                className="bg-manary-pink hover:bg-[#f78989] text-foreground"
              >
                {isSubmitting ? "保存中..." : "保存"}
              </Button>
            </DialogFooter>
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
                  <div className="w-4 h-4 rounded-full" style={{ backgroundColor: serviceType.color }} />
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
            <CardContent className="pb-2">
              <CardDescription className="line-clamp-2">{serviceType.description || "説明なし"}</CardDescription>
            </CardContent>
            <CardFooter className="pt-0">
              <p className="text-sm text-gray-500">所要時間: {serviceType.duration}分</p>
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
