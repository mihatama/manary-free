"use client"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { useSubscription } from "@/components/providers/subscription-provider"

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
  const { status, remainingTrialDays, state } = useSubscription()

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

  return (
    <Alert
      variant={status === "trial" && remainingTrialDays > 5 ? "default" : "destructive"}
      className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between"
    >
      <div>
        <AlertTitle className="flex items-center gap-3">
          <Badge variant={badgeVariant}>{badgeText}</Badge>
          {status === "trial" ? "無料トライアル期間中です" : "無料トライアルが終了しました"}
        </AlertTitle>
        <AlertDescription>
          {status === "trial" ? (
            <span>
              {trialEndsAt ? `終了予定日: ${formatDate(trialEndsAt)}。` : null}
              無料プランの残り日数を有効にご活用ください。
            </span>
          ) : (
            <span>継続してデータにアクセスするには、有料プランへの移行が必要です。</span>
          )}
        </AlertDescription>
      </div>
    </Alert>
  )
}
