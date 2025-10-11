'use client'

import { useMemo, useState } from "react"
import { Plus, Edit, MapPin, Phone, Trash2 } from "lucide-react"

import { saveClinic, deleteClinic } from "@/lib/storage/local-storage"
import type { Clinic } from "@/types/local-data"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface ClinicFormValues {
  id?: string
  name: string
  address?: string
  phoneNumber?: string
}

interface ClinicManagerProps {
  clinics: Clinic[]
  selectedClinicId: string | null
  onSelectClinic: (id: string | null) => void
}

const MAX_CLINICS = 3

export function ClinicManager({ clinics, selectedClinicId, onSelectClinic }: ClinicManagerProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [formValues, setFormValues] = useState<ClinicFormValues>({ name: '' })
  const [error, setError] = useState<string | null>(null)

  const clinicSlots = useMemo(() => {
    const padded = [...clinics]
    while (padded.length < MAX_CLINICS) {
      padded.push(null as unknown as Clinic)
    }
    return padded.slice(0, MAX_CLINICS)
  }, [clinics])

  const handleOpenDialog = (clinic?: Clinic) => {
    if (clinic) {
      setFormValues({ id: clinic.id, name: clinic.name, address: clinic.address, phoneNumber: clinic.phoneNumber })
    } else {
      setFormValues({ name: '', address: '', phoneNumber: '' })
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
    const name = (formData.get('name') as string)?.trim()

    if (!name) {
      setError('助産院名を入力してください。')
      return
    }

    try {
      const clinic = saveClinic({
        id: formValues.id,
        name,
        address: (formData.get('address') as string)?.trim() || undefined,
        phoneNumber: (formData.get('phoneNumber') as string)?.trim() || undefined,
      })
      onSelectClinic(clinic.id)
      handleCloseDialog()
    } catch (err) {
      console.error(err)
      setError(err instanceof Error ? err.message : '助産院を保存できませんでした。')
    }
  }

  const handleDelete = (clinic: Clinic) => {
    if (!confirm(`${clinic.name} を削除しますか？関連する診療種別も削除されます。`)) {
      return
    }
    deleteClinic(clinic.id)
    if (selectedClinicId === clinic.id) {
      onSelectClinic(null)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">助産院を選択・管理</h3>
        <Button onClick={() => handleOpenDialog()} variant="outline" size="sm">
          <Plus className="h-4 w-4 mr-2" />
          新規追加
        </Button>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {clinicSlots.map((clinic, index) => {
          if (!clinic) {
            return (
              <Card
                key={`empty-${index}`}
                className="flex items-center justify-center p-4 border-2 border-dashed bg-gray-50 hover:bg-gray-100 cursor-pointer transition-colors min-h-[180px]"
                onClick={() => handleOpenDialog()}
              >
                <div className="text-center text-gray-500">
                  <Plus className="mx-auto h-8 w-8 mb-2" />
                  <p>助産院を追加</p>
                </div>
              </Card>
            )
          }

          return (
            <Card
              key={clinic.id}
              className={`cursor-pointer transition-all flex flex-col ${selectedClinicId === clinic.id ? 'ring-2 ring-manary-pink' : 'hover:shadow-md'}`}
              onClick={() => onSelectClinic(clinic.id)}
            >
              <CardHeader className="pb-2">
                <CardTitle className="text-base">{clinic.name}</CardTitle>
              </CardHeader>
              <CardContent className="flex-grow pb-4 space-y-2 text-sm text-gray-600">
                {clinic.address && (
                  <div className="flex items-center">
                    <MapPin className="h-4 w-4 mr-2" />
                    <span>{clinic.address}</span>
                  </div>
                )}
                {clinic.phoneNumber && (
                  <div className="flex items-center">
                    <Phone className="h-4 w-4 mr-2" />
                    <span>{clinic.phoneNumber}</span>
                  </div>
                )}
              </CardContent>
              <CardFooter className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1"
                  onClick={(event) => {
                    event.stopPropagation()
                    handleOpenDialog(clinic)
                  }}
                >
                  <Edit className="h-4 w-4 mr-1" /> 編集
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-red-500"
                  onClick={(event) => {
                    event.stopPropagation()
                    handleDelete(clinic)
                  }}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </CardFooter>
            </Card>
          )
        })}
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <DialogHeader>
              <DialogTitle>{formValues.id ? '助産院を編集' : '新しい助産院'}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">助産院名</Label>
                <Input id="name" name="name" defaultValue={formValues.name} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="address">住所</Label>
                <Input id="address" name="address" defaultValue={formValues.address ?? ''} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phoneNumber">電話番号</Label>
                <Input id="phoneNumber" name="phoneNumber" defaultValue={formValues.phoneNumber ?? ''} />
              </div>
            </div>
            {error && <p className="text-sm text-red-500">{error}</p>}
            <DialogFooter>
              <Button type="button" variant="outline" onClick={handleCloseDialog}>
                キャンセル
              </Button>
              <Button type="submit">保存</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
