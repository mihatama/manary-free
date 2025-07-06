"use client"

import { useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { getPostpartumCareChartByAppointmentId, upsertPostpartumCareChart } from "@/app/actions/postpartum-care-actions"
import type { Tables } from "@/lib/supabase/database.types"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { toast } from "sonner"

type Appointment = Tables<"reservations"> & {
  questionnaires: Tables<"questionnaires"> | null
}

interface PostpartumCareChartProps {
  appointment: Appointment
  onClose: () => void
  user: {
    id: string
    name: string | null
    email: string | undefined
  }
}

const chartSchema = z.object({
  id: z.number().optional(),
  reservation_id: z.number(),
  patient_id: z.number(),
  visit_date: z.string(),
  practitioner_name: z.string().optional().nullable(),
  mother_condition: z.string().optional().nullable(),
  lochia_status: z.string().optional().nullable(),
  episiotomy_pain: z.string().optional().nullable(),
  constipation_status: z.string().optional().nullable(),
  mental_state: z.string().optional().nullable(),
  family_support: z.string().optional().nullable(),
  baby_condition: z.string().optional().nullable(),
  jaundice_level: z.string().optional().nullable(),
  umbilical_cord_status: z.string().optional().nullable(),
  feeding_status: z.string().optional().nullable(),
  care_plan: z.string().optional().nullable(),
  guidance: z.string().optional().nullable(),
  payment_details: z.string().optional().nullable(),
  weeks_postpartum: z.coerce.number().optional().nullable(),
  physical_condition: z.string().optional().nullable(),
  mental_condition: z.string().optional().nullable(),
  care_provided: z.string().optional().nullable(),
})

export function PostpartumCareChart({ appointment, onClose, user }: PostpartumCareChartProps) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { isSubmitting },
  } = useForm<z.infer<typeof chartSchema>>({
    resolver: zodResolver(chartSchema),
  })

  useEffect(() => {
    async function fetchChartData() {
      try {
        const { data: chartData, error } = await getPostpartumCareChartByAppointmentId(appointment.id)
        if (error) {
          toast.error("産後ケアカルテの読み込みに失敗しました。")
        }

        const questionnaire = appointment.questionnaires

        const baseData = {
          reservation_id: appointment.id,
          patient_id: appointment.patient_id,
          visit_date: new Date(appointment.start_time).toLocaleDateString("ja-JP"),
          practitioner_name: user.name || "",
        }

        let questionnaireData: Partial<z.infer<typeof chartSchema>> = {}
        if (questionnaire?.data && typeof questionnaire.data === "object") {
          const qData = questionnaire.data as any
          questionnaireData = {
            mother_condition: qData.notes || "",
          }
        }

        const finalData = {
          ...questionnaireData,
          ...(chartData || {}),
          ...baseData,
        }

        reset(finalData as z.infer<typeof chartSchema>)
      } catch (e) {
        console.error("Error fetching chart data:", e)
        toast.error("産後ケアカルテの読み込み中にエラーが発生しました。")
      }
    }
    fetchChartData()
  }, [appointment, reset, user])

  const onSubmit = async (formData: z.infer<typeof chartSchema>) => {
    try {
      const { error } = await upsertPostpartumCareChart(formData)
      if (error) {
        toast.error("カルテの保存に失敗しました。", { description: error })
      } else {
        toast.success("カルテを保存しました。")
        onClose()
      }
    } catch (error) {
      console.error("Error saving chart:", error)
      toast.error("カルテの保存中にエラーが発生しました。")
    }
  }

  const questionnaireData =
    appointment.questionnaires?.data && typeof appointment.questionnaires.data === "object"
      ? (appointment.questionnaires.data as any)
      : {}

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <Card className="w-full">
        <CardHeader>
          <CardTitle>産後ケアカルテ</CardTitle>
          <div className="text-sm text-muted-foreground">
            {questionnaireData?.mother_last_name} {questionnaireData?.mother_first_name} 様 (
            {new Date(appointment.start_time).toLocaleString("ja-JP")})
          </div>
        </CardHeader>
        <CardContent className="space-y-6 max-h-[70vh] overflow-y-auto p-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <Label>日付</Label>
              <Input {...register("visit_date")} readOnly />
            </div>
            <div>
              <Label>担当者</Label>
              <Input {...register("practitioner_name")} readOnly />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">お母さんの状態</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>全身状態・バイタル</Label>
                  <Textarea {...register("mother_condition")} />
                </div>
                <div>
                  <Label>悪露</Label>
                  <Input {...register("lochia_status")} />
                </div>
                <div>
                  <Label>会陰切開・帝王切開の傷</Label>
                  <Input {...register("episiotomy_pain")} />
                </div>
                <div>
                  <Label>便秘</Label>
                  <Input {...register("constipation_status")} />
                </div>
                <div>
                  <Label>精神状態</Label>
                  <Textarea {...register("mental_state")} />
                </div>
                <div>
                  <Label>家族のサポート</Label>
                  <Textarea {...register("family_support")} />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">赤ちゃんの状態</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>全身状態・バイタル</Label>
                  <Textarea {...register("baby_condition")} />
                </div>
                <div>
                  <Label>黄疸</Label>
                  <Input {...register("jaundice_level")} />
                </div>
                <div>
                  <Label>臍帯</Label>
                  <Input {...register("umbilical_cord_status")} />
                </div>
                <div>
                  <Label>授乳・哺乳状況</Label>
                  <Textarea {...register("feeding_status")} />
                </div>
              </CardContent>
            </Card>
          </div>

          <div>
            <Label>ケアプラン</Label>
            <Textarea {...register("care_plan")} rows={4} />
          </div>
          <div>
            <Label>指導内容</Label>
            <Textarea {...register("guidance")} rows={4} />
          </div>
          <div>
            <Label>会計</Label>
            <Input {...register("payment_details")} placeholder="例: チケット1回分" />
          </div>
        </CardContent>
        <CardFooter className="flex justify-end space-x-2">
          <Button type="button" variant="outline" onClick={onClose}>
            キャンセル
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "保存中..." : "カルテを保存"}
          </Button>
        </CardFooter>
      </Card>
    </form>
  )
}
