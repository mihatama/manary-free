"use client"

import type React from "react"

import { useState, useEffect, useTransition, useCallback } from "react"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { ArrowUpDown, Search } from "lucide-react"
import { getQuestionnaires } from "@/app/actions/questionnaire-actions"
import { useDebounce } from "use-debounce"

type Questionnaire = Awaited<ReturnType<typeof getQuestionnaires>>[0]

type SortKey = keyof Questionnaire | "patient_name"

export function QuestionnairesClient({ initialQuestionnaires }: { initialQuestionnaires: Questionnaire[] }) {
  const [questionnaires, setQuestionnaires] = useState(initialQuestionnaires)
  const [searchTerm, setSearchTerm] = useState("")
  const [debouncedSearchTerm] = useDebounce(searchTerm, 500)
  const [sortConfig, setSortConfig] = useState<{ key: SortKey; direction: "asc" | "desc" } | null>({
    key: "submission_date",
    direction: "desc",
  })
  const [isPending, startTransition] = useTransition()

  const fetchQuestionnaires = useCallback(() => {
    startTransition(async () => {
      const data = await getQuestionnaires({
        query: debouncedSearchTerm,
        sortBy: sortConfig?.key,
        sortOrder: sortConfig?.direction,
      })
      setQuestionnaires(data)
    })
  }, [debouncedSearchTerm, sortConfig])

  useEffect(() => {
    fetchQuestionnaires()
  }, [fetchQuestionnaires])

  const handleSort = (key: SortKey) => {
    let direction: "asc" | "desc" = "asc"
    if (sortConfig && sortConfig.key === key && sortConfig.direction === "asc") {
      direction = "desc"
    }
    setSortConfig({ key, direction })
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
                  <TableCell className="font-medium">
                    {q.patient_name} <span className="text-xs text-muted-foreground">({q.patient_id})</span>
                  </TableCell>
                  <TableCell>{new Date(q.submission_date).toLocaleString("ja-JP")}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="outline" size="sm">
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
  )
}
