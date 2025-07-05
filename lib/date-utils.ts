/**
 * 'YYYY-MM-DD' 形式の文字列を、タイムゾーンの問題を回避しながら安全に Date オブジェクトに変換します。
 * @param dateString - 'YYYY-MM-DD' 形式の日付文字列
 * @returns 変換された Date オブジェクト、または無効な場合は null
 */
export function parseDateString(dateString: string | null | undefined): Date | null {
  console.log(`[parseDateString] Attempting to parse:`, dateString)
  if (!dateString || typeof dateString !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
    console.error("[parseDateString] Validation failed: Invalid or non-string date provided.", { dateString })
    return null
  }
  try {
    const [year, month, day] = dateString.split("-").map(Number)
    // JavaScriptのDateコンストラクタでは月は0から始まるため、-1 する
    const date = new Date(year, month - 1, day)
    if (isNaN(date.getTime())) {
      console.error("[parseDateString] Created date is invalid.", { dateString, date })
      return null
    }
    console.log(`[parseDateString] Successfully parsed.`, { result: date })
    return date
  } catch (e) {
    console.error("[parseDateString] Exception caught.", { dateString, error: e })
    return null
  }
}

/**
 * Date オブジェクトと 'HH:mm:ss' 形式の時刻文字列から、新しい Date オブジェクトを安全に作成します。
 * @param baseDate - 基準となる Date オブジェクト
 * @param timeStr - 'HH:mm' または 'HH:mm:ss' 形式の時刻文字列
 * @returns 変換された Date オブジェクト、または無効な場合は null
 */
export const parseTime = (baseDate: Date, timeStr: string | null): Date | null => {
  console.log(`[parseTime] Attempting to parse:`, { baseDate, timeStr })

  if (!baseDate || isNaN(baseDate.getTime())) {
    console.error(`[parseTime] Validation failed: Invalid baseDate.`, { baseDate, timeStr })
    return null
  }
  if (typeof timeStr !== "string" || timeStr.length < 5) {
    console.error(`[parseTime] Validation failed: Invalid timeStr.`, { baseDate, timeStr })
    return null
  }

  if (!/^\d{2}:\d{2}(:\d{2})?$/.test(timeStr)) {
    console.error(`[parseTime] Validation failed: timeStr format is incorrect.`, { baseDate, timeStr })
    return null
  }

  try {
    const [hours, minutes, seconds] = timeStr.split(":").map(Number)
    if (isNaN(hours) || isNaN(minutes) || hours < 0 || hours > 23 || minutes < 0 || minutes > 59) {
      console.error(`[parseTime] Validation failed: Invalid time components.`, { hours, minutes, timeStr })
      return null
    }

    const newDate = new Date(
      baseDate.getFullYear(),
      baseDate.getMonth(),
      baseDate.getDate(),
      hours,
      minutes,
      seconds || 0,
    )

    if (isNaN(newDate.getTime())) {
      console.error(`[parseTime] Validation failed: Final date is invalid.`, { baseDate, timeStr, newDate })
      return null
    }

    console.log(`[parseTime] Successfully parsed.`, { result: newDate })
    return newDate
  } catch (e) {
    console.error(`[parseTime] Exception caught during parsing.`, { baseDate, timeStr, error: e })
    return null
  }
}
