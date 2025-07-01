"use client"

import type React from "react"

import { useState, useEffect, useTransition, useCallback } from "react"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { ArrowUpDown, Search } from "lucide-react"
import { getCharts } from "@/app/actions/chart-actions"
import { useDebounce } from "use-debounce"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { toast } from "sonner"
import { getBreastCareChartById } from "@/app/actions/breast-care-actions"
import { getPostpartumCareChartById } from "@/app/actions/postpartum-care-actions"
import { BreastCareChartDetails } from "./breast-care-chart-details"
import { PostpartumCareChartDetails } from "./postpartum-care-chart-details"

type Chart = Awaited<ReturnType<typeof getCharts>>[0]

type SortKey = keyof Chart | "patient_name"

// Mock data for templates
const mockBreastCareChart = {
  id: 0,
  no: "（番号）",
  visit_date: new Date().toLocaleDateString("ja-JP"),
  practitioner_name: "（担当者名）",
  trainee_name: "",
  clinic_location: [],
  breast_milk_interval: "",
  milk_volume_day: "",
  milk_volume_night: "",
  formula_volume_per_feed: "",
  s_text: "",
  p_text: "",
  breast_shape: "",
  nipple_shield_used: false,
  pumping_frequency: "",
  nipple_areola_condition: [],
  pain_location: [],
  feeding_position: "",
  family_support_status: "",
  breast_diagram_right: {},
  breast_diagram_left: {},
  diagnosis: "",
  initial_consultation_fee: false,
  single_session_fee: false,
  ticket_fee: false,
  rental_towel_fee: false,
  care_towel_fee: false,
  other_fee: null,
  other_fee_description: null,
  appointments: {
    start_time: new Date().toISOString(),
    questionnaires: {
      data: {
        child_last_name: "（お子様姓）",
        child_first_name: "（お子様名）",
      },
    },
  },
}

const mockPostpartumCareChart = {
  id: 0,
  visit_date: new Date().toLocaleDateString("ja-JP"),
  practitioner_name: "（担当者名）",
  mother_condition: "",
  lochia_status: "",
  episiotomy_pain: "",
  constipation_status: "",
  mental_state: "",
  family_support: "",
  baby_condition: "",
  jaundice_level: "",
  umbilical_cord_status: "",
  feeding_status: "",
  care_plan: "",
  guidance: "",
  payment_details: "",
  appointments: {
    start_time: new Date().toISOString(),
    questionnaires: {
      data: {
        mother_last_name: "（お母様姓）",
        mother_first_name: "（お母様名）",
      },
    },
  },
}

export function ChartsClient({ initialCharts }: { initialCharts: Chart[] }) {
  const [charts, setCharts] = useState(initialCharts)
  const [searchTerm, setSearchTerm] = useState("")
  const [debouncedSearchTerm] = useDebounce(searchTerm, 500)
  const [sortConfig, setSortConfig] = useState<{ key: SortKey; direction: "asc" | "desc" } | null>({
    key: "creation_date",
    direction: "desc",
  })
  const [isPending, startTransition] = useTransition()
  const [isDetailsOpen, setIsDetailsOpen] = useState(false)
  const [selectedChart, setSelectedChart] = useState<any | null>(null)
  const [activeChartType, setActiveChartType] = useState<"breast" | "postpartum" | null>(null)
  const [isBreastCareTemplateOpen, setIsBreastCareTemplateOpen] = useState(false)
  const [isPostpartumCareTemplateOpen, setIsPostpartumCareTemplateOpen] = useState(false)

  const fetchCharts = useCallback(() => {
    startTransition(async () => {
      const data = await getCharts({
        query: debouncedSearchTerm,
        sortBy: sortConfig?.key,
        sortOrder: sortConfig?.direction,
      })
      setCharts(data)
    })
  }, [debouncedSearchTerm, sortConfig])

  useEffect(() => {
    fetchCharts()
  }, [fetchCharts])

  const handleSort = (key: SortKey) => {
    let direction: "asc" | "desc" = "asc"
    if (sortConfig && sortConfig.key === key && sortConfig.direction === "asc") {
      direction = "desc"
    }
    setSortConfig({ key, direction })
  }

  const handleViewDetails = async (chart: Chart) => {
    startTransition(async () => {
      let chartData = null
      let error = null

      if (chart.chart_type === "乳房ケア") {
        const res = await getBreastCareChartById(chart.id)
        chartData = res.data
        error = res.error
        setActiveChartType("breast")
      } else if (chart.chart_type === "産後ケア") {
        const res = await getPostpartumCareChartById(chart.id)
        chartData = res.data
        error = res.error
        setActiveChartType("postpartum")
      }

      if (chartData && !error) {
        setSelectedChart(chartData)
        setIsDetailsOpen(true)
      } else {
        toast.error("カルテ詳細の読み込みに失敗しました。")
        console.error(error)
      }
    })
  }

  const SortableHeader = ({ sortKey, children }: { sortKey: SortKey; children: React.ReactNode }) => (
    <Button variant="ghost" onClick={() => handleSort(sortKey)} className="px-0">
      {children}
      {sortConfig?.key === sortKey ? (
        <ArrowUpDown className="ml-2 h-4 w-4" />
      ) : (
        <ArrowUpDown className="ml-2 h-4 w-4 opacity-0" />
      )}
    </Button>
  )

  return (
    <>
      <div className="space-y-4">
        <div className="flex justify-between items-center gap-4">
          <div className="relative flex-grow">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="患者名またはIDで検索..."
              className="pl-8 w-full"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex gap-2 flex-shrink-0">
            <Button variant="secondary" size="sm" onClick={() => setIsBreastCareTemplateOpen(true)}>
              乳房ケアフォーマット
            </Button>
            <Button variant="secondary" size="sm" onClick={() => setIsPostpartumCareTemplateOpen(true)}>
              産後ケアフォーマット
            </Button>
          </div>
        </div>
        <div className="border rounded-md">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>
                  <SortableHeader sortKey="patient_name">患者名</SortableHeader>
                </TableHead>
                <TableHead>
                  <SortableHeader sortKey="creation_date">作成日</SortableHeader>
                </TableHead>
                <TableHead>
                  <SortableHeader sortKey="chart_type">カルテ種別</SortableHeader>
                </TableHead>
                <TableHead className="text-right">アクション</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isPending && charts.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center h-24">
                    読み込み中...
                  </TableCell>
                </TableRow>
              ) : charts.length > 0 ? (
                charts.map((chart) => (
                  <TableRow key={chart.id}>
                    <TableCell className="font-medium">
                      {chart.patient_name} <span className="text-xs text-muted-foreground">({chart.patient_id})</span>
                    </TableCell>
                    <TableCell>{new Date(chart.creation_date).toLocaleString("ja-JP")}</TableCell>
                    <TableCell>
                      <Badge>{chart.chart_type}</Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="outline" size="sm" onClick={() => handleViewDetails(chart)} disabled={isPending}>
                        詳細表示
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={4} className="text-center h-24">
                    データが見つかりません。
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      <Dialog
        open={isDetailsOpen}
        onOpenChange={(isOpen) => {
          if (!isOpen) {
            setIsDetailsOpen(false)
            setSelectedChart(null)
            setActiveChartType(null)
          }
        }}
      >
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>カルテ詳細</DialogTitle>
          </DialogHeader>
          {isPending && !selectedChart ? (
            <div className="text-center py-8">読み込み中...</div>
          ) : selectedChart && activeChartType === "breast" ? (
            <BreastCareChartDetails chart={selectedChart} />
          ) : selectedChart && activeChartType === "postpartum" ? (
            <PostpartumCareChartDetails chart={selectedChart} />
          ) : null}
        </DialogContent>
      </Dialog>

      <Dialog open={isBreastCareTemplateOpen} onOpenChange={setIsBreastCareTemplateOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>乳房ケアカルテ フォーマット</DialogTitle>
          </DialogHeader>
          <BreastCareChartDetails chart={mockBreastCareChart} />
        </DialogContent>
      </Dialog>

      <Dialog open={isPostpartumCareTemplateOpen} onOpenChange={setIsPostpartumCareTemplateOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>産後ケアカルテ フォーマット</DialogTitle>
          </DialogHeader>
          <PostpartumCareChartDetails chart={mockPostpartumCareChart} />
        </DialogContent>
      </Dialog>
    </>
  )
}
