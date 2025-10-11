'use client'

import { useMemo, useState } from "react"
import { Plus, Edit, Trash2, Clock, Tag } from "lucide-react"

import { saveServiceType, deleteServiceType } from "@/lib/storage/local-storage"
import type { Clinic, ServiceType } from "@/types/local-data"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface ServiceTypeManagerProps {
  clinic: Clinic
  serviceTypes: ServiceType[]
  selectedServiceTypeId: string | null
  onSelectServiceType: (serviceTypeId: string | null) => void
}

interface ServiceTypeFormValues {
  id?: string
  name: string
  description?: string
  durationMinutes: number
  intervalMinutes: number
  price: number
  color: string
}

const DEFAULT_COLOR = "#f8a0a0"

export function ServiceTypeManager({
  clinic,
  serviceTypes,
  selectedServiceTypeId,
  onSelectServiceType,
}: ServiceTypeManagerProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [formValues, setFormValues] = useState<ServiceTypeFormValues>({
    name: "",
    description: "",
    durationMinutes: 60,
    intervalMinutes: 0,
    price: 0,
    color: DEFAULT_COLOR,
  })
  const [error, setError] = useState<string | null>(null)

  const sortedServiceTypes = useMemo(
    () => [...serviceTypes].sort((a, b) => a.name.localeCompare(b.name)),
    [serviceTypes],
  )

  const handleOpenDialog = (serviceType?: ServiceType) => {
    if (serviceType) {
      setFormValues({
        id: serviceType.id,
        name: serviceType.name,
        description: serviceType.description,
        durationMinutes: serviceType.durationMinutes,
        intervalMinutes: serviceType.intervalMinutes,
        price: serviceType.price,
        color: serviceType.color,
      })
    } else {
      setFormValues({
        name: "",
        description: "",
        durationMinutes: 60,
        intervalMinutes: 0,
        price: 0,
        color: DEFAULT_COLOR,
      })
    }
    setError(null)
    setIsDialogOpen(true)
  }

  const handleCloseDialog = () => {
    setIsDialogOpen(false)
    setError(null)
  }

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const formData = new FormData(event.currentTarget)
    const name = (formData.get("name") as string)?.trim()

    if (!name) {
      setError("診療種別名を入力してください。")
      return
    }

    const durationMinutes = Number(formData.get("durationMinutes")) || 60
    const intervalMinutes = Number(formData.get("intervalMinutes")) || 0
    const price = Number(formData.get("price")) || 0

    try {
      const serviceType = saveServiceType({
        id: formValues.id,
        clinicId: clinic.id,
        name,
        description: (formData.get("description") as string)?.trim() || undefined,
        durationMinutes,
        intervalMinutes,
        price,
        color: (formData.get("color") as string) || DEFAULT_COLOR,
      })
      onSelectServiceType(serviceType.id)
      handleCloseDialog()
    } catch (err) {
      console.error(err)
      setError(err instanceof Error ? err.message : "診療種別を保存できませんでした。")
    }
  }

  const handleDelete = (serviceType: ServiceType) => {
    if (!confirm(`${serviceType.name} を削除しますか？関連するカレンダー情報も削除されます。`)) {
      return
    }
    deleteServiceType(serviceType.id)
    if (selectedServiceTypeId === serviceType.id) {
      onSelectServiceType(null)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium">{clinic.name} の診療種別</h3>
          <p className="text-sm text-gray-500">サービスを追加して、所要時間や料金を設定できます。</p>
        </div>
        <Button onClick={() => handleOpenDialog()} size="sm" className="bg-manary-pink hover:bg-[#f78989] text-foreground">
          <Plus className="h-4 w-4 mr-1" /> 新規作成
        </Button>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {sortedServiceTypes.map((serviceType) => (
          <Card
            key={serviceType.id}
            className={`cursor-pointer transition-all ${
              selectedServiceTypeId === serviceType.id ? "ring-2 ring-manary-pink" : "hover:border-manary-pink"
            }`}
            onClick={() => onSelectServiceType(serviceType.id)}
          >
            <CardHeader className="pb-2">
              <div className="flex justify-between items-start">
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 rounded-full" style={{ backgroundColor: serviceType.color || DEFAULT_COLOR }} />
                  <CardTitle className="text-base">{serviceType.name}</CardTitle>
                </div>
                <div className="flex space-x-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={(event) => {
                      event.stopPropagation()
                      handleOpenDialog(serviceType)
                    }}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-red-500"
                    onClick={(event) => {
                      event.stopPropagation()
                      handleDelete(serviceType)
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
                  {serviceType.durationMinutes}分 {serviceType.intervalMinutes > 0 ? `(+${serviceType.intervalMinutes}分)` : ""}
                </span>
              </div>
              <div className="flex items-center gap-1">
                <Tag className="h-4 w-4" />
                <span className="font-semibold">{serviceType.price.toLocaleString()}円</span>
              </div>
            </CardFooter>
          </Card>
        ))}
      </div>

      {sortedServiceTypes.length === 0 && (
        <div className="text-center py-8 border rounded-lg bg-gray-50">
          <p className="text-gray-500 mb-4">診療種別がまだ登録されていません</p>
          <Button onClick={() => handleOpenDialog()} className="bg-manary-pink hover:bg-[#f78989] text-foreground">
            <Plus className="h-4 w-4 mr-1" /> 診療種別を作成
          </Button>
        </div>
      )}

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <DialogHeader>
              <DialogTitle>{formValues.id ? "診療種別を編集" : "新しい診療種別"}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">名前</Label>
                <Input id="name" name="name" defaultValue={formValues.name} placeholder="例: 初診相談" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">説明</Label>
                <Textarea
                  id="description"
                  name="description"
                  defaultValue={formValues.description || ""}
                  placeholder="例: 初めての方向けの相談"
                  rows={3}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="durationMinutes">所要時間（分）</Label>
                  <Input
                    id="durationMinutes"
                    name="durationMinutes"
                    type="number"
                    min="5"
                    step="5"
                    defaultValue={formValues.durationMinutes}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="intervalMinutes">インターバル（分）</Label>
                  <Input
                    id="intervalMinutes"
                    name="intervalMinutes"
                    type="number"
                    min="0"
                    step="5"
                    defaultValue={formValues.intervalMinutes}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="price">価格（円）</Label>
                  <Input id="price" name="price" type="number" min="0" defaultValue={formValues.price} placeholder="例: 10000" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="color">表示色</Label>
                  <Input id="color" name="color" type="color" defaultValue={formValues.color || DEFAULT_COLOR} className="w-full h-10 p-1" />
                </div>
              </div>
            </div>
            {error && <p className="text-sm text-red-500">{error}</p>}
            <DialogFooter>
              <Button type="button" variant="outline" onClick={handleCloseDialog}>
                キャンセル
              </Button>
              <Button type="submit" className="bg-manary-pink hover:bg-[#f78989] text-foreground">
                保存
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
