"use client"

import { useCallback, useMemo, useState } from "react"
import { useDebounce } from "use-debounce"
import { ArrowUpDown, Eye, PenLine, Plus, Search, Trash2 } from "lucide-react"
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
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
import type { ChartPayload, ChartRecord, ChartType } from "@/lib/chart-types"

import { BreastCareChartDetails } from "./breast-care-chart-details"
import { BreastCareChartForm } from "./breast-care-chart-form"
import { PostpartumCareChartDetails } from "./postpartum-care-chart-details"
import { PostpartumCareChartForm } from "./postpartum-care-chart-form"

type SortKey = "patientName" | "visitDate" | "chartType" | "updatedAt"
type SortOrder = "asc" | "desc"

type FormState =
  | { mode: "create"; chartType: ChartType }
  | { mode: "edit"; chart: ChartRecord }

const sortLabel: Record<SortKey, string> = {
  patientName: "患者名",
  visitDate: "来院日",
  chartType: "カルテ種類",
  updatedAt: "更新日",
}

const chartTypeLabel: Record<ChartType, string> = {
  breast: "乳房ケア",
  postpartum: "産後ケア",
}

function formatDate(value?: string | null) {
  if (!value) {
    return "-"
  }

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return value
  }

  try {
    return new Intl.DateTimeFormat("ja-JP", { dateStyle: "medium" }).format(date)
  } catch {
    return value
  }
}

function formatDateTime(value?: string | null) {
  if (!value) {
    return "-"
  }

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return value
  }

  try {
    return new Intl.DateTimeFormat("ja-JP", { dateStyle: "medium", timeStyle: "short" }).format(date)
  } catch {
    return value
  }
}

function parseSortableDate(value?: string | null) {
  if (!value) {
    return 0
  }
  const timestamp = new Date(value).getTime()
  return Number.isNaN(timestamp) ? 0 : timestamp
}

function matchesSearch(chart: ChartRecord, needle: string) {
  if (!needle) {
    return true
  }

  const haystack = [
    chart.patientName,
    chart.patientId,
    chart.practitionerName,
    chart.memo,
    chartTypeLabel[chart.chartType],
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase()

  return haystack.includes(needle)
}

export function ChartsManager() {
  const { isReady, charts, saveChart, deleteChart } = useAppState()
  const [search, setSearch] = useState("")
  const [sortKey, setSortKey] = useState<SortKey>("visitDate")
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc")
  const [formState, setFormState] = useState<FormState | null>(null)
  const [detailChart, setDetailChart] = useState<ChartRecord | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<ChartRecord | null>(null)
  const [debouncedSearch] = useDebounce(search, 250)

  const normalizedSearch = debouncedSearch.trim().toLowerCase()

  const filteredCharts = useMemo(() => {
    if (!normalizedSearch) {
      return charts
    }
    return charts.filter((chart) => matchesSearch(chart, normalizedSearch))
  }, [charts, normalizedSearch])

  const sortedCharts = useMemo(() => {
    const copy = [...filteredCharts]

    copy.sort((a, b) => {
      let comparison = 0

      switch (sortKey) {
        case "patientName":
          comparison = a.patientName.localeCompare(b.patientName, "ja")
          break
        case "chartType":
          comparison = chartTypeLabel[a.chartType].localeCompare(chartTypeLabel[b.chartType], "ja")
          break
        case "visitDate":
          comparison = parseSortableDate(a.visitDate) - parseSortableDate(b.visitDate)
          break
        case "updatedAt":
          comparison = parseSortableDate(a.updatedAt) - parseSortableDate(b.updatedAt)
          break
        default:
          comparison = 0
      }

      return sortOrder === "asc" ? comparison : -comparison
    })

    return copy
  }, [filteredCharts, sortKey, sortOrder])

  const handleSortToggle = useCallback((key: SortKey) => {
    setSortOrder((previous) => {
      if (sortKey !== key) {
        return key === "patientName" ? "asc" : "desc"
      }
      return previous === "asc" ? "desc" : "asc"
    })
    setSortKey(key)
  }, [sortKey])

  const handleFormSubmit = useCallback(
    (payload: ChartPayload) => {
      try {
        const saved = saveChart(payload)
        toast.success(`「${saved.patientName}」のカルテを保存しました。`)
        setFormState(null)
      } catch (error) {
        console.error(error)
        toast.error(
          error instanceof Error
            ? error.message
            : "カルテの保存に失敗しました。もう一度お試しください。",
        )
      }
    },
    [saveChart],
  )

  const handleDelete = useCallback(() => {
    if (!deleteTarget) {
      return
    }
    try {
      deleteChart(deleteTarget.id)
      toast.success(`「${deleteTarget.patientName}」のカルテを削除しました。`)
    } catch (error) {
      console.error(error)
      toast.error("カルテの削除に失敗しました。")
    } finally {
      setDeleteTarget(null)
    }
  }, [deleteChart, deleteTarget])

  const closeForm = useCallback(() => {
    setFormState(null)
  }, [])

  const renderForm = useCallback(() => {
    if (!formState) {
      return null
    }

    const submitLabel = formState.mode === "edit" ? "カルテを更新" : "カルテを保存"

    if (formState.mode === "create") {
      return formState.chartType === "breast" ? (
        <BreastCareChartForm onSubmit={handleFormSubmit} onCancel={closeForm} submitLabel={submitLabel} />
      ) : (
        <PostpartumCareChartForm
          onSubmit={handleFormSubmit}
          onCancel={closeForm}
          submitLabel={submitLabel}
        />
      )
    }

    return formState.chart.chartType === "breast" ? (
      <BreastCareChartForm
        chart={formState.chart}
        onSubmit={handleFormSubmit}
        onCancel={closeForm}
        submitLabel={submitLabel}
      />
    ) : (
      <PostpartumCareChartForm
        chart={formState.chart}
        onSubmit={handleFormSubmit}
        onCancel={closeForm}
        submitLabel={submitLabel}
      />
    )
  }, [closeForm, formState, handleFormSubmit])

  const emptyMessage = normalizedSearch
    ? "条件に一致するカルテが見つかりません。"
    : "保存されているカルテはまだありません。右上のボタンから作成してください。"

  return (
    <>
      <Card className="shadow-sm">
        <CardHeader className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <CardTitle className="text-2xl font-bold text-primary">カルテ一覧</CardTitle>
            <CardDescription>ローカルに保存されたカルテを検索・閲覧・編集できます。</CardDescription>
          </div>
          <div className="flex flex-col gap-2 md:flex-row">
            <Button
              type="button"
              variant="outline"
              className="flex items-center gap-2"
              onClick={() => setFormState({ mode: "create", chartType: "postpartum" })}
            >
              <Plus className="h-4 w-4" />
              産後ケアを追加
            </Button>
            <Button
              type="button"
              className="flex items-center gap-2"
              onClick={() => setFormState({ mode: "create", chartType: "breast" })}
            >
              <Plus className="h-4 w-4" />
              乳房ケアを追加
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="relative w-full md:max-w-sm">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="患者名・ID・メモで検索"
                className="pl-9"
              />
            </div>
            <div className="flex gap-2">
              {(Object.keys(sortLabel) as SortKey[]).map((key) => (
                <Button
                  key={key}
                  type="button"
                  variant={sortKey === key ? "default" : "outline"}
                  size="sm"
                  className="flex items-center gap-2"
                  onClick={() => handleSortToggle(key)}
                >
                  <ArrowUpDown className="h-4 w-4" />
                  {sortLabel[key]}
                  {sortKey === key ? `（${sortOrder === "asc" ? "昇順" : "降順"}）` : null}
                </Button>
              ))}
            </div>
          </div>

          <div className="overflow-x-auto rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>患者情報</TableHead>
                  <TableHead>カルテ種類</TableHead>
                  <TableHead>来院日</TableHead>
                  <TableHead>更新日</TableHead>
                  <TableHead className="text-right">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {!isReady ? (
                  <TableRow>
                    <TableCell colSpan={5} className="py-10 text-center text-sm text-muted-foreground">
                      カルテを読み込み中です…
                    </TableCell>
                  </TableRow>
                ) : sortedCharts.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="py-10 text-center text-sm text-muted-foreground">
                      {emptyMessage}
                    </TableCell>
                  </TableRow>
                ) : (
                  sortedCharts.map((chart) => (
                    <TableRow key={chart.id}>
                      <TableCell>
                        <div className="flex flex-col gap-1">
                          <span className="font-semibold">{chart.patientName}</span>
                          <span className="text-xs text-muted-foreground">
                            {chart.patientId ? `ID: ${chart.patientId}` : "ID未設定"}
                          </span>
                          {chart.memo ? (
                            <span className="text-xs text-muted-foreground line-clamp-1">{chart.memo}</span>
                          ) : null}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">{chartTypeLabel[chart.chartType]}</Badge>
                      </TableCell>
                      <TableCell>{formatDate(chart.visitDate)}</TableCell>
                      <TableCell>{formatDateTime(chart.updatedAt)}</TableCell>
                      <TableCell className="flex justify-end gap-2">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => setDetailChart(chart)}
                          aria-label="カルテを閲覧"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => setFormState({ mode: "edit", chart })}
                          aria-label="カルテを編集"
                        >
                          <PenLine className="h-4 w-4" />
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => setDeleteTarget(chart)}
                          aria-label="カルテを削除"
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={Boolean(detailChart)} onOpenChange={(open) => (!open ? setDetailChart(null) : null)}>
        <DialogContent className="max-h-[90vh] w-full max-w-4xl overflow-y-auto">
          {detailChart ? (
            <>
              <DialogHeader>
                <DialogTitle>{detailChart.patientName}</DialogTitle>
                <DialogDescription className="flex flex-col gap-1 text-sm">
                  <span>
                    種類: <Badge variant="secondary">{chartTypeLabel[detailChart.chartType]}</Badge>
                  </span>
                  <span>来院日: {formatDate(detailChart.visitDate)}</span>
                  <span>更新日: {formatDateTime(detailChart.updatedAt)}</span>
                  {detailChart.memo ? <span>メモ: {detailChart.memo}</span> : null}
                </DialogDescription>
              </DialogHeader>
              {detailChart.chartType === "breast" ? (
                <BreastCareChartDetails chart={detailChart} />
              ) : (
                <PostpartumCareChartDetails chart={detailChart} />
              )}
            </>
          ) : null}
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(formState)} onOpenChange={(open) => (!open ? closeForm() : null)}>
        <DialogContent className="max-h-[90vh] w-full max-w-5xl overflow-y-auto px-0 pb-6 pt-6 sm:px-4">
          {renderForm()}
        </DialogContent>
      </Dialog>

      <AlertDialog open={Boolean(deleteTarget)} onOpenChange={(open) => (!open ? setDeleteTarget(null) : null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>カルテを削除しますか？</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteTarget
                ? `「${deleteTarget.patientName}」のカルテを削除すると復元できません。よろしいですか？`
                : "このカルテを削除すると復元できません。"}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>キャンセル</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              削除する
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
