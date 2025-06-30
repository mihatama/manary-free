import type React from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import type { DetailedQuestionnaireWithReservation } from "@/app/actions/questionnaire-actions"

const fieldLabels: Record<string, string> = {
  mother_last_name: "お母様（姓）",
  mother_first_name: "お母様（名）",
  mother_last_name_kana: "お母様（セイ）",
  mother_first_name_kana: "お母様（メイ）",
  child_last_name: "お子様（姓）",
  child_first_name: "お子様（名）",
  child_last_name_kana: "お子様（セイ）",
  child_first_name_kana: "お子様（メイ）",
  child_birth_date: "お子様の生年月日",
  gestational_weeks_at_birth: "ご出産時の妊娠週数",
  birth_weight: "ご出産時の体重 (g)",
  current_weight: "現在の体重 (g)",
  delivery_method: "分娩方法",
  has_medical_history: "お母様の既往歴",
  medical_history_details: "既往歴の詳細",
  is_on_medication: "服用中のお薬",
  medication_details: "お薬の詳細",
  has_allergies: "アレルギー",
  allergy_details: "アレルギーの詳細",
  consultation_reason: "ご相談内容の種別",
  notes: "ご相談内容の詳細",
  location_nishinomiya: "西宮",
  location_takarazuka: "宝塚",
  location_nihonbashi: "日本橋",
  location_aichi: "愛知",
  location_visit: "訪問",
  phone_number: "電話番号",
  email: "メールアドレス",
}

const renderValue = (key: string, value: any) => {
  if (typeof value === "boolean") {
    return value ? "あり" : "なし"
  }
  if (key.startsWith("location_") && value === "on") {
    return "希望"
  }
  if (value === null || value === undefined || value === "") {
    return <span className="text-muted-foreground">未入力</span>
  }
  return String(value)
}

const DetailItem = ({ label, value }: { label: string; value: React.ReactNode }) => (
  <div className="grid grid-cols-3 gap-2 items-start">
    <Label className="font-semibold text-right pr-4 col-span-1">{label}</Label>
    <div className="col-span-2">{value}</div>
  </div>
)

export function QuestionnaireDetails({ questionnaire }: { questionnaire: DetailedQuestionnaireWithReservation }) {
  const data = questionnaire.data as Record<string, any> | null

  return (
    <div className="space-y-6 max-h-[80vh] overflow-y-auto p-2">
      <Card>
        <CardHeader>
          <CardTitle>予約情報</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <DetailItem label="患者名" value={`${data?.mother_last_name || ""} ${data?.mother_first_name || ""}`} />
          <DetailItem label="電話番号" value={data?.phone_number} />
          <DetailItem label="メールアドレス" value={data?.email} />
          <DetailItem
            label="予約日時"
            value={
              questionnaire.reservations?.reservation_date
                ? new Date(questionnaire.reservations.reservation_date).toLocaleString("ja-JP")
                : "N/A"
            }
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>問診票詳細</CardTitle>
          <CardDescription>患者様から提出された問診票の内容です。</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {data ? (
            Object.entries(fieldLabels).map(([key, label]) => {
              if (data[key] !== undefined) {
                return <DetailItem key={key} label={label} value={renderValue(key, data[key])} />
              }
              return null
            })
          ) : (
            <p>問診票データがありません。</p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
