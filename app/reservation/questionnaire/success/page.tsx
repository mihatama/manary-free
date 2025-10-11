import { FeatureDisabledMessage } from "@/components/feature-disabled-message"

export default function QuestionnaireSuccessPage() {
  return (
    <div className="container mx-auto flex min-h-[70vh] items-center justify-center px-4 py-12">
      <FeatureDisabledMessage
        title="問診票機能はご利用いただけません"
        description="オンライン問診票の受付を終了したため、送信完了ページは表示されません。"
        backHref="/"
      />
    </div>
  )
}
