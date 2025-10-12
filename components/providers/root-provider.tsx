"use client"

import type { PropsWithChildren } from "react"

import { ensureAmplifyConfigured } from "@/lib/amplify-client"

import { ThemeProvider } from "next-themes"
import { Toaster } from "@/components/ui/sonner"

import { AppStateProvider } from "./app-state-provider"
import { SubscriptionProvider } from "./subscription-provider"
import { PwaProvider } from "./pwa-provider"

ensureAmplifyConfigured()

export function RootProvider({ children }: PropsWithChildren) {
  return (
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
      <SubscriptionProvider>
        <AppStateProvider>
          <PwaProvider />
          {children}
          <Toaster position="top-right" richColors closeButton />
        </AppStateProvider>
      </SubscriptionProvider>
    </ThemeProvider>
  )
}
