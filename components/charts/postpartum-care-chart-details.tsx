import type React from "react"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"

import type { PostpartumCareChartRecord } from "@/lib/chart-types"

const DetailItem = ({ label, value }: { label: string; value?: React.ReactNode }) => (
  <div className="space-y-1 border-b py-2">
    <Label className="text-sm font-semibold">{label}</Label>
    <div className="text-sm">
      {value === null || value === undefined || value === "" ? (
        <span className="text-muted-foreground">未入力</span>
      ) : (
        value
      )}
    </div>
  </div>
)

export function PostpartumCareChartDetails({ chart }: { chart: PostpartumCareChartRecord }) {
  const data = chart.data

  return (
    <div className="max-h-[75vh] space-y-6 overflow-y-auto p-2">
      <Card>
        <CardHeader>
          <CardTitle>産後ケアカルテ</CardTitle>
          <CardDescription>
            {chart.patientName} 様（{chart.visitDate}）{chart.patientId ? ` / ID: ${chart.patientId}` : ""}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          <DetailItem label="担当助産師" value={chart.practitionerName} />
          <DetailItem label="産後週数" value={data.weeksPostpartum !== undefined && data.weeksPostpartum !== null ? `${data.weeksPostpartum}週` : undefined} />
          <DetailItem label="メモ" value={chart.memo} />
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">お母さんの状態</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <DetailItem label="全身状態・バイタル" value={data.motherCondition} />
            <DetailItem label="悪露" value={data.lochiaStatus} />
            <DetailItem label="会陰切開・帝王切開の状態" value={data.episiotomyPain} />
            <DetailItem label="便秘" value={data.constipationStatus} />
            <DetailItem label="身体的コンディション" value={data.physicalCondition} />
            <DetailItem label="心理面の状態" value={data.mentalCondition} />
            <DetailItem label="メンタルチェック" value={data.mentalState} />
            <DetailItem label="家族のサポート" value={data.familySupport} />
            <DetailItem label="実施したケア・フォロー" value={data.careProvided} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">赤ちゃんの状態</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <DetailItem label="全身状態・バイタル" value={data.babyCondition} />
            <DetailItem label="黄疸" value={data.jaundiceLevel} />
            <DetailItem label="臍帯の状態" value={data.umbilicalCordStatus} />
            <DetailItem label="授乳・哺乳状況" value={data.feedingStatus} />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">ケアプラン・指導内容</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <DetailItem label="ケアプラン" value={data.carePlan} />
          <DetailItem label="指導内容" value={data.guidance} />
          <DetailItem label="会計" value={data.paymentDetails} />
        </CardContent>
      </Card>
    </div>
  )
}
