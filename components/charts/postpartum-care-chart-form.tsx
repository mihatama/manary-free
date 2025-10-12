"use client"

import { useEffect, useMemo } from "react"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"

import type { ChartPayload, PostpartumCareChartRecord } from "@/lib/chart-types"

const formSchema = z.object({
  patientName: z.string().min(1, "患者名は必須です"),
  patientId: z.string().optional(),
  visitDate: z.string().min(1, "来院日は必須です"),
  practitionerName: z.string().optional(),
  memo: z.string().optional(),
  weeksPostpartum: z.union([z.string(), z.number()]).optional(),
  motherCondition: z.string().optional(),
  lochiaStatus: z.string().optional(),
  episiotomyPain: z.string().optional(),
  constipationStatus: z.string().optional(),
  physicalCondition: z.string().optional(),
  mentalCondition: z.string().optional(),
  mentalState: z.string().optional(),
  familySupport: z.string().optional(),
  careProvided: z.string().optional(),
  babyCondition: z.string().optional(),
  jaundiceLevel: z.string().optional(),
  umbilicalCordStatus: z.string().optional(),
  feedingStatus: z.string().optional(),
  carePlan: z.string().optional(),
  guidance: z.string().optional(),
  paymentDetails: z.string().optional(),
})

type FormValues = z.infer<typeof formSchema>

type PostpartumCareChartFormProps = {
  chart?: PostpartumCareChartRecord
  onSubmit: (payload: ChartPayload & { chartType: "postpartum" }) => void
  onCancel: () => void
  submitLabel?: string
}

const today = () => new Date().toISOString().slice(0, 10)

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

export function PostpartumCareChartForm({
  chart,
  onSubmit,
  onCancel,
  submitLabel = "カルテを保存",
}: PostpartumCareChartFormProps) {
  const defaultValues = useMemo<FormValues>(
    () => ({
      patientName: chart?.patientName ?? "",
      patientId: chart?.patientId ?? "",
      visitDate: chart?.visitDate ?? today(),
      practitionerName: chart?.practitionerName ?? "",
      memo: chart?.memo ?? "",
      weeksPostpartum:
        chart?.data.weeksPostpartum !== undefined && chart?.data.weeksPostpartum !== null
          ? String(chart.data.weeksPostpartum)
          : "",
      motherCondition: chart?.data.motherCondition ?? "",
      lochiaStatus: chart?.data.lochiaStatus ?? "",
      episiotomyPain: chart?.data.episiotomyPain ?? "",
      constipationStatus: chart?.data.constipationStatus ?? "",
      physicalCondition: chart?.data.physicalCondition ?? "",
      mentalCondition: chart?.data.mentalCondition ?? "",
      mentalState: chart?.data.mentalState ?? "",
      familySupport: chart?.data.familySupport ?? "",
      careProvided: chart?.data.careProvided ?? "",
      babyCondition: chart?.data.babyCondition ?? "",
      jaundiceLevel: chart?.data.jaundiceLevel ?? "",
      umbilicalCordStatus: chart?.data.umbilicalCordStatus ?? "",
      feedingStatus: chart?.data.feedingStatus ?? "",
      carePlan: chart?.data.carePlan ?? "",
      guidance: chart?.data.guidance ?? "",
      paymentDetails: chart?.data.paymentDetails ?? "",
    }),
    [chart],
  )

  const {
    register,
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
    const payload: ChartPayload & { chartType: "postpartum" } = {
      id: chart?.id,
      chartType: "postpartum",
      patientName: values.patientName,
      patientId: values.patientId?.trim() || undefined,
      visitDate: values.visitDate,
      practitionerName: values.practitionerName?.trim() || undefined,
      memo: values.memo?.trim() || undefined,
      data: {
        weeksPostpartum: parseNumeric(values.weeksPostpartum),
        motherCondition: values.motherCondition?.trim() || undefined,
        lochiaStatus: values.lochiaStatus?.trim() || undefined,
        episiotomyPain: values.episiotomyPain?.trim() || undefined,
        constipationStatus: values.constipationStatus?.trim() || undefined,
        physicalCondition: values.physicalCondition?.trim() || undefined,
        mentalCondition: values.mentalCondition?.trim() || undefined,
        mentalState: values.mentalState?.trim() || undefined,
        familySupport: values.familySupport?.trim() || undefined,
        careProvided: values.careProvided?.trim() || undefined,
        babyCondition: values.babyCondition?.trim() || undefined,
        jaundiceLevel: values.jaundiceLevel?.trim() || undefined,
        umbilicalCordStatus: values.umbilicalCordStatus?.trim() || undefined,
        feedingStatus: values.feedingStatus?.trim() || undefined,
        carePlan: values.carePlan?.trim() || undefined,
        guidance: values.guidance?.trim() || undefined,
        paymentDetails: values.paymentDetails?.trim() || undefined,
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
            <Input id="patientName" {...register("patientName")} placeholder="例: 佐藤 真理" />
            {errors.patientName && <p className="text-sm text-destructive">{errors.patientName.message}</p>}
          </div>
          <div className="grid gap-2">
            <Label htmlFor="patientId">患者ID</Label>
            <Input id="patientId" {...register("patientId")} placeholder="カルテIDや予約IDなど" />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="visitDate">来院日 *</Label>
            <Input id="visitDate" type="date" {...register("visitDate")} />
            {errors.visitDate && <p className="text-sm text-destructive">{errors.visitDate.message}</p>}
          </div>
          <div className="grid gap-2">
            <Label htmlFor="practitionerName">担当助産師</Label>
            <Input id="practitionerName" {...register("practitionerName")} />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="weeksPostpartum">産後週数</Label>
            <Input id="weeksPostpartum" type="number" inputMode="numeric" {...register("weeksPostpartum")} />
          </div>
          <div className="grid gap-2 md:col-span-2">
            <Label htmlFor="memo">メモ</Label>
            <Textarea id="memo" rows={2} {...register("memo")} placeholder="カルテ全体に関する補足など" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-xl">お母さんの状態</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div className="grid gap-2">
            <Label htmlFor="motherCondition">全身状態・バイタル</Label>
            <Textarea id="motherCondition" rows={3} {...register("motherCondition")} />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="lochiaStatus">悪露</Label>
            <Textarea id="lochiaStatus" rows={3} {...register("lochiaStatus")} />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="episiotomyPain">会陰切開・帝王切開の状態</Label>
            <Textarea id="episiotomyPain" rows={3} {...register("episiotomyPain")} />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="constipationStatus">便秘</Label>
            <Textarea id="constipationStatus" rows={3} {...register("constipationStatus")} />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="physicalCondition">身体的コンディション</Label>
            <Textarea id="physicalCondition" rows={3} {...register("physicalCondition")} />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="mentalCondition">心理面の状態</Label>
            <Textarea id="mentalCondition" rows={3} {...register("mentalCondition")} />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="mentalState">メンタルチェック（気分の変動など）</Label>
            <Textarea id="mentalState" rows={3} {...register("mentalState")} />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="familySupport">家族のサポート</Label>
            <Textarea id="familySupport" rows={3} {...register("familySupport")} />
          </div>
          <div className="grid gap-2 md:col-span-2">
            <Label htmlFor="careProvided">実施したケア・フォロー内容</Label>
            <Textarea id="careProvided" rows={3} {...register("careProvided")} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-xl">赤ちゃんの状態</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div className="grid gap-2">
            <Label htmlFor="babyCondition">全身状態・バイタル</Label>
            <Textarea id="babyCondition" rows={3} {...register("babyCondition")} />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="jaundiceLevel">黄疸</Label>
            <Textarea id="jaundiceLevel" rows={3} {...register("jaundiceLevel")} />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="umbilicalCordStatus">臍帯の状態</Label>
            <Textarea id="umbilicalCordStatus" rows={3} {...register("umbilicalCordStatus")} />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="feedingStatus">授乳・哺乳状況</Label>
            <Textarea id="feedingStatus" rows={3} {...register("feedingStatus")} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-xl">ケアプラン・指導内容</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="carePlan">ケアプラン</Label>
            <Textarea id="carePlan" rows={3} {...register("carePlan")} />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="guidance">指導内容</Label>
            <Textarea id="guidance" rows={3} {...register("guidance")} />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="paymentDetails">会計</Label>
            <Textarea id="paymentDetails" rows={3} {...register("paymentDetails")} />
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
