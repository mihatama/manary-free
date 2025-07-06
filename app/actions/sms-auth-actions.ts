export async function getAppointmentsByPhone(phone: string) {
  noStore()
  const supabase = createClient()
  const { data, error } = await supabase
    .from("reservations")
    .select(
      `
      *,
      clinics(*),
      service_types(*),
      questionnaires(id)
    `,
    )
    .eq("patient_phone", phone)
    .order("reservation_date", { ascending: false })
    .order("start_time", { ascending: false })

  if (error) {
    console.error("Error fetching appointments by phone:", error)
    return { success: false, message: "予約の取得に失敗しました。", data: [] }
  }

  // The result for questionnaires will be an array. We need to transform it
  // to match what AppointmentList expects.
  const transformedData = data?.map((item) => {
    // Supabase returns the joined table as an array.
    // In this case, a reservation can have at most one questionnaire.
    const questionnaire = Array.isArray(item.questionnaires) ? item.questionnaires[0] : null
    return {
      ...item,
      questionnaire_id: questionnaire ? questionnaire.id : null,
      token: item.access_token, // Rename access_token to token for the frontend
      questionnaires: undefined, // clean up the original array
    }
  })

  return { success: true, data: transformedData || [] }
}
