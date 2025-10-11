import { FeatureDisabledMessage } from "@/components/feature-disabled-message"

export default function QuestionnairePage() {
  return (
    <div className="container mx-auto flex min-h-[70vh] items-center justify-center px-4 py-12">
      <FeatureDisabledMessage
        title="問診票のオンライン提出は終了しました"
        description="オンライン問診票の受付を停止したため、こちらから情報を送信することはできません。"
        backHref="/"
      />
    </div>
  )
}
