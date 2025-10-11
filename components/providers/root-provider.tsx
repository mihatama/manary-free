"use client"

import type { PropsWithChildren } from "react"
import { AppStateProvider } from "./app-state-provider"

export function RootProvider({ children }: PropsWithChildren) {
  return <AppStateProvider>{children}</AppStateProvider>
}
