"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Checkbox } from "@/components/ui/checkbox"
import { useRouter } from "next/navigation"
import { submitQuestionnaire } from "@/app/actions/questionnaire-actions"
import { useCSRF } from "@/hooks/use-csrf"

interface MedicalQuestionnaireFormProps {
  patientId?: string
  phoneNumber: string
  onComplete?: () => void
  reservationData?: {
    clinicId: number
    serviceTypeId: number
    date: string
    startTime: string
    endTime: string
    patientName: string
    patientEmail?: string
  }
}

export function MedicalQuestionnaireForm({
  patientId,
  phoneNumber,
  onComplete,
  reservationData,
}: MedicalQuestionnaireFormProps) {
  const [formData, setFormData] = useState({
    birthdate: "",
    height: "",
    weight: "",
    bloodType: "",
    allergies: "",
    medications: "",
    medicalHistory: "",
    pregnancyHistory: "",
    lastMenstruation: "",
    smokingStatus: "never",
    alcoholConsumption: "none",
    exerciseFrequency: "rarely",
    dietaryRestrictions: [] as string[],
    concerns: "",
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  const router = useRouter()
  const { csrfToken, isLoading: isLoadingCSRF } = useCSRF()

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleRadioChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleCheckboxChange = (value: string, checked: boolean) => {
    setFormData((prev) => {
      const currentRestrictions = [...prev.dietaryRestrictions]

      if (checked) {
        return { ...prev, dietaryRestrictions: [...currentRestrictions, value] }
      } else {
        return { ...prev, dietaryRestrictions: currentRestrictions.filter((item) => item !== value) }
      }
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccessMessage(null)

    if (!csrfToken) {
      setError("セキュリティトークンが利用できません。ページを再読み込みしてください。")
      return
    }

    setIsSubmitting(true)

    try {
      const formDataToSubmit = new FormData()
      formDataToSubmit.append("csrf_token", csrfToken)
      formDataToSubmit.append("phone_number", phoneNumber)

      if (patientId) {
        formDataToSubmit.append("patient_id", patientId)
      }

      // フォームデータを追加
      Object.entries(formData).forEach(([key, value]) => {
        if (Array.isArray(value)) {
          formDataToSubmit.append(key, JSON.stringify(value))
        } else {
          formDataToSubmit.append(key, value)
        }
      })

      // 予約データがある場合は追加
      if (reservationData) {
        Object.entries(reservationData).forEach(([key, value]) => {
          formDataToSubmit.append(key, value.toString())
        })
      }

      const result = await submitQuestionnaire(formDataToSubmit)

      if (result.success) {
        setSuccessMessage("問診票が送信されました")

        // 予約データがある場合は予約確認ページに遷移
        if (reservationData) {
          setTimeout(() => {
            router.push(`/reservation/confirmation?token=${result.token}`)
          }, 1500)
        } else if (onComplete) {
          setTimeout(() => {
            onComplete()
          }, 1500)
        }
      } else {
        setError(result.error || "問診票の送信に失敗しました")
      }
    } catch (err: any) {
      console.error("問診票送信エラー:", err)
      setError(err.message || "問診票の送信に失敗しました")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Card className="w-full shadow-md border-gray-100">
      <CardHeader>
        <CardTitle className="text-xl text-center text-gray-800">問診票</CardTitle>
        <CardDescription className="text-center">より良い診療のために、以下の情報をご記入ください</CardDescription>
      </CardHeader>
      <CardContent>
        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {successMessage && (
          <Alert className="mb-4 bg-green-50 border-green-200">
            <AlertDescription className="text-green-700">{successMessage}</AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="birthdate">生年月日</Label>
                <Input
                  id="birthdate"
                  name="birthdate"
                  type="date"
                  value={formData.birthdate}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="bloodType">血液型</Label>
                <select
                  id="bloodType"
                  name="bloodType"
                  value={formData.bloodType}
                  onChange={handleChange as any}
                  className="w-full p-2 border rounded-md"
                >
                  <option value="">選択してください</option>
                  <option value="A">A型</option>
                  <option value="B">B型</option>
                  <option value="O">O型</option>
                  <option value="AB">AB型</option>
                  <option value="unknown">不明</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="height">身長 (cm)</Label>
                <Input
                  id="height"
                  name="height"
                  type="number"
                  value={formData.height}
                  onChange={handleChange}
                  placeholder="例: 160"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="weight">体重 (kg)</Label>
                <Input
                  id="weight"
                  name="weight"
                  type="number"
                  value={formData.weight}
                  onChange={handleChange}
                  placeholder="例: 50"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="allergies">アレルギー（食物・薬・その他）</Label>
              <Textarea
                id="allergies"
                name="allergies"
                value={formData.allergies}
                onChange={handleChange}
                placeholder="例: 花粉症、ハウスダスト、ペニシリン"
                rows={2}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="medications">現在服用中の薬</Label>
              <Textarea
                id="medications"
                name="medications"
                value={formData.medications}
                onChange={handleChange}
                placeholder="例: 降圧剤、ビタミン剤"
                rows={2}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="medicalHistory">既往歴</Label>
              <Textarea
                id="medicalHistory"
                name="medicalHistory"
                value={formData.medicalHistory}
                onChange={handleChange}
                placeholder="例: 高血圧、糖尿病、手術歴"
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="pregnancyHistory">妊娠・出産歴</Label>
              <Textarea
                id="pregnancyHistory"
                name="pregnancyHistory"
                value={formData.pregnancyHistory}
                onChange={handleChange}
                placeholder="例: 妊娠回数、出産回数、帝王切開の有無"
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="lastMenstruation">最終月経開始日</Label>
              <Input
                id="lastMenstruation"
                name="lastMenstruation"
                type="date"
                value={formData.lastMenstruation}
                onChange={handleChange}
              />
            </div>

            <div className="space-y-2">
              <Label>喫煙</Label>
              <RadioGroup
                value={formData.smokingStatus}
                onValueChange={(value) => handleRadioChange("smokingStatus", value)}
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="never" id="smoking-never" />
                  <Label htmlFor="smoking-never">吸わない</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="former" id="smoking-former" />
                  <Label htmlFor="smoking-former">以前吸っていた</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="current" id="smoking-current" />
                  <Label htmlFor="smoking-current">現在吸っている</Label>
                </div>
              </RadioGroup>
            </div>

            <div className="space-y-2">
              <Label>飲酒</Label>
              <RadioGroup
                value={formData.alcoholConsumption}
                onValueChange={(value) => handleRadioChange("alcoholConsumption", value)}
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="none" id="alcohol-none" />
                  <Label htmlFor="alcohol-none">飲まない</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="occasional" id="alcohol-occasional" />
                  <Label htmlFor="alcohol-occasional">時々飲む</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="regular" id="alcohol-regular" />
                  <Label htmlFor="alcohol-regular">定期的に飲む</Label>
                </div>
              </RadioGroup>
            </div>

            <div className="space-y-2">
              <Label>運動頻度</Label>
              <RadioGroup
                value={formData.exerciseFrequency}
                onValueChange={(value) => handleRadioChange("exerciseFrequency", value)}
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="rarely" id="exercise-rarely" />
                  <Label htmlFor="exercise-rarely">ほとんどしない</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="sometimes" id="exercise-sometimes" />
                  <Label htmlFor="exercise-sometimes">週1〜2回</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="regularly" id="exercise-regularly" />
                  <Label htmlFor="exercise-regularly">週3回以上</Label>
                </div>
              </RadioGroup>
            </div>

            <div className="space-y-2">
              <Label>食事制限（該当するものすべてにチェック）</Label>
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="diet-vegetarian"
                    checked={formData.dietaryRestrictions.includes("vegetarian")}
                    onCheckedChange={(checked) => handleCheckboxChange("vegetarian", checked as boolean)}
                  />
                  <Label htmlFor="diet-vegetarian">ベジタリアン</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="diet-vegan"
                    checked={formData.dietaryRestrictions.includes("vegan")}
                    onCheckedChange={(checked) => handleCheckboxChange("vegan", checked as boolean)}
                  />
                  <Label htmlFor="diet-vegan">ビーガン</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="diet-gluten-free"
                    checked={formData.dietaryRestrictions.includes("gluten-free")}
                    onCheckedChange={(checked) => handleCheckboxChange("gluten-free", checked as boolean)}
                  />
                  <Label htmlFor="diet-gluten-free">グルテンフリー</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="diet-dairy-free"
                    checked={formData.dietaryRestrictions.includes("dairy-free")}
                    onCheckedChange={(checked) => handleCheckboxChange("dairy-free", checked as boolean)}
                  />
                  <Label htmlFor="diet-dairy-free">乳製品不使用</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="diet-other"
                    checked={formData.dietaryRestrictions.includes("other")}
                    onCheckedChange={(checked) => handleCheckboxChange("other", checked as boolean)}
                  />
                  <Label htmlFor="diet-other">その他</Label>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="concerns">現在の症状や気になること</Label>
              <Textarea
                id="concerns"
                name="concerns"
                value={formData.concerns}
                onChange={handleChange}
                placeholder="例: 腰痛、不眠、ストレス"
                rows={4}
              />
            </div>
          </div>

          <Button
            type="submit"
            className="w-full bg-manary-pink hover:bg-[#f78989] text-white"
            disabled={isSubmitting || isLoadingCSRF}
          >
            {isSubmitting ? "送信中..." : "問診票を送信"}
          </Button>
        </form>
      </CardContent>
      <CardFooter className="flex justify-center border-t pt-4">
        <p className="text-sm text-gray-500">ご記入いただいた情報は、診療目的以外には使用いたしません</p>
      </CardFooter>
    </Card>
  )
}
