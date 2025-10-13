"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"

import { Button } from "@/components/ui/button"
import { Toggle } from "@/components/ui/toggle"
import type { BreastDiagram } from "@/lib/chart-types"
import { cn } from "@/lib/utils"

interface BreastDiagramInputProps {
  value?: BreastDiagram
  onChange?: (value: BreastDiagram) => void
  side: "right" | "left"
  readOnly?: boolean
}

const POSITIONS = ["12", "3", "6", "9"] as const
const POSITION_STYLES: Record<(typeof POSITIONS)[number], string> = {
  "12": "top-1.5 left-1/2 -translate-x-1/2",
  "3": "top-1/2 right-1.5 -translate-y-1/2",
  "6": "bottom-1.5 left-1/2 -translate-x-1/2",
  "9": "top-1/2 left-1.5 -translate-y-1/2",
}
const CANVAS_SIZE = 220
const LINE_COLOR = "#ef4444"
const LINE_WIDTH = 2.5
const ERASER_WIDTH = 14

type NormalizedDiagram = {
  imageData?: string
  markers?: Record<string, boolean>
}

const hasActiveMarkers = (markers?: Record<string, boolean>) =>
  Boolean(markers && Object.values(markers).some(Boolean))

const markersEqual = (a: Record<string, boolean>, b: Record<string, boolean>) => {
  const aKeys = Object.keys(a)
  const bKeys = Object.keys(b)
  if (aKeys.length !== bKeys.length) {
    return false
  }
  return aKeys.every((key) => a[key] === b[key])
}

const normalizeDiagramValue = (
  value: BreastDiagram | Record<string, boolean> | undefined,
): NormalizedDiagram => {
  if (!value || typeof value !== "object") {
    return {}
  }

  const record = value as Record<string, unknown>
  const normalized: NormalizedDiagram = {}

  if (typeof record.imageData === "string" && record.imageData.startsWith("data:image/")) {
    normalized.imageData = record.imageData
  }

  let markerSource: Record<string, unknown> | undefined
  if (record.markers && typeof record.markers === "object" && !Array.isArray(record.markers)) {
    markerSource = record.markers as Record<string, unknown>
  } else {
    markerSource = record
  }

  if (markerSource) {
    const markerEntries = Object.entries(markerSource).filter(
      ([key, val]) =>
        key !== "imageData" &&
        key !== "markers" &&
        typeof key === "string" &&
        typeof val === "boolean" &&
        val === true,
    ) as Array<[string, true]>

    if (markerEntries.length > 0) {
      normalized.markers = Object.fromEntries(markerEntries)
    }
  }

  return normalized
}

export function BreastDiagramInput({ value, onChange, side, readOnly = false }: BreastDiagramInputProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const lastPointRef = useRef<{ x: number; y: number } | null>(null)
  const isDrawingRef = useRef(false)
  const pointerIdRef = useRef<number | null>(null)
  const imageLoadIdRef = useRef(0)

  const [imageData, setImageData] = useState<string | undefined>()
  const [markers, setMarkers] = useState<Record<string, boolean>>({})
  const [eraserOn, setEraserOn] = useState(false)

  const valueKey = useMemo(() => JSON.stringify(value ?? {}), [value])
  const normalizedValue = useMemo(() => normalizeDiagramValue(value as any), [valueKey])
  const storageKey = useMemo(() => `breast-diagram-${side}`, [side])

  const loadStoredImage = useCallback(() => {
    if (typeof window === "undefined") {
      return undefined
    }
    try {
      return window.localStorage.getItem(storageKey) ?? undefined
    } catch {
      return undefined
    }
  }, [storageKey])

  const writeStoredImage = useCallback(
    (data?: string) => {
      if (typeof window === "undefined") {
        return
      }
      try {
        if (!data) {
          window.localStorage.removeItem(storageKey)
        } else {
          window.localStorage.setItem(storageKey, data)
        }
      } catch {
        // ignore storage quota errors and private browsing limitations
      }
    },
    [storageKey],
  )

  const getContext = useCallback(() => {
    if (!canvasRef.current) {
      return null
    }
    const context = canvasRef.current.getContext("2d")
    if (!context) {
      return null
    }
    context.lineCap = "round"
    context.lineJoin = "round"
    return context
  }, [])

  const loadImage = useCallback(
    async (data: string | undefined, id: number) => {
      const canvas = canvasRef.current
      if (!canvas) {
        return
      }
      const ctx = getContext()
      if (!ctx) {
        return
      }

      ctx.clearRect(0, 0, CANVAS_SIZE, CANVAS_SIZE)

      if (!data) {
        setImageData(undefined)
        return
      }

      const image = new Image()
      image.crossOrigin = "anonymous"
      image.src = data
      await new Promise((resolve) => {
        image.onload = resolve
        image.onerror = resolve
      })

      if (imageLoadIdRef.current !== id) {
        return
      }

      ctx.drawImage(image, 0, 0, CANVAS_SIZE, CANVAS_SIZE)
      setImageData(data)
    },
    [getContext],
  )

  useEffect(() => {
    const id = ++imageLoadIdRef.current
    const stored = loadStoredImage()
    const effectiveImage = normalizedValue.imageData ?? stored
    void loadImage(effectiveImage, id)
    setMarkers(normalizedValue.markers ?? {})
    setEraserOn(false)
  }, [loadImage, loadStoredImage, normalizedValue])

  useEffect(() => {
    if (!canvasRef.current) {
      return
    }
    canvasRef.current.width = CANVAS_SIZE
    canvasRef.current.height = CANVAS_SIZE
  }, [])

  const startDrawing = useCallback(
    (event: React.PointerEvent<HTMLCanvasElement>) => {
      if (readOnly || !canvasRef.current) {
        return
      }
      const rect = canvasRef.current.getBoundingClientRect()
      const x = event.clientX - rect.left
      const y = event.clientY - rect.top
      const ctx = getContext()
      if (!ctx) {
        return
      }

      pointerIdRef.current = event.pointerId
      canvasRef.current.setPointerCapture(event.pointerId)
      isDrawingRef.current = true
      lastPointRef.current = { x, y }

      ctx.beginPath()
      ctx.moveTo(x, y)
      ctx.lineWidth = eraserOn ? ERASER_WIDTH : LINE_WIDTH
      ctx.globalCompositeOperation = eraserOn ? "destination-out" : "source-over"
      ctx.strokeStyle = eraserOn ? "rgba(0,0,0,1)" : LINE_COLOR
      ctx.lineCap = "round"
      ctx.lineJoin = "round"
    },
    [eraserOn, getContext, readOnly],
  )

  const finishDrawing = useCallback(
    (event: React.PointerEvent<HTMLCanvasElement>) => {
      if (!canvasRef.current || pointerIdRef.current !== event.pointerId) {
        return
      }
      const ctx = getContext()
      if (ctx) {
        ctx.closePath()
      }
      isDrawingRef.current = false
      pointerIdRef.current = null
      lastPointRef.current = null

      try {
        const data = canvasRef.current.toDataURL("image/png", 0.9)
        setImageData(data)
        writeStoredImage(data)
        onChange?.({
          imageData: data,
          markers,
        })
      } catch (error) {
        console.error("Failed to save breast diagram", error)
      }
    },
    [getContext, markers, onChange, writeStoredImage],
  )

  const handlePointerDown = (event: React.PointerEvent<HTMLCanvasElement>) => {
    if (readOnly) {
      return
    }
    event.preventDefault()
    startDrawing(event)
  }

  const handlePointerMove = (event: React.PointerEvent<HTMLCanvasElement>) => {
    if (readOnly || pointerIdRef.current !== event.pointerId || !canvasRef.current) {
      return
    }
    event.preventDefault()
    const rect = canvasRef.current.getBoundingClientRect()
    const x = event.clientX - rect.left
    const y = event.clientY - rect.top
    const ctx = getContext()
    if (!ctx) {
      return
    }

    ctx.lineTo(x, y)
    ctx.stroke()
    ctx.beginPath()
    ctx.moveTo(x, y)
  }

  const handlePointerUp = (event: React.PointerEvent<HTMLCanvasElement>) => {
    if (readOnly) {
      return
    }
    const ctx = getContext()
    if (ctx) {
      ctx.globalCompositeOperation = "source-over"
      ctx.strokeStyle = LINE_COLOR
      ctx.lineWidth = LINE_WIDTH
    }
    finishDrawing(event)
  }

  const handlePointerLeave = (event: React.PointerEvent<HTMLCanvasElement>) => {
    if (readOnly) {
      return
    }
    const ctx = getContext()
    if (ctx) {
      ctx.globalCompositeOperation = "source-over"
      ctx.strokeStyle = LINE_COLOR
      ctx.lineWidth = LINE_WIDTH
    }
    finishDrawing(event)
  }

  const handlePointerCancel = (event: React.PointerEvent<HTMLCanvasElement>) => {
    if (readOnly) {
      return
    }
    const ctx = getContext()
    if (ctx) {
      ctx.globalCompositeOperation = "source-over"
      ctx.strokeStyle = LINE_COLOR
      ctx.lineWidth = LINE_WIDTH
    }
    finishDrawing(event)
  }

  const handleClear = useCallback(() => {
    if (readOnly) {
      return
    }
    const ctx = getContext()
    if (!ctx) {
      return
    }
    ctx.clearRect(0, 0, CANVAS_SIZE, CANVAS_SIZE)
    setImageData(undefined)
    setMarkers({})
    writeStoredImage(undefined)
    onChange?.({})
  }, [getContext, onChange, readOnly, writeStoredImage])

  const toggleMarker = useCallback(
    (position: (typeof POSITIONS)[number]) => {
      if (readOnly) {
        return
      }

      setMarkers((prev) => {
        const next = { ...prev, [position]: !prev[position] }
        if (!hasActiveMarkers(next)) {
          return {}
        }
        return next
      })
    },
    [readOnly],
  )

  useEffect(() => {
    if (readOnly) {
      return
    }
    if (!hasActiveMarkers(markers)) {
      return
    }
    onChange?.({
      imageData,
      markers,
    })
  }, [imageData, markers, onChange, readOnly])

  useEffect(() => {
    if (!value) {
      return
    }
    const normalizedMarkers = normalizedValue.markers ?? {}
    setMarkers((prev) => {
      if (markersEqual(prev, normalizedMarkers)) {
        return prev
      }
      return normalizedMarkers
    })
  }, [normalizedValue.markers, value])

  const sideLabel = side === "right" ? "右" : "左"
  const showMarkers = !imageData && hasActiveMarkers(markers)
  const canClear = Boolean(imageData) || hasActiveMarkers(markers)

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="flex items-center gap-2">
        <p className="text-sm font-semibold">{sideLabel}</p>
        {!readOnly ? (
          <div className="flex items-center gap-1">
            <Toggle
              pressed={eraserOn}
              onPressedChange={(on) => setEraserOn(Boolean(on))}
              size="sm"
              variant="outline"
              aria-label="消しゴム切替"
              title="消しゴム"
            >
              {eraserOn ? "消しゴム" : "ペン"}
            </Toggle>
            <Button type="button" variant="ghost" size="sm" onClick={handleClear} disabled={!canClear}>
              クリア
            </Button>
          </div>
        ) : null}
      </div>
      <div className="relative h-[220px] w-[220px] select-none">
        <svg
          viewBox="0 0 100 100"
          className="pointer-events-none absolute inset-0 h-full w-full text-muted-foreground/40"
        >
          <circle cx="50" cy="50" r="46" stroke="currentColor" strokeWidth="2" fill="none" />
          <circle cx="50" cy="50" r="22" stroke="currentColor" strokeWidth="1.5" fill="none" />
          <circle cx="50" cy="50" r="7" fill="currentColor" fillOpacity="0.2" />
          <line x1="50" y1="4" x2="50" y2="12" stroke="currentColor" strokeWidth="1.5" />
          <line x1="90" y1="50" x2="96" y2="50" stroke="currentColor" strokeWidth="1.5" />
          <line x1="50" y1="90" x2="50" y2="96" stroke="currentColor" strokeWidth="1.5" />
          <line x1="4" y1="50" x2="10" y2="50" stroke="currentColor" strokeWidth="1.5" />
          <text x="50" y="9" textAnchor="middle" fontSize="8" fontWeight="600" fill="currentColor">
            12
          </text>
          <text x="90" y="54" textAnchor="middle" dominantBaseline="middle" fontSize="8" fontWeight="600" fill="currentColor">
            3
          </text>
          <text x="50" y="93" textAnchor="middle" dominantBaseline="middle" fontSize="8" fontWeight="600" fill="currentColor">
            6
          </text>
          <text x="10" y="54" textAnchor="middle" dominantBaseline="middle" fontSize="8" fontWeight="600" fill="currentColor">
            9
          </text>
        </svg>
        <canvas
          ref={canvasRef}
          aria-label={`${sideLabel}乳房の描画`}
          className={cn(
            "absolute inset-0 h-full w-full touch-none select-none rounded-full bg-white shadow-sm",
            readOnly ? "cursor-default" : "cursor-crosshair",
          )}
          style={{ touchAction: "none" }}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerLeave={handlePointerLeave}
          onPointerCancel={handlePointerCancel}
        />
        {showMarkers
          ? POSITIONS.filter((position) => markers[position]).map((position) => (
              <span
                key={position}
                className={cn(
                  "pointer-events-none absolute flex h-9 w-9 items-center justify-center rounded-full border border-primary/70 bg-primary/20 text-sm font-semibold text-primary",
                  POSITION_STYLES[position],
                )}
              >
                {position}
              </span>
            ))
          : null}
      </div>
    </div>
  )
}
