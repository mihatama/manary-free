import { FeatureDisabledMessage } from "@/components/feature-disabled-message"

export default function NewCalendarPage() {
  return (
    <div className="container mx-auto flex min-h-[70vh] items-center justify-center px-4 py-12">
      <FeatureDisabledMessage
        title="予約カレンダーは利用できません"
        description="オンライン予約機能を停止したため、空き状況の確認や予約枠の選択はできません。"
        backHref="/"
      />
    </div>
  )
}
