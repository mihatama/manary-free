export type ChartType = "breast" | "postpartum"

export type BreastDiagram = Record<string, boolean>

export interface ChartBase {
  id: string
  chartType: ChartType
  patientName: string
  patientId?: string
  visitDate: string
  practitionerName?: string
  createdAt: string
  updatedAt: string
  memo?: string
}

export interface BreastCareChartData {
  chartNumber?: string
  traineeName?: string
  clinicLocation: string[]
  bodyWeight?: number | null
  weightGainPerDay?: number | null
  breastMilkInterval?: string
  milkVolumeDay?: string
  milkVolumeNight?: string
  formulaFeedsPerDay?: number | null
  formulaVolumePerFeed?: string
  weaningFeedsPerDay?: number | null
  weaningDetails?: string
  stoolFrequency?: number | null
  stoolConsistency?: string
  babyDevelopment?: string
  weaningStatus?: string
  subjectiveNote?: string
  planNote?: string
  breastShape?: string
  nippleShieldUsed?: boolean
  pumpingFrequency?: string
  pumpingMethod?: string
  nippleAreolaCondition: string[]
  painLocation: string[]
  feedingPosition?: string
  familySupportStatus?: string
  breastDiagramRight: BreastDiagram
  breastDiagramLeft: BreastDiagram
  concerns?: string
  leftBreastCondition?: string
  rightBreastCondition?: string
  careDetails?: string
  recommendations?: string
  diagnosis?: string
  paymentMethod?: string
  initialConsultationFee?: boolean
  singleSessionFee?: boolean
  ticketFee?: boolean
  rentalTowelFee?: boolean
  careTowelFee?: boolean
  otherFee?: number | null
  otherFeeDescription?: string | null
}

export interface PostpartumCareChartData {
  motherCondition?: string
  lochiaStatus?: string
  episiotomyPain?: string
  constipationStatus?: string
  mentalState?: string
  familySupport?: string
  babyCondition?: string
  jaundiceLevel?: string
  umbilicalCordStatus?: string
  feedingStatus?: string
  carePlan?: string
  guidance?: string
  paymentDetails?: string
  weeksPostpartum?: number | null
  physicalCondition?: string
  mentalCondition?: string
  careProvided?: string
}

export type BreastCareChartRecord = ChartBase & {
  chartType: "breast"
  data: BreastCareChartData
}

export type PostpartumCareChartRecord = ChartBase & {
  chartType: "postpartum"
  data: PostpartumCareChartData
}

export type ChartRecord = BreastCareChartRecord | PostpartumCareChartRecord

export type ChartPayload =
  | ({
      id?: string
    } & Omit<BreastCareChartRecord, "id" | "createdAt" | "updatedAt">)
  | ({
      id?: string
    } & Omit<PostpartumCareChartRecord, "id" | "createdAt" | "updatedAt">)
