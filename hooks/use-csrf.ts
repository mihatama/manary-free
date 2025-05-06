"use client"

import { useState, useEffect } from "react"

export function useCSRF() {
  const [csrfToken, setCsrfToken] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    async function fetchCSRFToken() {
      try {
        setIsLoading(true)
        const response = await fetch("/api/csrf")

        if (!response.ok) {
          throw new Error("CSRFトークンの取得に失敗しました")
        }

        const data = await response.json()
        setCsrfToken(data.csrfToken)
      } catch (err) {
        console.error("Error fetching CSRF token:", err)
        setError(err instanceof Error ? err : new Error("Unknown error"))
      } finally {
        setIsLoading(false)
      }
    }

    fetchCSRFToken()
  }, [])

  return { csrfToken, isLoading, error }
}
