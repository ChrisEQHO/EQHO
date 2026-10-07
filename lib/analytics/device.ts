'use client'

/**
 * Low-cardinality, non-PII context derivation.
 *
 * These values describe the environment, never the person. We deliberately
 * bucket into a handful of coarse categories so nothing here can act as a
 * fingerprint or identifier.
 */

import { Capacitor } from "@capacitor/core"
import packageJson from "../../package.json"

export type DeviceType = "mobile" | "tablet" | "desktop" | "unknown"
export type BrowserName =
  | "chrome"
  | "safari"
  | "firefox"
  | "edge"
  | "other"
  | "unknown"

export type AnalyticsPlatform = "web" | "ios" | "android"

export interface PlatformContext {
  platform: AnalyticsPlatform
  native_app: boolean
  app_version: string
  build_target: string
}

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

/**
 * Detect web vs the installed Capacitor shell. Falls back to "web" if the
 * Capacitor bridge is missing or throws, so the website never depends on it.
 */
export function getPlatformContext(): PlatformContext {
  let platform: AnalyticsPlatform = "web"
  let nativeApp = false
  try {
    const detected = Capacitor.getPlatform()
    nativeApp = Capacitor.isNativePlatform()
    if (nativeApp && (detected === "ios" || detected === "android")) {
      platform = detected
    } else {
      nativeApp = false
    }
  } catch {
    platform = "web"
    nativeApp = false
  }
  return {
    platform,
    native_app: nativeApp,
    app_version: getAppVersion(),
    build_target: process.env.NEXT_PUBLIC_BUILD_TARGET || "web",
  }
}

/** Shared properties attached to every client event. */
export function getDeviceContext(): PlatformContext {
  return getPlatformContext()
}
