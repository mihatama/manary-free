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
  patientName: "患者名",
  visitDate: "来院日",
  chartType: "カルテ別",
  createdAt: "作成日",
}

const sortableColumns: SortKey[] = ["patientName", "visitDate", "chartType", "createdAt"]

const chartTypeLabel: Record<ChartType, string> = {
  breast: "乳房ケア",
  postpartum: "産後ケア",
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
  patientName: "山田 花子",
  visitDate: new Date().toISOString().slice(0, 10),
  practitionerName: "佐藤 仁美",
  patientId: "SAMPLE-001",
  memo: "テンプレート用サンプルです",
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  data: {
    chartNumber: "BC-0001",
    traineeName: "研修生A",
    clinicLocation: ["西宮"],
    bodyWeight: 3600,
    weightGainPerDay: 30,
    breastMilkInterval: "3時間ごと",
    milkVolumeDay: "80ml × 5回",
    milkVolumeNight: "60ml × 2回",
    formulaFeedsPerDay: 2,
    formulaVolumePerFeed: "40ml/回",
    weaningFeedsPerDay: 1,
    weaningDetails: "10倍粥、にんじんピューレ",
    stoolFrequency: 6,
    stoolConsistency: "粘土状・やややわらかめ",
    babyDevelopment: "首すわり良好。おしゃぶりを好む",
    weaningStatus: "初期。まだ少量ずつ",
    subjectiveNote: "乳房の張りが気になる。夜間授乳が辛い",
    planNote: "搾乳方法の確認と夜間授乳の姿勢ケア",
    breastShape: "円錐状",
    nippleShieldUsed: false,
    pumpingFrequency: "1日2回（手動）",
    pumpingMethod: "手動ポンプ",
    nippleAreolaCondition: ["軽度の亀裂", "乾燥気味"],
    painLocation: ["右乳輪上部"],
    feedingPosition: "フットボール抱き",
    familySupportStatus: "夫が夜間対応をサポート",
    breastDiagramRight: { markers: { "12": true } },
    breastDiagramLeft: { markers: { "3": true } },
    concerns: "夜間の寝不足が続いている",
    leftBreastCondition: "しこりなし。柔らかさ保たれている",
    rightBreastCondition: "12時方向に軽い張り",
    careDetails: "ポジショニング指導と温罨法を実施",
    recommendations: "夜間授乳前の搾乳推奨。次回再評価",
    diagnosis: "乳腺の詰まり傾向。経過観察",
    paymentMethod: "現金払い",
    initialConsultationFee: true,
    singleSessionFee: true,
    ticketFee: false,
    rentalTowelFee: true,
    careTowelFee: true,
    otherFee: 1500,
    otherFeeDescription: "物販（母乳パッド）",
  },
}

const postpartumTemplate: PostpartumCareChartRecord = {
  id: "template-postpartum",
  chartType: "postpartum",
  patientName: "佐藤 真理",
  visitDate: new Date().toISOString().slice(0, 10),
  practitionerName: "田中 由美",
  patientId: "SAMPLE-PP-01",
  memo: "テンプレート用サンプルです",
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  data: {
    weeksPostpartum: 4,
    motherCondition: "バイタル正常、疲労感あり",
    lochiaStatus: "淡血色、量は減少傾向",
    episiotomyPain: "軽度の疼痛。傷は良好",
    constipationStatus: "便通は2日に1回。緩下剤による調整中",
    physicalCondition: "肩こりあり。睡眠不足",
    mentalCondition: "気分の波は少なめ。不安感あり",
    mentalState: "EPDS 6点。相談支援を継続",
    familySupport: "夫が夜間授乳をサポート。実母が週2回訪問",
    careProvided: "肩甲骨周りのストレッチと温罨法を実施",
    babyCondition: "体重の増え良好。発熱なし",
    jaundiceLevel: "自然消退済み",
    umbilicalCordStatus: "乾燥し落下済み",
    feedingStatus: "母乳中心。夜間2回ミルク補足",
    carePlan: "肩こり対策のセルフケア継続。夜間1回は休息を確保",
    guidance: "授乳姿勢の再確認。休息時間の確保方法を提案",
    paymentDetails: "産後ケア利用券 1枚使用",
  },
}

export function ChartsManager() {
  const { charts, saveChart, deleteChart, isReady } = useAppState()
  const [searchTerm, setSearchTerm] = useState("")
  const [debouncedSearchTerm] = useDebounce(searchTerm, 300)
  const [sortConfig, setSortConfig] = useState<{ key: SortKey; direction: "asc" | "desc" }>({
    key: "createdAt",
    direction: "desc",
  })
  const [detailsState, setDetailsState] = useState<{ open: boolean; chart: ChartRecord | null }>({
    open: false,
    chart: null,
  })
  const [editorState, setEditorState] = useState<{
    open: boolean
    chart: ChartRecord | null
    type: ChartType | null
  }>({ open: false, chart: null, type: null })
  const [deleteTarget, setDeleteTarget] = useState<ChartRecord | null>(null)
  const [templateDialog, setTemplateDialog] = useState<ChartType | null>(null)

  const filteredCharts = useMemo(() => {
    const term = debouncedSearchTerm.trim().toLowerCase()
    if (!term) {
      return charts
    }
    return charts.filter((chart) => {
      const haystack = [
        chart.patientName,
        chart.patientId ?? "",
        chartTypeLabel[chart.chartType],
        chart.visitDate,
        chart.practitionerName ?? "",
      ]
        .join(" ")
        .toLowerCase()
      return haystack.includes(term)
    })
  }, [charts, debouncedSearchTerm])

  const sortedCharts = useMemo(() => {
    const sorted = [...filteredCharts]
    sorted.sort((a, b) => {
      const { key } = sortConfig
      let result = 0
      if (key === "patientName") {
        result = a.patientName.localeCompare(b.patientName, "ja")
      } else if (key === "chartType") {
        result = chartTypeLabel[a.chartType].localeCompare(chartTypeLabel[b.chartType], "ja")
      } else if (key === "visitDate") {
        result = a.visitDate.localeCompare(b.visitDate)
      } else if (key === "createdAt") {
        result = a.createdAt.localeCompare(b.createdAt)
      }

      return sortConfig.direction === "asc" ? result : -result
    })
    return sorted
  }, [filteredCharts, sortConfig])

  const toggleSort = (key: SortKey) => {
    setSortConfig((prev) =>
      prev.key === key ? { key, direction: prev.direction === "asc" ? "desc" : "asc" } : { key, direction: "asc" },
    )
  }

  const openDetails = (chart: ChartRecord) => {
    setDetailsState({ open: true, chart })
  }

  const closeDetails = () => {
    setDetailsState({ open: false, chart: null })
  }

  const openEditChart = (chart: ChartRecord) => {
    setEditorState({ open: true, chart, type: chart.chartType })
  }

  const openNewChart = (type: ChartType) => {
    setEditorState({ open: true, chart: null, type })
  }

  const closeEditor = () => {
    setEditorState({ open: false, chart: null, type: null })
  }

  const handleSaveChart = useCallback(
    (payload: Parameters<typeof saveChart>[0]) => {
      const saved = saveChart(payload)
      toast.success(`カルテを保存しました: ${saved.patientName}`)
      closeEditor()
    },
    [saveChart],
  )

  const handleDelete = () => {
    if (!deleteTarget) {
      return
    }
    deleteChart(deleteTarget.id)
    toast.success(`カルテを削除しました: ${deleteTarget.patientName}`)
    setDeleteTarget(null)
  }

  if (!isReady) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>カルテ読込中</CardTitle>
          <CardDescription>ローカルストレージの読み込み中です…</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">しばらくお待ちください。</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      <Card>
        <CardHeader className="gap-4 md:flex md:items-center md:justify-between">
          <div>
            <CardTitle>カルテ一覧</CardTitle>
            <CardDescription>乳房ケア・産後ケアのカルテをローカルストレージで管理します。</CardDescription>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button onClick={() => openNewChart("breast")} className="bg-rose-500 text-white hover:bg-rose-400">
              <Plus className="mr-2 h-4 w-4" />
              乳房ケアカルテ作成
            </Button>
            <Button variant="secondary" onClick={() => openNewChart("postpartum")}>
              <Plus className="mr-2 h-4 w-4" />
              産後ケアカルテ作成
            </Button>
            <Button variant="outline" onClick={() => setTemplateDialog("breast")}>
              フォーマット（乳房ケア）
            </Button>
            <Button variant="outline" onClick={() => setTemplateDialog("postpartum")}>
              フォーマット（産後ケア）
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="relative md:max-w-sm">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="患者名 / ID / 種別で検索"
                className="pl-9"
              />
            </div>
            <div className="text-sm text-muted-foreground">
              {sortedCharts.length} 件表示（総数 {charts.length} 件）
            </div>
          </div>

          <div className="overflow-hidden rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  {sortableColumns.map((key) => (
                    <TableHead key={key}>
                      <button
                        type="button"
                        onClick={() => toggleSort(key)}
                        className="inline-flex items-center gap-2 text-sm font-semibold text-foreground"
                      >
                        {sortLabel[key]}
                        <ArrowUpDown
                          className={`h-4 w-4 ${sortConfig.key === key ? "opacity-100" : "opacity-40"}`}
                        />
                      </button>
                    </TableHead>
                  ))}
                  <TableHead className="text-right">アクション</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedCharts.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="h-24 text-center text-sm text-muted-foreground">
                      条件に一致するカルテはありません。
                    </TableCell>
                  </TableRow>
                ) : (
                  sortedCharts.map((chart) => (
                    <TableRow key={chart.id}>
                      <TableCell>
                        <div className="font-medium">{chart.patientName}</div>
                        <div className="text-xs text-muted-foreground">
                          {chart.patientId ? `ID: ${chart.patientId}` : "ID未登録"}
                        </div>
                      </TableCell>
                      <TableCell>{chart.visitDate}</TableCell>
                      <TableCell>
                        <Badge variant={chart.chartType === "breast" ? "default" : "outline"}>
                          {chartTypeLabel[chart.chartType]}
                        </Badge>
                      </TableCell>
                      <TableCell>{formatDateTime(chart.createdAt)}</TableCell>
                      <TableCell className="flex justify-end gap-2">
                        <Button variant="outline" size="sm" onClick={() => openDetails(chart)}>
                          詳細
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => openEditChart(chart)}>
                          <PenLine className="mr-1 h-4 w-4" />
                          編集
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-destructive hover:text-destructive"
                          onClick={() => setDeleteTarget(chart)}
                        >
                          <Trash2 className="mr-1 h-4 w-4" />
                          削除
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

      <Dialog open={detailsState.open} onOpenChange={(open) => (!open ? closeDetails() : undefined)}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>カルテ詳細</DialogTitle>
          </DialogHeader>
          {detailsState.chart ? (
            detailsState.chart.chartType === "breast" ? (
              <BreastCareChartDetails chart={detailsState.chart as BreastCareChartRecord} />
            ) : (
              <PostpartumCareChartDetails chart={detailsState.chart as PostpartumCareChartRecord} />
            )
          ) : null}
        </DialogContent>
      </Dialog>

      <Dialog open={editorState.open} onOpenChange={(open) => (!open ? closeEditor() : undefined)}>
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editorState.chart
                ? `カルテ編集 — ${chartTypeLabel[editorState.chart.chartType]}`
                : editorState.type
                  ? `${chartTypeLabel[editorState.type]}カルテ作成`
                  : "カルテ"}
            </DialogTitle>
          </DialogHeader>
          {editorState.type === "breast" ? (
            <BreastCareChartForm
              chart={editorState.chart as BreastCareChartRecord | undefined}
              onCancel={closeEditor}
              onSubmit={(payload) => handleSaveChart(payload)}
            />
          ) : editorState.type === "postpartum" ? (
            <PostpartumCareChartForm
              chart={editorState.chart as PostpartumCareChartRecord | undefined}
              onCancel={closeEditor}
              onSubmit={(payload) => handleSaveChart(payload)}
            />
          ) : null}
        </DialogContent>
      </Dialog>

      <Dialog open={templateDialog === "breast"} onOpenChange={(open) => (!open ? setTemplateDialog(null) : undefined)}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>乳房ケアカルテ フォーマット</DialogTitle>
          </DialogHeader>
          <BreastCareChartDetails chart={breastTemplate} />
        </DialogContent>
      </Dialog>

      <Dialog
        open={templateDialog === "postpartum"}
        onOpenChange={(open) => (!open ? setTemplateDialog(null) : undefined)}
      >
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>産後ケアカルテ フォーマット</DialogTitle>
          </DialogHeader>
          <PostpartumCareChartDetails chart={postpartumTemplate} />
        </DialogContent>
      </Dialog>

      <AlertDialog open={Boolean(deleteTarget)} onOpenChange={(open) => (!open ? setDeleteTarget(null) : undefined)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>カルテを削除しますか？</AlertDialogTitle>
            <AlertDialogDescription>
              この操作は取り消せません。カルテ「{deleteTarget?.patientName ?? ""}」を削除すると、ブラウザに保存されたデータからも完全に削除されます。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>キャンセル</AlertDialogCancel>
            <AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90" onClick={handleDelete}>
              削除する
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}

