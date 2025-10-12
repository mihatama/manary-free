"use client"

import type { PropsWithChildren } from "react"

import { ensureAmplifyConfigured } from "@/lib/amplify-client"

import { ThemeProvider } from "next-themes"
import { Toaster } from "@/components/ui/sonner"

import { AppStateProvider } from "./app-state-provider"
import { PwaProvider } from "./pwa-provider"

ensureAmplifyConfigured()

export function RootProvider({ children }: PropsWithChildren) {
  return (
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
      <AppStateProvider>
        <PwaProvider />
        {children}
        <Toaster position="top-right" richColors closeButton />
      </AppStateProvider>
    </ThemeProvider>
  )
}
