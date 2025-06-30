import type React from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { BreastDiagramInput } from "./breast-diagram-input"

const DetailItem = ({ label, value }: { label: string; value: React.ReactNode }) => (
  <div className="grid grid-cols-3 gap-2 items-start py-2 border-b">
    <Label className="font-semibold text-sm text-right pr-4 col-span-1">{label}</Label>
    <div className="col-span-2 text-sm">
      {value === null || value === undefined || value === "" ? (
        <span className="text-muted-foreground">未入力</span>
      ) : (
        value
      )}
    </div>
  </div>
)

const CheckboxItem = ({ label, checked }: { label: string; checked: boolean | null | undefined }) => (
  <div className="flex items-center space-x-2">
    <Checkbox checked={!!checked} disabled />
    <Label>{label}</Label>
  </div>
)

export function BreastCareChartDetails({ chart }: { chart: any }) {
  const questionnaire = chart.appointments?.questionnaires?.data

  return (
    <div className="space-y-6 max-h-[80vh] overflow-y-auto p-2">
      <Card>
        <CardHeader>
          <CardTitle>すいな法乳房ケアカルテ</CardTitle>
          <CardDescription>
            {questionnaire?.child_last_name} {questionnaire?.child_first_name} 様 (
            {new Date(chart.appointments.start_time).toLocaleString("ja-JP")})
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <DetailItem label="No." value={chart.no} />
          <DetailItem label="日付" value={chart.visit_date} />
          <DetailItem label="担当者" value={chart.practitioner_name} />
          <DetailItem label="研修生" value={chart.trainee_name} />
          <DetailItem label="場所" value={chart.clinic_location?.join(", ")} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">授乳情報</CardTitle>
        </CardHeader>
        <CardContent>
          <DetailItem label="母乳間隔" value={chart.breast_milk_interval} />
          <DetailItem label="ミルク(日中)" value={chart.milk_volume_day} />
          <DetailItem label="ミルク(夜中)" value={chart.milk_volume_night} />
          <DetailItem label="搾母乳" value={chart.formula_volume_per_feed} />
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">S) 主観的情報</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm whitespace-pre-wrap">{chart.s_text}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">P) 計画</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm whitespace-pre-wrap">{chart.p_text}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">乳房の状態</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-2">
              <DetailItem label="乳房の形" value={chart.breast_shape} />
              <DetailItem label="ニップル使用" value={chart.nipple_shield_used ? "あり" : "なし"} />
              <DetailItem label="搾乳" value={chart.pumping_frequency} />
              <DetailItem label="乳頭・乳輪の状態" value={chart.nipple_areola_condition?.join(", ")} />
              <DetailItem label="疼痛" value={chart.pain_location?.join(", ")} />
              <DetailItem label="授乳姿勢" value={chart.feeding_position} />
              <DetailItem label="家族などのサポート状況" value={chart.family_support_status} />
            </div>
            <div className="flex justify-around">
              <BreastDiagramInput side="right" value={chart.breast_diagram_right} readOnly />
              <BreastDiagramInput side="left" value={chart.breast_diagram_left} readOnly />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">乳房診断・会計</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label className="font-semibold">診断</Label>
            <p className="text-sm whitespace-pre-wrap mt-1">{chart.diagnosis}</p>
          </div>
          <div className="space-y-2">
            <Label className="font-semibold">会計項目</Label>
            <div className="flex flex-wrap gap-4">
              <CheckboxItem label="初診料 1,000円" checked={chart.initial_consultation_fee} />
              <CheckboxItem label="1回 5,500円" checked={chart.single_session_fee} />
              <CheckboxItem label="チケット 14,850円" checked={chart.ticket_fee} />
              <CheckboxItem label="レンタルタオル 350円" checked={chart.rental_towel_fee} />
              <CheckboxItem label="ケアタオル 250円" checked={chart.care_towel_fee} />
            </div>
          </div>
          {chart.other_fee && (
            <DetailItem label={`その他 (${chart.other_fee_description})`} value={`${chart.other_fee}円`} />
          )}
        </CardContent>
      </Card>
    </div>
  )
}
