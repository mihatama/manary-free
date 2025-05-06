"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface DevAuthBypassProps {
  onLogin: (phoneNumber: string) => void
}

export function DevAuthBypass({ onLogin }: DevAuthBypassProps) {
  const [error, setError] = useState<string | null>(null)

  // 開発環境でのみ使用可能
  if (process.env.NODE_ENV === "production") {
    return null
  }

  const handleDevLogin = () => {
    try {
      onLogin("09012345678")
    } catch (err) {
      setError("開発用ログインに失敗しました")
    }
  }

  return (
    <Card className="shadow-md border-gray-100 mb-6 border-2 border-blue-300">
      <CardHeader className="bg-blue-50">
        <CardTitle className="text-xl text-center text-blue-800">開発モード</CardTitle>
        <CardDescription className="text-center text-blue-600">開発環境用の認証バイパス</CardDescription>
      </CardHeader>
      <CardContent className="p-4">
        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="space-y-4">
          <Button onClick={handleDevLogin} className="w-full bg-blue-600 hover:bg-blue-700 text-white">
            開発用: 認証をスキップ
          </Button>
          <p className="text-xs text-center text-gray-500">※この機能は開発環境でのみ使用できます</p>
        </div>
      </CardContent>
    </Card>
  )
}
