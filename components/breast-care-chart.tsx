"use client"

import { useEffect } from "react"
import { useForm, Controller } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { getBreastCareChartByAppointmentId, upsertBreastCareChart } from "@/app/actions/breast-care-actions"
import type { Tables } from "@/lib/supabase/database.types"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { toast } from "sonner"
import { BreastDiagramInput } from "./breast-diagram-input"

type Appointment = Tables<"appointments"> & {
  questionnaires: Tables<"questionnaires"> | null
  service_types: Tables<"service_types"> | null
}

interface BreastCareChartProps {
  appointment: Appointment
  onClose: () => void
}

const chartSchema = z.object({
  id: z.number().optional(),
  appointment_id: z.number(),
  no: z.string().optional().nullable(),
  visit_date: z.string().optional().nullable(),
  clinic_location: z.array(z.string()).optional().nullable(),
  practitioner_name: z.string().optional().nullable(),
  trainee_name: z.string().optional().nullable(),
  body_weight: z.coerce.number().optional().nullable(),
  weight_gain_per_day: z.coerce.number().optional().nullable(),
  breast_milk_interval: z.string().optional().nullable(),
  milk_volume_day: z.string().optional().nullable(),
  milk_volume_night: z.string().optional().nullable(),
  formula_feeds_per_day: z.coerce.number().optional().nullable(),
  formula_volume_per_feed: z.string().optional().nullable(),
  weaning_feeds_per_day: z.coerce.number().optional().nullable(),
  weaning_details: z.string().optional().nullable(),
  stool_frequency: z.coerce.number().optional().nullable(),
  stool_consistency: z.string().optional().nullable(),
  baby_development: z.string().optional().nullable(),
  weaning_status: z.string().optional().nullable(),
  s_text: z.string().optional().nullable(),
  p_text: z.string().optional().nullable(),
  breast_shape: z.string().optional().nullable(),
  nipple_shield_used: z.boolean().optional().nullable(),
  pumping_frequency: z.coerce.number().optional().nullable(),
  pumping_method: z.string().optional().nullable(),
  nipple_areola_condition: z.array(z.string()).optional().nullable(),
  pain_location: z.array(z.string()).optional().nullable(),
  feeding_position: z.string().optional().nullable(),
  family_support_status: z.string().optional().nullable(),
  diagnosis: z.string().optional().nullable(),
  payment_method: z.string().optional().nullable(),
  initial_consultation_fee: z.boolean().optional().nullable(),
  single_session_fee: z.boolean().optional().nullable(),
  ticket_fee: z.boolean().optional().nullable(),
  rental_towel_fee: z.boolean().optional().nullable(),
  care_towel_fee: z.boolean().optional().nullable(),
  other_fee: z.coerce.number().optional().nullable(),
  other_fee_description: z.string().optional().nullable(),
  breast_diagram_right: z.any().optional().nullable(),
  breast_diagram_left: z.any().optional().nullable(),
})

type ChartFormData = z.infer<typeof chartSchema>

export function BreastCareChart({ appointment, onClose }: BreastCareChartProps) {
  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { isSubmitting, errors },
  } = useForm<ChartFormData>({
    resolver: zodResolver(chartSchema),
  })

  useEffect(() => {
    async function fetchChartData() {
      const { data: chartData, error } = await getBreastCareChartByAppointmentId(appointment.id)
      if (error) {
        toast.error("カルテ情報の読み込みに失敗しました。")
        // Initialize with questionnaire data even if fetch fails
        const questionnaire = appointment.questionnaires
        reset({
          appointment_id: appointment.id,
          visit_date: new Date(appointment.start_time).toLocaleDateString("ja-JP"),
          clinic_location: questionnaire?.visit_locations || [],
        })
      } else if (chartData) {
        reset(chartData as ChartFormData)
      } else {
        // No existing chart, pre-fill from questionnaire
        const questionnaire = appointment.questionnaires
        reset({
          appointment_id: appointment.id,
          visit_date: new Date(appointment.start_time).toLocaleDateString("ja-JP"),
          clinic_location: questionnaire?.visit_locations || [],
          // Add other pre-fill fields here if needed
        })
      }
    }
    fetchChartData()
  }, [appointment, reset])

  const onSubmit = async (formData: ChartFormData) => {
    const { error } = await upsertBreastCareChart(formData)
    if (error) {
      toast.error("カルテの保存に失敗しました。", { description: error })
    } else {
      toast.success("カルテを保存しました。")
      onClose()
    }
  }

  const questionnaire = appointment.questionnaires

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <Card className="w-full">
        <CardHeader>
          <CardTitle>すいな法乳房ケアカルテ</CardTitle>
          <div className="text-sm text-muted-foreground">
            {questionnaire?.child_last_name} {questionnaire?.child_first_name} 様 (
            {new Date(appointment.start_time).toLocaleString("ja-JP")})
          </div>
        </CardHeader>
        <CardContent className="space-y-6 max-h-[70vh] overflow-y-auto p-4">
          {/* Basic Info */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <Label>No.</Label>
              <Input {...register("no")} />
            </div>
            <div>
              <Label>日付</Label>
              <Input {...register("visit_date")} />
            </div>
            <div>
              <Label>担当者</Label>
              <Input {...register("practitioner_name")} />
            </div>
            <div>
              <Label>研修生</Label>
              <Input {...register("trainee_name")} />
            </div>
          </div>

          {/* Feeding Info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">授乳情報</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>母乳間隔</Label>
                  <Input {...register("breast_milk_interval")} placeholder="例: 2-3時間" />
                </div>
                <div>
                  <Label>ミルク(日中)</Label>
                  <Input {...register("milk_volume_day")} placeholder="例: 3回 80ml" />
                </div>
                <div>
                  <Label>ミルク(夜中)</Label>
                  <Input {...register("milk_volume_night")} placeholder="例: 1回 100ml" />
                </div>
                <div>
                  <Label>搾母乳</Label>
                  <Input {...register("formula_volume_per_feed")} placeholder="例: 2回 50ml" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Subjective / Plan */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>S) 主観的情報</Label>
              <Textarea {...register("s_text")} rows={5} />
            </div>
            <div>
              <Label>P) 計画</Label>
              <Textarea {...register("p_text")} rows={5} />
            </div>
          </div>

          {/* Breast Condition & Diagram */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-4">
              <Controller
                name="breast_shape"
                control={control}
                render={({ field }) => (
                  <RadioGroup onValueChange={field.onChange} value={field.value || ""} className="flex space-x-4">
                    <Label>乳房の形:</Label>
                    {["I型", "IIa型", "IIb型", "III型"].map((type) => (
                      <div key={type} className="flex items-center space-x-2">
                        <RadioGroupItem value={type} id={`shape-${type}`} />
                        <Label htmlFor={`shape-${type}`}>{type}</Label>
                      </div>
                    ))}
                  </RadioGroup>
                )}
              />
              <div className="flex items-center space-x-2">
                <Controller
                  name="nipple_shield_used"
                  control={control}
                  render={({ field }) => <Checkbox checked={field.value || false} onCheckedChange={field.onChange} />}
                />
                <Label>ニップル使用</Label>
              </div>
              <div>
                <Label>搾乳</Label>
                <Input {...register("pumping_frequency")} placeholder="例: 1日3回 (手動・電動)" />
              </div>
              <div>
                <Label>乳頭・乳輪の状態</Label>
                <Input {...register("nipple_areola_condition")} placeholder="例: 白斑, 亀裂" />
              </div>
              <div>
                <Label>疼痛</Label>
                <Input {...register("pain_location")} placeholder="例: 乳輪, 乳頭" />
              </div>
              <div>
                <Label>授乳姿勢</Label>
                <Input {...register("feeding_position")} />
              </div>
              <div>
                <Label>家族などのサポート状況</Label>
                <Textarea {...register("family_support_status")} />
              </div>
            </div>
            <div className="flex justify-around">
              <Controller
                name="breast_diagram_right"
                control={control}
                render={({ field }) => <BreastDiagramInput side="right" {...field} />}
              />
              <Controller
                name="breast_diagram_left"
                control={control}
                render={({ field }) => <BreastDiagramInput side="left" {...field} />}
              />
            </div>
          </div>

          {/* Diagnosis & Payment */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">乳房診断・会計</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>診断</Label>
                <Textarea {...register("diagnosis")} />
              </div>
              <div className="flex flex-wrap gap-4">
                <Controller
                  name="initial_consultation_fee"
                  control={control}
                  render={({ field }) => (
                    <div className="flex items-center space-x-2">
                      <Checkbox checked={field.value || false} onCheckedChange={field.onChange} />
                      <Label>初診料 1,000円</Label>
                    </div>
                  )}
                />
                <Controller
                  name="single_session_fee"
                  control={control}
                  render={({ field }) => (
                    <div className="flex items-center space-x-2">
                      <Checkbox checked={field.value || false} onCheckedChange={field.onChange} />
                      <Label>1回 5,500円</Label>
                    </div>
                  )}
                />
                <Controller
                  name="ticket_fee"
                  control={control}
                  render={({ field }) => (
                    <div className="flex items-center space-x-2">
                      <Checkbox checked={field.value || false} onCheckedChange={field.onChange} />
                      <Label>チケット 14,850円</Label>
                    </div>
                  )}
                />
                <Controller
                  name="rental_towel_fee"
                  control={control}
                  render={({ field }) => (
                    <div className="flex items-center space-x-2">
                      <Checkbox checked={field.value || false} onCheckedChange={field.onChange} />
                      <Label>レンタルタオル 350円</Label>
                    </div>
                  )}
                />
                <Controller
                  name="care_towel_fee"
                  control={control}
                  render={({ field }) => (
                    <div className="flex items-center space-x-2">
                      <Checkbox checked={field.value || false} onCheckedChange={field.onChange} />
                      <Label>ケアタオル 250円</Label>
                    </div>
                  )}
                />
              </div>
              <div className="flex items-center gap-2">
                <Label>その他</Label>
                <Input {...register("other_fee_description")} placeholder="内容" className="w-1/3" />
                <Input type="number" {...register("other_fee")} placeholder="金額" className="w-1/4" />
              </div>
            </CardContent>
          </Card>
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
