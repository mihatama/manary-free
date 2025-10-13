import type React from "react"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"

import type { BreastCareChartRecord } from "@/lib/chart-types"

import { BreastDiagramInput } from "./breast-diagram-input"

const DetailItem = ({ label, value }: { label: string; value?: React.ReactNode }) => (
  <div className="grid grid-cols-3 items-start gap-3 border-b py-2">
    <Label className="col-span-1 pr-4 text-right text-sm font-semibold">{label}</Label>
    <div className="col-span-2 text-sm">
      {value === null || value === undefined || value === "" ? (
        <span className="text-muted-foreground">未入力</span>
      ) : (
        value
      )}
    </div>
  </div>
)

const formatList = (items: string[]) => (items.length > 0 ? items.join("、") : <span className="text-muted-foreground">未入力</span>)

const formatNumber = (value?: number | null, unit?: string) => {
  if (value === null || value === undefined || Number.isNaN(value)) {
    return <span className="text-muted-foreground">未入力</span>
  }
  return `${value.toLocaleString()}${unit ?? ""}`
}

export function BreastCareChartDetails({ chart }: { chart: BreastCareChartRecord }) {
  const data = chart.data

  return (
    <div className="max-h-[75vh] space-y-6 overflow-y-auto p-2">
      <Card>
        <CardHeader>
          <CardTitle>すいな法乳房ケアカルテ</CardTitle>
          <CardDescription>
            {chart.patientName} 様（{chart.visitDate}）{chart.patientId ? ` / ID: ${chart.patientId}` : ""}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          <DetailItem label="カルテ番号" value={data.chartNumber} />
          <DetailItem label="担当助産師" value={chart.practitionerName} />
          <DetailItem label="研修生" value={data.traineeName} />
          <DetailItem label="場所" value={data.clinicLocation?.join("、")} />
          <DetailItem label="赤ちゃん体重" value={formatNumber(data.bodyWeight, "g")} />
          <DetailItem label="1日増加量" value={formatNumber(data.weightGainPerDay, "g")} />
          <DetailItem label="メモ" value={chart.memo} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">授乳・栄養情報</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <DetailItem label="母乳間隔" value={data.breastMilkInterval} />
          <DetailItem label="ミルク（日中）" value={data.milkVolumeDay} />
          <DetailItem label="ミルク（夜間）" value={data.milkVolumeNight} />
          <DetailItem label="搾母乳 / ミルク量" value={data.formulaVolumePerFeed} />
          <DetailItem label="ミルク回数 / 日" value={formatNumber(data.formulaFeedsPerDay, "回")} />
          <DetailItem label="離乳食回数 / 日" value={formatNumber(data.weaningFeedsPerDay, "回")} />
          <DetailItem label="離乳食の内容" value={data.weaningDetails} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">排泄・発達状況</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <DetailItem label="排便回数 / 日" value={formatNumber(data.stoolFrequency, "回")} />
          <DetailItem label="便性状" value={data.stoolConsistency} />
          <DetailItem label="発達の様子" value={data.babyDevelopment} />
          <DetailItem label="離乳の進み具合" value={data.weaningStatus} />
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">S) 主観的情報</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="whitespace-pre-wrap text-sm">{data.subjectiveNote || "未入力"}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">P) 計画</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="whitespace-pre-wrap text-sm">{data.planNote || "未入力"}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">乳房の状態・ケア</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <DetailItem label="乳房の形" value={data.breastShape} />
              <DetailItem label="ニップルシールド使用" value={data.nippleShieldUsed ? "あり" : "なし"} />
              <DetailItem label="搾乳頻度" value={data.pumpingFrequency} />
              <DetailItem label="搾乳方法" value={data.pumpingMethod} />
              <DetailItem label="乳頭・乳輪の状態" value={formatList(data.nippleAreolaCondition)} />
              <DetailItem label="疼痛部位" value={formatList(data.painLocation)} />
              <DetailItem label="授乳姿勢" value={data.feedingPosition} />
              <DetailItem label="家族などのサポート状況" value={data.familySupportStatus} />
            </div>
            <div className="flex items-center justify-evenly">
              <BreastDiagramInput side="right" value={data.breastDiagramRight} readOnly />
              <BreastDiagramInput side="left" value={data.breastDiagramLeft} readOnly />
            </div>
          </div>
          <DetailItem label="気になる点・相談内容" value={data.concerns} />
          <DetailItem label="左乳房の状態" value={data.leftBreastCondition} />
          <DetailItem label="右乳房の状態" value={data.rightBreastCondition} />
          <DetailItem label="ケア内容" value={data.careDetails} />
          <DetailItem label="助言・次回までの課題" value={data.recommendations} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">診断・会計</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <DetailItem label="診断" value={<p className="whitespace-pre-wrap">{data.diagnosis || "未入力"}</p>} />
          <DetailItem label="会計方法" value={data.paymentMethod} />
          <div className="space-y-2">
            <Label className="text-sm font-semibold">会計項目</Label>
            <div className="flex flex-wrap gap-3 text-sm">
              <span className={!data.initialConsultationFee ? "text-muted-foreground line-through" : undefined}>
                初診料 1,000円
              </span>
              <span className={!data.singleSessionFee ? "text-muted-foreground line-through" : undefined}>
                1回 5,500円
              </span>
              <span className={!data.ticketFee ? "text-muted-foreground line-through" : undefined}>チケット 14,850円</span>
              <span className={!data.rentalTowelFee ? "text-muted-foreground line-through" : undefined}>
                レンタルタオル 350円
              </span>
              <span className={!data.careTowelFee ? "text-muted-foreground line-through" : undefined}>
                ケアタオル 250円
              </span>
            </div>
          </div>
          {data.otherFee !== undefined && data.otherFee !== null ? (
            <DetailItem
              label={`その他${data.otherFeeDescription ? `（${data.otherFeeDescription}）` : ""}`}
              value={`${data.otherFee.toLocaleString()}円`}
            />
          ) : null}
        </CardContent>
      </Card>
    </div>
  )
}
