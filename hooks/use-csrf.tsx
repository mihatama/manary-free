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
        const response = await fetch(`/api/csrf?t=${Date.now()}`, {
          cache: "no-store",
          headers: {
            "Cache-Control": "no-cache",
            Pragma: "no-cache",
          },
        })

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}))
          console.error("CSRF API response not OK:", response.status, errorData)
          throw new Error(errorData.error || "CSRFトークンの取得に失敗しました")
        }

        const data = await response.json()
        if (!data.csrfToken) {
          console.error("CSRF token missing in API response:", data)
          throw new Error("CSRFトークンがレスポンスに含まれていません")
        }
        setCsrfToken(data.csrfToken)
        setError(null)
      } catch (err: any) {
        console.error("Failed to fetch CSRF token hook:", err)
        setError(err.message || "セキュリティトークンの取得に失敗しました")

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
