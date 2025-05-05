"use client"

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
  DialogTrigger,
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
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import {
  getServiceTypes,
  createServiceType,
  updateServiceType,
  deleteServiceType,
} from "@/app/actions/schedule-actions"
import type { Database } from "@/lib/supabase/database.types"

type ServiceType = Database["public"]["Tables"]["service_types"]["Row"]

interface ServiceTypeManagerProps {
  clinicId: number
  onSelectServiceType: (serviceType: ServiceType) => void
  selectedServiceTypeId: number | null
}

export function ServiceTypeManager({ clinicId, onSelectServiceType, selectedServiceTypeId }: ServiceTypeManagerProps) {
  const [serviceTypes, setServiceTypes] = useState<ServiceType[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingServiceType, setEditingServiceType] = useState<ServiceType | null>(null)

  // フォーム状態
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [duration, setDuration] = useState("60")
  const [color, setColor] = useState("#f8a0a0")

  useEffect(() => {
    if (!clinicId) return

    async function loadServiceTypes() {
      try {
        setIsLoading(true)
        const data = await getServiceTypes(clinicId)
        setServiceTypes(data)

        // 初期選択
        if (data.length > 0 && !selectedServiceTypeId) {
          onSelectServiceType(data[0])
        }
      } catch (err) {
        setError("診療種別の読み込みに失敗しました")
        console.error(err)
      } finally {
        setIsLoading(false)
      }
    }

    loadServiceTypes()
  }, [clinicId, selectedServiceTypeId, onSelectServiceType])

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
    try {
      if (editingServiceType) {
        // 更新
        const updated = await updateServiceType(editingServiceType.id, {
          name,
          description,
          duration: Number.parseInt(duration),
          color,
        })
        setServiceTypes(serviceTypes.map((st) => (st.id === updated.id ? updated : st)))
      } else {
        // 新規作成
        const created = await createServiceType({
          clinic_id: clinicId,
          name,
          description,
          duration: Number.parseInt(duration),
          color,
        })
        setServiceTypes([...serviceTypes, created])
      }
      handleCloseDialog()
    } catch (err) {
      console.error(err)
      setError("診療種別の保存に失敗しました")
    }
  }

  const handleDelete = async (id: number) => {
    try {
      await deleteServiceType(id)
      setServiceTypes(serviceTypes.filter((st) => st.id !== id))

      // 選択中の診療種別が削除された場合、別の診療種別を選択
      if (selectedServiceTypeId === id && serviceTypes.length > 1) {
        const newSelected = serviceTypes.find((st) => st.id !== id)
        if (newSelected) {
          onSelectServiceType(newSelected)
        }
      }
    } catch (err) {
      console.error(err)
      setError("診療種別の削除に失敗しました")
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
            <Button onClick={() => handleOpenDialog()} size="sm" className="bg-manary-pink hover:bg-[#f78989]">
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
              <Button onClick={handleSubmit} className="bg-manary-pink hover:bg-[#f78989]">
                保存
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
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-red-500"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>診療種別を削除</AlertDialogTitle>
                        <AlertDialogDescription>
                          「{serviceType.name}」を削除してもよろしいですか？この操作は元に戻せません。
                          関連する予約可能時間設定もすべて削除されます。
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>キャンセル</AlertDialogCancel>
                        <AlertDialogAction
                          className="bg-red-500 hover:bg-red-600"
                          onClick={() => handleDelete(serviceType.id)}
                        >
                          削除
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
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
          <Button onClick={() => handleOpenDialog()} className="bg-manary-pink hover:bg-[#f78989]">
            <Plus className="h-4 w-4 mr-1" />
            診療種別を作成
          </Button>
        </div>
      )}
    </div>
  )
}
