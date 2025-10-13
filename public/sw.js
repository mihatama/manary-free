const CACHE_NAME = "manary-pwa-v2"
const STATIC_ASSETS = [
  "/offline.html",
  "/manifest.webmanifest",
  "/favicon.ico",
  "/manary-logo.png",
  "/icons/icon-192.png",
  "/icons/icon-512.png",
  "/icons/icon-512-maskable.png",
]

const cacheFirst = async (request) => {
  const cache = await caches.open(CACHE_NAME)
  const cached = await cache.match(request)
  if (cached) return cached

  const response = await fetch(request)
  if (response && response.status === 200) {
    cache.put(request, response.clone())
  }
  return response
}

const networkFirst = async (request) => {
  const cache = await caches.open(CACHE_NAME)

  try {
    const response = await fetch(request)
    if (response && response.status === 200) {
      cache.put(request, response.clone())
    }
    return response
  } catch (error) {
    const cached = await cache.match(request)
    if (cached) return cached
    if (request.mode === "navigate") {
      return cache.match("/offline.html")
    }
    throw error
  }
}

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) =>
        Promise.all(
          STATIC_ASSETS.map(async (asset) => {
            try {
              await cache.add(asset)
            } catch (error) {
              console.warn("[SW] Failed to precache", asset, error)
            }
          }),
        ),
      )
      .finally(() => self.skipWaiting()),
  )
})

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))))
      .then(() => self.clients.claim()),
  )
})

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return

  const url = new URL(event.request.url)

  if (STATIC_ASSETS.includes(url.pathname)) {
    event.respondWith(cacheFirst(event.request))
    return
  }

  if (event.request.mode === "navigate") {
    event.respondWith(networkFirst(event.request))
    return
  }

  if (url.origin === self.location.origin) {
    event.respondWith(cacheFirst(event.request))
  }
})
