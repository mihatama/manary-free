import { ChartsClient } from "@/components/charts-client"
import { getCharts } from "@/app/actions/chart-actions"
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card"

export const dynamic = "force-dynamic"

export default async function ChartsPage() {
  const initialCharts = await getCharts({})

  return (
    <Card>
      <CardHeader>
        <CardTitle>カルテ一覧</CardTitle>
        <CardDescription>カルテの検索、並び替えができます。</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartsClient initialCharts={initialCharts} />
      </CardContent>
    </Card>
  )
}
