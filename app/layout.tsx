import type React from "react"
import type { Metadata } from "next"
import "./globals.css"
import "react-big-calendar/lib/css/react-big-calendar.css"

export const metadata: Metadata = {
  title: "manary",
  description: "Created with v0",
  generator: "v0.dev",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
