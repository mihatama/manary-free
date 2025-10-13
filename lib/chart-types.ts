export type ChartType = "breast" | "postpartum"

export interface BreastDiagram {
  imageData?: string | null
  markers?: Record<string, boolean>
}

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

export interface ChartFeeItem {
  label: string
  price?: number | null
  selected?: boolean
}

export interface BreastCareChartData {
  childName?: string
  childBirthDate?: string
  childAgeYears?: number | null
  childAgeMonths?: number | null
  childAgeDays?: number | null
  chartNumber?: string
  traineeName?: string
  clinicLocation?: string | null
  bodyWeight?: number | null
  weightGainPerDay?: number | null
  breastMilkInterval?: string
  breastMilkIntervalDay?: string
  breastMilkIntervalNight?: string
  milkVolumeDay?: string
  milkVolumeNight?: string
  formulaFeedsPerDay?: number | null
  formulaFeedsDaytime?: number | null
  formulaFeedsNighttime?: number | null
  formulaVolumePerFeed?: string
  expressedMilkFrequency?: number | null
  expressedMilkVolumePerFeed?: number | null
  weaningFeedsPerDay?: number | null
  weaningDetails?: string
  stoolFrequency?: number | null
  urinationFrequency?: number | null
  stoolConsistency?: string
  babyDevelopment?: string
  weaningStatus?: string
  weaningCompletionDay?: string
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
  fees?: ChartFeeItem[]
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
