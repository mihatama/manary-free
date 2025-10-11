"use client"

import type React from "react"

import { useCSRF } from "@/hooks/use-csrf"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface CSRFFormProps {
  children: React.ReactNode
  action?: (formData: FormData) => Promise<void> | void
  onSubmit?: React.FormEventHandler<HTMLFormElement>
  className?: string
}

export function CSRFForm({ children, action, onSubmit, className = "" }: CSRFFormProps) {
  const { csrfToken, isLoading, error } = useCSRF()

  if (isLoading) {
    return <div className="text-sm text-gray-500">フォームを読み込み中...</div>
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    )
  }

  return (
    <form action={action} onSubmit={onSubmit} className={className}>
      <input type="hidden" name="csrf_token" value={csrfToken} />
      {children}
    </form>
  )
}
