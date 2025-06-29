"use client"

import { useState, useEffect } from "react"
import { cn } from "@/lib/utils"

type DiagramData = {
  [key: string]: boolean
}

interface BreastDiagramInputProps {
  value?: DiagramData
  onChange: (value: DiagramData) => void
  side: "right" | "left"
}

export function BreastDiagramInput({ value = {}, onChange, side }: BreastDiagramInputProps) {
  const [selections, setSelections] = useState<DiagramData>(value)

  useEffect(() => {
    setSelections(value || {})
  }, [value])

  const positions = ["12", "3", "6", "9"]

  const handleClick = (pos: string) => {
    const newSelections = { ...selections, [pos]: !selections[pos] }
    setSelections(newSelections)
    onChange(newSelections)
  }

  return (
    <div className="flex flex-col items-center">
      <p className="font-bold mb-2">{side === "right" ? "右" : "左"}</p>
      <div className="relative w-32 h-32">
        <svg viewBox="0 0 100 100" className="w-full h-full">
          <circle cx="50" cy="50" r="45" stroke="black" strokeWidth="2" fill="white" />
          <line x1="50" y1="5" x2="50" y2="95" stroke="lightgray" strokeWidth="1" />
          <line x1="5" y1="50" x2="95" y2="50" stroke="lightgray" strokeWidth="1" />
        </svg>
        {positions.map((pos) => {
          const positionStyles: { [key: string]: string } = {
            "12": "top-0 left-1/2 -translate-x-1/2",
            "3": "top-1/2 right-0 -translate-y-1/2",
            "6": "bottom-0 left-1/2 -translate-x-1/2",
            "9": "top-1/2 left-0 -translate-y-1/2",
          }
          return (
            <button
              key={pos}
              type="button"
              onClick={() => handleClick(pos)}
              className={cn(
                "absolute w-8 h-8 flex items-center justify-center rounded-full text-xs",
                positionStyles[pos],
                selections[pos] ? "bg-red-500 text-white" : "bg-gray-200",
              )}
            >
              {pos}
            </button>
          )
        })}
      </div>
    </div>
  )
}
