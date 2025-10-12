"use client"

import { useRouter } from "next/navigation"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { badgeVariants } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { useSubscription } from "@/components/providers/subscription-provider"
import { cn } from "@/lib/utils"

function formatDate(date?: Date) {
  if (!date) {
    return ""
  }
  try {
    return new Intl.DateTimeFormat("ja-JP", {
      year: "numeric",
      month: "long",
      day: "numeric",
      weekday: "short",
    }).format(date)
  } catch {
    return date.toLocaleDateString("ja-JP")
  }
}

export function TrialStatusBanner() {
  const router = useRouter()
  const { status, remainingTrialDays, state, productPagePath } = useSubscription()

  if (status === "paid") {
    return null
  }

  const trialEndsAt = state?.trialEndsAt
  const badgeText =
    status === "trial"
      ? remainingTrialDays <= 0
        ? "本日まで"
        : `残り ${remainingTrialDays}日`
      : "トライアル終了"

  const badgeVariant =
    status === "trial" ? (remainingTrialDays <= 5 ? "destructive" : "secondary") : "destructive"

  const handleNavigate = () => {
    router.push(productPagePath)
  }

  return (
    <Alert
      variant={status === "trial" && remainingTrialDays > 5 ? "default" : "destructive"}
      className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between"
    >
      <div className="space-y-2">
        <AlertTitle className="flex flex-col gap-2 md:flex-row md:items-center md:gap-3">
          <button
            type="button"
            onClick={handleNavigate}
            className="w-fit rounded-full border border-transparent bg-transparent p-0 text-left text-sm font-semibold text-primary focus:outline-none focus:ring-2 focus:ring-primary/40 focus:ring-offset-2"
          >
            <span className={cn(badgeVariants({ variant: badgeVariant }), "cursor-pointer px-3 py-1")}>
              {badgeText}
            </span>
          </button>
          {status === "trial" ? "無料トライアル期間中です" : "無料トライアルが終了しました"}
        </AlertTitle>
        <AlertDescription>
          {status === "trial" ? (
            <span>
              {trialEndsAt ? `終了予定日: ${formatDate(trialEndsAt)}。` : null}
              残り日数をクリックすると有料プランへの移行手続きに進みます。
            </span>
          ) : (
            <span>継続してデータにアクセスするには、有料プランへの移行が必要です。</span>
          )}
        </AlertDescription>
      </div>
      <Button onClick={handleNavigate} className="w-full md:w-auto">
        プランを見る
      </Button>
    </Alert>
  )
}
