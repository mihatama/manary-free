"use client"

import Link from "next/link"

import { useSubscription } from "@/components/providers/subscription-provider"
import { CardPaymentForm } from "@/components/subscription/card-payment-form"
import { UnlockForm } from "@/components/subscription/unlock-form"
import { Button } from "@/components/ui/button"

const PRODUCT_INFO_URL = process.env.NEXT_PUBLIC_PRODUCT_INFO_URL ?? "https://manary.care/"

function formatTrialEnd(date?: Date | null) {
  if (!date) {
    return null
  }
  try {
    return new Intl.DateTimeFormat("ja-JP", {
      year: "numeric",
      month: "short",
      day: "numeric",
      weekday: "short",
    }).format(date)
  } catch {
    return date.toLocaleDateString("ja-JP")
  }
}

export default function ProductPage() {
  const { status, state, isReady } = useSubscription()
  const trialEndsAt = state?.trialEndsAt ?? null
  const formattedTrialEndsAt = formatTrialEnd(trialEndsAt)
  const shouldShowLockNotice = isReady && status === "expired"
  const primaryMessage = shouldShowLockNotice
    ? "無料トライアル（30日）が終了したため、アカウントを一時的にロックしました。有料プランに移行すると、これまで保存したデータを含めてすべての機能が再び利用可能になります。"
    : formattedTrialEndsAt
      ? `無料トライアルをご利用中です。終了予定日: ${formattedTrialEndsAt} までは保存済みのデータを含めて、すべての機能を引き続きご利用いただけます。`
      : "無料トライアルをご利用中です。有料プランに移行すると、保存済みのデータを含めてすべての機能を継続してご利用いただけます。"

  return (
    <div className="min-h-screen bg-accent py-12">
      <div className="container mx-auto max-w-4xl space-y-10 bg-background px-6 py-10 shadow-lg sm:rounded-xl">
        <section className="space-y-3">
          <h1 className="text-3xl font-bold text-primary">Manary 製品プランのご案内</h1>
          <p className="text-muted-foreground">{primaryMessage}</p>
          <div className="rounded-lg border border-dashed border-primary/40 bg-primary/5 p-4 text-sm text-primary">
            <p className="font-semibold">有料プランで利用できる内容</p>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-primary/90">
              <li>過去に作成した乳房ケア・産後ケアカルテの完全復号と閲覧</li>
              <li>暗号化されたローカルデータの継続保存とバックアップ</li>
              <li>アップデートやサポートへの優先アクセス</li>
            </ul>
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold">カードで今すぐアップグレード</h2>
          <p className="text-sm text-muted-foreground">
            決済が完了すると、自動的にロックが解除され、過去のカルテデータを含め継続利用できるようになります。
          </p>
          <CardPaymentForm />
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">製品の詳細を見る</h2>
          <p className="text-sm text-muted-foreground">
            料金プランや導入相談については、以下の製品紹介ページをご覧ください。
          </p>
          <Button asChild>
            <Link href={PRODUCT_INFO_URL} target="_blank" rel="noreferrer">
              製品紹介ページを表示
            </Link>
          </Button>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold">ライセンスキーをお持ちの方</h2>
          <p className="text-sm text-muted-foreground">
            決済時に付与されたライセンスキーを入力すると、暗号化されたカルテデータを復元しダッシュボードへ戻ります。
          </p>
          <UnlockForm />
        </section>
      </div>
    </div>
  )
}
