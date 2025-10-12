"use client"

import type { PropsWithChildren } from "react"
import { SessionProvider } from "next-auth/react"
import { AppStateProvider } from "./app-state-provider"

export function RootProvider({ children }: PropsWithChildren) {
  return (
    <SessionProvider>
      <AppStateProvider>{children}</AppStateProvider>
    </SessionProvider>
  )
}
