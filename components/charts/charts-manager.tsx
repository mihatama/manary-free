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
  patientName: "山田 花子",
  visitDate: new Date().toISOString().slice(0, 10),
  practitionerName: "佐藤 仁美",
  patientId: "SAMPLE-002",
  memo: "産後ケアテンプレートのサンプルです",
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  data: {
    chartNumber: "PP-0001",
    clinicLocation: ["西宮"],
    homeCareSupport: ["訪問助産師"],
    postpartumDay: 7,
    deliveryDate: new Date().toISOString().slice(0, 10),
    familyStructure: ["夫", "第一子（3歳）"],
    childcareExperience: "第一子あり",
    livingWithExtendedFamily: false,
    babyCondition: "体重 3100g。黄疸なし",
    motherCondition: "疲労蓄積。肩こりあり",
    sleepStatus: "夜間覚醒 2-3回。授乳後の寝付き悪い",
    appetite: "朝食は軽め。昼と夜は普通",
    bowelCondition: "便秘気味。下剤使用中",
    lochia: "減少傾向。悪臭なし",
    uterineInvolution: "臍下1横指。痛み軽度。",
    postpartumComplications: ["乳腺炎リスク", "会陰部痛"],
    breastfeedingStatus: "混合授乳。昼間はほぼ母乳",
    babyFeedingAmount: "母乳左右各10分＋ミルク40ml",
    lactationStatus: "搾乳で1回80ml確保",
    breastSymptoms: ["乳房の張り", "乳頭痛"],
    mentalState: "不安：夜間授乳。疲労感",
    familySupport: "夫が夜間対応。祖母が週2回訪問",
    householdTasks: ["洗濯", "簡単な掃除"],
    outingRestrictions: "買い物のみ。長時間外出なし",
    contraception: "検討中。次回健診で相談予定",
    supplementUse: ["鉄剤", "ビタミンD"],
    stretchingStatus: "肩・腰回りの柔軟不足",
    reflection: "授乳姿勢の課題を感じている",
    issuesToAddress: ["授乳姿勢改善", "肩こり軽減"],
    healingState: "会陰部縫合部は良好。多少の突っ張り感あり",
    lochiaState: "赤色から褐色へ移行中",
    uterusState: "硬さ良好。収縮も順調",
    ovarianState: "特記なし",
    breastState: "乳房は張り気味。しこりなし",
    nippleState: "軽度の亀裂。保湿ケア中",
    massageDetails: "腰背部〜肩、頸部のリリース。会陰部周囲のドレナージ",
    carePlan: "授乳姿勢の指導とナイトサポート体制の調整",
    careDetails: "肩甲骨周囲のストレッチ指導。呼吸法の練習",
    evaluation: "姿勢矯正で肩こり改善。睡眠時間確保が課題",
    homework: ["肩甲骨ストレッチ1日3回", "授乳前の深呼吸3回"],
    nextSchedule: "来週同じ時間にフォローアップ",
    paymentMethod: "現金払い",
    initialConsultationFee: false,
    singleSessionFee: true,
    ticketFee: false,
    rentalTowelFee: true,
    careTowelFee: true,
    otherFee: null,
    otherFeeDescription: undefined,
  },
}

type EditorState =
  | {
      open: false
      type: "breast" | "postpartum" | null
      chart: ChartRecord | null
    }
  | {
      open: true
      type: "breast" | "postpartum"
      chart: ChartRecord | null
    }

type DetailState =
  | {
      open: false
      chart: ChartRecord | null
    }
  | {
      open: true
      chart: ChartRecord
    }

const initialEditorState: EditorState = {
  open: false,
  type: null,
  chart: null,
}

const initialDetailState: DetailState = {
  open: false,
  chart: null,
}

function useChartsManagerState() {
  const { charts, saveChart, deleteChart } = useAppState()
  const [search, setSearch] = useState("")
  const [sortKey, setSortKey] = useState<SortKey>("createdAt")
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc")
  const [debouncedSearch] = useDebounce(search, 300)
  const [editorState, setEditorState] = useState<EditorState>(initialEditorState)
  const [detailsState, setDetailsState] = useState<DetailState>(initialDetailState)
  const [templateDialog, setTemplateDialog] = useState<"breast" | "postpartum" | null>(null)

  const resetState = useCallback(() => {
    setEditorState(initialEditorState)
    setDetailsState(initialDetailState)
  }, [])

  const filteredCharts = useMemo(() => {
    const normalized = debouncedSearch.trim().toLowerCase()
    if (!normalized) {
      return charts
    }
    return charts.filter((chart) => {
      const patientName = chart.patientName?.toLowerCase() ?? ""
      const practitionerName = chart.practitionerName?.toLowerCase() ?? ""
      const memo = chart.memo?.toLowerCase() ?? ""
      const patientId = chart.patientId?.toLowerCase() ?? ""
      return (
        patientName.includes(normalized) ||
        practitionerName.includes(normalized) ||
        memo.includes(normalized) ||
        patientId.includes(normalized)
      )
    })
  }, [charts, debouncedSearch])

  const sortedCharts = useMemo(() => {
    const factor = sortDirection === "asc" ? 1 : -1
    return [...filteredCharts].sort((a, b) => {
      const left = a[sortKey]
      const right = b[sortKey]
      if (typeof left === "string" && typeof right === "string") {
        return left.localeCompare(right) * factor
      }
      if (typeof left === "number" && typeof right === "number") {
        return (left - right) * factor
      }
      if (left instanceof Date && right instanceof Date) {
        return (left.getTime() - right.getTime()) * factor
      }
      return factor
    })
  }, [filteredCharts, sortDirection, sortKey])

  const toggleSort = useCallback(
    (key: SortKey) => {
      if (sortKey === key) {
        setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"))
      } else {
        setSortKey(key)
        setSortDirection("asc")
      }
    },
    [sortKey],
  )

  const openDetails = useCallback((chart: ChartRecord) => {
    setDetailsState({ open: true, chart })
  }, [])

  const closeDetails = useCallback(() => {
    setDetailsState(initialDetailState)
  }, [])

  const openEditor = useCallback((type: "breast" | "postpartum", chart: ChartRecord | null = null) => {
    setEditorState({ open: true, type, chart })
  }, [])

  const closeEditor = useCallback(() => {
    setEditorState(initialEditorState)
  }, [])

  const handleSaveChart = useCallback(
    (payload: ChartRecord) => {
      const isNew = !payload.id || !charts.some((chart) => chart.id === payload.id)
      const saved = saveChart(payload)
      toast.success(isNew ? "カルテを作成しました" : "カルテを更新しました")
      resetState()
      return saved
    },
    [charts, resetState, saveChart],
  )

  const handleDelete = useCallback(
    (chart: ChartRecord) => {
      deleteChart(chart.id)
      toast.success("カルテを削除しました")
      resetState()
    },
    [deleteChart, resetState],
  )

  const exportCharts = useCallback(() => {
    const payload = JSON.stringify(charts, null, 2)
    const blob = new Blob([payload], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.download = `charts-${new Date().toISOString()}.json`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
    toast.success("カルテデータをエクスポートしました")
  }, [charts])

  return {
    charts,
    sortLabel,
    sortableColumns,
    chartTypeLabel,
    search,
    setSearch,
    sortKey,
    setSortKey,
    sortDirection,
    setSortDirection,
    debouncedSearch,
    editorState,
    setEditorState,
    detailsState,
    setDetailsState,
    templateDialog,
    setTemplateDialog,
    filteredCharts,
    sortedCharts,
    toggleSort,
    openDetails,
    closeDetails,
    openEditor,
    closeEditor,
    handleSaveChart,
    handleDelete,
    exportCharts,
  }
}

export function ChartsManager() {
  const {
    charts,
    sortLabel,
    sortableColumns,
    chartTypeLabel,
    search,
    setSearch,
    sortKey,
    sortDirection,
    debouncedSearch,
    editorState,
    detailsState,
    templateDialog,
    filteredCharts,
    sortedCharts,
    toggleSort,
    openDetails,
    closeDetails,
    openEditor,
    closeEditor,
    handleSaveChart,
    handleDelete,
    exportCharts,
    setTemplateDialog,
  } = useChartsManagerState()

  const createNewChart = useCallback(
    (type: ChartType) => {
      if (type === "breast") {
        openEditor("breast", null)
      } else {
        openEditor("postpartum", null)
      }
    },
    [openEditor],
  )

  const handleImport = useCallback(async () => {
    try {
      const [fileHandle] = await window.showOpenFilePicker({
        multiple: false,
        types: [
          {
            description: "カルテデータ（JSON）",
            accept: {
              "application/json": [".json"],
            },
          },
        ],
      })

      const file = await fileHandle.getFile()
      const text = await file.text()
      const data = JSON.parse(text) as ChartRecord[]

      for (const chart of data) {
        handleSaveChart(chart)
      }

      toast.success("カルテデータをインポートしました")
    } catch (error) {
      console.error(error)
      toast.error("カルテデータのインポートに失敗しました")
    }
  }, [handleSaveChart])

  const showBreastTemplate = useCallback(() => {
    setTemplateDialog("breast")
  }, [])

  const showPostpartumTemplate = useCallback(() => {
    setTemplateDialog("postpartum")
  }, [])

  return (
    <>
      <Card>
        <CardHeader className="flex flex-wrap items-center gap-4">
          <div>
            <CardTitle>カルテ管理</CardTitle>
            <CardDescription>カルテデータの閲覧・作成・編集ができます。</CardDescription>
          </div>
          <div className="flex flex-1 flex-wrap items-center justify-end gap-2">
            <Button variant="outline" onClick={exportCharts}>
              エクスポート
            </Button>
            <Button variant="outline" onClick={handleImport}>
              インポート
            </Button>
            <Button variant="outline" onClick={showBreastTemplate}>
              乳房ケア用テンプレート
            </Button>
            <Button variant="outline" onClick={showPostpartumTemplate}>
              産後ケア用テンプレート
            </Button>
            <Button onClick={() => createNewChart("breast")}>
              <Plus className="mr-2 h-4 w-4" />
              乳房ケアカルテを作成
            </Button>
            <Button onClick={() => createNewChart("postpartum")}>
              <Plus className="mr-2 h-4 w-4" />
              産後ケアカルテを作成
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="relative w-full md:max-w-sm">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="患者名やメモで検索"
                className="pl-8"
              />
            </div>
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" size="sm" onClick={() => createNewChart("breast")}>
                <PenLine className="mr-2 h-4 w-4" />
                乳房ケアカルテを作成
              </Button>
              <Button variant="outline" size="sm" onClick={() => createNewChart("postpartum")}>
                <PenLine className="mr-2 h-4 w-4" />
                産後ケアカルテを作成
              </Button>
            </div>
          </div>
          <div className="mt-4 overflow-hidden rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  {sortableColumns.map((key) => (
                    <TableHead key={key}>
                      <Button
                        variant="ghost"
                        className="flex w-full items-center justify-between px-0 text-left font-semibold"
                        onClick={() => toggleSort(key)}
                      >
                        {sortLabel[key]}
                        <ArrowUpDown className="ml-2 h-4 w-4" />
                      </Button>
                    </TableHead>
                  ))}
                  <TableHead className="w-32 text-right">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCharts.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={sortableColumns.length + 1} className="h-24 text-center text-muted-foreground">
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
