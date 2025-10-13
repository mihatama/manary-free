"use client"

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react"
import { v4 as uuidv4 } from "uuid"

import type {
  ChartPayload,
  ChartRecord,
  BreastCareChartData,
  PostpartumCareChartData,
  BreastDiagram,
  ChartFeeItem,
} from "@/lib/chart-types"
import { decryptToString, encryptString } from "@/lib/encryption"
import { getEncryptedStateKey } from "@/lib/subscription"
import { useSubscription } from "./subscription-provider"

type AppState = {
  charts: ChartRecord[]
}

type AppStateContextValue = {
  isReady: boolean
  charts: ChartRecord[]
  saveChart: (payload: ChartPayload) => ChartRecord
  deleteChart: (id: string) => void
  resetCharts: () => void
}

const STORAGE_KEY = getEncryptedStateKey()
const STORAGE_VERSION = 2

const defaultState: AppState = {
  charts: [],
}

const AppStateContext = createContext<AppStateContextValue | undefined>(undefined)

function normalizeString(value: unknown): string | undefined {
  if (typeof value !== "string") {
    return undefined
  }
  const trimmed = value.trim()
  return trimmed.length > 0 ? trimmed : undefined
}

function normalizeBoolean(value: unknown): boolean | undefined {
  if (typeof value === "boolean") {
    return value
  }
  return undefined
}

function normalizeNumber(value: unknown): number | null | undefined {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value
  }
  if (value === null) {
    return null
  }
  return undefined
}

function normalizeStringArray(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value
      .map((item) => (typeof item === "string" ? item.trim() : ""))
      .filter((item) => item.length > 0)
  }

  if (typeof value === "string") {
    return value
      .split(",")
      .map((item) => item.trim())
      .filter((item) => item.length > 0)
  }

  return []
}

function normalizeFees(value: unknown): ChartFeeItem[] {
  if (!Array.isArray(value)) {
    return []
  }

  return value
    .map((item) => {
      if (!item || typeof item !== "object") {
        return null
      }
      const record = item as Record<string, unknown>
      const label = normalizeString(record.label)

      let price: number | null | undefined
      if (typeof record.price === "number" || record.price === null) {
        price = normalizeNumber(record.price)
      } else if (typeof record.price === "string") {
        const trimmed = record.price.trim()
        if (trimmed.length === 0) {
          price = null
        } else {
          const parsed = Number(trimmed.replace(/,/g, ""))
          price = Number.isFinite(parsed) ? parsed : undefined
        }
      }

      const selected = typeof record.selected === "boolean" ? record.selected : undefined

      if (!label && price === undefined) {
        return null
      }

      return {
        label: label ?? (price !== undefined && price !== null ? "" : "未設定"),
        price: price ?? null,
        selected,
      }
    })
    .filter((item): item is ChartFeeItem => item !== null)
}

function normalizeDiagram(value: unknown): BreastDiagram {
  if (!value || typeof value !== "object") {
    return {}
  }

  const record = value as Record<string, unknown>
  const normalized: BreastDiagram = {}

  if (typeof record.imageData === "string" && record.imageData.startsWith("data:image/")) {
    normalized.imageData = record.imageData
  }

  let markerEntries: Array<[string, boolean]> = []

  if (record.markers && typeof record.markers === "object" && !Array.isArray(record.markers)) {
    markerEntries = Object.entries(record.markers as Record<string, unknown>).filter(
      ([key, val]) => typeof key === "string" && typeof val === "boolean",
    ) as Array<[string, boolean]>
  }

  if (markerEntries.length === 0) {
    markerEntries = Object.entries(record).filter(
      ([key, val]) =>
        key !== "imageData" &&
        key !== "markers" &&
        typeof key === "string" &&
        typeof val === "boolean",
    ) as Array<[string, boolean]>
  }

  if (markerEntries.length > 0) {
    const activeEntries = markerEntries.filter(([, val]) => val === true)
    if (activeEntries.length > 0) {
      normalized.markers = Object.fromEntries(activeEntries)
    }
  }

  return normalized
}

function calculateAgeParts(birthDate?: string | null, referenceDate?: string | null) {
  if (!birthDate || !referenceDate) {
    return null
  }

  const birth = new Date(`${birthDate.slice(0, 10)}T00:00:00`)
  const reference = new Date(`${referenceDate.slice(0, 10)}T00:00:00`)

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

function normalizeBreastCareData(data?: Partial<BreastCareChartData>): BreastCareChartData {
  const rawClinicLocation = (data as Record<string, unknown> | undefined)?.clinicLocation
  let normalizedClinicLocation = normalizeString(rawClinicLocation)
  if (!normalizedClinicLocation && Array.isArray(rawClinicLocation)) {
    const joined = rawClinicLocation
      .map((item) => (typeof item === "string" ? item.trim() : ""))
      .filter((item) => item.length > 0)
      .join("、")
    normalizedClinicLocation = joined.length > 0 ? joined : undefined
  }

  const normalizedNippleAreola = normalizeStringArray((data as Record<string, unknown> | undefined)?.nippleAreolaCondition)
  const normalizedPainLocation = normalizeStringArray((data as Record<string, unknown> | undefined)?.painLocation)
  let normalizedFees = normalizeFees((data as Record<string, unknown> | undefined)?.fees)

  if (
    normalizedFees.length === 0 &&
    (data as Record<string, unknown> | undefined)
  ) {
    const legacy: ChartFeeItem[] = []

    const legacyMap: Array<{ key: string; label: string; price: number }> = [
      { key: "initialConsultationFee", label: "初診料", price: 1000 },
      { key: "singleSessionFee", label: "1回", price: 5500 },
      { key: "ticketFee", label: "チケット", price: 14850 },
      { key: "rentalTowelFee", label: "レンタルタオル", price: 350 },
      { key: "careTowelFee", label: "ケアタオル", price: 250 },
    ]

    for (const item of legacyMap) {
      const value = normalizeBoolean((data as Record<string, unknown>)[item.key])
      if (value) {
        legacy.push({
          label: item.label,
          price: item.price,
          selected: true,
        })
      }
    }

    const otherFee = normalizeNumber((data as Record<string, unknown>).otherFee)
    const otherLabel = normalizeString((data as Record<string, unknown>).otherFeeDescription)
    if (otherFee !== undefined) {
      legacy.push({
        label: `その他${otherLabel ? `（${otherLabel}）` : ""}`,
        price: otherFee,
        selected: true,
      })
    }

    if (legacy.length > 0) {
      normalizedFees = legacy
    }
  }

  return {
    childName: normalizeString((data as Record<string, unknown> | undefined)?.childName),
    childBirthDate: normalizeString((data as Record<string, unknown> | undefined)?.childBirthDate),
    childAgeYears: normalizeNumber((data as Record<string, unknown> | undefined)?.childAgeYears),
    childAgeMonths: normalizeNumber((data as Record<string, unknown> | undefined)?.childAgeMonths),
    childAgeDays: normalizeNumber((data as Record<string, unknown> | undefined)?.childAgeDays),
    chartNumber: normalizeString(data?.chartNumber),
    traineeName: normalizeString(data?.traineeName),
    clinicLocation: normalizedClinicLocation ?? null,
    bodyWeight: normalizeNumber(data?.bodyWeight),
    weightGainPerDay: normalizeNumber(data?.weightGainPerDay),
    breastMilkInterval: normalizeString(data?.breastMilkInterval),
    breastMilkIntervalDay: normalizeString((data as Record<string, unknown> | undefined)?.breastMilkIntervalDay),
    breastMilkIntervalNight: normalizeString((data as Record<string, unknown> | undefined)?.breastMilkIntervalNight),
    milkVolumeDay: normalizeString(data?.milkVolumeDay),
    milkVolumeNight: normalizeString(data?.milkVolumeNight),
    formulaFeedsPerDay: normalizeNumber(data?.formulaFeedsPerDay),
    formulaFeedsDaytime: normalizeNumber((data as Record<string, unknown> | undefined)?.formulaFeedsDaytime),
    formulaFeedsNighttime: normalizeNumber((data as Record<string, unknown> | undefined)?.formulaFeedsNighttime),
    formulaVolumePerFeed: normalizeString(data?.formulaVolumePerFeed),
    expressedMilkFrequency: normalizeNumber((data as Record<string, unknown> | undefined)?.expressedMilkFrequency),
    expressedMilkVolumePerFeed: normalizeNumber((data as Record<string, unknown> | undefined)?.expressedMilkVolumePerFeed),
    weaningFeedsPerDay: normalizeNumber(data?.weaningFeedsPerDay),
    weaningDetails: normalizeString(data?.weaningDetails),
    stoolFrequency: normalizeNumber(data?.stoolFrequency),
    urinationFrequency: normalizeNumber((data as Record<string, unknown> | undefined)?.urinationFrequency),
    stoolConsistency: normalizeString(data?.stoolConsistency),
    babyDevelopment: normalizeString(data?.babyDevelopment),
    weaningStatus: normalizeString(data?.weaningStatus),
    weaningCompletionDay: normalizeString((data as Record<string, unknown> | undefined)?.weaningCompletionDay),
    subjectiveNote: normalizeString(data?.subjectiveNote),
    planNote: normalizeString(data?.planNote),
    breastShape: normalizeString(data?.breastShape),
    nippleShieldUsed: normalizeBoolean(data?.nippleShieldUsed),
    pumpingFrequency: normalizeString(data?.pumpingFrequency),
    pumpingMethod: normalizeString(data?.pumpingMethod),
    nippleAreolaCondition: normalizedNippleAreola,
    painLocation: normalizedPainLocation,
    feedingPosition: normalizeString(data?.feedingPosition),
    familySupportStatus: normalizeString(data?.familySupportStatus),
    breastDiagramRight: normalizeDiagram(data?.breastDiagramRight),
    breastDiagramLeft: normalizeDiagram(data?.breastDiagramLeft),
    concerns: normalizeString(data?.concerns),
    leftBreastCondition: normalizeString(data?.leftBreastCondition),
    rightBreastCondition: normalizeString(data?.rightBreastCondition),
    careDetails: normalizeString(data?.careDetails),
    recommendations: normalizeString(data?.recommendations),
    diagnosis: normalizeString(data?.diagnosis),
    paymentMethod: normalizeString(data?.paymentMethod),
    fees: normalizedFees,
  }
}

function normalizePostpartumCareData(data?: Partial<PostpartumCareChartData>): PostpartumCareChartData {
  return {
    chartNumber: normalizeString(data?.chartNumber),
    clinicLocation: normalizeStringArray(data?.clinicLocation),
    homeCareSupport: normalizeStringArray(data?.homeCareSupport),
    postpartumDay: normalizeNumber(data?.postpartumDay),
    deliveryDate: normalizeString(data?.deliveryDate),
    familyStructure: normalizeStringArray(data?.familyStructure),
    childcareExperience: normalizeString(data?.childcareExperience),
    livingWithExtendedFamily: normalizeBoolean(data?.livingWithExtendedFamily),
    babyCondition: normalizeString(data?.babyCondition),
    motherCondition: normalizeString(data?.motherCondition),
    sleepStatus: normalizeString(data?.sleepStatus),
    appetite: normalizeString(data?.appetite),
    bowelCondition: normalizeString(data?.bowelCondition),
    lochia: normalizeString(data?.lochia),
    uterineInvolution: normalizeString(data?.uterineInvolution),
    postpartumComplications: normalizeStringArray(data?.postpartumComplications),
    breastfeedingStatus: normalizeString(data?.breastfeedingStatus),
    babyFeedingAmount: normalizeString(data?.babyFeedingAmount),
    lactationStatus: normalizeString(data?.lactationStatus),
    breastSymptoms: normalizeStringArray(data?.breastSymptoms),
    mentalState: normalizeString(data?.mentalState),
    familySupport: normalizeString(data?.familySupport),
    householdTasks: normalizeStringArray(data?.householdTasks),
    outingRestrictions: normalizeString(data?.outingRestrictions),
    contraception: normalizeString(data?.contraception),
    supplementUse: normalizeStringArray(data?.supplementUse),
    stretchingStatus: normalizeString(data?.stretchingStatus),
    reflection: normalizeString(data?.reflection),
    issuesToAddress: normalizeStringArray(data?.issuesToAddress),
    healingState: normalizeString(data?.healingState),
    lochiaState: normalizeString(data?.lochiaState),
    uterusState: normalizeString(data?.uterusState),
    ovarianState: normalizeString(data?.ovarianState),
    breastState: normalizeString(data?.breastState),
    nippleState: normalizeString(data?.nippleState),
    massageDetails: normalizeString(data?.massageDetails),
    carePlan: normalizeString(data?.carePlan),
    careDetails: normalizeString(data?.careDetails),
    evaluation: normalizeString(data?.evaluation),
    homework: normalizeStringArray(data?.homework),
    nextSchedule: normalizeString(data?.nextSchedule),
    paymentMethod: normalizeString(data?.paymentMethod),
    initialConsultationFee: normalizeBoolean(data?.initialConsultationFee),
    singleSessionFee: normalizeBoolean(data?.singleSessionFee),
    ticketFee: normalizeBoolean(data?.ticketFee),
    rentalTowelFee: normalizeBoolean(data?.rentalTowelFee),
    careTowelFee: normalizeBoolean(data?.careTowelFee),
    otherFee: normalizeNumber(data?.otherFee),
    otherFeeDescription: normalizeString(data?.otherFeeDescription),
  }
}

function sanitizeChartRecord(record?: Partial<ChartRecord> | null): ChartRecord | null {
  if (!record) {
    return null
  }

  const id = normalizeString(record.id) ?? uuidv4()
  const chartType = normalizeString(record.chartType)
  const createdAt = normalizeString(record.createdAt)
  const updatedAt = normalizeString(record.updatedAt) ?? createdAt
  const patientName = normalizeString(record.patientName)
  const visitDate = normalizeString(record.visitDate)

  if (!chartType || !createdAt) {
    return null
  }

  if (chartType !== "breast" && chartType !== "postpartum") {
    return null
  }

  const common = {
    id,
    chartType,
    createdAt,
    updatedAt,
    patientName,
    patientId: normalizeString(record.patientId),
    practitionerName: normalizeString(record.practitionerName),
    visitDate,
    memo: normalizeString(record.memo),
  }

  if (chartType === "breast") {
    return {
      ...common,
      chartType: "breast",
      data: normalizeBreastCareData(record.data as Partial<BreastCareChartData> | undefined),
    }
  }

  return {
    ...common,
    chartType: "postpartum",
    data: normalizePostpartumCareData(record.data as Partial<PostpartumCareChartData> | undefined),
  }
}

function sanitizeCharts(charts: unknown): ChartRecord[] {
  if (!Array.isArray(charts)) {
    return []
  }

  return charts
    .map((item) => sanitizeChartRecord(item as Partial<ChartRecord>))
    .filter((item): item is ChartRecord => item !== null)
}

function normalizeChartPayload(payload: ChartPayload, timestamp: string, existing?: ChartRecord) {
  const chartType = payload.chartType ?? existing?.chartType ?? "breast"
  const base: ChartRecord = {
    id: payload.id ?? existing?.id ?? uuidv4(),
    chartType,
    patientName: normalizeString(payload.patientName) ?? existing?.patientName,
    patientId: normalizeString(payload.patientId) ?? existing?.patientId,
    visitDate: normalizeString(payload.visitDate) ?? existing?.visitDate,
    practitionerName: normalizeString(payload.practitionerName) ?? existing?.practitionerName,
    memo: normalizeString(payload.memo) ?? existing?.memo,
    createdAt: existing?.createdAt ?? timestamp,
    updatedAt: timestamp,
    data: chartType === "breast" ? normalizeBreastCareData(payload.data) : normalizePostpartumCareData(payload.data),
  }

  if (base.chartType === "breast") {
    const age = calculateAgeParts(
      (base.data as BreastCareChartData).childBirthDate,
      base.visitDate,
    )
    if (age) {
      const breastData = base.data as BreastCareChartData
      if (breastData.childAgeYears === undefined || breastData.childAgeYears === null) {
        breastData.childAgeYears = age.years
      }
      if (breastData.childAgeMonths === undefined || breastData.childAgeMonths === null) {
        breastData.childAgeMonths = age.months
      }
      if (breastData.childAgeDays === undefined || breastData.childAgeDays === null) {
        breastData.childAgeDays = age.days
      }
    }
  }

  return base
}

async function loadState(encryptionKey?: string | null): Promise<AppState> {
  if (typeof window === "undefined") {
    return defaultState
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) {
      return defaultState
    }

    const parsed = JSON.parse(raw) as { version: number; payload?: string }
    if (!parsed || parsed.version !== STORAGE_VERSION || !parsed.payload || !encryptionKey) {
      return defaultState
    }

    const payloadString = await decryptToString(parsed.payload, encryptionKey)
    if (!payloadString) {
      return defaultState
    }

    const decryptedState = JSON.parse(payloadString) as Partial<AppState> | null
    const charts = sanitizeCharts(decryptedState?.charts)
    return { charts }
  } catch (error) {
    console.error("Failed to load chart state", error)
    return defaultState
  }
}

async function persistState(state: AppState, encryptionKey?: string | null) {
  if (typeof window === "undefined" || !encryptionKey) {
    return
  }

  try {
    const payload = await encryptString(JSON.stringify(state), encryptionKey)
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        version: STORAGE_VERSION,
        payload,
      }),
    )
  } catch (error) {
    console.error("Failed to persist chart state", error)
  }
}

export function AppStateProvider({ children }: { children: React.ReactNode }) {
  const { isReady: isSubscriptionReady, encryptionKey } = useSubscription()
  const [state, setState] = useState<AppState>(defaultState)
  const [isLocalReady, setIsLocalReady] = useState(false)

  useEffect(() => {
    if (!isSubscriptionReady) {
      return
    }

    let cancelled = false
    setIsLocalReady(false)
    ;(async () => {
      const nextState = await loadState(encryptionKey)
      if (!cancelled) {
        setState(nextState)
        setIsLocalReady(true)
      }
    })()

    return () => {
      cancelled = true
    }
  }, [isSubscriptionReady, encryptionKey])

  useEffect(() => {
    if (!isLocalReady || !encryptionKey) {
      return
    }

    void (async () => {
      await persistState(state, encryptionKey)
    })()
  }, [state, isLocalReady, encryptionKey])

  const saveChart = useCallback<AppStateContextValue["saveChart"]>((payload) => {
    if (!encryptionKey) {
      throw new Error("現在のアカウント状態ではデータを編集できません。サブスクリプションを有効化してください。")
    }
    const timestamp = new Date().toISOString()
    let savedChart: ChartRecord | null = null

    setState((prev) => {
      const existing = payload.id ? prev.charts.find((chart) => chart.id === payload.id) : undefined
      savedChart = normalizeChartPayload(payload, timestamp, existing)

      const charts = existing
        ? prev.charts.map((chart) => (chart.id === savedChart!.id ? savedChart! : chart))
        : [...prev.charts, savedChart!]

      return { charts }
    })

    if (!savedChart) {
      throw new Error("Failed to save chart")
    }

    return savedChart
  }, [encryptionKey])

  const deleteChart = useCallback<AppStateContextValue["deleteChart"]>((id) => {
    if (!encryptionKey) {
      throw new Error("現在のアカウント状態ではデータを削除できません。サブスクリプションを有効化してください。")
    }
    setState((prev) => ({
      charts: prev.charts.filter((chart) => chart.id !== id),
    }))
  }, [encryptionKey])

  const resetCharts = useCallback<AppStateContextValue["resetCharts"]>(() => {
    if (!encryptionKey) {
      throw new Error("現在のアカウント状態ではデータを初期化できません。サブスクリプションを有効化してください。")
    }
    setState(defaultState)
  }, [encryptionKey])

  const isReady = isLocalReady

  const contextValue = useMemo<AppStateContextValue>(() => {
    return {
      isReady,
      charts: state.charts,
      saveChart,
      deleteChart,
      resetCharts,
    }
  }, [isReady, state.charts, saveChart, deleteChart, resetCharts])

  return <AppStateContext.Provider value={contextValue}>{children}</AppStateContext.Provider>
}

export function useAppState() {
  const context = useContext(AppStateContext)
  if (!context) {
    throw new Error("useAppState must be used within an AppStateProvider")
  }
  return context
}
