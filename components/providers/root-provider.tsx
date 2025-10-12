"use client"

import type { PropsWithChildren } from "react"

import { ensureAmplifyConfigured } from "@/lib/amplify-client"

import { AppStateProvider } from "./app-state-provider"
import { ThemeProvider } from "next-themes"
import { Toaster } from "@/components/ui/sonner"

ensureAmplifyConfigured()

export function RootProvider({ children }: PropsWithChildren) {
  return (
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
      <AppStateProvider>
        {children}
        <Toaster position="top-right" richColors closeButton />
      </AppStateProvider>
    </ThemeProvider>
  )
}
