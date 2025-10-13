"use client"

import { useEffect, useRef } from "react"
import { Controller, useFieldArray, useForm } from "react-hook-form"
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"

import type { BreastCareChartRecord, BreastDiagram, ChartPayload, ChartFeeItem } from "@/lib/chart-types"

import { BreastDiagramInput } from "./breast-diagram-input"

type FeeFormItem = {
  label: string
  price?: string | number | null
  selected?: boolean
}

const DEFAULT_FEE_ITEMS: FeeFormItem[] = [
  { label: "初診料", price: 1000, selected: true },
  { label: "1回", price: 5500, selected: true },
  { label: "チケット", price: 14850, selected: false },
  { label: "レンタルタオル", price: 350, selected: true },
  { label: "ケアタオル", price: 250, selected: true },
]

const feeItemSchema = z.object({
  label: z.string().min(1, "項目名を入力してください"),
  price: z.union([z.string(), z.number(), z.null()]).optional(),
  selected: z.boolean().optional().default(true),
})

const breastDiagramFieldSchema = z
  .union([
    z.object({
      imageData: z.string().optional().nullable(),
      markers: z.record(z.boolean()).optional(),
    }),
    z.record(z.boolean()),
  ])
  .default({})

const numericField = z.union([z.string(), z.number()]).optional()

const formSchema = z.object({
  patientName: z.string().min(1, "患者名は必須です"),
  patientId: z.string().optional(),
  visitDate: z.string().min(1, "来院日は必須です"),
  practitionerName: z.string().optional(),
  traineeName: z.string().optional(),
  chartNumber: z.string().optional(),
  memo: z.string().optional(),
  childName: z.string().optional(),
  childBirthDate: z.string().optional(),
  childAgeYears: numericField,
  childAgeMonths: numericField,
  childAgeDays: numericField,
  clinicLocation: z.string().optional(),
  breastMilkInterval: z.string().optional(),
  breastMilkIntervalDay: z.string().optional(),
  breastMilkIntervalNight: z.string().optional(),
  bodyWeight: numericField,
  weightGainPerDay: numericField,
  milkVolumeDay: z.string().optional(),
  milkVolumeNight: z.string().optional(),
  formulaFeedsPerDay: numericField,
  formulaFeedsDaytime: numericField,
  formulaFeedsNighttime: numericField,
  formulaVolumePerFeed: z.string().optional(),
  expressedMilkFrequency: numericField,
  expressedMilkVolumePerFeed: numericField,
  weaningFeedsPerDay: numericField,
  weaningDetails: z.string().optional(),
  stoolFrequency: numericField,
  urinationFrequency: numericField,
  stoolConsistency: z.string().optional(),
  babyDevelopment: z.string().optional(),
  weaningStatus: z.string().optional(),
  weaningCompletionDay: z.string().optional(),
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
  fees: z.array(feeItemSchema).default([]),
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
    .split(/[\n,、]/)
    .map((item) => item.trim())
    .filter((item) => item.length > 0)

const parseNumeric = (value: string | number | null | undefined): number | undefined => {
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : undefined
  }
  const text = value?.toString().trim()
  if (!text) {
    return undefined
  }
  const parsed = Number(text.replace(/,/g, ""))
  return Number.isNaN(parsed) ? undefined : parsed
}

const calculateAge = (birthDate: string, referenceDate: string) => {
  if (!birthDate || !referenceDate) {
    return null
  }

  const birth = new Date(`${birthDate}T00:00:00`)
  const reference = new Date(`${referenceDate}T00:00:00`)

  if (Number.isNaN(birth.getTime()) || Number.isNaN(reference.getTime()) || reference < birth) {
    return null
  }

  let years = reference.getFullYear() - birth.getFullYear()
  let months = reference.getMonth() - birth.getMonth()
  let days = reference.getDate() - birth.getDate()

  if (days < 0) {
    months -= 1
    const previousMonthLastDay = new Date(reference.getFullYear(), reference.getMonth(), 0).getDate()
    days += previousMonthLastDay
  }

  if (months < 0) {
    years -= 1
    months += 12
  }

  if (years < 0) {
    return null
  }

  return { years, months, days }
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

const normalizeBoolean = (value: unknown) => (typeof value === "boolean" ? value : false)

const normalizeFeesFromForm = (fees: FormValues["fees"]): ChartFeeItem[] => {
  if (!fees) {
    return []
  }

  return fees
    .map((fee) => {
      const label = fee.label?.trim()
      const price = parseNumeric(fee.price ?? undefined)
      const selected = normalizeBoolean(fee.selected)

      if (!label && price === undefined && !selected) {
        return null
      }

      return {
        label: label ?? "",
        price: price ?? null,
        selected,
      }
    })
    .filter((item): item is ChartFeeItem => item !== null)
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
      childName: values.childName?.trim() || undefined,
      childBirthDate: values.childBirthDate?.trim() || undefined,
      childAgeYears: parseNumeric(values.childAgeYears),
      childAgeMonths: parseNumeric(values.childAgeMonths),
      childAgeDays: parseNumeric(values.childAgeDays),
      clinicLocation: values.clinicLocation?.trim() || undefined,
      bodyWeight: parseNumeric(values.bodyWeight),
      weightGainPerDay: parseNumeric(values.weightGainPerDay),
      breastMilkInterval: values.breastMilkInterval?.trim() || undefined,
      breastMilkIntervalDay: values.breastMilkIntervalDay?.trim() || undefined,
      breastMilkIntervalNight: values.breastMilkIntervalNight?.trim() || undefined,
      milkVolumeDay: values.milkVolumeDay?.trim() || undefined,
      milkVolumeNight: values.milkVolumeNight?.trim() || undefined,
      formulaFeedsPerDay: parseNumeric(values.formulaFeedsPerDay),
      formulaFeedsDaytime: parseNumeric(values.formulaFeedsDaytime),
      formulaFeedsNighttime: parseNumeric(values.formulaFeedsNighttime),
      formulaVolumePerFeed: values.formulaVolumePerFeed?.trim() || undefined,
      expressedMilkFrequency: parseNumeric(values.expressedMilkFrequency),
      expressedMilkVolumePerFeed: parseNumeric(values.expressedMilkVolumePerFeed),
      weaningFeedsPerDay: parseNumeric(values.weaningFeedsPerDay),
      weaningDetails: values.weaningDetails?.trim() || undefined,
      stoolFrequency: parseNumeric(values.stoolFrequency),
      urinationFrequency: parseNumeric(values.urinationFrequency),
      stoolConsistency: values.stoolConsistency?.trim() || undefined,
      babyDevelopment: values.babyDevelopment?.trim() || undefined,
      weaningStatus: values.weaningStatus?.trim() || undefined,
      weaningCompletionDay: values.weaningCompletionDay?.trim() || undefined,
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
      fees: normalizeFeesFromForm(values.fees),
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

type PaymentSummaryProps = {
  formValues: FormValues
}

function PaymentSummary({ formValues }: PaymentSummaryProps) {
  const items = (formValues.fees ?? [])
    .filter((item) => item.selected)
    .map((item) => {
      const label = item.label?.trim() || "項目"
      const priceValue = parseNumeric(item.price ?? undefined)
      const priceText = priceValue !== undefined ? ` ${priceValue.toLocaleString()}円` : ""
      return `${label}${priceText}`
    })

  return (
    <div className="rounded-md border border-dashed p-3">
      <div className="text-xs font-semibold text-muted-foreground">会計サマリー</div>
      <div className="mt-1 whitespace-pre-wrap text-sm">{items.length > 0 ? items.join("\n") : "未選択"}</div>
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
          childName: chart.data.childName ?? "",
          childBirthDate: chart.data.childBirthDate ?? "",
          childAgeYears: chart.data.childAgeYears ?? undefined,
          childAgeMonths: chart.data.childAgeMonths ?? undefined,
          childAgeDays: chart.data.childAgeDays ?? undefined,
          chartNumber: chart.data.chartNumber ?? "",
          memo: chart.memo ?? "",
          clinicLocation: chart.data.clinicLocation ?? "",
          breastMilkInterval: chart.data.breastMilkInterval ?? "",
          breastMilkIntervalDay: chart.data.breastMilkIntervalDay ?? "",
          breastMilkIntervalNight: chart.data.breastMilkIntervalNight ?? "",
          bodyWeight: chart.data.bodyWeight ?? undefined,
          weightGainPerDay: chart.data.weightGainPerDay ?? undefined,
          milkVolumeDay: chart.data.milkVolumeDay ?? "",
          milkVolumeNight: chart.data.milkVolumeNight ?? "",
          formulaFeedsPerDay: chart.data.formulaFeedsPerDay ?? undefined,
          formulaFeedsDaytime: chart.data.formulaFeedsDaytime ?? undefined,
          formulaFeedsNighttime: chart.data.formulaFeedsNighttime ?? undefined,
          formulaVolumePerFeed: chart.data.formulaVolumePerFeed ?? "",
          expressedMilkFrequency: chart.data.expressedMilkFrequency ?? undefined,
          expressedMilkVolumePerFeed: chart.data.expressedMilkVolumePerFeed ?? undefined,
          weaningFeedsPerDay: chart.data.weaningFeedsPerDay ?? undefined,
          weaningDetails: chart.data.weaningDetails ?? "",
          stoolFrequency: chart.data.stoolFrequency ?? undefined,
          urinationFrequency: chart.data.urinationFrequency ?? undefined,
          stoolConsistency: chart.data.stoolConsistency ?? "",
          babyDevelopment: chart.data.babyDevelopment ?? "",
          weaningStatus: chart.data.weaningStatus ?? "",
          weaningCompletionDay: chart.data.weaningCompletionDay ?? "",
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
          fees:
            chart.data.fees && chart.data.fees.length > 0
              ? chart.data.fees.map((fee) => ({
                  label: fee.label,
                  price: fee.price ?? "",
                  selected: fee.selected ?? true,
                }))
              : DEFAULT_FEE_ITEMS,
        }
      : {
          visitDate: new Date().toISOString().slice(0, 10),
          clinicLocation: "",
          childName: "",
          childBirthDate: "",
          nippleShieldUsed: false,
          fees: DEFAULT_FEE_ITEMS,
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

  const { fields: feeFields, append: appendFee, remove: removeFee } = useFieldArray({
    control,
    name: "fees",
  })

  const childBirthDateValue = watch("childBirthDate")
  const visitDateValue = watch("visitDate")
  const previousBirthDateRef = useRef<string | undefined>(chart?.data.childBirthDate ?? undefined)

  useEffect(() => {
    const updateField = (field: "childAgeYears" | "childAgeMonths" | "childAgeDays", value: number | undefined) => {
      const current = form.getValues(field)
      const normalized = value ?? undefined
      if (current !== normalized) {
        form.setValue(field, normalized as any, { shouldDirty: false, shouldValidate: false })
      }
    }

    if (!childBirthDateValue) {
      if (previousBirthDateRef.current) {
        updateField("childAgeYears", undefined)
        updateField("childAgeMonths", undefined)
        updateField("childAgeDays", undefined)
      }
      previousBirthDateRef.current = undefined
      return
    }

    if (visitDateValue) {
      const age = calculateAge(childBirthDateValue, visitDateValue)
      if (age) {
        updateField("childAgeYears", age.years)
        updateField("childAgeMonths", age.months)
        updateField("childAgeDays", age.days)
        previousBirthDateRef.current = childBirthDateValue
        return
      }
    }

    updateField("childAgeYears", undefined)
    updateField("childAgeMonths", undefined)
    updateField("childAgeDays", undefined)
    previousBirthDateRef.current = childBirthDateValue
  }, [childBirthDateValue, visitDateValue, form])

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

  const nippleShieldUsedValue = watch("nippleShieldUsed")
  const watchedValues = watch()

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
          <CardTitle className="text-xl">{chart ? "乳房ケアカルテ編集" : "乳房ケアカルテ作成"}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <FieldWrapper label="患者" error={errors.patientName?.message}>
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
            <FieldWrapper label="担��助産師">
              <Input {...register("practitionerName")} placeholder="例: 佐藤 仁美" />
            </FieldWrapper>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <FieldWrapper label="研修者">
              <Input {...register("traineeName")} placeholder="例: 研修生A" />
            </FieldWrapper>
            <FieldWrapper label="カルテ番号">
              <Input {...register("chartNumber")} placeholder="例: BC-401" />
            </FieldWrapper>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <FieldWrapper label="お子様の氏名">
              <Input {...register("childName")} placeholder="例: 山田 太郎" />
            </FieldWrapper>
            <FieldWrapper label="お子様の生年月日">
              <Input type="date" {...register("childBirthDate")} />
            </FieldWrapper>
          </div>
          <FieldWrapper label="年齢（歳・か月・日目）">
            <div className="grid grid-cols-3 gap-2">
              <Input
                {...register("childAgeYears")}
                inputMode="numeric"
                placeholder="歳"
                aria-label="年齢（歳）"
                readOnly
              />
              <Input
                {...register("childAgeMonths")}
                inputMode="numeric"
                placeholder="か月"
                aria-label="年齢（か月）"
                readOnly
              />
              <Input
                {...register("childAgeDays")}
                inputMode="numeric"
                placeholder="日目"
                aria-label="年齢（日目）"
                readOnly
              />
            </div>
          </FieldWrapper>
          <FieldWrapper label="場所">
            <Input {...register("clinicLocation")} placeholder="例: 宝塁E/ 訪問（西宮市）など自由記�E" />
          </FieldWrapper>
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
            <FieldWrapper label="授乳間隔（備考）">
              <Input {...register("breastMilkInterval")} placeholder="例: 3時間ごと" />
            </FieldWrapper>
            <FieldWrapper label="授乳間隔（日中）">
              <Input {...register("breastMilkIntervalDay")} placeholder="例: 2〜3時間 / 8回" />
            </FieldWrapper>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <FieldWrapper label="授乳間隔（夜間）">
              <Input {...register("breastMilkIntervalNight")} placeholder="例: 3〜4時間 / 3回" />
            </FieldWrapper>
            <FieldWrapper label="搾乳回数 / 日">
              <Input {...register("expressedMilkFrequency")} inputMode="numeric" placeholder="例: 2" />
            </FieldWrapper>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <FieldWrapper label="搾乳量 / 回 (ml)">
              <Input {...register("expressedMilkVolumePerFeed")} inputMode="numeric" placeholder="例: 80" />
            </FieldWrapper>
            <FieldWrapper label="調乳 / ミルク量">
              <Input {...register("formulaVolumePerFeed")} placeholder="例: 40ml/回" />
            </FieldWrapper>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <FieldWrapper label="ミルク量（日中）">
              <Input {...register("milkVolumeDay")} placeholder="例: 80ml × 5回" />
            </FieldWrapper>
            <FieldWrapper label="ミルク量（夜間）">
              <Input {...register("milkVolumeNight")} placeholder="例: 60ml × 2回" />
            </FieldWrapper>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <FieldWrapper label="ミルク回数 / 日">
              <Input {...register("formulaFeedsPerDay")} inputMode="numeric" placeholder="例: 7" />
            </FieldWrapper>
            <FieldWrapper label="ミルク回数（日中）">
              <Input {...register("formulaFeedsDaytime")} inputMode="numeric" placeholder="例: 5" />
            </FieldWrapper>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <FieldWrapper label="ミルク回数（夜間）">
              <Input {...register("formulaFeedsNighttime")} inputMode="numeric" placeholder="例: 2" />
            </FieldWrapper>
            <FieldWrapper label="離乳食回数 / 日">
              <Input {...register("weaningFeedsPerDay")} inputMode="numeric" placeholder="例: 1" />
            </FieldWrapper>
          </div>
          <FieldWrapper label="離乳食の内容">
            <Textarea rows={3} {...register("weaningDetails")} placeholder="例: 10倍粥、にんじんピューレ" />
          </FieldWrapper>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-xl">赤ちめE��惁E��</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <FieldWrapper label="体重 (g)">
              <Input {...register("bodyWeight")} inputMode="numeric" placeholder="例: 3600" />
            </FieldWrapper>
            <FieldWrapper label="1日増加釁E(g)">
              <Input {...register("weightGainPerDay")} inputMode="numeric" placeholder="例: 30" />
            </FieldWrapper>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <FieldWrapper label="排便回数 / 日">
              <Input {...register("stoolFrequency")} inputMode="numeric" placeholder="例: 6" />
            </FieldWrapper>
            <FieldWrapper label="排尿回数 / 日">
              <Input {...register("urinationFrequency")} inputMode="numeric" placeholder="例: 8" />
            </FieldWrapper>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <FieldWrapper label="便性状">
              <Input {...register("stoolConsistency")} placeholder="例: 粘土状〜やわらかめ" />
            </FieldWrapper>
            <FieldWrapper label="卒乳 / 断乳 日目">
              <Input {...register("weaningCompletionDay")} placeholder="例: 産征E0日目" />
            </FieldWrapper>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <FieldWrapper label="発達状況">
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
          <CardTitle className="text-xl">乳房ケアの状況</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <FieldWrapper label="乳房の形">
              <Input {...register("breastShape")} placeholder="例: 冁E��状" />
            </FieldWrapper>
            <FieldWrapper label="ニップルシールド使用">
              <div className="flex items-center gap-2">
                <Checkbox checked={nippleShieldUsedValue} onCheckedChange={(checked) => form.setValue("nippleShieldUsed", Boolean(checked))} />
                <span>使用してぁE��</span>
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
                placeholder="1行につき1項目で入力してください。例: 軽度の亀裂 など"
              />
            </FieldWrapper>
            <FieldWrapper label="痛み部位">
              <Textarea rows={3} {...register("painLocationText")} placeholder="例: 右乳輪上部" />
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

          <div className="grid gap-4 md:grid-cols-2">
            <FieldWrapper label="乳房図（右）">
              <Controller
                name="breastDiagramRight"
                control={control}
                render={({ field }) => <BreastDiagramInput side="right" value={field.value} onChange={field.onChange} />}
              />
            </FieldWrapper>
            <FieldWrapper label="乳房図（左）">
              <Controller
                name="breastDiagramLeft"
                control={control}
                render={({ field }) => <BreastDiagramInput side="left" value={field.value} onChange={field.onChange} />}
              />
            </FieldWrapper>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <FieldWrapper label="気になる点・相諁E�E容">
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

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">S) 主観情報</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="whitespace-pre-wrap text-sm">{formatInputValue(watch("subjectiveNote"))}</p>
            <Textarea className="mt-3" rows={4} {...register("subjectiveNote")} placeholder="S) 主観情報を記�E" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">P) 計画</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="whitespace-pre-wrap text-sm">{formatInputValue(watch("planNote"))}</p>
            <Textarea className="mt-3" rows={4} {...register("planNote")} placeholder="P) 計画を記入" />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-xl">診断・会計</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-2">
            <Label htmlFor="diagnosis">診断</Label>
            <Textarea id="diagnosis" rows={4} {...register("diagnosis")} />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="paymentMethod">会計方法</Label>
            <Input id="paymentMethod" {...register("paymentMethod")} placeholder="例: 現金 / カード / PayPay" />
          </div>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-semibold">会計項目</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => appendFee({ label: "", price: "", selected: true })}
              >
                項目を追加
              </Button>
            </div>
            {feeFields.length === 0 ? (
              <p className="text-sm text-muted-foreground">会計項目は未登録です。必要に応じて追加してください。</p>
            ) : (
              feeFields.map((field, index) => (
                <div key={field.id} className="grid gap-2 md:grid-cols-[2fr,1fr,auto] md:items-center">
                  <div>
                    <Input
                      {...register(`fees.${index}.label` as const)}
                      placeholder="項目名"
                    />
                    {errors.fees?.[index]?.label ? (
                      <p className="text-xs text-destructive">{errors.fees[index]?.label?.message}</p>
                    ) : null}
                  </div>
                  <Input
                    {...register(`fees.${index}.price` as const)}
                    inputMode="numeric"
                    placeholder="金額（円）"
                  />
                  <div className="flex items-center gap-2">
                    <Controller
                      name={`fees.${index}.selected` as const}
                      control={control}
                      render={({ field }) => (
                        <label className="flex items-center gap-2 text-sm">
                          <Checkbox checked={Boolean(field.value)} onCheckedChange={(checked) => field.onChange(Boolean(checked))} />
                          適用
                        </label>
                      )}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeFee(index)}
                      disabled={feeFields.length === 1}
                    >
                      削除
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
          <PaymentSummary formValues={watchedValues} />
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
