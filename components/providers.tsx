"use client"

import type { ReactNode } from "react"
import { AmplifyProvider, Theme, defaultDarkModeOverride } from "@aws-amplify/ui-react"
import "@aws-amplify/ui-react/styles.css"

const theme: Theme = {
  name: "manary-amplify",
  overrides: [defaultDarkModeOverride],
  tokens: {
    colors: {
      brand: {
        primary: {
          10: { value: "#fff1f5" },
          20: { value: "#ffe4eb" },
          40: { value: "#f9a8d4" },
          60: { value: "#f472b6" },
          80: { value: "#ec4899" },
          90: { value: "#db2777" },
        },
      },
    },
    radii: {
      small: { value: "0.5rem" },
      medium: { value: "0.75rem" },
    },
  },
}

export function Providers({ children }: { children: ReactNode }) {
  return <AmplifyProvider theme={theme}>{children}</AmplifyProvider>
}
