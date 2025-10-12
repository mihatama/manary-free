"use client"

import { useEffect, useState } from "react"

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>
}

type PwaInstallButtonProps = {
  className?: string
}

export function PwaInstallButton({ className }: PwaInstallButtonProps) {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [hasInstalled, setHasInstalled] = useState(false)

  useEffect(() => {
    const handleBeforeInstallPrompt = (event: Event) => {
      event.preventDefault()
      setDeferredPrompt(event as BeforeInstallPromptEvent)
    }

    const handleAppInstalled = () => {
      setHasInstalled(true)
      setDeferredPrompt(null)
    }

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt)
    window.addEventListener("appinstalled", handleAppInstalled)

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt)
      window.removeEventListener("appinstalled", handleAppInstalled)
    }
  }, [])

  const handleInstall = async () => {
    if (!deferredPrompt) {
      return
    }

    try {
      await deferredPrompt.prompt()
      await deferredPrompt.userChoice
    } catch (error) {
      console.error("PWA installation prompt failed:", error)
    } finally {
      // Prompt events can only be used once. Wait for a new one if the user cancelled.
      setDeferredPrompt(null)
    }
  }

  if (hasInstalled) {
    return (
      <p className="text-xs text-rose-500" role="status">
        デスクトップにショートカットを追加しました。ありがとうございます。
      </p>
    )
  }

  if (!deferredPrompt) {
    return (
      <p className="text-xs text-muted-foreground">
        対応ブラウザでは「共有」メニューやアドレスバーからホーム画面に追加できます。
      </p>
    )
  }

  return (
    <button
      type="button"
      onClick={handleInstall}
      className={className ?? "w-full rounded-full bg-rose-500 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-rose-600 focus:outline-none focus:ring-2 focus:ring-rose-200 focus:ring-offset-2"}
    >
      デスクトップアプリとしてインストール
    </button>
  )
}
