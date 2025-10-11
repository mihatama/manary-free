"use client"

import Link from "next/link"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

interface FeatureDisabledMessageProps {
  title: string
  description: string
  backHref?: string
  backLabel?: string
  className?: string
}

export function FeatureDisabledMessage({
  title,
  description,
  backHref,
  backLabel = "トップページに戻る",
  className,
}: FeatureDisabledMessageProps) {
  return (
    <div
      role="alert"
      className={cn(
        "flex max-w-2xl flex-col items-center gap-4 rounded-xl border border-dashed border-rose-200 bg-rose-50/80 p-8 text-center shadow-sm",
        className,
      )}
    >
      <div className="space-y-3">
        <h2 className="text-xl font-semibold text-rose-600">{title}</h2>
        <p className="text-sm text-rose-900/80">{description}</p>
      </div>
      {backHref ? (
        <Button asChild className="bg-rose-500 text-white hover:bg-rose-500/90">
          <Link href={backHref}>{backLabel}</Link>
        </Button>
      ) : null}
    </div>
  )
}
