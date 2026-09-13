import { describe, it, expect, beforeEach, afterEach, vi } from "vitest"

/**
 * The client wrapper reads env + build target at module load, so each scenario
 * sets the environment, then imports the module fresh via resetModules.
 */

const ORIGINAL_ENV = { ...process.env }

function setEnv(env: Record<string, string | undefined>) {
  process.env = { ...ORIGINAL_ENV, ...env }
}

describe("analytics gating (analyticsAllowed)", () => {
  beforeEach(() => {
    vi.resetModules()
    // jsdom provides window; ensure it exists for the "allowed" branch checks.
  })

  afterEach(() => {
    process.env = { ...ORIGINAL_ENV }
  })

  it("no-ops in development regardless of key", async () => {
    setEnv({
      NODE_ENV: "development",
      NEXT_PUBLIC_POSTHOG_KEY: "phc_test",
      NEXT_PUBLIC_BUILD_TARGET: "web",
      NEXT_PUBLIC_V0_PREVIEW: "false",
    })
    const mod = await import("../posthog-client")
    expect(mod.analyticsAllowed()).toBe(false)
    expect(await mod.initPostHog()).toBeNull()
  })

  it("no-ops in the mobile (Capacitor) build even in production with a key", async () => {
    setEnv({
      NODE_ENV: "production",
      NEXT_PUBLIC_POSTHOG_KEY: "phc_test",
      NEXT_PUBLIC_BUILD_TARGET: "mobile",
      NEXT_PUBLIC_V0_PREVIEW: "false",
    })
    const mod = await import("../posthog-client")
    expect(mod.analyticsAllowed()).toBe(false)
  })

  it("no-ops in production web when the key is absent", async () => {
    setEnv({
      NODE_ENV: "production",
      NEXT_PUBLIC_POSTHOG_KEY: undefined,
      NEXT_PUBLIC_BUILD_TARGET: "web",
      NEXT_PUBLIC_V0_PREVIEW: "false",
    })
    const mod = await import("../posthog-client")
    expect(mod.analyticsAllowed()).toBe(false)
  })

  it("no-ops in the v0 preview even with a key", async () => {
    setEnv({
      NODE_ENV: "production",
      NEXT_PUBLIC_POSTHOG_KEY: "phc_test",
      NEXT_PUBLIC_BUILD_TARGET: "web",
      NEXT_PUBLIC_V0_PREVIEW: "true",
    })
    const mod = await import("../posthog-client")
    expect(mod.analyticsAllowed()).toBe(false)
  })

  it("captureEvent is a safe no-op when PostHog never initialised", async () => {
    setEnv({
      NODE_ENV: "development",
      NEXT_PUBLIC_POSTHOG_KEY: "phc_test",
    })
    const mod = await import("../posthog-client")
    expect(() => mod.captureEvent("session_started" as never, { location: "x" })).not.toThrow()
  })
})
