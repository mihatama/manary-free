"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { CalendarIcon } from "lucide-react"
import { format } from "date-fns"
import { ja } from "date-fns/locale"
import { cn } from "@/lib/utils"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { submitQuestionnaire } from "@/app/actions/questionnaire-actions"
import { useCSRF } from "@/hooks/use-csrf"

interface MedicalQuestionnaireFormProps {
  phoneNumber: string
  reservationData?: {
    clinicId: number
    serviceTypeId: number
    date: string
    startTime: string
    endTime: string
    patientName: string
  }
}

export function MedicalQuestionnaireForm({ phoneNumber, reservationData }: MedicalQuestionnaireFormProps) {
  console.log("MedicalQuestionnaireForm レンダリング", { phoneNumber, reservationData })
  const [birthdate, setBirthdate] = useState<Date | undefined>()
  const [lastMenstruation, setLastMenstruation] = useState<Date | undefined>()
  const [height, setHeight] = useState("")
  const [weight, setWeight] = useState("")
  const [bloodType, setBloodType] = useState("")
  const [allergies, setAllergies] = useState("")
  const [medications, setMedications] = useState("")
  const [medicalHistory, setMedicalHistory] = useState("")
  const [pregnancyHistory, setPregnancyHistory] = useState("")
  const [smokingStatus, setSmokingStatus] = useState("")
  const [alcoholConsumption, setAlcoholConsumption] = useState("")
  const [exerciseFrequency, setExerciseFrequency] = useState("")
  const [dietaryRestrictions, setDietaryRestrictions] = useState("")
  const [concerns, setConcerns] = useState("")
  const [patientName, setPatientName] = useState(reservationData?.patientName || "")
  const [patientEmail, setPatientEmail] = useState("")

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const router = useRouter()
  const { csrfToken, isLoading: isLoadingCSRF } = useCSRF()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    console.log("問診票フォーム送信開始")
    setError(null)

    if (!patientName && reservationData) {
      console.error("患者名が入力されていません")
      setError("お名前を入力してください")
      return
    }

    if (!csrfToken) {
      console.error("CSRFトークンが利用できません")
      setError("セキュリティトークンが利用できません。ページを再読み込みしてください。")
      return
    }

    setIsSubmitting(true)

    try {
      console.log("フォームデータの準備")
      const formData = new FormData()
      formData.append("csrf_token", csrfToken)
      formData.append("phone_number", phoneNumber)

      if (birthdate) {
        formData.append("birthdate", format(birthdate, "yyyy-MM-dd"))
      }
      if (lastMenstruation) {
        formData.append("lastMenstruation", format(lastMenstruation, "yyyy-MM-dd"))
      }

      formData.append("height", height)
      formData.append("weight", weight)
      formData.append("bloodType", bloodType)
      formData.append("allergies", allergies)
      formData.append("medications", medications)
      formData.append("medicalHistory", medicalHistory)
      formData.append("pregnancyHistory", pregnancyHistory)
      formData.append("smokingStatus", smokingStatus)
      formData.append("alcoholConsumption", alcoholConsumption)
      formData.append("exerciseFrequency", exerciseFrequency)
      formData.append("dietaryRestrictions", dietaryRestrictions)
      formData.append("concerns", concerns)

      // 予約データがある場合は追加
      if (reservationData) {
        console.log("予約データの追加", reservationData)
        formData.append("clinicId", reservationData.clinicId.toString())
        formData.append("serviceTypeId", reservationData.serviceTypeId.toString())
        formData.append("date", reservationData.date)
        formData.append("startTime", reservationData.startTime)
        formData.append("endTime", reservationData.endTime)
        formData.append("patientName", patientName)
        if (patientEmail) {
          formData.append("patientEmail", patientEmail)
        }
      }

      // フォームデータをサーバーに送信
      try {
        console.log("問診票送信開始")
        const result = await submitQuestionnaire(formData)
        console.log("問診票送信結果", result)

        if (result.success) {
          if (result.token) {
            // 予約確認ページにリダイレクト
            console.log("予約確認ページへリダイレクト", { token: result.token })
            router.push(`/reservation/confirmation?token=${result.token}`)
          } else {
            // 問診票のみ送信成功
            console.log("問診票のみ送信成功")
            router.push("/reservation?success=questionnaire")
          }
        } else {
          console.error("問診票送信失敗", result.error)
          setError(result.error || "問診票の送信に失敗しました")
        }
      } catch (err: any) {
        console.error("問診票送信エラー:", err)
        setError(err.message || "問診票の送信に失敗しました")

        // テスト用：エラーが発生しても予約ページに進む
        if (reservationData) {
          console.log("テスト用：エラーが発生しても予約ページに進みます")
          router.push(
            `/reservation/new?clinicId=${reservationData.clinicId}&serviceTypeId=${reservationData.serviceTypeId}&date=${reservationData.date}&startTime=${reservationData.startTime}&endTime=${reservationData.endTime}&phone=${phoneNumber}&verified=true&skipQuestionnaire=true`,
          )
        }
      }
    } catch (err: any) {
      console.error("フォーム送信エラー:", err)
      setError(err.message || "フォームの送信に失敗しました")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Card className="w-full shadow-md border-gray-100">
      <CardContent className="p-6">
        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {reservationData && (
            <div className="space-y-4">
              <h3 className="text-lg font-medium">予約情報</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="patientName">
                    お名前 <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="patientName"
                    value={patientName}
                    onChange={(e) => setPatientName(e.target.value)}
                    placeholder="例: 山田 花子"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="patientEmail">メールアドレス (任意)</Label>
                  <Input
                    id="patientEmail"
                    type="email"
                    value={patientEmail}
                    onChange={(e) => setPatientEmail(e.target.value)}
                    placeholder="例: example@example.com"
                  />
                </div>
              </div>
            </div>
          )}

          <div className="space-y-4">
            <h3 className="text-lg font-medium">基本情報</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="birthdate">生年月日</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant={"outline"}
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !birthdate && "text-muted-foreground",
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {birthdate ? format(birthdate, "yyyy年MM月dd日", { locale: ja }) : "日付を選択"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar mode="single" selected={birthdate} onSelect={setBirthdate} initialFocus locale={ja} />
                  </PopoverContent>
                </Popover>
              </div>
              <div className="space-y-2">
                <Label htmlFor="bloodType">血液型</Label>
                <Select value={bloodType} onValueChange={setBloodType}>
                  <SelectTrigger>
                    <SelectValue placeholder="選択してください" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="A">A型</SelectItem>
                    <SelectItem value="B">B型</SelectItem>
                    <SelectItem value="O">O型</SelectItem>
                    <SelectItem value="AB">AB型</SelectItem>
                    <SelectItem value="unknown">不明</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="height">身長 (cm)</Label>
                <Input
                  id="height"
                  type="text"
                  value={height}
                  onChange={(e) => setHeight(e.target.value)}
                  placeholder="例: 160"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="weight">体重 (kg)</Label>
                <Input
                  id="weight"
                  type="text"
                  value={weight}
                  onChange={(e) => setWeight(e.target.value)}
                  placeholder="例: 50"
                />
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-lg font-medium">健康状態</h3>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="allergies">アレルギー</Label>
                <Textarea
                  id="allergies"
                  value={allergies}
                  onChange={(e) => setAllergies(e.target.value)}
                  placeholder="アレルギーがある場合は記入してください"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="medications">服用中の薬</Label>
                <Textarea
                  id="medications"
                  value={medications}
                  onChange={(e) => setMedications(e.target.value)}
                  placeholder="現在服用している薬があれば記入してください"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="medicalHistory">既往歴</Label>
                <Textarea
                  id="medicalHistory"
                  value={medicalHistory}
                  onChange={(e) => setMedicalHistory(e.target.value)}
                  placeholder="過去の病歴や手術歴があれば記入してください"
                />
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-lg font-medium">女性の方</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="lastMenstruation">最終月経日</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant={"outline"}
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !lastMenstruation && "text-muted-foreground",
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {lastMenstruation ? format(lastMenstruation, "yyyy年MM月dd日", { locale: ja }) : "日付を選択"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={lastMenstruation}
                      onSelect={setLastMenstruation}
                      initialFocus
                      locale={ja}
                    />
                  </PopoverContent>
                </Popover>
              </div>
              <div className="space-y-2">
                <Label htmlFor="pregnancyHistory">妊娠・出産歴</Label>
                <Textarea
                  id="pregnancyHistory"
                  value={pregnancyHistory}
                  onChange={(e) => setPregnancyHistory(e.target.value)}
                  placeholder="妊娠・出産の経験があれば記入してください"
                />
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-lg font-medium">生活習慣</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="smokingStatus">喫煙</Label>
                <Select value={smokingStatus} onValueChange={setSmokingStatus}>
                  <SelectTrigger>
                    <SelectValue placeholder="選択してください" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="never">吸わない</SelectItem>
                    <SelectItem value="former">以前吸っていた</SelectItem>
                    <SelectItem value="occasional">時々吸う</SelectItem>
                    <SelectItem value="regular">毎日吸う</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="alcoholConsumption">飲酒</Label>
                <Select value={alcoholConsumption} onValueChange={setAlcoholConsumption}>
                  <SelectTrigger>
                    <SelectValue placeholder="選択してください" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="never">飲まない</SelectItem>
                    <SelectItem value="occasional">時々飲む</SelectItem>
                    <SelectItem value="regular">定期的に飲む</SelectItem>
                    <SelectItem value="daily">毎日飲む</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="exerciseFrequency">運動頻度</Label>
                <Select value={exerciseFrequency} onValueChange={setExerciseFrequency}>
                  <SelectTrigger>
                    <SelectValue placeholder="選択してください" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="never">ほとんどしない</SelectItem>
                    <SelectItem value="occasional">時々する</SelectItem>
                    <SelectItem value="regular">週に1-2回</SelectItem>
                    <SelectItem value="frequent">週に3回以上</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="dietaryRestrictions">食事制限</Label>
              <Textarea
                id="dietaryRestrictions"
                value={dietaryRestrictions}
                onChange={(e) => setDietaryRestrictions(e.target.value)}
                placeholder="食事制限や特別な食事があれば記入してください"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="concerns">気になること・相談したいこと</Label>
            <Textarea
              id="concerns"
              value={concerns}
              onChange={(e) => setConcerns(e.target.value)}
              placeholder="気になることや相談したいことがあれば記入してください"
            />
          </div>

          <Button
            type="submit"
            className="w-full bg-[#f8a0a0] hover:bg-[#f78989] text-white"
            disabled={isSubmitting || isLoadingCSRF}
          >
            {isSubmitting ? "送信中..." : reservationData ? "問診票を送信して予約へ進む" : "問診票を送信する"}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
