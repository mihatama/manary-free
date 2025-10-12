"use client"

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react"
import { v4 as uuidv4 } from "uuid"

import type { ChartPayload, ChartRecord, BreastCareChartData, PostpartumCareChartData, BreastDiagram } from "@/lib/chart-types"

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

const STORAGE_KEY = "manary-free-charts-state"

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
    normalized.markers = Object.fromEntries(markerEntries)
  }

  return normalized
}

function normalizeBreastCareData(data?: Partial<BreastCareChartData>): BreastCareChartData {
  return {
    chartNumber: normalizeString(data?.chartNumber),
    traineeName: normalizeString(data?.traineeName),
    clinicLocation: normalizeStringArray(data?.clinicLocation),
    bodyWeight: normalizeNumber(data?.bodyWeight),
    weightGainPerDay: normalizeNumber(data?.weightGainPerDay),
    breastMilkInterval: normalizeString(data?.breastMilkInterval),
    milkVolumeDay: normalizeString(data?.milkVolumeDay),
    milkVolumeNight: normalizeString(data?.milkVolumeNight),
    formulaFeedsPerDay: normalizeNumber(data?.formulaFeedsPerDay),
    formulaVolumePerFeed: normalizeString(data?.formulaVolumePerFeed),
    weaningFeedsPerDay: normalizeNumber(data?.weaningFeedsPerDay),
    weaningDetails: normalizeString(data?.weaningDetails),
    stoolFrequency: normalizeNumber(data?.stoolFrequency),
    stoolConsistency: normalizeString(data?.stoolConsistency),
    babyDevelopment: normalizeString(data?.babyDevelopment),
    weaningStatus: normalizeString(data?.weaningStatus),
    subjectiveNote: normalizeString(data?.subjectiveNote),
    planNote: normalizeString(data?.planNote),
    breastShape: normalizeString(data?.breastShape),
    nippleShieldUsed: normalizeBoolean(data?.nippleShieldUsed) ?? false,
    pumpingFrequency: normalizeString(data?.pumpingFrequency),
    pumpingMethod: normalizeString(data?.pumpingMethod),
    nippleAreolaCondition: normalizeStringArray(data?.nippleAreolaCondition),
    painLocation: normalizeStringArray(data?.painLocation),
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
    initialConsultationFee: normalizeBoolean(data?.initialConsultationFee) ?? false,
    singleSessionFee: normalizeBoolean(data?.singleSessionFee) ?? false,
    ticketFee: normalizeBoolean(data?.ticketFee) ?? false,
    rentalTowelFee: normalizeBoolean(data?.rentalTowelFee) ?? false,
    careTowelFee: normalizeBoolean(data?.careTowelFee) ?? false,
    otherFee: normalizeNumber(data?.otherFee),
    otherFeeDescription: normalizeString(data?.otherFeeDescription) ?? null,
  }
}

function normalizePostpartumData(data?: Partial<PostpartumCareChartData>): PostpartumCareChartData {
  return {
    motherCondition: normalizeString(data?.motherCondition),
    lochiaStatus: normalizeString(data?.lochiaStatus),
    episiotomyPain: normalizeString(data?.episiotomyPain),
    constipationStatus: normalizeString(data?.constipationStatus),
    mentalState: normalizeString(data?.mentalState),
    familySupport: normalizeString(data?.familySupport),
    babyCondition: normalizeString(data?.babyCondition),
    jaundiceLevel: normalizeString(data?.jaundiceLevel),
    umbilicalCordStatus: normalizeString(data?.umbilicalCordStatus),
    feedingStatus: normalizeString(data?.feedingStatus),
    carePlan: normalizeString(data?.carePlan),
    guidance: normalizeString(data?.guidance),
    paymentDetails: normalizeString(data?.paymentDetails),
    weeksPostpartum: normalizeNumber(data?.weeksPostpartum),
    physicalCondition: normalizeString(data?.physicalCondition),
    mentalCondition: normalizeString(data?.mentalCondition),
    careProvided: normalizeString(data?.careProvided),
  }
}

function normalizeChartPayload(
  payload: ChartPayload,
  timestamp: string,
  existing?: ChartRecord,
  createdAtOverride?: string,
): ChartRecord {
  const createdAt = existing?.createdAt ?? createdAtOverride ?? timestamp

  const base = {
    id: payload.id ?? uuidv4(),
    chartType: payload.chartType,
    patientName: payload.patientName.trim(),
    patientId: normalizeString(payload.patientId),
    visitDate: payload.visitDate,
    practitionerName: normalizeString(payload.practitionerName),
    memo: normalizeString(payload.memo),
    createdAt,
    updatedAt: timestamp,
  }

  if (payload.chartType === "breast") {
    return {
      ...base,
      chartType: "breast",
      data: normalizeBreastCareData(payload.data),
    }
  }

  return {
    ...base,
    chartType: "postpartum",
    data: normalizePostpartumData(payload.data),
  }
}

function sanitizeCharts(value: unknown): ChartRecord[] {
  if (!Array.isArray(value)) {
    return []
  }

  return value
    .map((raw) => {
      if (!raw || typeof raw !== "object") {
        return null
      }
      const chartType = (raw as { chartType?: string }).chartType === "postpartum" ? "postpartum" : "breast"
      const id = typeof (raw as { id?: string }).id === "string" ? (raw as { id?: string }).id : uuidv4()
      const patientName =
        typeof (raw as { patientName?: string }).patientName === "string"
          ? (raw as { patientName?: string }).patientName
          : ""
      const visitDate =
        typeof (raw as { visitDate?: string }).visitDate === "string"
          ? (raw as { visitDate?: string }).visitDate
          : new Date().toISOString().slice(0, 10)
      const practitionerName =
        typeof (raw as { practitionerName?: string }).practitionerName === "string"
          ? (raw as { practitionerName?: string }).practitionerName
          : undefined
      const memo =
        typeof (raw as { memo?: string }).memo === "string" ? (raw as { memo?: string }).memo : undefined
      const createdAt =
        typeof (raw as { createdAt?: string }).createdAt === "string"
          ? (raw as { createdAt?: string }).createdAt
          : new Date().toISOString()
      const updatedAt =
        typeof (raw as { updatedAt?: string }).updatedAt === "string"
          ? (raw as { updatedAt?: string }).updatedAt
          : createdAt
      const patientId =
        typeof (raw as { patientId?: string }).patientId === "string"
          ? (raw as { patientId?: string }).patientId
          : undefined

      const payload: ChartPayload =
        chartType === "breast"
          ? {
              id,
              chartType,
              patientName,
              patientId,
              visitDate,
              practitionerName,
              memo,
              data: (raw as { data?: Partial<BreastCareChartData> }).data ?? {},
            }
          : {
              id,
              chartType,
              patientName,
              patientId,
              visitDate,
              practitionerName,
              memo,
              data: (raw as { data?: Partial<PostpartumCareChartData> }).data ?? {},
            }

      return normalizeChartPayload(payload, updatedAt, undefined, createdAt)
    })
    .filter((chart): chart is ChartRecord => chart !== null && chart.patientName.length > 0)
}

function loadState(): AppState {
  if (typeof window === "undefined") {
    return defaultState
  }

  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (!stored) {
      return defaultState
    }

    const parsed = JSON.parse(stored) as Partial<AppState>
    const charts = sanitizeCharts(parsed?.charts)
    return { charts }
  } catch (error) {
    console.error("Failed to load chart state", error)
    return defaultState
  }
}

function persistState(state: AppState) {
  if (typeof window === "undefined") {
    return
  }

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  } catch (error) {
    console.error("Failed to persist chart state", error)
  }
}

export function AppStateProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AppState>(defaultState)
  const [isLocalReady, setIsLocalReady] = useState(false)

  useEffect(() => {
    const initialState = loadState()
    setState(initialState)
    setIsLocalReady(true)
  }, [])

  useEffect(() => {
    if (isLocalReady) {
      persistState(state)
    }
  }, [state, isLocalReady])

  const saveChart = useCallback<AppStateContextValue["saveChart"]>((payload) => {
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
  }, [])

  const deleteChart = useCallback<AppStateContextValue["deleteChart"]>((id) => {
    setState((prev) => ({
      charts: prev.charts.filter((chart) => chart.id !== id),
    }))
  }, [])

  const resetCharts = useCallback<AppStateContextValue["resetCharts"]>(() => {
    setState(defaultState)
  }, [])

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
