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
        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="患者名またはIDで検索..."
            className="pl-8 w-full md:w-1/3"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
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
    </>
  )
}
