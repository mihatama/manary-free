import Link from "next/link"
import { Alert, Flex, Text } from "@aws-amplify/ui-react"

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
    <Alert
      variation="warning"
      heading={title}
      className={cn(
        "flex max-w-2xl flex-col items-center gap-4 border border-dashed border-rose-200 bg-rose-50/80 p-8 text-center shadow-sm",
        className,
      )}
    >
      <Flex direction="column" alignItems="center" gap="0.75rem">
        <Text as="p" fontSize="small" color="font.tertiary">
          {description}
        </Text>
        {backHref ? (
          <Button asChild className="bg-rose-500 text-white hover:bg-rose-500/90">
            <Link href={backHref}>{backLabel}</Link>
          </Button>
        ) : null}
      </Flex>
    </Alert>
  )
}
