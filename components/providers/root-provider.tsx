"use client"

import type { PropsWithChildren } from "react"

import { ensureAmplifyConfigured } from "@/lib/amplify-client"

import { AppStateProvider } from "./app-state-provider"

ensureAmplifyConfigured()

export function RootProvider({ children }: PropsWithChildren) {
  return <AppStateProvider>{children}</AppStateProvider>
}
