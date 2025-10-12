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
    errors.cardNumber = "Please enter a valid card number."
  }

  if (!/^(0[1-9]|1[0-2])\/\d{2}$/.test(fields.expiry.trim())) {
    errors.expiry = "Use the MM/YY format for the expiry date."
  }

  if (!/^\d{3,4}$/.test(fields.cvc.trim())) {
    errors.cvc = "CVC/CVV must be a 3-4 digit number."
  }

  if (fields.cardholder.trim().length === 0) {
    errors.cardholder = "Enter the cardholder name."
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
      setError("Auto unlock code is not configured. Please contact an administrator.")
      return
    }

    setIsProcessing(true)
    try {
      await new Promise((resolve) => setTimeout(resolve, 1400))

      const result = await markAsPaid(AUTO_UNLOCK_CODE)
      if (!result.success) {
        setError(result.error ?? "Failed to confirm the billing status. Please try again.")
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
        <Label htmlFor="card-number">Card number</Label>
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
          <Label htmlFor="card-expiry">Expiry</Label>
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
        <Label htmlFor="card-holder">Cardholder name</Label>
        <Input
          id="card-holder"
          placeholder="Jane Smith"
          value={cardholder}
          onChange={(event) => setCardholder(event.target.value)}
          disabled={isUnlocking || isProcessing || success}
        />
        {fieldErrors.cardholder ? <p className="text-xs text-destructive">{fieldErrors.cardholder}</p> : null}
      </div>

      <p className="text-xs text-muted-foreground">
        These inputs simulate validation only. Real card data is never sent. Integrate your payment gateway SDK for production transactions.
      </p>

      {error ? <p className="text-sm text-destructive">{error}</p> : null}
      {success ? <p className="text-sm text-emerald-600">Payment confirmed. Redirecting to the dashboard...</p> : null}

      <Button type="submit" className="w-full" disabled={isUnlocking || isProcessing || success}>
        {isProcessing || isUnlocking ? "Verifying..." : "Complete with card"}
      </Button>
    </form>
  )
}
