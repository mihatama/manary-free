import type React from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Label } from "@/components/ui/label"

const DetailItem = ({ label, value }: { label: string; value: React.ReactNode }) => (
  <div className="py-2 border-b">
    <Label className="font-semibold text-sm">{label}</Label>
    <div className="text-sm mt-1 whitespace-pre-wrap">
      {value === null || value === undefined || value === "" ? (
        <span className="text-muted-foreground">未入力</span>
      ) : (
        value
      )}
    </div>
  </div>
)

export function PostpartumCareChartDetails({ chart }: { chart: any }) {
  const questionnaire = chart.appointments?.questionnaires?.data

  return (
    <div className="space-y-6 max-h-[80vh] overflow-y-auto p-2">
      <Card>
        <CardHeader>
          <CardTitle>産後ケアカルテ</CardTitle>
          <CardDescription>
            {questionnaire?.mother_last_name} {questionnaire?.mother_first_name} 様 (
            {new Date(chart.appointments.start_time).toLocaleString("ja-JP")})
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <DetailItem label="日付" value={chart.visit_date} />
          <DetailItem label="担当者" value={chart.practitioner_name} />
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">お母さんの状態</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <DetailItem label="全身状態・バイタル" value={chart.mother_condition} />
            <DetailItem label="悪露" value={chart.lochia_status} />
            <DetailItem label="会陰切開・帝王切開の傷" value={chart.episiotomy_pain} />
            <DetailItem label="便秘" value={chart.constipation_status} />
            <DetailItem label="精神状態" value={chart.mental_state} />
            <DetailItem label="家族のサポート" value={chart.family_support} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">赤ちゃんの状態</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <DetailItem label="全身状態・バイタル" value={chart.baby_condition} />
            <DetailItem label="黄疸" value={chart.jaundice_level} />
            <DetailItem label="臍帯" value={chart.umbilical_cord_status} />
            <DetailItem label="授乳・哺乳状況" value={chart.feeding_status} />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">ケアプラン・指導内容</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <DetailItem label="ケアプラン" value={chart.care_plan} />
          <DetailItem label="指導内容" value={chart.guidance} />
          <DetailItem label="会計" value={chart.payment_details} />
        </CardContent>
      </Card>
    </div>
  )
}
