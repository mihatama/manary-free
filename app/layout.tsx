import type React from "react"
import type { Metadata, Viewport } from "next"

import "./globals.css"
import "react-big-calendar/lib/css/react-big-calendar.css"
import "@aws-amplify/ui-react/styles.css"

import { RootProvider } from "@/components/providers/root-provider"

export const metadata: Metadata = {
  title: {
    default: "Manary",
    template: "%s | Manary",
  },
  description: "Midwife-focused chart manager (local storage edition)",
  applicationName: "Manary",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    title: "Manary",
    statusBarStyle: "default",
  },
  icons: {
    icon: [
      { url: "/favicon.ico" },
      { url: "/icons/icon-192.png", type: "image/png", sizes: "192x192" },
      { url: "/icons/icon-512.png", type: "image/png", sizes: "512x512" },
    ],
    apple: [{ url: "/icons/icon-192.png", type: "image/png", sizes: "192x192" }],
  },
}

export const viewport: Viewport = {
  themeColor: [{ color: "#0ea5e9" }],
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="ja">
      <body>
        <RootProvider>{children}</RootProvider>
      </body>
    </html>
  )
}
