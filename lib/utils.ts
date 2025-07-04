import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Calculates the contrasting color (black or white) for a given hex color.
 * @param hexcolor The hex color string (e.g., "#RRGGBB").
 * @returns The contrasting color, either '#000000' (black) or '#FFFFFF' (white).
 */
export function getContrastYIQ(hexcolor?: string): string {
  if (!hexcolor) return "#000000" // Default to black if no color is provided

  hexcolor = hexcolor.replace("#", "")

  // Handle 3-digit hex
  if (hexcolor.length === 3) {
    hexcolor = hexcolor
      .split("")
      .map((char) => char + char)
      .join("")
  }

  if (hexcolor.length !== 6) {
    return "#000000" // Return default for invalid hex
  }

  const r = Number.parseInt(hexcolor.substring(0, 2), 16)
  const g = Number.parseInt(hexcolor.substring(2, 4), 16)
  const b = Number.parseInt(hexcolor.substring(4, 6), 16)

  // Calculate YIQ value
  const yiq = (r * 299 + g * 587 + b * 114) / 1000

  return yiq >= 128 ? "#000000" : "#FFFFFF"
}
