import { QuestionnairesClient } from "@/components/questionnaires-client"
import { getQuestionnaires } from "@/app/actions/questionnaire-actions"
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card"

export const dynamic = "force-dynamic"

export default async function QuestionnairesPage() {
  const initialQuestionnaires = await getQuestionnaires({})

  return (
    <Card>
      <CardHeader>
        <CardTitle>問診票一覧</CardTitle>
        <CardDescription>問診票の検索、並び替えができます。</CardDescription>
      </CardHeader>
      <CardContent>
        <QuestionnairesClient initialQuestionnaires={initialQuestionnaires} />
      </CardContent>
    </Card>
  )
}
