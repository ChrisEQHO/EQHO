'use client'

/**
 * Low-cardinality, non-PII context derivation.
 *
 * These values describe the environment, never the person. We deliberately
 * bucket into a handful of coarse categories so nothing here can act as a
 * fingerprint or identifier.
 */

import packageJson from "../../package.json"

export type DeviceType = "mobile" | "tablet" | "desktop" | "unknown"
export type BrowserName =
  | "chrome"
  | "safari"
  | "firefox"
  | "edge"
  | "other"
  | "unknown"

export function getAppVersion(): string {
  return (packageJson as { version?: string }).version ?? "0.0.0"
}

export function getDeviceType(): DeviceType {
  if (typeof navigator === "undefined") return "unknown"
  const ua = navigator.userAgent
  if (/iPad|Tablet/i.test(ua)) return "tablet"
  if (/Mobi|Android|iPhone|iPod/i.test(ua)) return "mobile"
  return "desktop"
}

export function getBrowser(): BrowserName {
  if (typeof navigator === "undefined") return "unknown"
  const ua = navigator.userAgent
  // Order matters: Edge and Chrome both contain "Chrome"; Safari excludes it.
  if (/Edg\//i.test(ua)) return "edge"
  if (/Firefox\//i.test(ua)) return "firefox"
  if (/Chrome\//i.test(ua)) return "chrome"
  if (/Safari\//i.test(ua) && !/Chrome\//i.test(ua)) return "safari"
  return "other"
}

/** Coarse, non-identifying context attached to client events. */
export function getDeviceContext(): {
  platform: DeviceType
  app_version: string
} {
  return {
    platform: getDeviceType(),
    app_version: getAppVersion(),
  }
}
