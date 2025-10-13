"use client"

import { useState } from "react"
import type { FormEvent } from "react"
import { useRouter } from "next/navigation"

import { useSubscription } from "@/components/providers/subscription-provider"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export function UnlockForm() {
  const router = useRouter()
  const { markAsPaid, isUnlocking } = useSubscription()
  const [code, setCode] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError(null)

    const trimmed = code.trim()
    if (!trimmed) {
      setError("解除コードを入力してください。")
      return
    }

    const result = await markAsPaid(trimmed)
    if (result.success) {
      setSuccess(true)
      router.replace("/dashboard")
      return
    }

    setError(result.error ?? "解除コードを確認できませんでした。内容をご確認のうえ再度お試しください。")
  }

  return (
    <form className="space-y-4 rounded-lg border border-border bg-background p-6 shadow-sm" onSubmit={handleSubmit}>
      <div className="space-y-2">
        <Label htmlFor="unlock-code">解除コード</Label>
        <Input
          id="unlock-code"
          placeholder="例）MANARY-PAID-2024"
          value={code}
          onChange={(event) => setCode(event.target.value)}
          disabled={isUnlocking || success}
        />
        <p className="text-xs text-muted-foreground">決済後に発行されたコードを入力すると利用を再開できます。</p>
      </div>

      {error ? <p className="text-sm text-destructive">{error}</p> : null}
      {success ? <p className="text-sm text-emerald-600">解除に成功しました。ダッシュボードへ移動します...</p> : null}

      <Button type="submit" className="w-full" disabled={isUnlocking || success}>
        {isUnlocking ? "確認中..." : "解除する"}
      </Button>
    </form>
  )
}
