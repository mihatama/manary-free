import Link from "next/link"
import { AlertCircle } from "lucide-react"

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
      className={cn(
        "flex flex-col items-center justify-center gap-4 rounded-lg border border-dashed border-rose-200 bg-rose-50/60 p-10 text-center shadow-sm",
        className,
      )}
    >
      <AlertCircle className="h-12 w-12 text-rose-400" aria-hidden="true" />
      <div>
        <h2 className="text-2xl font-bold text-rose-600">{title}</h2>
        <p className="mt-2 text-sm text-rose-700/80">{description}</p>
      </div>
      {backHref ? (
        <Button asChild className="bg-rose-500 text-white hover:bg-rose-500/90">
          <Link href={backHref}>{backLabel}</Link>
        </Button>
      ) : null}
    </div>
  )
}
