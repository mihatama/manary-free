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
    return null
  }

  const normalized = Number(text.replace(/,/g, ""))
  if (Number.isNaN(normalized)) {
    return undefined
  }
  return normalized
}

const normalizeDiagramField = (value: DiagramFieldValue | undefined): BreastDiagram => {
  if (!value || typeof value !== "object") {
    return {}
  }

  const record = value as Record<string, unknown>
  const normalized: BreastDiagram = {}

  if (typeof record.imageData === "string" && record.imageData.startsWith("data:image/")) {
    normalized.imageData = record.imageData
  }

  const markers = record.markers
  if (markers && typeof markers === "object" && !Array.isArray(markers)) {
    normalized.markers = Object.entries(markers)
      .filter((entry): entry is [string, boolean] => typeof entry[0] === "string" && typeof entry[1] === "boolean")
      .reduce<Record<string, boolean>>((acc, [key, val]) => {
        if (val) {
          acc[key] = true
        }
        return acc
      }, {})
  }

  return normalized
}

const normalizeClinicLocation = (value: FormValues["clinicLocation"] | string | undefined): string[] => {
  if (Array.isArray(value)) {
    return value.filter((item) => typeof item === "string" && item.trim().length > 0)
  }
  if (typeof value === "string") {
    return splitToList(value)
  }
  return []
}

const normalizeBoolean = (value: unknown) => (typeof value === "boolean" ? value : false)

type PaymentSummaryProps = {
  formValues: FormValues
}

function PaymentSummary({ formValues }: PaymentSummaryProps) {
  const {
    initialConsultationFee,
    singleSessionFee,
    ticketFee,
    rentalTowelFee,
    careTowelFee,
    otherFee,
    otherFeeDescription,
  } = formValues

  const entry = useMemo(() => {
    const items = []
    if (initialConsultationFee) {
      items.push("初診料 1,000円")
    }
    if (singleSessionFee) {
      items.push("1回 5,500円")
    }
    if (ticketFee) {
      items.push("チケット 14,850円")
    }
    if (rentalTowelFee) {
      items.push("レンタルタオル 350円")
    }
    if (careTowelFee) {
      items.push("ケアタオル 250円")
    }
    if (typeof otherFee === "number" && Number.isFinite(otherFee)) {
      const description = otherFeeDescription?.trim()
      items.push(`その他 ${description ? `（${description}）` : ""}${otherFee.toLocaleString()}円`)
    }
    return items.join("\n")
  }, [
    careTowelFee,
    initialConsultationFee,
    otherFee,
    otherFeeDescription,
    rentalTowelFee,
    singleSessionFee,
    ticketFee,
  ])

  return (
    <div className="rounded-md border border-dashed p-3">
      <div className="text-xs font-semibold text-muted-foreground">会計サマリー</div>
      <div className="mt-1 whitespace-pre-wrap text-sm">{entry || "未選択"}</div>
    </div>
  )
}

function normalizeFormValues(values: FormValues, existing?: BreastCareChartRecord) {
  const chart: BreastCareChartRecord = {
    id: existing?.id ?? values.chartNumber ?? "",
    chartType: "breast",
    patientName: values.patientName,
    patientId: values.patientId?.trim() || undefined,
    visitDate: values.visitDate,
    practitionerName: values.practitionerName?.trim() || undefined,
    chartNumber: values.chartNumber?.trim() || undefined,
    memo: values.memo?.trim() || undefined,
    data: {
      traineeName: values.traineeName?.trim() || undefined,
      clinicLocation: normalizeClinicLocation(values.clinicLocation),
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
      nippleShieldUsed: normalizeBoolean(values.nippleShieldUsed),
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
      initialConsultationFee: normalizeBoolean(values.initialConsultationFee),
      singleSessionFee: normalizeBoolean(values.singleSessionFee),
      ticketFee: normalizeBoolean(values.ticketFee),
      rentalTowelFee: normalizeBoolean(values.rentalTowelFee),
      careTowelFee: normalizeBoolean(values.careTowelFee),
      otherFee: parseCurrency(values.otherFee),
      otherFeeDescription: values.otherFeeDescription?.trim() || undefined,
    },
    createdAt: existing?.createdAt ?? new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }

  return chart
}

type FieldProps = {
  label: string
  description?: string
  error?: string
  children: React.ReactNode
}

function FieldWrapper({ label, description, error, children }: FieldProps) {
  return (
    <div className="grid gap-2">
      <Label className="text-sm font-semibold text-foreground">{label}</Label>
      {description ? <p className="text-xs text-muted-foreground">{description}</p> : null}
      {children}
      {error ? <p className="text-xs text-destructive">{error}</p> : null}
    </div>
  )
}

export function BreastCareChartForm({
  chart,
  onSubmit,
  onCancel,
  submitLabel = "保存する",
}: BreastCareChartFormProps) {
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: chart
      ? {
          patientName: chart.patientName,
          patientId: chart.patientId ?? "",
          visitDate: chart.visitDate,
          practitionerName: chart.practitionerName ?? "",
          traineeName: chart.data.traineeName ?? "",
          chartNumber: chart.data.chartNumber ?? "",
          memo: chart.memo ?? "",
          bodyWeight: chart.data.bodyWeight ?? undefined,
          weightGainPerDay: chart.data.weightGainPerDay ?? undefined,
          clinicLocation: chart.data.clinicLocation ?? [],
          breastMilkInterval: chart.data.breastMilkInterval ?? "",
          milkVolumeDay: chart.data.milkVolumeDay ?? "",
          milkVolumeNight: chart.data.milkVolumeNight ?? "",
          formulaFeedsPerDay: chart.data.formulaFeedsPerDay ?? undefined,
          formulaVolumePerFeed: chart.data.formulaVolumePerFeed ?? "",
          weaningFeedsPerDay: chart.data.weaningFeedsPerDay ?? undefined,
          weaningDetails: chart.data.weaningDetails ?? "",
          stoolFrequency: chart.data.stoolFrequency ?? undefined,
          stoolConsistency: chart.data.stoolConsistency ?? "",
          babyDevelopment: chart.data.babyDevelopment ?? "",
          weaningStatus: chart.data.weaningStatus ?? "",
          subjectiveNote: chart.data.subjectiveNote ?? "",
          planNote: chart.data.planNote ?? "",
          breastShape: chart.data.breastShape ?? "",
          nippleShieldUsed: chart.data.nippleShieldUsed ?? false,
          pumpingFrequency: chart.data.pumpingFrequency ?? "",
          pumpingMethod: chart.data.pumpingMethod ?? "",
          nippleAreolaConditionText: listToMultiline(chart.data.nippleAreolaCondition ?? []),
          painLocationText: listToMultiline(chart.data.painLocation ?? []),
          feedingPosition: chart.data.feedingPosition ?? "",
          familySupportStatus: chart.data.familySupportStatus ?? "",
          concerns: chart.data.concerns ?? "",
          leftBreastCondition: chart.data.leftBreastCondition ?? "",
          rightBreastCondition: chart.data.rightBreastCondition ?? "",
          careDetails: chart.data.careDetails ?? "",
          recommendations: chart.data.recommendations ?? "",
          breastDiagramRight: chart.data.breastDiagramRight ?? {},
          breastDiagramLeft: chart.data.breastDiagramLeft ?? {},
          diagnosis: chart.data.diagnosis ?? "",
          paymentMethod: chart.data.paymentMethod ?? "",
          initialConsultationFee: chart.data.initialConsultationFee ?? false,
          singleSessionFee: chart.data.singleSessionFee ?? false,
          ticketFee: chart.data.ticketFee ?? false,
          rentalTowelFee: chart.data.rentalTowelFee ?? false,
          careTowelFee: chart.data.careTowelFee ?? false,
          otherFee: chart.data.otherFee ?? undefined,
          otherFeeDescription: chart.data.otherFeeDescription ?? "",
        }
      : {
          visitDate: new Date().toISOString().slice(0, 10),
          clinicLocation: [],
          initialConsultationFee: true,
          singleSessionFee: true,
          rentalTowelFee: true,
          careTowelFee: true,
        },
  })

  const {
    register,
    control,
    handleSubmit,
    watch,
    resetField,
    formState: { errors, isSubmitting },
  } = form

  const clinicLocationValue = watch("clinicLocation")
  const nippleShieldUsedValue = watch("nippleShieldUsed")
  const pumpingFrequencyValue = watch("pumpingFrequency")
  const pumpingMethodValue = watch("pumpingMethod")
  const nippleAreolaConditionTextValue = watch("nippleAreolaConditionText")
  const painLocationTextValue = watch("painLocationText")
  const feedingPositionValue = watch("feedingPosition")
  const familySupportStatusValue = watch("familySupportStatus")

  const paymentSummary = useMemo(() => <PaymentSummary formValues={form.getValues()} />, [form])

  useEffect(() => {
    if (!chart) {
      return
    }

    if (!chart.data.breastDiagramRight) {
      resetField("breastDiagramRight", { defaultValue: {} })
    }
    if (!chart.data.breastDiagramLeft) {
      resetField("breastDiagramLeft", { defaultValue: {} })
    }
  }, [chart, resetField])

  const submit = handleSubmit((values) => {
    const normalized = normalizeFormValues(values, chart)
    onSubmit({
      ...normalized,
      chartType: "breast",
    })
  })

  const formatInputValue = (value?: string) => (value && value.trim().length > 0 ? value : "未入力")

  return (
    <form onSubmit={submit} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">{chart ? "乳房ケアカルテを編集" : "乳房ケアカルテを作成"}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <FieldWrapper label="患者名" error={errors.patientName?.message}>
              <Input {...register("patientName")} placeholder="例: 山田 花子" />
            </FieldWrapper>
            <FieldWrapper label="ID">
              <Input {...register("patientId")} placeholder="例: PATIENT-001" />
            </FieldWrapper>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <FieldWrapper label="来院日" error={errors.visitDate?.message}>
              <Input type="date" {...register("visitDate")} />
            </FieldWrapper>
            <FieldWrapper label="担当助産師">
              <Input {...register("practitionerName")} placeholder="例: 佐藤 仁美" />
            </FieldWrapper>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <FieldWrapper label="研修生">
              <Input {...register("traineeName")} placeholder="例: 研修生A" />
            </FieldWrapper>
            <FieldWrapper label="カルテ番号">
              <Input {...register("chartNumber")} placeholder="例: BC-401" />
            </FieldWrapper>
          </div>

          <FieldWrapper label="メモ">
            <Textarea rows={3} {...register("memo")} placeholder="メモを入力してください" />
          </FieldWrapper>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-xl">授乳・栄養</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <FieldWrapper label="母乳間隔">
              <Input {...register("breastMilkInterval")} placeholder="例: 3時間ごと" />
            </FieldWrapper>
            <FieldWrapper label="ミルク（日中）">
              <Input {...register("milkVolumeDay")} placeholder="例: 80ml × 5回" />
            </FieldWrapper>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <FieldWrapper label="ミルク（夜間）">
              <Input {...register("milkVolumeNight")} placeholder="例: 60ml × 2回" />
            </FieldWrapper>
            <FieldWrapper label="搾母乳 / ミルク量">
              <Input {...register("formulaVolumePerFeed")} placeholder="例: 40ml/回" />
            </FieldWrapper>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <FieldWrapper label="ミルク回数 / 日">
              <Input {...register("formulaFeedsPerDay")} placeholder="例: 2" inputMode="numeric" />
            </FieldWrapper>
            <FieldWrapper label="離乳食回数 / 日">
              <Input {...register("weaningFeedsPerDay")} placeholder="例: 1" inputMode="numeric" />
            </FieldWrapper>
          </div>

          <FieldWrapper label="離乳食の内容">
            <Textarea rows={3} {...register("weaningDetails")} placeholder="例: 10倍粥、にんじんピューレ" />
          </FieldWrapper>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-xl">赤ちゃん情報</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <FieldWrapper label="体重(g)">
              <Input {...register("bodyWeight")} placeholder="例: 3600" inputMode="numeric" />
            </FieldWrapper>
            <FieldWrapper label="1日増加量(g)">
              <Input {...register("weightGainPerDay")} placeholder="例: 30" inputMode="numeric" />
            </FieldWrapper>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <FieldWrapper label="便の回数 / 日">
              <Input {...register("stoolFrequency")} placeholder="例: 5" inputMode="numeric" />
            </FieldWrapper>
            <FieldWrapper label="便の性状">
              <Input {...register("stoolConsistency")} placeholder="例: 粘土状・やわらかめ" />
            </FieldWrapper>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <FieldWrapper label="発達の様子">
              <Textarea rows={3} {...register("babyDevelopment")} placeholder="例: 首すわり良好。おしゃぶりを好む" />
            </FieldWrapper>
            <FieldWrapper label="離乳の進み具合">
              <Textarea rows={3} {...register("weaningStatus")} placeholder="例: 初期。まだ少量ずつ" />
            </FieldWrapper>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-xl">乳房ケア情報</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <FieldWrapper label="乳房の形">
              <Input {...register("breastShape")} placeholder="例: 円錐状" />
            </FieldWrapper>
            <FieldWrapper label="ニップルシールド使用">
              <div className="flex items-center gap-2">
                <Checkbox checked={nippleShieldUsedValue} onCheckedChange={(checked) => form.setValue("nippleShieldUsed", Boolean(checked))} />
                <span>使用している</span>
              </div>
            </FieldWrapper>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <FieldWrapper label="搾乳頻度">
              <Input {...register("pumpingFrequency")} placeholder="例: 1日2回（手動）" />
            </FieldWrapper>
            <FieldWrapper label="搾乳方法">
              <Input {...register("pumpingMethod")} placeholder="例: 手動ポンプ" />
            </FieldWrapper>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <FieldWrapper label="乳頭・乳輪の状態">
              <Textarea
                rows={3}
                {...register("nippleAreolaConditionText")}
                placeholder="1行につき1項目を入力してください"
              />
            </FieldWrapper>
            <FieldWrapper label="疼痛部位">
              <Textarea rows={3} {...register("painLocationText")} placeholder="1行につき1部位を入力してください" />
            </FieldWrapper>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <FieldWrapper label="授乳姿勢">
              <Input {...register("feedingPosition")} placeholder="例: フットボール抱き" />
            </FieldWrapper>
            <FieldWrapper label="家族などのサポート状況">
              <Textarea rows={2} {...register("familySupportStatus")} placeholder="例: 夫が夜間対応をサポート" />
            </FieldWrapper>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-xl">乳房図</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <FieldWrapper label="乳頭・乳輪の状態（入力欄）">
              <p className="text-sm text-muted-foreground">
                下記の入力欄でまとめた内容が自動で反映されます。手入力したい場合はチェックを外してください。
              </p>
            </FieldWrapper>
            <FieldWrapper label="テキスト入力">
              <Textarea
                rows={3}
                {...register("nippleAreolaConditionText")}
                placeholder="カンマや改行で区切って入力してください例: 軽度の亀裂, 乾燥気味"
              />
            </FieldWrapper>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <FieldWrapper label="疼痛部位（入力欄）">
              <p className="text-sm text-muted-foreground">
                1行につき1項目を入力してください。例: 右乳輪上部
              </p>
            </FieldWrapper>
            <FieldWrapper label="テキスト入力">
              <Textarea rows={3} {...register("painLocationText")} placeholder="例: 右乳輪上部" />
            </FieldWrapper>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <FieldWrapper label="授乳姿勢">
              <Input {...register("feedingPosition")} placeholder="例: フットボール抱き" />
            </FieldWrapper>
            <FieldWrapper label="家族などのサポート状況">
              <Textarea rows={2} {...register("familySupportStatus")} />
            </FieldWrapper>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <FieldWrapper label="乳房図（右）">
              <Controller
                name="breastDiagramRight"
                control={control}
                render={({ field }) => (
                  <BreastDiagramInput side="right" value={field.value} onChange={field.onChange} />
                )}
              />
            </FieldWrapper>
            <FieldWrapper label="乳房図（左）">
              <Controller
                name="breastDiagramLeft"
                control={control}
                render={({ field }) => (
                  <BreastDiagramInput side="left" value={field.value} onChange={field.onChange} />
                )}
              />
            </FieldWrapper>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-xl">相談・ケア内容</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <FieldWrapper label="気になる点・相談内容">
              <Textarea rows={3} {...register("concerns")} />
            </FieldWrapper>
            <FieldWrapper label="ケア内容">
              <Textarea rows={3} {...register("careDetails")} />
            </FieldWrapper>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <FieldWrapper label="左乳房の状態">
              <Textarea rows={3} {...register("leftBreastCondition")} />
            </FieldWrapper>
            <FieldWrapper label="右乳房の状態">
              <Textarea rows={3} {...register("rightBreastCondition")} />
            </FieldWrapper>
          </div>

          <FieldWrapper label="助言・次回までの課題">
            <Textarea rows={3} {...register("recommendations")} />
          </FieldWrapper>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-xl">診断・会計</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <FieldWrapper label="診断">
            <Textarea rows={4} {...register("diagnosis")} />
          </FieldWrapper>
          <FieldWrapper label="会計方法">
            <Input {...register("paymentMethod")} placeholder="例: 現金 / クレジット" />
          </FieldWrapper>
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
          <div className="grid gap-4 md:grid-cols-[2fr,1fr] md:items-center">
            <FieldWrapper label="その他（内容）">
              <Input {...register("otherFeeDescription")} placeholder="例: 物販" />
            </FieldWrapper>
            <FieldWrapper label="金額">
              <Input type="number" inputMode="numeric" {...register("otherFee")} placeholder="例: 1500" />
            </FieldWrapper>
          </div>
          {paymentSummary}
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
