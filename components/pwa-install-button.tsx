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
      <p className="text-xs text-primary" role="status">
        デスクトップにショートカットを追加しました。ありがとうございます。
      </p>
    )
  }

  if (!deferredPrompt) {
    return null
  }

  return (
    <button
      type="button"
      onClick={handleInstall}
      className={
        className ??
        "w-full rounded-full bg-primary px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:ring-offset-2"
      }
    >
      デスクトップアプリとしてインストール
    </button>
  )
}

