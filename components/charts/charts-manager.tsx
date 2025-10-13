"use client"

import { useCallback, useMemo, useState } from "react"
import { useDebounce } from "use-debounce"
import { ArrowUpDown, PenLine, Plus, Search, Trash2 } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

import { useAppState } from "@/components/providers/app-state-provider"
import type {
  BreastCareChartRecord,
  ChartRecord,
  ChartType,
  PostpartumCareChartRecord,
} from "@/lib/chart-types"

import { BreastCareChartDetails } from "./breast-care-chart-details"
import { BreastCareChartForm } from "./breast-care-chart-form"
import { PostpartumCareChartDetails } from "./postpartum-care-chart-details"
import { PostpartumCareChartForm } from "./postpartum-care-chart-form"

type SortKey = "patientName" | "visitDate" | "chartType" | "createdAt"

const sortLabel: Record<SortKey, string> = {
  patientName: "謔｣閠・錐",
  visitDate: "譚･髯｢譌･",
  chartType: "繧ｫ繝ｫ繝・挨",
  createdAt: "菴懈・譌･",
}

const sortableColumns: SortKey[] = ["patientName", "visitDate", "chartType", "createdAt"]

const chartTypeLabel: Record<ChartType, string> = {
  breast: "荵ｳ謌ｿ繧ｱ繧｢",
  postpartum: "逕｣蠕後こ繧｢",
}

const formatDateTime = (value: string) => {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return value
  }
  return date.toLocaleString("ja-JP")
}

const breastTemplate: BreastCareChartRecord = {
  id: "template-breast",
  chartType: "breast",
  patientName: "Hanako Yamada",
  visitDate: new Date().toISOString().slice(0, 10),
  practitionerName: "Hitomi Sato",
  patientId: "SAMPLE-001",
  memo: "Template sample data",
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  data: {
    chartNumber: "BC-0001",
    traineeName: "Trainee A",
    childName: "Taro Yamada",
    childBirthDate: new Date(new Date().setMonth(new Date().getMonth() - 3)).toISOString().slice(0, 10),
    childAgeYears: 0,
    childAgeMonths: 3,
    childAgeDays: 10,
    clinicLocation: "Nishinomiya (home visit)",
    bodyWeight: 3600,
    weightGainPerDay: 30,
    breastMilkInterval: "Every 3 hours",
    breastMilkIntervalDay: "2-3 hours / 5 feeds",
    breastMilkIntervalNight: "3-4 hours / 2 feeds",
    milkVolumeDay: "80ml x 5 feeds",
    milkVolumeNight: "60ml x 2 feeds",
    formulaFeedsPerDay: 2,
    formulaFeedsDaytime: 5,
    formulaFeedsNighttime: 2,
    formulaVolumePerFeed: "40ml/feed",
    expressedMilkFrequency: 2,
    expressedMilkVolumePerFeed: 80,
    weaningFeedsPerDay: 1,
    weaningDetails: "10x rice porridge, carrot puree",
    stoolFrequency: 6,
    urinationFrequency: 8,
    stoolConsistency: "Soft clay-like",
    babyDevelopment: "Good head control, likes pacifier",
    weaningStatus: "Early stage, small portions",
    weaningCompletionDay: "30 days postpartum",
    subjectiveNote: "Breast engorgement at night, fatigue",
    planNote: "Review pumping technique and night positioning",
    breastShape: "Conical",
    nippleShieldUsed: false,
    pumpingFrequency: "2 times per day (manual)",
    pumpingMethod: "Manual pump",
    nippleAreolaCondition: ["Mild cracks", "Dry"],
    painLocation: ["Right areola upper area"],
    feedingPosition: "Football hold",
    familySupportStatus: "Husband covers night feeds",
    breastDiagramRight: { markers: { "12": true } },
    breastDiagramLeft: { markers: { "3": true } },
    concerns: "Lack of sleep continues",
    leftBreastCondition: "No lumps, soft",
    rightBreastCondition: "Mild firmness at 12 o'clock",
    careDetails: "Positioning guidance and warm compress",
    recommendations: "Pump before night feeds, review next visit",
    diagnosis: "Mild duct congestion, observe",
    paymentMethod: "Cash",
    fees: [
      { label: "Initial consult", price: 1000, selected: true },
      { label: "Single session", price: 5500, selected: true },
      { label: "Ticket", price: 14850, selected: false },
      { label: "Rental towel", price: 350, selected: true },
      { label: "Care towel", price: 250, selected: true },
      { label: "Other (supplies)", price: 1500, selected: true },
    ],
  },
}
const postpartumTemplate: PostpartumCareChartRecord = {
  id: "template-postpartum",
  chartType: "postpartum",
  patientName: "Hanako Yamada",
  visitDate: new Date().toISOString().slice(0, 10),
  practitionerName: "Hitomi Sato",
  patientId: "SAMPLE-PP-01",
  memo: "Postpartum template sample",
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  data: {
    chartNumber: "PP-0001",
    clinicLocation: ['Nishinomiya'],
    homeCareSupport: ['Visiting midwife'],
    postpartumDay: 7,
    deliveryDate: new Date().toISOString().slice(0, 10),
    familyStructure: ['Husband', 'First child (3 years)'],
    childcareExperience: "Experience with first child",
    babyCondition: "Weight 3100g, healthy",
    motherCondition: "Tired but stable",
    carePlan: "Continue home care support",
    careDetails: "Shoulder and back stretching guidance",
    evaluation: "Improved posture, monitor sleep",
    homework: ['Breathing exercises before feeds'],
    nextSchedule: "Follow-up visit next week",
    paymentMethod: "Cash",
  },
}

