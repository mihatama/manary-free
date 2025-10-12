"use client"

import { useState } from "react"
import type { FormEvent } from "react"
import { useRouter } from "next/navigation"

import { useSubscription } from "@/components/providers/subscription-provider"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

const AUTO_UNLOCK_CODE = process.env.NEXT_PUBLIC_UNLOCK_CODE

type FieldErrors = Partial<Record<"cardNumber" | "expiry" | "cvc" | "cardholder", string>>

function validate(fields: {
  cardNumber: string
  expiry: string
  cvc: string
  cardholder: string
}): FieldErrors {
  const errors: FieldErrors = {}

  const trimmedNumber = fields.cardNumber.replace(/\s+/g, "")
  if (!/^\d{13,19}$/.test(trimmedNumber)) {
    errors.cardNumber = "カード番号を正しく入力してください。"
  }

  if (!/^(0[1-9]|1[0-2])\/\d{2}$/.test(fields.expiry.trim())) {
    errors.expiry = "有効期限は MM/YY 形式で入力してください。"
  }

  if (!/^\d{3,4}$/.test(fields.cvc.trim())) {
    errors.cvc = "CVC/CVV は 3〜4 桁で入力してください。"
  }

  if (fields.cardholder.trim().length === 0) {
    errors.cardholder = "カード名義人を入力してください。"
  }

  return errors
}

export function CardPaymentForm() {
  const router = useRouter()
  const { markAsPaid, isUnlocking } = useSubscription()
  const [cardNumber, setCardNumber] = useState("")
  const [expiry, setExpiry] = useState("")
  const [cvc, setCvc] = useState("")
  const [cardholder, setCardholder] = useState("")
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({})
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError(null)
    setFieldErrors({})

    const validation = validate({ cardNumber, expiry, cvc, cardholder })
    if (Object.keys(validation).length > 0) {
      setFieldErrors(validation)
      return
    }

    if (!AUTO_UNLOCK_CODE) {
      setError("決済設定が完了していません。管理者にお問い合わせください。")
      return
    }

    setIsProcessing(true)
    try {
      await new Promise((resolve) => setTimeout(resolve, 1400))

      const unlocked = await markAsPaid(AUTO_UNLOCK_CODE)
      if (!unlocked) {
        setError("決済結果の確認に失敗しました。もう一度お試しください。")
        return
      }

      setSuccess(true)
      setTimeout(() => {
        router.replace("/dashboard")
      }, 1200)
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <form className="space-y-4 rounded-lg border border-border bg-background p-6 shadow-sm" onSubmit={handleSubmit}>
      <div className="space-y-2">
        <Label htmlFor="card-number">カード番号</Label>
        <Input
          id="card-number"
          inputMode="numeric"
          placeholder="4242 4242 4242 4242"
          value={cardNumber}
          onChange={(event) => setCardNumber(event.target.value)}
          disabled={isUnlocking || isProcessing || success}
        />
        {fieldErrors.cardNumber ? <p className="text-xs text-destructive">{fieldErrors.cardNumber}</p> : null}
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="card-expiry">有効期限</Label>
          <Input
            id="card-expiry"
            placeholder="09/27"
            value={expiry}
            onChange={(event) => setExpiry(event.target.value)}
            disabled={isUnlocking || isProcessing || success}
          />
          {fieldErrors.expiry ? <p className="text-xs text-destructive">{fieldErrors.expiry}</p> : null}
        </div>
        <div className="space-y-2">
          <Label htmlFor="card-cvc">CVC/CVV</Label>
          <Input
            id="card-cvc"
            inputMode="numeric"
            placeholder="123"
            value={cvc}
            onChange={(event) => setCvc(event.target.value)}
            disabled={isUnlocking || isProcessing || success}
          />
          {fieldErrors.cvc ? <p className="text-xs text-destructive">{fieldErrors.cvc}</p> : null}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="card-holder">カード名義人</Label>
        <Input
          id="card-holder"
          placeholder="山田 花子"
          value={cardholder}
          onChange={(event) => setCardholder(event.target.value)}
          disabled={isUnlocking || isProcessing || success}
        />
        {fieldErrors.cardholder ? <p className="text-xs text-destructive">{fieldErrors.cardholder}</p> : null}
      </div>

      <p className="text-xs text-muted-foreground">
        入力内容はブラウザでのみ検証され、外部には送信されません。実際の決済サービスと連携する際は、該当サービスの推奨する SDK を組み込んでください。
      </p>

      {error ? <p className="text-sm text-destructive">{error}</p> : null}
      {success ? <p className="text-sm text-emerald-600">決済が完了しました。ダッシュボードへ移動します…</p> : null}

      <Button type="submit" className="w-full" disabled={isUnlocking || isProcessing || success}>
        {isProcessing || isUnlocking ? "決済処理中…" : "カードで決済する"}
      </Button>
    </form>
  )
}
