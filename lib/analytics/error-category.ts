import type { ErrorCategory } from "./events"

/**
 * Map an error (or a returned error string) to a coarse, content-free bucket.
 * The raw message is only inspected locally and never leaves the device.
 * Returns null for a user/system cancellation, which is not a failure.
 */
export function categorizeError(error: unknown): ErrorCategory | null {
  const name = error instanceof Error ? error.name : ""
  if (name === "AbortError") return null

  const message = (
    error instanceof Error ? error.message : typeof error === "string" ? error : ""
  ).toLowerCase()

  if (/\bcancel(l)?ed\b|\baborted\b/.test(message)) return null

  if (typeof navigator !== "undefined" && navigator.onLine === false) return "network"
  if (
    name === "NetworkError" ||
    /network|failed to fetch|load failed|offline|timed? ?out|connection/.test(message)
  ) {
    return "network"
  }
  if (/\b401\b|unauthori[sz]ed|not authenticated|jwt|session expired|sign in/.test(message)) {
    return "authentication"
  }
  if (
    name === "NotAllowedError" ||
    name === "SecurityError" ||
    /\b403\b|forbidden|permission|access[- ]denied|different account/.test(message)
  ) {
    return "permission"
  }
  if (
    name === "QuotaExceededError" ||
    /quota|storage|indexeddb|disk|no space/.test(message)
  ) {
    return "storage"
  }
  if (/invalid|validation|unsupported|too large|\b400\b|\b422\b/.test(message)) {
    return "validation"
  }
  return "unknown"
}
