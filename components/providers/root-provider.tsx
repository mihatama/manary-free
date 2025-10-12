"use client"

import type { PropsWithChildren } from "react"
import { AmplifyProvider } from "@aws-amplify/ui-react"

import { ensureAmplifyConfigured } from "@/lib/amplify-client"

import { AppStateProvider } from "./app-state-provider"

ensureAmplifyConfigured()

export function RootProvider({ children }: PropsWithChildren) {
  return (
    <AmplifyProvider>
      <AppStateProvider>{children}</AppStateProvider>
    </AmplifyProvider>
  )
}
