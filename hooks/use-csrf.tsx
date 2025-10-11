"use client"

import { useState, useEffect } from "react"

export function useCSRF() {
  const [csrfToken, setCsrfToken] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [retryCount, setRetryCount] = useState(0)

  useEffect(() => {
    const fetchCSRFToken = async () => {
      try {
        setIsLoading(true)
        // Add a cache-busting parameter to prevent caching
        const response = await fetch(`/api/csrf?t=${Date.now()}`, {
          cache: "no-store",
          credentials: "same-origin",
          headers: {
            "Cache-Control": "no-cache",
            Pragma: "no-cache",
          },
        })

        if (!response.ok) {
          throw new Error("CSRFトークンの取得に失敗しました")
        }

        const data = await response.json()
        setCsrfToken(data.csrfToken)
        setError(null)
      } catch (err) {
        console.error("Failed to fetch CSRF token:", err)
        setError("セキュリティトークンの取得に失敗しました")

        // Retry up to 3 times with exponential backoff
        if (retryCount < 3) {
          const timeout = Math.pow(2, retryCount) * 1000
          setTimeout(() => {
            setRetryCount((prev) => prev + 1)
          }, timeout)
        }
      } finally {
        setIsLoading(false)
      }
    }

    fetchCSRFToken()
  }, [retryCount])

  return { csrfToken, isLoading, error }
}
