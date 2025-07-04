"use client"

import { Component, type ErrorInfo, type ReactNode } from "react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { TriangleAlert } from "lucide-react"

interface Props {
  children: ReactNode
}

interface State {
  hasError: boolean
  error?: Error
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
  }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error in ErrorBoundary:", error, errorInfo)
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="flex items-center justify-center h-full">
          <Alert variant="destructive" className="max-w-md">
            <TriangleAlert className="h-4 w-4" />
            <AlertTitle>エラーが発生しました</AlertTitle>
            <AlertDescription>
              カレンダーの表示中に問題が発生しました。ページを再読み込みするか、時間をおいて再度お試しください。
              <details className="mt-2 text-xs text-muted-foreground">
                <summary>エラー詳細</summary>
                <pre className="mt-1 p-2 bg-secondary rounded text-secondary-foreground overflow-auto">
                  {this.state.error?.toString()}
                </pre>
              </details>
            </AlertDescription>
          </Alert>
        </div>
      )
    }

    return this.props.children
  }
}

export default ErrorBoundary
