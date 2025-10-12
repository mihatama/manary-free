"use client"

import { useEffect, useMemo } from "react"
import { Controller, useForm } from "react-hook-form"
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"

import type { BreastCareChartRecord, BreastDiagram, ChartPayload } from "@/lib/chart-types"

import { BreastDiagramInput } from "./breast-diagram-input"

const clinicLocationOptions = [
  { value: "西宮", label: "西宮" },
  { value: "宝塚", label: "宝塚" },
  { value: "日本橋", label: "日本橋" },
  { value: "愛知", label: "愛知" },
  { value: "訪問", label: "訪問" },
] as const

const feeOptions = [
  { name: "initialConsultationFee", label: "初診料 1,000円" },
  { name: "singleSessionFee", label: "1回 5,500円" },
  { name: "ticketFee", label: "チケット 14,850円" },
  { name: "rentalTowelFee", label: "レンタルタオル 350円" },
  { name: "careTowelFee", label: "ケアタオル 250円" },
] as const

const breastDiagramFieldSchema = z
  .union([
    z.object({
      imageData: z.string().optional().nullable(),
      markers: z.record(z.boolean()).optional(),
    }),
    z.record(z.boolean()),
  ])
  .default({})

const formSchema = z.object({
  patientName: z.string().min(1, "患者名は必須です"),
  patientId: z.string().optional(),
  visitDate: z.string().min(1, "来院日は必須です"),
  practitionerName: z.string().optional(),
  traineeName: z.string().optional(),
  chartNumber: z.string().optional(),
  memo: z.string().optional(),
  bodyWeight: z.union([z.string(), z.number()]).optional(),
  weightGainPerDay: z.union([z.string(), z.number()]).optional(),
  clinicLocation: z.array(z.string()).default([]),
  breastMilkInterval: z.string().optional(),
  milkVolumeDay: z.string().optional(),
  milkVolumeNight: z.string().optional(),
  formulaFeedsPerDay: z.union([z.string(), z.number()]).optional(),
  formulaVolumePerFeed: z.string().optional(),
  weaningFeedsPerDay: z.union([z.string(), z.number()]).optional(),
  weaningDetails: z.string().optional(),
  stoolFrequency: z.union([z.string(), z.number()]).optional(),
  stoolConsistency: z.string().optional(),
  babyDevelopment: z.string().optional(),
  weaningStatus: z.string().optional(),
  subjectiveNote: z.string().optional(),
  planNote: z.string().optional(),
  breastShape: z.string().optional(),
  nippleShieldUsed: z.boolean().optional().default(false),
  pumpingFrequency: z.string().optional(),
  pumpingMethod: z.string().optional(),
  nippleAreolaConditionText: z.string().optional(),
  painLocationText: z.string().optional(),
  feedingPosition: z.string().optional(),
  familySupportStatus: z.string().optional(),
  concerns: z.string().optional(),
  leftBreastCondition: z.string().optional(),
  rightBreastCondition: z.string().optional(),
  careDetails: z.string().optional(),
  recommendations: z.string().optional(),
  breastDiagramRight: breastDiagramFieldSchema,
  breastDiagramLeft: breastDiagramFieldSchema,
  diagnosis: z.string().optional(),
  paymentMethod: z.string().optional(),
  initialConsultationFee: z.boolean().optional().default(false),
  singleSessionFee: z.boolean().optional().default(false),
  ticketFee: z.boolean().optional().default(false),
  rentalTowelFee: z.boolean().optional().default(false),
  careTowelFee: z.boolean().optional().default(false),
  otherFee: z.union([z.string(), z.number()]).optional(),
  otherFeeDescription: z.string().optional(),
})

type DiagramFieldValue = z.infer<typeof breastDiagramFieldSchema>
type FormValues = z.infer<typeof formSchema>

type BreastCareChartFormProps = {
  chart?: BreastCareChartRecord
  onSubmit: (payload: ChartPayload & { chartType: "breast" }) => void
  onCancel: () => void
  submitLabel?: string
}

const listToMultiline = (items: string[]) => (items.length > 0 ? items.join("\n") : "")

const splitToList = (value?: string) =>
  (value ?? "")
    .split(/[\n,]/)
    .map((item) => item.trim())
    .filter((item) => item.length > 0)

const parseNumeric = (value: string | number | undefined): number | undefined => {
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : undefined
  }
  const text = value?.trim()
  if (!text) {
    return undefined
  }
  const parsed = Number(text)
  return Number.isNaN(parsed) ? undefined : parsed
}

const parseCurrency = (value: FormValues["otherFee"]): number | null | undefined => {
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : undefined
  }
  const text = value?.trim()
  if (!text) {
    return undefined
  }
  const parsed = Number(text)
  if (Number.isNaN(parsed)) {
    return undefined
  }
  return parsed
}

const normalizeDiagramField = (value: DiagramFieldValue | undefined): BreastDiagram => {
  if (!value || typeof value !== "object") {
    return {}
  }

  const record = value as Record<string, unknown>
  const normalized: BreastDiagram = {}

  const rawImage = record.imageData
  if (typeof rawImage === "string" && rawImage.trim().length > 0 && rawImage.startsWith("data:image/")) {
    normalized.imageData = rawImage
  }

  let markerSource: Record<string, unknown> | undefined
  if (record.markers && typeof record.markers === "object" && !Array.isArray(record.markers)) {
    markerSource = record.markers as Record<string, unknown>
  } else {
    markerSource = record
  }

  if (markerSource) {
    const markerEntries = Object.entries(markerSource).filter(
      ([key, val]) =>
        key !== "imageData" &&
        key !== "markers" &&
        typeof key === "string" &&
        typeof val === "boolean" &&
        val === true,
    ) as Array<[string, true]>

    if (markerEntries.length > 0) {
      normalized.markers = Object.fromEntries(markerEntries)
    }
  }

  return normalized
}

const today = () => new Date().toISOString().slice(0, 10)

export function BreastCareChartForm({
  chart,
  onSubmit,
  onCancel,
  submitLabel = "カルテを保存",
}: BreastCareChartFormProps) {
  const defaultValues = useMemo<FormValues>(
    () => ({
      patientName: chart?.patientName ?? "",
      patientId: chart?.patientId ?? "",
      visitDate: chart?.visitDate ?? today(),
      practitionerName: chart?.practitionerName ?? "",
      traineeName: chart?.data.traineeName ?? "",
      chartNumber: chart?.data.chartNumber ?? "",
      memo: chart?.memo ?? "",
      bodyWeight:
        chart?.data.bodyWeight !== undefined && chart?.data.bodyWeight !== null
          ? String(chart.data.bodyWeight)
          : "",
      weightGainPerDay:
        chart?.data.weightGainPerDay !== undefined && chart?.data.weightGainPerDay !== null
          ? String(chart.data.weightGainPerDay)
          : "",
      clinicLocation: chart?.data.clinicLocation ?? [],
      breastMilkInterval: chart?.data.breastMilkInterval ?? "",
      milkVolumeDay: chart?.data.milkVolumeDay ?? "",
      milkVolumeNight: chart?.data.milkVolumeNight ?? "",
      formulaFeedsPerDay:
        chart?.data.formulaFeedsPerDay !== undefined && chart?.data.formulaFeedsPerDay !== null
          ? String(chart.data.formulaFeedsPerDay)
          : "",
      formulaVolumePerFeed: chart?.data.formulaVolumePerFeed ?? "",
      weaningFeedsPerDay:
        chart?.data.weaningFeedsPerDay !== undefined && chart?.data.weaningFeedsPerDay !== null
          ? String(chart.data.weaningFeedsPerDay)
          : "",
      weaningDetails: chart?.data.weaningDetails ?? "",
      stoolFrequency:
        chart?.data.stoolFrequency !== undefined && chart?.data.stoolFrequency !== null
          ? String(chart.data.stoolFrequency)
          : "",
      stoolConsistency: chart?.data.stoolConsistency ?? "",
      babyDevelopment: chart?.data.babyDevelopment ?? "",
      weaningStatus: chart?.data.weaningStatus ?? "",
      subjectiveNote: chart?.data.subjectiveNote ?? "",
      planNote: chart?.data.planNote ?? "",
      breastShape: chart?.data.breastShape ?? "",
      nippleShieldUsed: chart?.data.nippleShieldUsed ?? false,
      pumpingFrequency: chart?.data.pumpingFrequency ?? "",
      pumpingMethod: chart?.data.pumpingMethod ?? "",
      nippleAreolaConditionText: listToMultiline(chart?.data.nippleAreolaCondition ?? []),
      painLocationText: listToMultiline(chart?.data.painLocation ?? []),
      feedingPosition: chart?.data.feedingPosition ?? "",
      familySupportStatus: chart?.data.familySupportStatus ?? "",
      concerns: chart?.data.concerns ?? "",
      leftBreastCondition: chart?.data.leftBreastCondition ?? "",
      rightBreastCondition: chart?.data.rightBreastCondition ?? "",
      careDetails: chart?.data.careDetails ?? "",
      recommendations: chart?.data.recommendations ?? "",
      breastDiagramRight: chart?.data.breastDiagramRight ?? {},
      breastDiagramLeft: chart?.data.breastDiagramLeft ?? {},
      diagnosis: chart?.data.diagnosis ?? "",
      paymentMethod: chart?.data.paymentMethod ?? "",
      initialConsultationFee: chart?.data.initialConsultationFee ?? false,
      singleSessionFee: chart?.data.singleSessionFee ?? false,
      ticketFee: chart?.data.ticketFee ?? false,
      rentalTowelFee: chart?.data.rentalTowelFee ?? false,
      careTowelFee: chart?.data.careTowelFee ?? false,
      otherFee:
        chart?.data.otherFee !== undefined && chart?.data.otherFee !== null ? String(chart.data.otherFee) : "",
      otherFeeDescription: chart?.data.otherFeeDescription ?? "",
    }),
    [chart],
  )

  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues,
  })

  useEffect(() => {
    reset(defaultValues)
  }, [defaultValues, reset])

  const submitHandler = handleSubmit((values) => {
    const payload: ChartPayload & { chartType: "breast" } = {
      id: chart?.id,
      chartType: "breast",
      patientName: values.patientName,
      patientId: values.patientId?.trim() || undefined,
      visitDate: values.visitDate,
      practitionerName: values.practitionerName?.trim() || undefined,
      memo: values.memo?.trim() || undefined,
      data: {
        chartNumber: values.chartNumber?.trim() || undefined,
        traineeName: values.traineeName?.trim() || undefined,
        clinicLocation: values.clinicLocation ?? [],
        bodyWeight: parseNumeric(values.bodyWeight),
        weightGainPerDay: parseNumeric(values.weightGainPerDay),
        breastMilkInterval: values.breastMilkInterval?.trim() || undefined,
        milkVolumeDay: values.milkVolumeDay?.trim() || undefined,
        milkVolumeNight: values.milkVolumeNight?.trim() || undefined,
        formulaFeedsPerDay: parseNumeric(values.formulaFeedsPerDay),
        formulaVolumePerFeed: values.formulaVolumePerFeed?.trim() || undefined,
        weaningFeedsPerDay: parseNumeric(values.weaningFeedsPerDay),
        weaningDetails: values.weaningDetails?.trim() || undefined,
        stoolFrequency: parseNumeric(values.stoolFrequency),
        stoolConsistency: values.stoolConsistency?.trim() || undefined,
        babyDevelopment: values.babyDevelopment?.trim() || undefined,
        weaningStatus: values.weaningStatus?.trim() || undefined,
        subjectiveNote: values.subjectiveNote?.trim() || undefined,
        planNote: values.planNote?.trim() || undefined,
        breastShape: values.breastShape?.trim() || undefined,
        nippleShieldUsed: values.nippleShieldUsed ?? false,
        pumpingFrequency: values.pumpingFrequency?.trim() || undefined,
        pumpingMethod: values.pumpingMethod?.trim() || undefined,
        nippleAreolaCondition: splitToList(values.nippleAreolaConditionText),
        painLocation: splitToList(values.painLocationText),
        feedingPosition: values.feedingPosition?.trim() || undefined,
        familySupportStatus: values.familySupportStatus?.trim() || undefined,
        concerns: values.concerns?.trim() || undefined,
        leftBreastCondition: values.leftBreastCondition?.trim() || undefined,
        rightBreastCondition: values.rightBreastCondition?.trim() || undefined,
        careDetails: values.careDetails?.trim() || undefined,
        recommendations: values.recommendations?.trim() || undefined,
        breastDiagramRight: normalizeDiagramField(values.breastDiagramRight),
        breastDiagramLeft: normalizeDiagramField(values.breastDiagramLeft),
        diagnosis: values.diagnosis?.trim() || undefined,
        paymentMethod: values.paymentMethod?.trim() || undefined,
        initialConsultationFee: values.initialConsultationFee ?? false,
        singleSessionFee: values.singleSessionFee ?? false,
        ticketFee: values.ticketFee ?? false,
        rentalTowelFee: values.rentalTowelFee ?? false,
        careTowelFee: values.careTowelFee ?? false,
        otherFee: parseCurrency(values.otherFee),
        otherFeeDescription: values.otherFeeDescription?.trim() || undefined,
      },
    }

    onSubmit(payload)
  })

  return (
    <form onSubmit={submitHandler} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">基本情報</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div className="grid gap-2">
            <Label htmlFor="patientName">患者名 *</Label>
            <Input id="patientName" {...register("patientName")} placeholder="例: 山田 花子" />
            {errors.patientName && <p className="text-sm text-destructive">{errors.patientName.message}</p>}
          </div>
          <div className="grid gap-2">
            <Label htmlFor="patientId">患者ID</Label>
            <Input id="patientId" {...register("patientId")} placeholder="カルテID・内部IDなど" />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="visitDate">来院日 *</Label>
            <Input id="visitDate" type="date" {...register("visitDate")} />
            {errors.visitDate && <p className="text-sm text-destructive">{errors.visitDate.message}</p>}
          </div>
          <div className="grid gap-2">
            <Label htmlFor="chartNumber">カルテ番号</Label>
            <Input id="chartNumber" {...register("chartNumber")} />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="practitionerName">担当助産師</Label>
            <Input id="practitionerName" {...register("practitionerName")} />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="traineeName">研修生</Label>
            <Input id="traineeName" {...register("traineeName")} />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="bodyWeight">赤ちゃん体重 (g)</Label>
            <Input id="bodyWeight" type="number" inputMode="numeric" {...register("bodyWeight")} />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="weightGainPerDay">1日増加量 (g)</Label>
            <Input id="weightGainPerDay" type="number" inputMode="numeric" {...register("weightGainPerDay")} />
          </div>
          <div className="grid gap-2 md:col-span-2">
            <Label>場所</Label>
            <Controller
              name="clinicLocation"
              control={control}
              render={({ field }) => (
                <div className="flex flex-wrap gap-3">
                  {clinicLocationOptions.map((location) => {
                    const selected = field.value?.includes(location.value) ?? false
                    return (
                      <label key={location.value} className="flex items-center gap-2 text-sm">
                        <Checkbox
                          checked={selected}
                          onCheckedChange={(checked) => {
                            const isChecked = Boolean(checked)
                            const current = field.value ?? []
                            const next = isChecked
                              ? Array.from(new Set([...current, location.value]))
                              : current.filter((item) => item !== location.value)
                            field.onChange(next)
                          }}
                        />
                        {location.label}
                      </label>
                    )
                  })}
                </div>
              )}
            />
          </div>
          <div className="grid gap-2 md:col-span-2">
            <Label htmlFor="memo">メモ</Label>
            <Textarea id="memo" rows={2} {...register("memo")} placeholder="カルテ全体に関する補足など" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-xl">授乳・栄養情報</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div className="grid gap-2">
            <Label htmlFor="breastMilkInterval">母乳間隔</Label>
            <Input id="breastMilkInterval" {...register("breastMilkInterval")} placeholder="例: 3時間おき" />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="milkVolumeDay">ミルク（日中）</Label>
            <Input id="milkVolumeDay" {...register("milkVolumeDay")} placeholder="例: 80ml × 5回" />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="milkVolumeNight">ミルク（夜間）</Label>
            <Input id="milkVolumeNight" {...register("milkVolumeNight")} placeholder="例: 60ml × 2回" />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="formulaFeedsPerDay">1日のミルク回数</Label>
            <Input id="formulaFeedsPerDay" type="number" inputMode="numeric" {...register("formulaFeedsPerDay")} />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="formulaVolumePerFeed">搾母乳 / ミルク量</Label>
            <Input id="formulaVolumePerFeed" {...register("formulaVolumePerFeed")} placeholder="例: 50ml/回" />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="weaningFeedsPerDay">離乳食回数</Label>
            <Input id="weaningFeedsPerDay" type="number" inputMode="numeric" {...register("weaningFeedsPerDay")} />
          </div>
          <div className="grid gap-2 md:col-span-2">
            <Label htmlFor="weaningDetails">離乳食の内容</Label>
            <Textarea id="weaningDetails" rows={2} {...register("weaningDetails")} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-xl">排泄・発達状況</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div className="grid gap-2">
            <Label htmlFor="stoolFrequency">排便回数/日</Label>
            <Input id="stoolFrequency" type="number" inputMode="numeric" {...register("stoolFrequency")} />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="stoolConsistency">便性状</Label>
            <Input id="stoolConsistency" {...register("stoolConsistency")} placeholder="例: 黄色・やわらかい" />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="babyDevelopment">発達の様子</Label>
            <Textarea id="babyDevelopment" rows={3} {...register("babyDevelopment")} />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="weaningStatus">離乳の進み具合</Label>
            <Textarea id="weaningStatus" rows={3} {...register("weaningStatus")} />
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-xl">S) 主観的情報</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-2">
            <Textarea
              id="subjectiveNote"
              rows={6}
              {...register("subjectiveNote")}
              placeholder="主観的訴え・生活背景などを記録します"
            />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-xl">P) 計画</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-2">
            <Textarea
              id="planNote"
              rows={6}
              {...register("planNote")}
              placeholder="ケアの計画・指導予定などを記録します"
            />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-xl">乳房の状態・ケア</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="grid gap-3">
              <div className="grid gap-2">
                <Label htmlFor="breastShape">乳房の形</Label>
                <Input id="breastShape" {...register("breastShape")} />
              </div>
              <div className="flex items-center gap-2">
                <Controller
                  name="nippleShieldUsed"
                  control={control}
                  render={({ field }) => (
                    <Checkbox checked={field.value} onCheckedChange={(checked) => field.onChange(Boolean(checked))} />
                  )}
                />
                <Label htmlFor="nippleShieldUsed">ニップルシールド使用</Label>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="pumpingFrequency">搾乳頻度</Label>
                <Input id="pumpingFrequency" {...register("pumpingFrequency")} placeholder="例: 1日3回（手動）" />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="pumpingMethod">搾乳方法</Label>
                <Input id="pumpingMethod" {...register("pumpingMethod")} placeholder="例: 電動ポンプ" />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="nippleAreolaConditionText">乳頭・乳輪の状態</Label>
                <Textarea
                  id="nippleAreolaConditionText"
                  rows={3}
                  {...register("nippleAreolaConditionText")}
                  placeholder="1行につき1項目で入力してください"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="painLocationText">疼痛部位</Label>
                <Textarea
                  id="painLocationText"
                  rows={3}
                  {...register("painLocationText")}
                  placeholder="1行につき1部位で入力してください"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="feedingPosition">授乳姿勢</Label>
                <Input id="feedingPosition" {...register("feedingPosition")} placeholder="例: フットボール抱き" />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="familySupportStatus">家族などのサポート状況</Label>
                <Textarea id="familySupportStatus" rows={2} {...register("familySupportStatus")} />
              </div>
            </div>
            <div className="flex items-center justify-evenly">
              <Controller
                name="breastDiagramRight"
                control={control}
                render={({ field }) => <BreastDiagramInput side="right" value={field.value} onChange={field.onChange} />}
              />
              <Controller
                name="breastDiagramLeft"
                control={control}
                render={({ field }) => <BreastDiagramInput side="left" value={field.value} onChange={field.onChange} />}
              />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor="concerns">気になる点・相談内容</Label>
              <Textarea id="concerns" rows={3} {...register("concerns")} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="careDetails">ケア内容</Label>
              <Textarea id="careDetails" rows={3} {...register("careDetails")} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="leftBreastCondition">左乳房の状態</Label>
              <Textarea id="leftBreastCondition" rows={3} {...register("leftBreastCondition")} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="rightBreastCondition">右乳房の状態</Label>
              <Textarea id="rightBreastCondition" rows={3} {...register("rightBreastCondition")} />
            </div>
            <div className="grid gap-2 md:col-span-2">
              <Label htmlFor="recommendations">助言・次回までの課題</Label>
              <Textarea id="recommendations" rows={3} {...register("recommendations")} />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-xl">診断・会計</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-2">
            <Label htmlFor="diagnosis">診断</Label>
            <Textarea id="diagnosis" rows={4} {...register("diagnosis")} />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="paymentMethod">会計方法</Label>
            <Input id="paymentMethod" {...register("paymentMethod")} placeholder="例: 現金 / クレジット" />
          </div>
          <div className="flex flex-wrap gap-4">
            {feeOptions.map((option) => (
              <Controller
                key={option.name}
                name={option.name as keyof FormValues}
                control={control}
                render={({ field }) => (
                  <label className="flex items-center gap-2 text-sm">
                    <Checkbox checked={field.value as boolean} onCheckedChange={(checked) => field.onChange(Boolean(checked))} />
                    {option.label}
                  </label>
                )}
              />
            ))}
          </div>
          <div className="grid gap-2 md:grid-cols-[2fr,1fr] md:items-center">
            <div className="grid gap-2">
              <Label htmlFor="otherFeeDescription">その他（内容）</Label>
              <Input id="otherFeeDescription" {...register("otherFeeDescription")} placeholder="例: 物販" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="otherFee">金額</Label>
              <Input id="otherFee" type="number" inputMode="numeric" {...register("otherFee")} placeholder="例: 1500" />
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex justify-end gap-3">
          <Button type="button" variant="outline" onClick={onCancel}>
            キャンセル
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "保存中..." : submitLabel}
          </Button>
        </CardFooter>
      </Card>
    </form>
  )
}
