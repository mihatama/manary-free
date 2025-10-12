import type { MetadataRoute } from "next"

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Manary",
    short_name: "Manary",
    description: "Midwife-focused chart manager (local storage edition)",
    start_url: "/",
    display: "standalone",
    background_color: "#f8fafc",
    theme_color: "#0ea5e9",
    scope: "/",
    lang: "ja",
    orientation: "portrait-primary",
    icons: [
      {
        src: "/icons/icon-192.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/icons/icon-512.png",
        sizes: "512x512",
        type: "image/png",
      },
      {
        src: "/icons/icon-512-maskable.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
    shortcuts: [
      { name: "Dashboard", short_name: "Dashboard", url: "/dashboard" },
      { name: "Reservations", short_name: "Reservations", url: "/reservation" },
    ],
  }
}
