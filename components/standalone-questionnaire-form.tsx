"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { CSRFForm } from "@/components/csrf-form"
import { submitAndLinkQuestionnaire } from "@/app/actions/questionnaire-actions"
import type { Database } from "@/lib/supabase/database.types"

type AppointmentWithRelations = Database["public"]["Tables"]["appointments"]["Row"] & {
  clinics: Database["public"]["Tables"]["clinics"]["Row"] | null
  service_types: Database["public"]["Tables"]["service_types"]["Row"] | null
}

interface StandaloneQuestionnaireFormProps {
  appointment: AppointmentWithRelations
}

export function StandaloneQuestionnaireForm({ appointment }: StandaloneQuestionnaireFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  // フォームの初期値を設定
  const [lastName, firstName] = appointment.patient_name.split(/ |　/) // 半角・全角スペースで分割
  const initialData = {
    motherLastName: lastName || "",
    motherFirstName: firstName || "",
    email: appointment.patient_email || "",
    notes: appointment.notes || "",
  }

  // 受診場所の初期値を設定
  const clinicName = appointment.clinics?.name
  const initialLocation = {
    isNishinomiya: clinicName === "西宮",
    isTakarazuka: clinicName === "宝塚",
    isNihonbashi: clinicName === "日本橋",
    isAichi: clinicName === "愛知",
    isVisit: clinicName === "訪問",
  }

  const handleSubmit = async (formData: FormData) => {
    setIsSubmitting(true)
    setError(null)

    formData.append("appointment_id", String(appointment.id))
    formData.append("appointment_token", appointment.token)
    formData.append("phone_number", appointment.patient_phone)

    try {
      const result = await submitAndLinkQuestionnaire(formData)

      if (!result.success) {
        throw new Error(result.error || "問診票の送信に失敗しました")
      }

      // 成功ページにリダイレクト
      router.push(`/reservation/questionnaire/success`)
    } catch (err) {
      setError(err instanceof Error ? err.message : "問診票の送信中にエラーが発生しました")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <CSRFForm action={handleSubmit} className="space-y-8">
        {/* 受診場所 */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-[#f8a0a0]">
            受診場所 <span className="text-red-500">*</span>
          </h2>
          <div className="flex flex-wrap gap-4">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="locationNishinomiya"
                name="locationNishinomiya"
                defaultChecked={initialLocation.isNishinomiya}
              />
              <Label htmlFor="locationNishinomiya">西宮</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="locationTakarazuka"
                name="locationTakarazuka"
                defaultChecked={initialLocation.isTakarazuka}
              />
              <Label htmlFor="locationTakarazuka">宝塚</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="locationNihonbashi"
                name="locationNihonbashi"
                defaultChecked={initialLocation.isNihonbashi}
              />
              <Label htmlFor="locationNihonbashi">日本橋</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox id="locationAichi" name="locationAichi" defaultChecked={initialLocation.isAichi} />
              <Label htmlFor="locationAichi">愛知</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox id="locationVisit" name="locationVisit" defaultChecked={initialLocation.isVisit} />
              <Label htmlFor="locationVisit">訪問</Label>
            </div>
          </div>
        </div>

        {/* ママ情報 */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-[#f8a0a0]">ママ情報</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="motherLastName">
                姓（漢字） <span className="text-red-500">*</span>
              </Label>
              <Input
                id="motherLastName"
                name="motherLastName"
                required
                placeholder="山田"
                defaultValue={initialData.motherLastName}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="motherFirstName">
                名（漢字） <span className="text-red-500">*</span>
              </Label>
              <Input
                id="motherFirstName"
                name="motherFirstName"
                required
                placeholder="花子"
                defaultValue={initialData.motherFirstName}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="motherLastNameKana">
                ふりがな（姓） <span className="text-red-500">*</span>
              </Label>
              <Input id="motherLastNameKana" name="motherLastNameKana" required placeholder="やまだ" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="motherFirstNameKana">
                ふりがな（名） <span className="text-red-500">*</span>
              </Label>
              <Input id="motherFirstNameKana" name="motherFirstNameKana" required placeholder="はなこ" />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="motherBirthYear">
                生年（西暦） <span className="text-red-500">*</span>
              </Label>
              <Input id="motherBirthYear" name="motherBirthYear" type="number" required placeholder="1990" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="motherBirthMonth">
                月 <span className="text-red-500">*</span>
              </Label>
              <Input
                id="motherBirthMonth"
                name="motherBirthMonth"
                type="number"
                min="1"
                max="12"
                required
                placeholder="1"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="motherBirthDay">
                日 <span className="text-red-500">*</span>
              </Label>
              <Input
                id="motherBirthDay"
                name="motherBirthDay"
                type="number"
                min="1"
                max="31"
                required
                placeholder="1"
              />
            </div>
          </div>
        </div>

        {/* お子様情報 */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-[#f8a0a0]">お子様情報</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="childLastName">
                姓（漢字） <span className="text-red-500">*</span>
              </Label>
              <Input id="childLastName" name="childLastName" required placeholder="山田" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="childFirstName">
                名（漢字） <span className="text-red-500">*</span>
              </Label>
              <Input id="childFirstName" name="childFirstName" required placeholder="太郎" />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="childLastNameKana">
                ふりがな（姓） <span className="text-red-500">*</span>
              </Label>
              <Input id="childLastNameKana" name="childLastNameKana" required placeholder="やまだ" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="childFirstNameKana">
                ふりがな（名） <span className="text-red-500">*</span>
              </Label>
              <Input id="childFirstNameKana" name="childFirstNameKana" required placeholder="たろう" />
            </div>
          </div>

          <div className="grid grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label htmlFor="childBirthYear">
                生年（西暦） <span className="text-red-500">*</span>
              </Label>
              <Input id="childBirthYear" name="childBirthYear" type="number" required placeholder="2023" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="childBirthMonth">
                月 <span className="text-red-500">*</span>
              </Label>
              <Input
                id="childBirthMonth"
                name="childBirthMonth"
                type="number"
                min="1"
                max="12"
                required
                placeholder="1"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="childBirthDay">
                日 <span className="text-red-500">*</span>
              </Label>
              <Input id="childBirthDay" name="childBirthDay" type="number" min="1" max="31" required placeholder="1" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="childNumber">
                第（）子 <span className="text-red-500">*</span>
              </Label>
              <Input id="childNumber" name="childNumber" type="number" min="1" required placeholder="1" />
            </div>
          </div>

          <div className="space-y-2">
            <Label>
              お子様の性別 <span className="text-red-500">*</span>
            </Label>
            <RadioGroup name="childGender" className="flex space-x-4" defaultValue="男児">
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="男児" id="male" />
                <Label htmlFor="male">男児</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="女児" id="female" />
                <Label htmlFor="female">女児</Label>
              </div>
            </RadioGroup>
          </div>
        </div>

        {/* お仕事について */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-[#f8a0a0]">お仕事について</h2>

          <div className="space-y-2">
            <Label htmlFor="occupation">どのようなお仕事をしていますか？</Label>
            <Textarea id="occupation" name="occupation" placeholder="例：事務職、看護師、主婦など" />
          </div>

          <div className="flex flex-wrap gap-4">
            <div className="flex items-center space-x-2">
              <Checkbox id="isOnMaternityLeave" name="isOnMaternityLeave" />
              <Label htmlFor="isOnMaternityLeave">産休育休を休んでいる</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox id="hasResigned" name="hasResigned" />
              <Label htmlFor="hasResigned">退職した</Label>
            </div>
          </div>
        </div>

        {/* 連絡先情報 */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-[#f8a0a0]">連絡先情報</h2>

          <div className="space-y-2">
            <Label htmlFor="email">
              メールアドレス <span className="text-red-500">*</span>
            </Label>
            <Input
              id="email"
              name="email"
              type="email"
              required
              placeholder="example@email.com"
              defaultValue={initialData.email}
            />
          </div>
        </div>

        {/* 備考 */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-[#f8a0a0]">備考</h2>

          <div className="space-y-2">
            <Label htmlFor="notes">予約に関する特別な要望や質問があればご記入ください</Label>
            <Textarea
              id="notes"
              name="notes"
              placeholder="例：授乳室の利用希望、アレルギーがあるなど"
              defaultValue={initialData.notes}
            />
          </div>
        </div>

        {error && <div className="p-3 bg-red-100 text-red-700 rounded-md">{error}</div>}

        <Button type="submit" disabled={isSubmitting} className="w-full bg-[#f8a0a0] hover:bg-[#f78b8b]">
          {isSubmitting ? "送信中..." : "問診票を送信する"}
        </Button>
      </CSRFForm>
    </div>
  )
}
