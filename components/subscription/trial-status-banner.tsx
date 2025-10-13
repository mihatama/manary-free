"use client"

import { useRouter } from "next/navigation"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { badgeVariants } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { useSubscription } from "@/components/providers/subscription-provider"
import { cn } from "@/lib/utils"
import type { BillingSubscriptionStatus } from "@/lib/server/billing-client"

function formatDate(date?: Date) {
  if (!date) {
    return ""
  }
  try {
    return new Intl.DateTimeFormat("ja-JP", {
      year: "numeric",
      month: "short",
      day: "numeric",
      weekday: "short",
    }).format(date)
  } catch {
    return date.toLocaleDateString()
  }
}

function describeBackendStatus(status?: BillingSubscriptionStatus) {
  switch (status) {
    case "active":
      return "有効"
    case "trialing":
      return "トライアル中"
    case "past_due":
      return "支払い遅延"
    case "canceled":
      return "解約済み"
    case "incomplete":
      return "未完了"
    case "unpaid":
      return "未払い"
    default:
      return undefined
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
        ? "トライアル終了"
        : `残り${remainingTrialDays}日`
      : "トライアル期限切れ"

  const badgeVariant =
    status === "trial" ? (remainingTrialDays <= 5 ? "destructive" : "secondary") : "destructive"

  const handleNavigate = () => {
    router.push(productPagePath)
  }

  const backendStatus = describeBackendStatus(state?.backendStatus)
  const backendMessage = state?.backendMessage

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
          {status === "trial" ? "無料トライアルをご利用中です。" : "無料トライアルは終了しました。"}
        </AlertTitle>
        <AlertDescription>
          <div className="space-y-2 text-sm text-muted-foreground">
            {status === "trial" ? (
              <span>
                {trialEndsAt ? `終了予定日: ${formatDate(trialEndsAt)}。` : ""}
                上のバッジからプラン一覧をご確認ください。
              </span>
            ) : (
              <span>保存済みのカルテを再度利用するには有料プランへのアップグレードが必要です。</span>
            )}
            {backendStatus ? (
              <p className="text-xs text-muted-foreground">
                決済ステータス: {backendStatus}
                {backendMessage ? " - " + backendMessage : ""}
              </p>
            ) : null}
          </div>
        </AlertDescription>
      </div>
      <Button onClick={handleNavigate} className="w-full md:w-auto">
        プランを確認
      </Button>
    </Alert>
  )
}
