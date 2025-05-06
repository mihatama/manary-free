"use client"

import { useState, useEffect } from "react"
import { Plus, Edit, Trash2, MapPin, Phone } from "lucide-react"
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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { createClinic, updateClinic, deleteClinic } from "@/app/actions/clinic-actions"
import { getClinics } from "@/app/actions/schedule-actions"
import type { Database } from "@/lib/supabase/database.types"
import { useCSRF } from "@/hooks/use-csrf"

type Clinic = Database["public"]["Tables"]["clinics"]["Row"]

export function ClinicManager() {
  const [clinics, setClinics] = useState<Clinic[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingClinic, setEditingClinic] = useState<Clinic | null>(null)

  // フォーム状態
  const [name, setName] = useState("")
  const [address, setAddress] = useState("")
  const [phone, setPhone] = useState("")

  const { csrfToken, isLoading: isLoadingCSRF, error: csrfError } = useCSRF()

  useEffect(() => {
    async function loadClinics() {
      try {
        setIsLoading(true)
        const data = await getClinics()
        setClinics(data)
      } catch (err) {
        setError("助産院の読み込みに失敗しました")
        console.error(err)
      } finally {
        setIsLoading(false)
      }
    }

    loadClinics()
  }, [])

  const resetForm = () => {
    setName("")
    setAddress("")
    setPhone("")
    setEditingClinic(null)
  }

  const handleOpenDialog = (clinic?: Clinic) => {
    if (clinic) {
      setEditingClinic(clinic)
      setName(clinic.name)
      setAddress(clinic.address || "")
      setPhone(clinic.phone || "")
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
      if (!csrfToken) {
        setError("セキュリティトークンが利用できません。ページを再読み込みしてください。")
        return
      }

      const formData = new FormData()
      formData.append("csrf_token", csrfToken)

      if (editingClinic) {
        // 更新
        formData.append("id", editingClinic.id.toString())
        formData.append("name", name)
        formData.append("address", address)
        formData.append("phone", phone)

        const updated = await updateClinic(formData)
        setClinics(clinics.map((c) => (c.id === updated.id ? updated : c)))
      } else {
        // 新規作成
        formData.append("name", name)
        formData.append("address", address)
        formData.append("phone", phone)

        const created = await createClinic(formData)
        setClinics([...clinics, created])
      }
      handleCloseDialog()
    } catch (err: any) {
      console.error("Clinic operation error:", err)
      setError(err.message || "データの保存に失敗しました。もう一度お試しください。")
    }
  }

  const handleDelete = async (id: number) => {
    try {
      if (!csrfToken) {
        setError("セキュリティトークンが利用できません。ページを再読み込みしてください。")
        return
      }

      const formData = new FormData()
      formData.append("csrf_token", csrfToken)
      formData.append("id", id.toString())

      await deleteClinic(formData)
      setClinics(clinics.filter((c) => c.id !== id))
    } catch (err: any) {
      console.error("Clinic deletion error:", err)
      setError(err.message || "データの削除に失敗しました。もう一度お試しください。")
    }
  }

  if (isLoading) {
    return <div className="text-sm text-gray-500">読み込み中...</div>
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">助産院管理</h3>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => handleOpenDialog()} size="sm" className="bg-manary-pink hover:bg-[#f78989]">
              <Plus className="h-4 w-4 mr-1" />
              新規作成
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingClinic ? "助産院を編集" : "新しい助産院"}</DialogTitle>
              <DialogDescription>助産院の詳細情報を入力してください。</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">助産院名</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="例: マナリー助産院"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="address">住所</Label>
                <Input
                  id="address"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="例: 東京都渋谷区〇〇1-2-3"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">電話番号</Label>
                <Input
                  id="phone"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="例: 03-1234-5678"
                />
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

      {error && (
        <Alert variant="destructive" className="mb-4">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {clinics.map((clinic) => (
          <Card key={clinic.id} className="cursor-pointer transition-all hover:shadow-md">
            <CardHeader className="pb-2">
              <div className="flex justify-between items-start">
                <CardTitle className="text-base">{clinic.name}</CardTitle>
                <div className="flex space-x-1">
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleOpenDialog(clinic)}>
                    <Edit className="h-4 w-4" />
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>助産院を削除</AlertDialogTitle>
                        <AlertDialogDescription>
                          「{clinic.name}」を削除してもよろしいですか？この操作は元に戻せません。
                          関連する診療種別や予約可能時間設定もすべて削除されます。
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>キャンセル</AlertDialogCancel>
                        <AlertDialogAction
                          className="bg-red-500 hover:bg-red-600"
                          onClick={() => handleDelete(clinic.id)}
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
              {clinic.address && (
                <div className="flex items-center text-sm text-gray-500 mb-1">
                  <MapPin className="h-3.5 w-3.5 mr-1 flex-shrink-0" />
                  <span>{clinic.address}</span>
                </div>
              )}
              {clinic.phone && (
                <div className="flex items-center text-sm text-gray-500">
                  <Phone className="h-3.5 w-3.5 mr-1 flex-shrink-0" />
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
          <Button onClick={() => handleOpenDialog()} className="bg-manary-pink hover:bg-[#f78989]">
            <Plus className="h-4 w-4 mr-1" />
            助産院を作成
          </Button>
        </div>
      )}
    </div>
  )
}
