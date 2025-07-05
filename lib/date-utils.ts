import { format, parse, isValid, startOfDay } from "date-fns"

/**
 * Safely parses a time string (HH:mm or HH:mm:ss) into a Date object for a given day.
 * @param timeStr The time string to parse.
 * @param baseDate The base date to apply the time to.
 * @returns A Date object or null if parsing fails.
 */
export const parseTime = (timeStr: string | null | undefined, baseDate: Date): Date | null => {
  if (!timeStr || !isValid(baseDate)) {
    console.error("[parseTime] Invalid input:", { timeStr, baseDate })
    return null
  }

  // Try parsing HH:mm:ss first, then HH:mm
  let parsedTime = parse(timeStr, "HH:mm:ss", baseDate)
  if (!isValid(parsedTime)) {
    parsedTime = parse(timeStr, "HH:mm", baseDate)
  }

  if (!isValid(parsedTime)) {
    console.error("[parseTime] Failed to parse time string:", timeStr)
    return null
  }

  return parsedTime
}

/**
 * Safely parses a date string (YYYY-MM-DD) into a Date object.
 * It ensures the date is treated as local time, not UTC, to avoid timezone-off-by-one errors.
 * @param dateStr The date string to parse.
 * @returns A Date object or null if parsing fails.
 */
export const parseDate = (dateStr: string | null | undefined): Date | null => {
  if (!dateStr) {
    console.error("[parseDate] Invalid input: dateStr is null or undefined")
    return null
  }

  // The 'T00:00:00' suffix ensures the date is parsed in the local timezone.
  const date = new Date(`${dateStr}T00:00:00`)

  if (!isValid(date)) {
    console.error("[parseDate] Failed to parse date string:", dateStr)
    return null
  }

  return startOfDay(date) // Normalize to the beginning of the day
}

/**
 * Formats a Date object into a YYYY-MM-DD string.
 * @param date The Date object to format.
 * @returns A formatted string or an empty string if the date is invalid.
 */
export const formatDate = (date: Date | null | undefined): string => {
  if (!date || !isValid(date)) {
    return ""
  }
  return format(date, "yyyy-MM-dd")
}

/**
 * Formats a Date object into an HH:mm string.
 * @param date The Date object to format.
 * @returns A formatted string or an empty string if the date is invalid.
 */
export const formatTimeSimple = (date: Date | null | undefined): string => {
  if (!date || !isValid(date)) {
    return ""
  }
  return format(date, "HH:mm")
}
