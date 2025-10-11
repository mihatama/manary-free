import type React from "react"
import type { Metadata } from "next"
import "./globals.css"
import "react-big-calendar/lib/css/react-big-calendar.css"

import { Providers } from "@/components/providers"

export const metadata: Metadata = {
  title: "manary",
  description: "Amplify-powered clinic operations dashboard",
  generator: "AWS Amplify UI",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="ja">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
