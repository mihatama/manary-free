"use client"

import { useEffect, useMemo, useState } from "react"

import type { BreastDiagram } from "@/lib/chart-types"
import { cn } from "@/lib/utils"

interface BreastDiagramInputProps {
  value?: BreastDiagram
  onChange?: (value: BreastDiagram) => void
  side: "right" | "left"
  readOnly?: boolean
}

const POSITIONS = ["12", "3", "6", "9"] as const

export function BreastDiagramInput({ value = {}, onChange, side, readOnly = false }: BreastDiagramInputProps) {
  const [selections, setSelections] = useState<BreastDiagram>(value)

  const valueString = useMemo(() => JSON.stringify(value), [value])

  useEffect(() => {
    try {
      const parsed = JSON.parse(valueString) as BreastDiagram
      setSelections(parsed || {})
    } catch {
      setSelections({})
    }
  }, [valueString])

  const handleClick = (position: (typeof POSITIONS)[number]) => {
    if (readOnly) {
      return
    }

    const updated = { ...selections, [position]: !selections[position] }
    setSelections(updated)
    onChange?.(updated)
  }

  return (
    <div className="flex flex-col items-center">
      <p className="mb-2 font-semibold">{side === "right" ? "右" : "左"}</p>
      <div className="relative h-32 w-32">
        <svg viewBox="0 0 100 100" className="h-full w-full">
          <circle cx="50" cy="50" r="45" stroke="black" strokeWidth="2" fill="white" />
          <line x1="50" y1="5" x2="50" y2="95" stroke="lightgray" strokeWidth="1" />
          <line x1="5" y1="50" x2="95" y2="50" stroke="lightgray" strokeWidth="1" />
        </svg>
        {POSITIONS.map((position) => {
          const positionStyles: Record<(typeof POSITIONS)[number], string> = {
            "12": "top-0 left-1/2 -translate-x-1/2",
            "3": "top-1/2 right-0 -translate-y-1/2",
            "6": "bottom-0 left-1/2 -translate-x-1/2",
            "9": "top-1/2 left-0 -translate-y-1/2",
          }
          return (
            <button
              key={position}
              type="button"
              onClick={() => handleClick(position)}
              disabled={readOnly}
              className={cn(
                "absolute flex h-8 w-8 items-center justify-center rounded-full text-xs transition",
                positionStyles[position],
                selections[position] ? "bg-rose-500 text-white" : "bg-gray-200",
                readOnly ? "cursor-not-allowed opacity-80" : "hover:bg-rose-400 hover:text-white",
              )}
            >
              {position}
            </button>
          )
        })}
      </div>
    </div>
  )
}
