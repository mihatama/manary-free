"use client"

import { useEffect } from "react"
import { toast } from "sonner"

const SW_PATH = "/sw.js"

export function PwaProvider() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return

    const register = async () => {
      try {
        const registration = await navigator.serviceWorker.register(SW_PATH, { scope: "/" })

        const handleUpdate = () => {
          const worker = registration.installing
          if (!worker) return

          worker.addEventListener("statechange", () => {
            if (worker.state !== "installed") return

            if (navigator.serviceWorker.controller) {
              toast("A new version is available. Reload to update.", {
                action: {
                  label: "Reload",
                  onClick: () => window.location.reload(),
                },
              })
              return
            }

            toast.success("Manary is ready to use offline.")
          })
        }

        registration.addEventListener("updatefound", handleUpdate)
        handleUpdate()
      } catch (error) {
        console.error("Service worker registration failed:", error)
      }
    }

    if (document.readyState === "complete") {
      register()
    } else {
      window.addEventListener("load", register, { once: true })
    }

    return () => {
      window.removeEventListener("load", register)
    }
  }, [])

  return null
}
