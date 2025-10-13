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
  patientName: "螻ｱ逕ｰ 闃ｱ蟄・,
  visitDate: new Date().toISOString().slice(0, 10),
  practitionerName: "菴占陸 莉∫ｾ・,
  patientId: "SAMPLE-001",
  memo: "繝・Φ繝励Ξ繝ｼ繝育畑繧ｵ繝ｳ繝励Ν縺ｧ縺・,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  data: {
    chartNumber: "BC-0001",
    traineeName: "遐比ｿｮ逕蘗",
    clinicLocation: "西宮",
    bodyWeight: 3600,
    weightGainPerDay: 30,
    breastMilkInterval: "3譎る俣縺斐→",
    milkVolumeDay: "80ml ﾃ・5蝗・,
    milkVolumeNight: "60ml ﾃ・2蝗・,
    formulaFeedsPerDay: 2,
    formulaVolumePerFeed: "40ml/蝗・,
    weaningFeedsPerDay: 1,
    weaningDetails: "10蛟咲ｲ･縲√↓繧薙§繧薙ヴ繝･繝ｼ繝ｬ",
    stoolFrequency: 6,
    stoolConsistency: "邊伜悄迥ｶ繝ｻ繧・ｄ繧・ｏ繧峨°繧・,
    babyDevelopment: "鬥悶☆繧上ｊ濶ｯ螂ｽ縲ゅ♀縺励ｃ縺ｶ繧翫ｒ螂ｽ繧",
    weaningStatus: "蛻晄悄縲ゅ∪縺蟆鷹㍼縺壹▽",
    subjectiveNote: "荵ｳ謌ｿ縺ｮ蠑ｵ繧翫′豌励↓縺ｪ繧九ょ､憺俣謗井ｹｳ縺瑚ｾ帙＞",
    planNote: "謳ｾ荵ｳ譁ｹ豕輔・遒ｺ隱阪→螟憺俣謗井ｹｳ縺ｮ蟋ｿ蜍｢繧ｱ繧｢",
    breastShape: "蜀・倹迥ｶ",
    nippleShieldUsed: false,
    pumpingFrequency: "1譌･2蝗橸ｼ域焔蜍包ｼ・,
    pumpingMethod: "謇句虚繝昴Φ繝・,
    nippleAreolaCondition: ["霆ｽ蠎ｦ縺ｮ莠陬・, "荵ｾ辯･豌怜袖"],
    painLocation: ["蜿ｳ荵ｳ霈ｪ荳企Κ"],
    feedingPosition: "繝輔ャ繝医・繝ｼ繝ｫ謚ｱ縺・,
    familySupportStatus: "螟ｫ縺悟､憺俣蟇ｾ蠢懊ｒ繧ｵ繝昴・繝・,
    breastDiagramRight: { markers: { "12": true } },
    breastDiagramLeft: { markers: { "3": true } },
    concerns: "螟憺俣縺ｮ蟇昜ｸ崎ｶｳ縺檎ｶ壹＞縺ｦ縺・ｋ",
    leftBreastCondition: "縺励％繧翫↑縺励よ沐繧峨°縺穂ｿ昴◆繧後※縺・ｋ",
    rightBreastCondition: "12譎よ婿蜷代↓霆ｽ縺・ｼｵ繧・,
    careDetails: "繝昴ず繧ｷ繝ｧ繝九Φ繧ｰ謖・ｰ弱→貂ｩ鄂ｨ豕輔ｒ螳滓命",
    recommendations: "螟憺俣謗井ｹｳ蜑阪・謳ｾ荵ｳ謗ｨ螂ｨ縲よｬ｡蝗槫・隧穂ｾ｡",
    diagnosis: "荵ｳ閻ｺ縺ｮ隧ｰ縺ｾ繧雁だ蜷代らｵ碁℃隕ｳ蟇・,
    paymentMethod: "迴ｾ驥第鴛縺・,
    paymentMethod: "現金 / PayPay",
    fees: [
      { label: "初診料", price: 1000, selected: true },
      { label: "1回", price: 5500, selected: true },
      { label: "チケット", price: 14850, selected: false },
      { label: "レンタルタオル", price: 350, selected: true },
      { label: "ケアタオル", price: 250, selected: true },
    ],
  },
}

const postpartumTemplate: PostpartumCareChartRecord = {
  id: "template-postpartum",
  chartType: "postpartum",
  patientName: "菴占陸 逵溽炊",
  visitDate: new Date().toISOString().slice(0, 10),
  practitionerName: "逕ｰ荳ｭ 逕ｱ鄒・,
  patientId: "SAMPLE-PP-01",
  memo: "繝・Φ繝励Ξ繝ｼ繝育畑繧ｵ繝ｳ繝励Ν縺ｧ縺・,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  data: {
    weeksPostpartum: 4,
    motherCondition: "繝舌う繧ｿ繝ｫ豁｣蟶ｸ縲∫夢蜉ｴ諢溘≠繧・,
    lochiaStatus: "豺｡陦濶ｲ縲・㍼縺ｯ貂帛ｰ大だ蜷・,
    episiotomyPain: "霆ｽ蠎ｦ縺ｮ逍ｼ逞帙ょす縺ｯ濶ｯ螂ｽ",
    constipationStatus: "萓ｿ騾壹・2譌･縺ｫ1蝗槭らｷｩ荳句王縺ｫ繧医ｋ隱ｿ謨ｴ荳ｭ",
    physicalCondition: "閧ｩ縺薙ｊ縺ゅｊ縲ら擅逵荳崎ｶｳ",
    mentalCondition: "豌怜・縺ｮ豕｢縺ｯ蟆代↑繧√ゆｸ榊ｮ画─縺ゅｊ",
    mentalState: "EPDS 6轤ｹ縲ら嶌隲・髪謠ｴ繧堤ｶ咏ｶ・,
    familySupport: "螟ｫ縺悟､憺俣謗井ｹｳ繧偵し繝昴・繝医ょｮ滓ｯ阪′騾ｱ2蝗櫁ｨｪ蝠・,
    careProvided: "閧ｩ逕ｲ鬪ｨ蜻ｨ繧翫・繧ｹ繝医Ξ繝・メ縺ｨ貂ｩ鄂ｨ豕輔ｒ螳滓命",
    babyCondition: "菴馴㍾縺ｮ蠅励∴濶ｯ螂ｽ縲ら匱辭ｱ縺ｪ縺・,
    jaundiceLevel: "閾ｪ辟ｶ豸磯貂医∩",
    umbilicalCordStatus: "荵ｾ辯･縺苓誠荳区ｸ医∩",
    feedingStatus: "豈堺ｹｳ荳ｭ蠢・ょ､憺俣2蝗槭Α繝ｫ繧ｯ陬懆ｶｳ",
    carePlan: "閧ｩ縺薙ｊ蟇ｾ遲悶・繧ｻ繝ｫ繝輔こ繧｢邯咏ｶ壹ょ､憺俣1蝗槭・莨第・繧堤｢ｺ菫・,
    guidance: "謗井ｹｳ蟋ｿ蜍｢縺ｮ蜀咲｢ｺ隱阪ゆｼ第・譎る俣縺ｮ遒ｺ菫晄婿豕輔ｒ謠先｡・,
    paymentDetails: "逕｣蠕後こ繧｢蛻ｩ逕ｨ蛻ｸ 1譫壻ｽｿ逕ｨ",
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
      toast.success(`繧ｫ繝ｫ繝・ｒ菫晏ｭ倥＠縺ｾ縺励◆: ${saved.patientName}`)
      closeEditor()
    },
    [saveChart],
  )

  const handleDelete = () => {
    if (!deleteTarget) {
      return
    }
    deleteChart(deleteTarget.id)
    toast.success(`繧ｫ繝ｫ繝・ｒ蜑企勁縺励∪縺励◆: ${deleteTarget.patientName}`)
    setDeleteTarget(null)
  }

  if (!isReady) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>繧ｫ繝ｫ繝・ｪｭ霎ｼ荳ｭ</CardTitle>
          <CardDescription>繝ｭ繝ｼ繧ｫ繝ｫ繧ｹ繝医Ξ繝ｼ繧ｸ縺ｮ隱ｭ縺ｿ霎ｼ縺ｿ荳ｭ縺ｧ縺吮ｦ</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">縺励・繧峨￥縺雁ｾ・■縺上□縺輔＞縲・/p>
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      <Card>
        <CardHeader className="gap-4 md:flex md:items-center md:justify-between">
          <div>
            <CardTitle>繧ｫ繝ｫ繝・ｸ隕ｧ</CardTitle>
            <CardDescription>荵ｳ謌ｿ繧ｱ繧｢繝ｻ逕｣蠕後こ繧｢縺ｮ繧ｫ繝ｫ繝・ｒ繝ｭ繝ｼ繧ｫ繝ｫ繧ｹ繝医Ξ繝ｼ繧ｸ縺ｧ邂｡逅・＠縺ｾ縺吶・/CardDescription>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button onClick={() => openNewChart("breast")} className="bg-primary text-primary-foreground hover:bg-primary/90">
              <Plus className="mr-2 h-4 w-4" />
              荵ｳ謌ｿ繧ｱ繧｢繧ｫ繝ｫ繝・ｽ懈・
            </Button>
            <Button variant="secondary" onClick={() => openNewChart("postpartum")}>
              <Plus className="mr-2 h-4 w-4" />
              逕｣蠕後こ繧｢繧ｫ繝ｫ繝・ｽ懈・
            </Button>
            <Button variant="outline" onClick={() => setTemplateDialog("breast")}>
              繝輔か繝ｼ繝槭ャ繝茨ｼ井ｹｳ謌ｿ繧ｱ繧｢・・            </Button>
            <Button variant="outline" onClick={() => setTemplateDialog("postpartum")}>
              繝輔か繝ｼ繝槭ャ繝茨ｼ育肇蠕後こ繧｢・・            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="relative md:max-w-sm">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="謔｣閠・錐 / ID / 遞ｮ蛻･縺ｧ讀懃ｴ｢"
                className="pl-9"
              />
            </div>
            <div className="text-sm text-muted-foreground">
              {sortedCharts.length} 莉ｶ陦ｨ遉ｺ・育ｷ乗焚 {charts.length} 莉ｶ・・            </div>
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
                  <TableHead className="text-right">繧｢繧ｯ繧ｷ繝ｧ繝ｳ</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedCharts.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="h-24 text-center text-sm text-muted-foreground">
                      譚｡莉ｶ縺ｫ荳閾ｴ縺吶ｋ繧ｫ繝ｫ繝・・縺ゅｊ縺ｾ縺帙ｓ縲・                    </TableCell>
                  </TableRow>
                ) : (
                  sortedCharts.map((chart) => (
                    <TableRow key={chart.id}>
                      <TableCell>
                        <div className="font-medium">{chart.patientName}</div>
                        <div className="text-xs text-muted-foreground">
                          {chart.patientId ? `ID: ${chart.patientId}` : "ID譛ｪ逋ｻ骭ｲ"}
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
                          隧ｳ邏ｰ
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => openEditChart(chart)}>
                          <PenLine className="mr-1 h-4 w-4" />
                          邱ｨ髮・                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-destructive hover:text-destructive"
                          onClick={() => setDeleteTarget(chart)}
                        >
                          <Trash2 className="mr-1 h-4 w-4" />
                          蜑企勁
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
            <DialogTitle>繧ｫ繝ｫ繝・ｩｳ邏ｰ</DialogTitle>
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
                ? `繧ｫ繝ｫ繝・ｷｨ髮・窶・${chartTypeLabel[editorState.chart.chartType]}`
                : editorState.type
                  ? `${chartTypeLabel[editorState.type]}繧ｫ繝ｫ繝・ｽ懈・`
                  : "繧ｫ繝ｫ繝・}
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
            <DialogTitle>荵ｳ謌ｿ繧ｱ繧｢繧ｫ繝ｫ繝・繝輔か繝ｼ繝槭ャ繝・/DialogTitle>
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
            <DialogTitle>逕｣蠕後こ繧｢繧ｫ繝ｫ繝・繝輔か繝ｼ繝槭ャ繝・/DialogTitle>
          </DialogHeader>
          <PostpartumCareChartDetails chart={postpartumTemplate} />
        </DialogContent>
      </Dialog>

      <AlertDialog open={Boolean(deleteTarget)} onOpenChange={(open) => (!open ? setDeleteTarget(null) : undefined)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>繧ｫ繝ｫ繝・ｒ蜑企勁縺励∪縺吶°・・/AlertDialogTitle>
            <AlertDialogDescription>
              縺薙・謫堺ｽ懊・蜿悶ｊ豸医○縺ｾ縺帙ｓ縲ゅき繝ｫ繝・鶏deleteTarget?.patientName ?? ""}縲阪ｒ蜑企勁縺吶ｋ縺ｨ縲√ヶ繝ｩ繧ｦ繧ｶ縺ｫ菫晏ｭ倥＆繧後◆繝・・繧ｿ縺九ｉ繧ょｮ悟・縺ｫ蜑企勁縺輔ｌ縺ｾ縺吶・            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>繧ｭ繝｣繝ｳ繧ｻ繝ｫ</AlertDialogCancel>
            <AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90" onClick={handleDelete}>
              蜑企勁縺吶ｋ
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}


