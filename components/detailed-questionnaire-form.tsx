"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { CSRFForm } from "@/components/csrf-form"
import { submitAndLinkQuestionnaire } from "@/app/actions/questionnaire-actions"
import type { Database } from "@/lib/supabase/database.types"
import { format } from "date-fns"

type AppointmentWithRelations = Database["public"]["Tables"]["appointments"]["Row"] & {
  clinics: Database["public"]["Tables"]["clinics"]["Row"] | null
  service_types: Database["public"]["Tables"]["service_types"]["Row"] | null
}

interface DetailedQuestionnaireFormProps {
  appointment: AppointmentWithRelations
}

// Helper component for form sections
const FormSection = ({
  title,
  description,
  children,
}: { title: string; description?: string; children: React.ReactNode }) => (
  <Card>
    <CardHeader>
      <CardTitle className="text-xl text-[#f8a0a0]">{title}</CardTitle>
      {description && <CardDescription>{description}</CardDescription>}
    </CardHeader>
    <CardContent className="space-y-6">{children}</CardContent>
  </Card>
)

// Helper for input fields
const FormField = ({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) => (
  <div className="space-y-2">
    <Label>
      {label} {required && <span className="text-red-500">*</span>}
    </Label>
    {children}
  </div>
)

export function DetailedQuestionnaireForm({ appointment }: DetailedQuestionnaireFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  const [lastName, firstName] = appointment.patient_name.split(/ |　/)

  const handleSubmit = async (formData: FormData) => {
    setIsSubmitting(true)
    setError(null)

    formData.append("appointment_id", String(appointment.id))
    formData.append("appointment_token", appointment.token)
    formData.append("phone_number", appointment.patient_phone)

    try {
      const result = await submitAndLinkQuestionnaire(formData)

      if (!result.success) {
        throw new Error(result.error || "問診票の送信に失敗しました")
      }

      router.push(`/reservation/questionnaire/success`)
    } catch (err) {
      setError(err instanceof Error ? err.message : "問診票の送信中にエラーが発生しました")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <CSRFForm action={handleSubmit} className="space-y-8">
      <FormSection title="基本情報">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField label="記入年月日" required>
            <Input name="entry_date" type="date" defaultValue={format(new Date(), "yyyy-MM-dd")} />
          </FormField>
        </div>
        {/* Mother's Info */}
        <div className="space-y-2">
          <p className="font-semibold">ご本人様</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField label="氏名（姓）" required>
              <Input name="mother_last_name" placeholder="山田" defaultValue={lastName} />
            </FormField>
            <FormField label="氏名（名）" required>
              <Input name="mother_first_name" placeholder="花子" defaultValue={firstName} />
            </FormField>
            <FormField label="フリガナ（セイ）" required>
              <Input name="mother_last_name_kana" placeholder="ヤマダ" />
            </FormField>
            <FormField label="フリガナ（メイ）" required>
              <Input name="mother_first_name_kana" placeholder="ハナコ" />
            </FormField>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
            <FormField label="生年月日" required>
              <div className="flex items-center gap-2">
                <Input name="mother_birth_year" type="number" placeholder="1990" className="w-24" />
                <Label>年</Label>
                <Input name="mother_birth_month" type="number" placeholder="1" className="w-16" />
                <Label>月</Label>
                <Input name="mother_birth_day" type="number" placeholder="1" className="w-16" />
                <Label>日</Label>
              </div>
            </FormField>
            <FormField label="年齢">
              <div className="flex items-center gap-2">
                <Input name="mother_age" type="number" placeholder="30" className="w-20" />
                <Label>才</Label>
              </div>
            </FormField>
          </div>
        </div>
        {/* Child's Info */}
        <div className="space-y-2">
          <p className="font-semibold">お子様</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField label="お名前（姓）">
              <Input name="child_last_name" placeholder="山田" />
            </FormField>
            <FormField label="お名前（名）">
              <Input name="child_first_name" placeholder="太郎" />
            </FormField>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
            <FormField label="生年月日">
              <div className="flex items-center gap-2">
                <Input name="child_birth_year" type="number" placeholder="2024" className="w-24" />
                <Label>年</Label>
                <Input name="child_birth_month" type="number" placeholder="4" className="w-16" />
                <Label>月</Label>
                <Input name="child_birth_day" type="number" placeholder="1" className="w-16" />
                <Label>日</Label>
              </div>
            </FormField>
            <FormField label="性別">
              <RadioGroup name="child_gender" className="flex space-x-4">
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="男" id="male" />
                  <Label htmlFor="male">男</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="女" id="female" />
                  <Label htmlFor="female">女</Label>
                </div>
              </RadioGroup>
            </FormField>
          </div>
        </div>
        {/* Occupation */}
        <FormField label="ご職業">
          <div className="flex flex-wrap gap-x-4 gap-y-2">
            <div className="flex items-center space-x-2">
              <Checkbox id="shufu" name="occupation_type_shufu" />
              <Label htmlFor="shufu">主婦</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox id="kaishain" name="occupation_type_kaishain" />
              <Label htmlFor="kaishain">会社員</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox id="part" name="occupation_type_part" />
              <Label htmlFor="part">パート</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox id="arubaito" name="occupation_type_arubaito" />
              <Label htmlFor="arubaito">アルバイト</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox id="jieigyo" name="occupation_type_jieigyo" />
              <Label htmlFor="jieigyo">自営業</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox id="other_occupation" name="occupation_type_other" />
              <Label htmlFor="other_occupation">その他</Label>
            </div>
          </div>
          <Input name="occupation_other_text" placeholder="その他ご職業" className="mt-2" />
        </FormField>
        {/* Address & Contact */}
        <FormField label="住所（自宅）">
          <Input name="address_home" />
        </FormField>
        <FormField label="住所（実家）">
          <Input name="address_parents" />
        </FormField>
        <FormField label="連絡先（携帯電話）" required>
          <Input name="phone_number" defaultValue={appointment.patient_phone} />
        </FormField>
      </FormSection>

      <FormSection title="家族構成">
        <div className="grid grid-cols-3 gap-2 font-semibold text-sm border-b pb-2">
          <div>氏名</div>
          <div>年齢</div>
          <div>その他</div>
        </div>
        <div className="grid grid-cols-3 gap-2 items-center">
          <div className="flex items-center gap-2">
            <Label className="w-8">夫</Label>
            <Input name="husband_name" />
          </div>
          <div>
            <Input name="husband_age" type="number" />
          </div>
          <div>
            <Input name="husband_other" />
          </div>
        </div>
        <div className="grid grid-cols-3 gap-2 items-center">
          <div className="flex items-center gap-2">
            <Label className="w-8">子</Label>
            <Input name="child_1_name" />
          </div>
          <div>
            <Input name="child_1_age" type="number" />
          </div>
          <div>
            <Input name="child_1_other" />
          </div>
        </div>
        <div className="grid grid-cols-3 gap-2 items-center">
          <div className="flex items-center gap-2">
            <Label className="w-8">子</Label>
            <Input name="child_2_name" />
          </div>
          <div>
            <Input name="child_2_age" type="number" />
          </div>
          <div>
            <Input name="child_2_other" />
          </div>
        </div>
      </FormSection>

      <FormSection title="既往歴" description="大きな病気・手術・けが">
        <Textarea name="medical_history" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex items-center space-x-2">
            <Checkbox id="allergy_check" name="has_allergy" />
            <Label htmlFor="allergy_check">アレルギー</Label>
            <Input name="allergy_details" placeholder="アレルギー詳細" />
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox id="medication_check" name="has_medication" />
            <Label htmlFor="medication_check">内服中の薬</Label>
            <Input name="medication_details" placeholder="薬の詳細" />
          </div>
        </div>
      </FormSection>

      <FormSection title="妊娠・分娩の様子">
        <FormField label="妊娠の様子">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div className="flex items-center space-x-2">
              <Checkbox id="preg_natural" name="preg_natural" />
              <Label htmlFor="preg_natural">自然妊娠</Label>
            </div>
            <div className="flex items-center space-x-2 col-span-2">
              <Checkbox id="preg_ivf" name="preg_ivf" />
              <Label htmlFor="preg_ivf">不妊治療</Label>
              <Input name="preg_ivf_details" placeholder="詳細" />
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox id="preg_premature" name="preg_premature" />
              <Label htmlFor="preg_premature">切迫早産</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox id="preg_hypertension" name="preg_hypertension" />
              <Label htmlFor="preg_hypertension">妊娠高血圧症候群</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox id="preg_diabetes" name="preg_diabetes" />
              <Label htmlFor="preg_diabetes">妊娠糖尿病</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox id="preg_anemia" name="preg_anemia" />
              <Label htmlFor="preg_anemia">貧血</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox id="preg_sickness" name="preg_sickness" />
              <Label htmlFor="preg_sickness">つわり</Label>
            </div>
          </div>
        </FormField>
        <FormField label="分娩の様子">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div className="flex items-center space-x-2">
              <Checkbox id="birth_normal" name="birth_normal" />
              <Label htmlFor="birth_normal">正常分娩</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox id="birth_induced" name="birth_induced" />
              <Label htmlFor="birth_induced">誘発分娩</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox id="birth_painless" name="birth_painless" />
              <Label htmlFor="birth_painless">無痛分娩</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox id="birth_vacuum" name="birth_vacuum" />
              <Label htmlFor="birth_vacuum">吸引（鉗子）分娩</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox id="birth_csection" name="birth_csection" />
              <Label htmlFor="birth_csection">帝王切開術</Label>
            </div>
          </div>
        </FormField>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField label="分娩時の週数">
            <div className="flex items-center gap-2">
              <Input name="birth_weeks" type="number" className="w-20" />
              <span>週</span>
              <Input name="birth_days" type="number" className="w-20" />
              <span>日</span>
            </div>
          </FormField>
          <FormField label="出生時・後の異常">
            <Input name="birth_abnormality" />
          </FormField>
          <FormField label="出生体重">
            <div className="flex items-center gap-2">
              <Input name="birth_weight_g" type="number" />
              <span>g</span>
            </div>
          </FormField>
          <FormField label="退院時の体重">
            <div className="flex items-center gap-2">
              <Input name="discharge_weight_g" type="number" />
              <span>g</span>
            </div>
          </FormField>
          <FormField label="退院日">
            <Input name="discharge_date" type="date" />
          </FormField>
          <FormField label="分娩施設">
            <Input name="birth_facility" />
          </FormField>
        </div>
      </FormSection>

      <FormSection title="最近の授乳（食事）の様子">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField label="直接授乳">
            <div className="flex items-center flex-wrap gap-2">
              <Input name="feed_direct_count" type="number" placeholder="回数" className="w-20" />
              <span>回/日 (日中</span>
              <Input name="feed_direct_day" type="number" className="w-16" />
              <span>回, 夜間</span>
              <Input name="feed_direct_night" type="number" className="w-16" />
              <span>回)</span>
            </div>
          </FormField>
          <FormField label="搾乳">
            <div className="flex items-center flex-wrap gap-2">
              <Input name="feed_pump_count" type="number" placeholder="回数" className="w-20" />
              <span>回/日</span>
              <Input name="feed_pump_amount" type="number" placeholder="量" className="w-20" />
              <span>ml/回</span>
            </div>
          </FormField>
          <FormField label="ミルク">
            <div className="flex items-center flex-wrap gap-2">
              <Input name="feed_formula_count" type="number" placeholder="回数" className="w-20" />
              <span>回/日</span>
              <Input name="feed_formula_amount" type="number" placeholder="量" className="w-20" />
              <span>ml/回</span>
            </div>
          </FormField>
          <FormField label="離乳食">
            <div className="flex items-center flex-wrap gap-2">
              <Input name="feed_solid_count" type="number" placeholder="回数" className="w-20" />
              <span>回/日</span>
            </div>
          </FormField>
        </div>
      </FormSection>

      <FormSection title="ご相談内容" description="あてはまる項目をいくつでもチェックしてください">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-4">
            <h4 className="font-semibold">【おっぱいのトラブル】</h4>
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Checkbox id="consult_nipple_pain" name="consult_nipple_pain" />
                <Label htmlFor="consult_nipple_pain">乳首の痛み</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox id="consult_nipple_wound" name="consult_nipple_wound" />
                <Label htmlFor="consult_nipple_wound">乳首の傷</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox id="consult_white_spot" name="consult_white_spot" />
                <Label htmlFor="consult_white_spot">白斑（乳首に白いものがある）</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox id="consult_breast_pain" name="consult_breast_pain" />
                <Label htmlFor="consult_breast_pain">乳房全体の痛み</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox id="consult_mastitis" name="consult_mastitis" />
                <Label htmlFor="consult_mastitis">乳腺炎</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox id="consult_swelling" name="consult_swelling" />
                <Label htmlFor="consult_swelling">腫れ</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox id="consult_lump" name="consult_lump" />
                <Label htmlFor="consult_lump">しこり</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox id="consult_heat_redness" name="consult_heat_redness" />
                <Label htmlFor="consult_heat_redness">熱感や赤み</Label>
              </div>
            </div>
          </div>
          <div className="space-y-4">
            <h4 className="font-semibold">【授乳のこと】</h4>
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Checkbox id="consult_latching" name="consult_latching" />
                <Label htmlFor="consult_latching">授乳のやり方をみてほしい（うまく吸ってくれない）</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox id="consult_supply_anxiety" name="consult_supply_anxiety" />
                <Label htmlFor="consult_supply_anxiety">母乳が足りているかわからない</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox id="consult_supply_amount" name="consult_supply_amount" />
                <Label htmlFor="consult_supply_amount">母乳の分泌量を知りたい</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox id="consult_formula_amount" name="consult_formula_amount" />
                <Label htmlFor="consult_formula_amount">ミルクの増やし方がわからない</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox id="consult_weaning" name="consult_weaning" />
                <Label htmlFor="consult_weaning">卒乳・断乳したい</Label>
              </div>
            </div>
          </div>
          <div className="space-y-4">
            <h4 className="font-semibold">【お子さん／育児のこと】</h4>
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Checkbox id="consult_weight_gain" name="consult_weight_gain" />
                <Label htmlFor="consult_weight_gain">体重が増えているか</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox id="consult_holding_diaper" name="consult_holding_diaper" />
                <Label htmlFor="consult_holding_diaper">抱っこ、おむつ交換をみてほしい</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox id="consult_bathing_learn" name="consult_bathing_learn" />
                <Label htmlFor="consult_bathing_learn">沐浴を教えてほしい</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox id="consult_bathing_help" name="consult_bathing_help" />
                <Label htmlFor="consult_bathing_help">沐浴をしてほしい（手伝ってほしい）</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox id="consult_skincare" name="consult_skincare" />
                <Label htmlFor="consult_skincare">スキンケア</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox id="consult_solid_food" name="consult_solid_food" />
                <Label htmlFor="consult_solid_food">離乳食について</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox id="consult_sleep" name="consult_sleep" />
                <Label htmlFor="consult_sleep">夜泣きや睡眠について</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox id="consult_development" name="consult_development" />
                <Label htmlFor="consult_development">発達について</Label>
              </div>
            </div>
          </div>
          <div className="space-y-4">
            <h4 className="font-semibold">【その他】</h4>
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Checkbox id="consult_relax" name="consult_relax" />
                <Label htmlFor="consult_relax">リラックスしたい</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox id="consult_rest" name="consult_rest" />
                <Label htmlFor="consult_rest">休息したい</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox id="consult_talk" name="consult_talk" />
                <Label htmlFor="consult_talk">話を聞いてほしい</Label>
              </div>
            </div>
          </div>
        </div>
      </FormSection>

      <FormSection title="ご利用のきっかけ">
        <div className="space-y-2">
          <div className="flex items-center space-x-2">
            <Checkbox id="referral_facility" name="referral_facility" />
            <Label htmlFor="referral_facility">施設からの紹介</Label>
            <Input name="referral_facility_name" placeholder="施設名" />
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox id="referral_friend" name="referral_friend" />
            <Label htmlFor="referral_friend">知人・友人からの紹介</Label>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox id="referral_flyer" name="referral_flyer" />
            <Label htmlFor="referral_flyer">チラシ</Label>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox id="referral_instagram" name="referral_instagram" />
            <Label htmlFor="referral_instagram">インスタグラム</Label>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox id="referral_other" name="referral_other" />
            <Label htmlFor="referral_other">その他</Label>
            <Input name="referral_other_text" placeholder="その他詳細" />
          </div>
        </div>
      </FormSection>

      <FormSection title="ご要望">
        <Textarea name="requests" placeholder="ご要望がございましたら、ご記入ください。" />
      </FormSection>

      {error && <div className="p-3 bg-red-100 text-red-700 rounded-md">{error}</div>}

      <div className="text-center">
        <p className="text-sm text-gray-500 mb-4">
          ご記入していただいた情報は、「助産院・こよみ」のケア及びサービスでのみ活用させていただきます。ご協力ありがとうございました。
        </p>
        <Button type="submit" disabled={isSubmitting} className="w-full max-w-md bg-[#f8a0a0] hover:bg-[#f78b8b]">
          {isSubmitting ? "送信中..." : "問診票を送信する"}
        </Button>
      </div>
    </CSRFForm>
  )
}
