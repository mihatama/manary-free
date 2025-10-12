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
      setError("Enter the unlock code.")
      return
    }

    const result = await markAsPaid(trimmed)
    if (result.success) {
      setSuccess(true)
      router.replace("/dashboard")
      return
    }

    setError(result.error ?? "Unable to validate the unlock code. Please recheck and try again.")
  }

  return (
    <form className="space-y-4 rounded-lg border border-border bg-background p-6 shadow-sm" onSubmit={handleSubmit}>
      <div className="space-y-2">
        <Label htmlFor="unlock-code">Unlock code</Label>
        <Input
          id="unlock-code"
          placeholder="e.g. MANARY-PAID-2024"
          value={code}
          onChange={(event) => setCode(event.target.value)}
          disabled={isUnlocking || success}
        />
        <p className="text-xs text-muted-foreground">Use the code delivered after checkout to restore access.</p>
      </div>

      {error ? <p className="text-sm text-destructive">{error}</p> : null}
      {success ? <p className="text-sm text-emerald-600">Unlocked successfully. Redirecting to the dashboard...</p> : null}

      <Button type="submit" className="w-full" disabled={isUnlocking || success}>
        {isUnlocking ? "Verifying..." : "Unlock now"}
      </Button>
    </form>
  )
}
