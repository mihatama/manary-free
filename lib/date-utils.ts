import { format, startOfDay as fnsStartOfDay } from "date-fns"

// Parses a date string like "YYYY-MM-DD" into a Date object.
export function parseDate(dateString: string | null | undefined): Date | null {
  if (!dateString) return null
  try {
    // Appending T00:00:00 ensures it's parsed in the local timezone, not UTC.
    const date = new Date(`${dateString}T00:00:00`)
    if (isNaN(date.getTime())) throw new Error("Invalid date value")
    return date
  } catch (e) {
    console.error(`Failed to parse date string: ${dateString}`, e)
    return null
  }
}

// Parses a time string like "HH:mm" or "HH:mm:ss" and applies it to a given date.
export function parseTime(timeString: string | null | undefined, baseDate: Date | null | undefined): Date | null {
  if (!timeString || !baseDate) return null
  try {
    const [hours, minutes] = timeString.split(":").map(Number)
    if (isNaN(hours) || isNaN(minutes)) throw new Error("Invalid time format")

    const newDate = new Date(baseDate)
    newDate.setHours(hours, minutes, 0, 0)
    return newDate
  } catch (e) {
    console.error(`Failed to parse time string: ${timeString}`, e)
    return null
  }
}

// Formats a Date object into "YYYY-MM-DD"
export function formatDate(date: Date | null | undefined): string {
  if (!date) return ""
  return format(date, "yyyy-MM-dd")
}

// Formats a Date object into "HH:mm"
export function formatTimeSimple(date: Date | null | undefined): string {
  if (!date) return ""
  return format(date, "HH:mm")
}

// Wrapper for date-fns startOfDay
export const startOfDay = fnsStartOfDay
