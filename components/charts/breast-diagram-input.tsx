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

  useEffect(() => {
    const nextMarkers = normalizedValue.markers ?? {}
    setMarkers((prev) => (markersEqual(prev, nextMarkers) ? prev : nextMarkers))

    if (readOnly) {
      const readOnlyImage = normalizedValue.imageData ?? undefined
      setImageData((prev) => (prev === readOnlyImage ? prev : readOnlyImage))
      return
    }

    const storedImage = normalizedValue.imageData ?? loadStoredImage()
    const nextImage = storedImage ?? undefined
    setImageData((prev) => (prev === nextImage ? prev : nextImage))

    if (normalizedValue.imageData) {
      writeStoredImage(normalizedValue.imageData)
    } else if (storedImage) {
      onChange?.({ imageData: storedImage })
    }
  }, [loadStoredImage, normalizedValue, onChange, readOnly, writeStoredImage])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) {
      return
    }
    const dpr = window.devicePixelRatio || 1
    canvas.width = CANVAS_SIZE * dpr
    canvas.height = CANVAS_SIZE * dpr
    canvas.style.width = `${CANVAS_SIZE}px`
    canvas.style.height = `${CANVAS_SIZE}px`
  }, [])

  const getContext = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) {
      return null
    }
    const ctx = canvas.getContext("2d")
    if (!ctx) {
      return null
    }
    const dpr = window.devicePixelRatio || 1
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    ctx.lineCap = "round"
    ctx.lineJoin = "round"
    ctx.lineWidth = LINE_WIDTH
    ctx.strokeStyle = LINE_COLOR
    return ctx
  }, [])

  useEffect(() => {
    const ctx = getContext()
    if (!ctx) {
      return
    }
    ctx.clearRect(0, 0, CANVAS_SIZE, CANVAS_SIZE)

    if (!imageData) {
      return
    }

    const loadId = ++imageLoadIdRef.current
    const img = new Image()
    img.onload = () => {
      if (imageLoadIdRef.current !== loadId) {
        return
      }
      const drawCtx = getContext()
      if (!drawCtx) {
        return
      }
      drawCtx.clearRect(0, 0, CANVAS_SIZE, CANVAS_SIZE)
      drawCtx.drawImage(img, 0, 0, CANVAS_SIZE, CANVAS_SIZE)
    }
    img.src = imageData
  }, [getContext, imageData])

  const getCanvasPoint = useCallback((event: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (!canvas) {
      return { x: 0, y: 0 }
    }
    const rect = canvas.getBoundingClientRect()
    return {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top,
    }
  }, [])

  const persistCanvas = useCallback(() => {
    if (readOnly) {
      return
    }
    const canvas = canvasRef.current
    if (!canvas) {
      return
    }

    requestAnimationFrame(() => {
      const dataUrl = canvas.toDataURL("image/png")
      setImageData(dataUrl)
      const payload: BreastDiagram = { imageData: dataUrl }
      writeStoredImage(dataUrl)
      onChange?.(payload)
      if (hasActiveMarkers(markers)) {
        setMarkers({})
      }
    })
  }, [markers, onChange, readOnly, writeStoredImage])

  const finishDrawing = useCallback(
    (event?: React.PointerEvent<HTMLCanvasElement>) => {
      if (!isDrawingRef.current) {
        return
      }

      isDrawingRef.current = false
      lastPointRef.current = null

      const canvas = canvasRef.current
      if (canvas && pointerIdRef.current !== null && canvas.hasPointerCapture?.(pointerIdRef.current)) {
        try {
          canvas.releasePointerCapture(pointerIdRef.current)
        } catch {
          // noop
        }
      }
      pointerIdRef.current = null

      if (event) {
        event.preventDefault()
      }

      persistCanvas()
    },
    [persistCanvas],
  )

  const handlePointerDown = (event: React.PointerEvent<HTMLCanvasElement>) => {
    if (readOnly) {
      return
    }
    event.preventDefault()

    const ctx = getContext()
    const canvas = canvasRef.current
    if (!ctx || !canvas) {
      return
    }

    // Apply current tool (pen or eraser)
    ctx.globalCompositeOperation = eraserOn ? "destination-out" : "source-over"
    ctx.strokeStyle = eraserOn ? "rgba(0,0,0,1)" : LINE_COLOR
    ctx.lineWidth = eraserOn ? ERASER_WIDTH : LINE_WIDTH

    const point = getCanvasPoint(event)
    ctx.beginPath()
    ctx.moveTo(point.x, point.y)
    ctx.lineTo(point.x, point.y)
    ctx.stroke()

    lastPointRef.current = point
    isDrawingRef.current = true
    pointerIdRef.current = event.pointerId

    if (canvas.setPointerCapture) {
      try {
        canvas.setPointerCapture(event.pointerId)
      } catch {
        // noop
      }
    }
  }

  const handlePointerMove = (event: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawingRef.current || readOnly) {
      return
    }
    event.preventDefault()

    const ctx = getContext()
    if (!ctx) {
      return
    }

    // Ensure tool settings stay applied while moving
    ctx.globalCompositeOperation = eraserOn ? "destination-out" : "source-over"
    ctx.strokeStyle = eraserOn ? "rgba(0,0,0,1)" : LINE_COLOR
    ctx.lineWidth = eraserOn ? ERASER_WIDTH : LINE_WIDTH

    const point = getCanvasPoint(event)
    const lastPoint = lastPointRef.current
    ctx.beginPath()
    if (lastPoint) {
      ctx.moveTo(lastPoint.x, lastPoint.y)
    } else {
      ctx.moveTo(point.x, point.y)
    }
    ctx.lineTo(point.x, point.y)
    ctx.stroke()
    lastPointRef.current = point
  }

  const handlePointerUp = (event: React.PointerEvent<HTMLCanvasElement>) => {
    if (readOnly) {
      return
    }
    // Reset composite to default after a stroke
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
