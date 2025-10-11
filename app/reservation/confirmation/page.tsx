import { FeatureDisabledMessage } from "@/components/feature-disabled-message"

export default function ConfirmationPage() {
  return (
    <div className="container mx-auto flex min-h-[70vh] items-center justify-center px-4 py-12">
      <FeatureDisabledMessage
        title="予約確認ページは利用できません"
        description="オンライン予約機能が終了したため、過去の予約内容をこちらで確認することはできません。"
        backHref="/"
      />
    </div>
  )
}
