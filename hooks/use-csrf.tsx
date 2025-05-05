"use client"

import { useState, useEffect } from "react"

export function useCSRF() {
  const [csrfToken, setCsrfToken] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchCSRFToken = async () => {
      try {
        setIsLoading(true)
        // 単純なフェッチを使用し、Supabaseクライアントは使用しない
        const response = await fetch("/api/csrf")

        if (!response.ok) {
          throw new Error("CSRFトークンの取得に失敗しました")
        }

        const data = await response.json()
        setCsrfToken(data.csrfToken)
        setError(null)
      } catch (err) {
        console.error("Failed to fetch CSRF token:", err)
        setError("セキュリティトークンの取得に失敗しました")
      } finally {
        setIsLoading(false)
      }
    }

    fetchCSRFToken()
  }, [])

  return { csrfToken, isLoading, error }
}
