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
        <span className="text-muted-foreground">譛ｪ蜈･蜉・/span>
      ) : (
        value
      )}
    </div>
  </div>
)

const formatList = (items: string[]) => (items.length > 0 ? items.join("縲・) : <span className="text-muted-foreground">譛ｪ蜈･蜉・/span>)

const formatNumber = (value?: number | null, unit?: string) => {
  if (value === null || value === undefined || Number.isNaN(value)) {
    return <span className="text-muted-foreground">譛ｪ蜈･蜉・/span>
  }
  return `${value.toLocaleString()}${unit ?? ""}`
}

export function BreastCareChartDetails({ chart }: { chart: BreastCareChartRecord }) {
  const data = chart.data

  return (
    <div className="max-h-[75vh] space-y-6 overflow-y-auto p-2">
      <Card>
        <CardHeader>
          <CardTitle>縺吶＞縺ｪ豕穂ｹｳ謌ｿ繧ｱ繧｢繧ｫ繝ｫ繝・/CardTitle>
          <CardDescription>
            {chart.patientName} 讒假ｼ・chart.visitDate}・閲chart.patientId ? ` / ID: ${chart.patientId}` : ""}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          <DetailItem label="繧ｫ繝ｫ繝・分蜿ｷ" value={data.chartNumber} />
          <DetailItem label="諡・ｽ灘勧逕｣蟶ｫ" value={chart.practitionerName} />
          <DetailItem label="遐比ｿｮ逕・ value={data.traineeName} />
          <DetailItem label="蝣ｴ謇" value={data.clinicLocation ?? ""} />
          <DetailItem label="襍､縺｡繧・ｓ菴馴㍾" value={formatNumber(data.bodyWeight, "g")} />
          <DetailItem label="1譌･蠅怜刈驥・ value={formatNumber(data.weightGainPerDay, "g")} />
          <DetailItem label="繝｡繝｢" value={chart.memo} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">謗井ｹｳ繝ｻ譬・､頑ュ蝣ｱ</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <DetailItem label="豈堺ｹｳ髢馴囈" value={data.breastMilkInterval} />
          <DetailItem label="繝溘Ν繧ｯ・域律荳ｭ・・ value={data.milkVolumeDay} />
          <DetailItem label="繝溘Ν繧ｯ・亥､憺俣・・ value={data.milkVolumeNight} />
          <DetailItem label="謳ｾ豈堺ｹｳ / 繝溘Ν繧ｯ驥・ value={data.formulaVolumePerFeed} />
          <DetailItem label="繝溘Ν繧ｯ蝗樊焚 / 譌･" value={formatNumber(data.formulaFeedsPerDay, "蝗・)} />
          <DetailItem label="髮｢荵ｳ鬟溷屓謨ｰ / 譌･" value={formatNumber(data.weaningFeedsPerDay, "蝗・)} />
          <DetailItem label="髮｢荵ｳ鬟溘・蜀・ｮｹ" value={data.weaningDetails} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">謗呈ｳ・・逋ｺ驕皮憾豕・/CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <DetailItem label="謗剃ｾｿ蝗樊焚 / 譌･" value={formatNumber(data.stoolFrequency, "蝗・)} />
          <DetailItem label="萓ｿ諤ｧ迥ｶ" value={data.stoolConsistency} />
          <DetailItem label="逋ｺ驕斐・讒伜ｭ・ value={data.babyDevelopment} />
          <DetailItem label="髮｢荵ｳ縺ｮ騾ｲ縺ｿ蜈ｷ蜷・ value={data.weaningStatus} />
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">S) 荳ｻ隕ｳ逧・ュ蝣ｱ</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="whitespace-pre-wrap text-sm">{data.subjectiveNote || "譛ｪ蜈･蜉・}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">P) 險育判</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="whitespace-pre-wrap text-sm">{data.planNote || "譛ｪ蜈･蜉・}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">荵ｳ謌ｿ縺ｮ迥ｶ諷九・繧ｱ繧｢</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <DetailItem label="荵ｳ謌ｿ縺ｮ蠖｢" value={data.breastShape} />
              <DetailItem label="繝九ャ繝励Ν繧ｷ繝ｼ繝ｫ繝我ｽｿ逕ｨ" value={data.nippleShieldUsed ? "縺ゅｊ" : "縺ｪ縺・} />
              <DetailItem label="謳ｾ荵ｳ鬆ｻ蠎ｦ" value={data.pumpingFrequency} />
              <DetailItem label="謳ｾ荵ｳ譁ｹ豕・ value={data.pumpingMethod} />
              <DetailItem label="荵ｳ鬆ｭ繝ｻ荵ｳ霈ｪ縺ｮ迥ｶ諷・ value={formatList(data.nippleAreolaCondition)} />
              <DetailItem label="逍ｼ逞幃Κ菴・ value={formatList(data.painLocation)} />
              <DetailItem label="謗井ｹｳ蟋ｿ蜍｢" value={data.feedingPosition} />
              <DetailItem label="螳ｶ譌上↑縺ｩ縺ｮ繧ｵ繝昴・繝育憾豕・ value={data.familySupportStatus} />
            </div>
            <div className="flex items-center justify-evenly">
              <BreastDiagramInput side="right" value={data.breastDiagramRight} readOnly />
              <BreastDiagramInput side="left" value={data.breastDiagramLeft} readOnly />
            </div>
          </div>
          <DetailItem label="豌励↓縺ｪ繧狗せ繝ｻ逶ｸ隲・・螳ｹ" value={data.concerns} />
          <DetailItem label="蟾ｦ荵ｳ謌ｿ縺ｮ迥ｶ諷・ value={data.leftBreastCondition} />
          <DetailItem label="蜿ｳ荵ｳ謌ｿ縺ｮ迥ｶ諷・ value={data.rightBreastCondition} />
          <DetailItem label="繧ｱ繧｢蜀・ｮｹ" value={data.careDetails} />
          <DetailItem label="蜉ｩ險繝ｻ谺｡蝗槭∪縺ｧ縺ｮ隱ｲ鬘・ value={data.recommendations} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">診断・会計</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <DetailItem label="診断" value={<p className="whitespace-pre-wrap">{data.diagnosis || "未入力"}</p>} />
          <DetailItem label="会計方法" value={data.paymentMethod} />
          <DetailItem
            label="会計項目"
            value={
              data.fees && data.fees.length > 0 ? (
                <ul className="space-y-1">
                  {data.fees.map((fee, index) => (
                    <li
                      key={`${fee.label ?? "item"}-${index}`}
                      className={`flex items-center justify-between text-sm${fee.selected ? "" : " text-muted-foreground"}`}
                    >
                      <span>{fee.label || "項目名未設定"}</span>
                      <span>
                        {fee.price !== undefined && fee.price !== null
                          ? `${fee.price.toLocaleString()}円`
                          : "金額未入力"}
                        {!fee.selected ? <span className="ml-2 text-xs">(未適用)</span> : null}
                      </span>
                    </li>
                  ))}
                </ul>
              ) : undefined
            }
          />
        </CardContent>
      </Card>
      </Card>
    </div>
  )
}


