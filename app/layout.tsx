import type React from "react"
import type { Metadata } from "next"

import "./globals.css"
import "react-big-calendar/lib/css/react-big-calendar.css"
import "@aws-amplify/ui-react/styles.css"

import { RootProvider } from "@/components/providers/root-provider"

export const metadata: Metadata = {
  title: "Manary",
  description: "Midwife-focused reservation manager (local storage edition)",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body>
        <RootProvider>{children}</RootProvider>
      </body>
    </html>
  )
}
