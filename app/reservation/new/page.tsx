import { FeatureDisabledMessage } from "@/components/feature-disabled-message"

export default function NewReservationPage() {
  return (
    <div className="container mx-auto flex min-h-[70vh] items-center justify-center px-4 py-12">
      <FeatureDisabledMessage
        title="新規予約は受け付けていません"
        description="オンライン予約の提供を終了したため、こちらのページからの新規予約手続きは行えません。お手数ですが他の連絡手段をご利用ください。"
        backHref="/"
      />
    </div>
  )
}
