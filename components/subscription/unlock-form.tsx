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
      setError("ライセンスキーを入力してください。")
      return
    }

    const result = await markAsPaid(trimmed)
    if (result) {
      setSuccess(true)
      router.replace("/dashboard")
      return
    }

    setError("ライセンスキーを確認してください。")
  }

  return (
    <form className="space-y-4 rounded-lg border border-border bg-background p-6 shadow-sm" onSubmit={handleSubmit}>
      <div className="space-y-2">
        <Label htmlFor="unlock-code">ライセンスキー</Label>
        <Input
          id="unlock-code"
          placeholder="例: MANARY-PAID-2024"
          value={code}
          onChange={(event) => setCode(event.target.value)}
          disabled={isUnlocking || success}
        />
        <p className="text-xs text-muted-foreground">決済時に発行されたライセンスキーを入力するとロックが解除されます。</p>
      </div>

      {error ? <p className="text-sm text-destructive">{error}</p> : null}
      {success ? <p className="text-sm text-emerald-600">ロックを解除しました。ダッシュボードへ移動します…</p> : null}

      <Button type="submit" className="w-full" disabled={isUnlocking || success}>
        {isUnlocking ? "解除中…" : "ロックを解除する"}
      </Button>
    </form>
  )
}
