"use client"

import type React from "react"

import { useState, useEffect, useTransition, useCallback } from "react"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { ArrowUpDown, Search } from "lucide-react"
import {
  getQuestionnaires,
  getQuestionnaireById,
  type QuestionnaireWithReservation,
  type DetailedQuestionnaireWithReservation,
} from "@/app/actions/questionnaire-actions"
import { useDebounce } from "use-debounce"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { QuestionnaireDetails } from "./questionnaire-details"
import { toast } from "sonner"

type SortKey = "patient_name" | "submission_date"

export function QuestionnairesClient({
  initialQuestionnaires,
}: {
  initialQuestionnaires: { data: QuestionnaireWithReservation[]; count: number }
}) {
  const [questionnaires, setQuestionnaires] = useState(initialQuestionnaires.data)
  const [searchTerm, setSearchTerm] = useState("")
  const [debouncedSearchTerm] = useDebounce(searchTerm, 500)
  const [sortConfig, setSortConfig] = useState<{ key: SortKey; direction: "asc" | "desc" } | null>({
    key: "submission_date",
    direction: "desc",
  })
  const [isPending, startTransition] = useTransition()
  const [selectedQuestionnaire, setSelectedQuestionnaire] = useState<DetailedQuestionnaireWithReservation | null>(null)
  const [isDetailsOpen, setIsDetailsOpen] = useState(false)

  // This is a placeholder fetch function. The real implementation would use the search and sort state.
  const fetchQuestionnaires = useCallback(() => {
    startTransition(async () => {
      // In a real app, you'd pass search/sort params here
      const result = await getQuestionnaires({})
      setQuestionnaires(result.data)
    })
  }, [])

  useEffect(() => {
    fetchQuestionnaires()
  }, [fetchQuestionnaires])

  const handleSort = (key: SortKey) => {
    let direction: "asc" | "desc" = "asc"
    if (sortConfig && sortConfig.key === key && sortConfig.direction === "asc") {
      direction = "desc"
    }
    setSortConfig({ key, direction })
    // Add sorting logic here
  }

  const handleViewDetails = async (id: number) => {
    startTransition(async () => {
      const data = await getQuestionnaireById(id)
      if (data) {
        setSelectedQuestionnaire(data)
        setIsDetailsOpen(true)
      } else {
        toast.error("問診票の読み込みに失敗しました。")
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
                  <SortableHeader sortKey="submission_date">提出日</SortableHeader>
                </TableHead>
                <TableHead className="text-right">アクション</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isPending ? (
                <TableRow>
                  <TableCell colSpan={3} className="text-center h-24">
                    読み込み中...
                  </TableCell>
                </TableRow>
              ) : questionnaires.length > 0 ? (
                questionnaires.map((q) => (
                  <TableRow key={q.id}>
                    <TableCell className="font-medium">{q.reservations?.patient_name || "N/A"}</TableCell>
                    <TableCell>{new Date(q.created_at).toLocaleString("ja-JP")}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="outline" size="sm" onClick={() => handleViewDetails(q.id)} disabled={isPending}>
                        詳細表示
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={3} className="text-center h-24">
                    データが見つかりません。
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>問診票詳細</DialogTitle>
          </DialogHeader>
          {selectedQuestionnaire ? (
            <QuestionnaireDetails questionnaire={selectedQuestionnaire} />
          ) : (
            <div className="text-center py-8">読み込み中...</div>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}
