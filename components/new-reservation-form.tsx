"use client"

import { useState, useEffect, useMemo } from "react"
import { useRouter } from "next/navigation"
import { format } from "date-fns"
import { ja } from "date-fns/locale"
import { z } from "zod"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { CalendarTimePicker } from "@/components/calendar-time-picker"
import { ClinicSelector } from "@/components/clinic-selector"
import { createReservation } from "@/app/actions/reservation-actions"
import { useCSRF } from "@/hooks/use-csrf"

// Define types based on other components
interface Clinic {
  id: string
  name: string
}

interface ServiceType {
  id: string
  name: string
  duration: number
  price: number
}

interface NewReservationFormProps {
  clinics: Clinic[]
  serviceTypes: ServiceType[]
  phone: string
}

const formSchema = z.object({
  patient_name: z.string().min(1, "お名前を入力してください"),
  patient_email: z.string().email("有効なメールアドレスを入力してください").optional().or(z.literal("")),
})

export function NewReservationForm({ clinics, serviceTypes, phone }: NewReservationFormProps) {
  const router = useRouter()
  const [clinicId, setClinicId] = useState<string | null>(null)
  const [serviceTypeId, setServiceTypeId] = useState<string | null>(null)
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<{ start: string; end: string } | null>(null)

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const { csrfToken } = useCSRF()

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      patient_name: "",
      patient_email: "",
    },
  })

  useEffect(() => {
    if (Array.isArray(clinics) && clinics.length > 0 && !clinicId) {
      setClinicId(clinics[0].id)
    }
  }, [clinics, clinicId])

  const filteredServiceTypes = useMemo(() => {
    // This part is complex, assuming for now all services are available at all clinics
    // In a real app, this would filter based on clinicId
    return serviceTypes
  }, [serviceTypes, clinicId])

  useEffect(() => {
    if (Array.isArray(filteredServiceTypes) && filteredServiceTypes.length > 0 && !serviceTypeId) {
      setServiceTypeId(filteredServiceTypes[0].id)
    }
  }, [filteredServiceTypes, serviceTypeId])

  const handleDateTimeSelect = (date: Date, startTime: string, endTime: string) => {
    setSelectedDate(date)
    setSelectedTimeSlot({ start: startTime, end: endTime })
  }

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    if (!clinicId || !serviceTypeId || !selectedDate || !selectedTimeSlot || !csrfToken) {
      setError("すべての項目を選択・入力してください。")
      return
    }

    setIsSubmitting(true)
    setError(null)

    try {
      const formData = new FormData()
      formData.append("csrf_token", csrfToken)
      formData.append("clinic_id", clinicId)
      formData.append("service_type_id", serviceTypeId)
      formData.append("appointment_date", format(selectedDate, "yyyy-MM-dd"))
      formData.append("start_time", selectedTimeSlot.start)
      formData.append("end_time", selectedTimeSlot.end)
      formData.append("patient_name", values.patient_name)
      formData.append("patient_phone", phone)
      formData.append("patient_email", values.patient_email || "")

      const result = await createReservation(formData)

      if (result.success && result.token) {
        router.push(`/reservation/confirmation?token=${result.token}`)
      } else {
        setError(result.error || "予約の作成に失敗しました。")
      }
    } catch (err: any) {
      setError(err.message || "予約の作成中にエラーが発生しました。")
    } finally {
      setIsSubmitting(false)
    }
  }

  // THE FIX: Add checks before using .find()
  const selectedService =
    Array.isArray(filteredServiceTypes) && serviceTypeId
      ? filteredServiceTypes.find((s) => s.id === serviceTypeId)
      : null

  const selectedClinic = Array.isArray(clinics) && clinicId ? clinics.find((c) => c.id === clinicId) : null

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>新規予約</CardTitle>
        <CardDescription>必要事項を入力して予約を完了してください。</CardDescription>
      </CardHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <CardContent className="space-y-6">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-4">
              <FormItem>
                <FormLabel>助産院</FormLabel>
                <ClinicSelector clinics={clinics || []} selectedClinicId={clinicId} onClinicChange={setClinicId} />
              </FormItem>

              <FormItem>
                <FormLabel>診療種別</FormLabel>
                <select
                  value={serviceTypeId || ""}
                  onChange={(e) => setServiceTypeId(e.target.value)}
                  className="w-full p-2 border rounded-md bg-white"
                  disabled={!clinicId || !Array.isArray(filteredServiceTypes) || filteredServiceTypes.length === 0}
                >
                  <option value="" disabled>
                    選択してください
                  </option>
                  {Array.isArray(filteredServiceTypes) &&
                    filteredServiceTypes.map((service) => (
                      <option key={service.id} value={service.id}>
                        {service.name} ({service.duration}分)
                      </option>
                    ))}
                </select>
                {Array.isArray(filteredServiceTypes) && filteredServiceTypes.length === 0 && (
                  <p className="text-sm text-muted-foreground">この助産院で利用可能なサービスはありません。</p>
                )}
              </FormItem>
            </div>

            {clinicId && serviceTypeId && (
              <div className="space-y-4">
                <FormItem>
                  <FormLabel>ご希望の日時</FormLabel>
                  <div className="p-4 border rounded-md">
                    <CalendarTimePicker
                      clinicId={clinicId}
                      serviceTypeId={serviceTypeId}
                      onSelectDateTime={handleDateTimeSelect}
                    />
                  </div>
                  {selectedDate && selectedTimeSlot && (
                    <div className="mt-2 p-2 bg-blue-50 rounded-md">
                      <p className="text-blue-700">
                        選択中の日時: {format(selectedDate, "yyyy年MM月dd日(EEE)", { locale: ja })}{" "}
                        {selectedTimeSlot.start} - {selectedTimeSlot.end}
                      </p>
                    </div>
                  )}
                </FormItem>
              </div>
            )}

            <div className="space-y-4">
              <FormField
                control={form.control}
                name="patient_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>お名前</FormLabel>
                    <FormControl>
                      <Input placeholder="山田 花子" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormItem>
                <FormLabel>電話番号</FormLabel>
                <Input value={phone} disabled />
              </FormItem>
              <FormField
                control={form.control}
                name="patient_email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>メールアドレス (任意)</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="hanako@example.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </CardContent>
          <CardFooter>
            <Button
              type="submit"
              disabled={isSubmitting || !selectedDate || !selectedTimeSlot}
              className="w-full bg-[#f8a0a0] hover:bg-[#f78989] text-white"
            >
              {isSubmitting ? "予約中..." : "予約を確定する"}
            </Button>
          </CardFooter>
        </form>
      </Form>
    </Card>
  )
}
