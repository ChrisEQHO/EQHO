import { describe, it, expect } from "vitest"
import { sanitizeProps, ALLOWED_PROP_KEYS } from "../events"

describe("sanitizeProps", () => {
  it("returns an empty object for undefined props", () => {
    expect(sanitizeProps(undefined)).toEqual({})
  })

  it("keeps only allowlisted keys", () => {
    const out = sanitizeProps({
      location: "header",
      plan: "pro",
      // not allowlisted — must be dropped:
      email: "coach@example.com",
      gymnast_name: "Jane Doe",
      file_name: "floor-routine-final.mp3",
      routine: "beam",
    })
    expect(out).toEqual({ location: "header", plan: "pro" })
    expect(out).not.toHaveProperty("email")
    expect(out).not.toHaveProperty("gymnast_name")
    expect(out).not.toHaveProperty("file_name")
  })

  it("drops non-primitive values even on allowlisted keys", () => {
    const out = sanitizeProps({
      // allowlisted keys, but unsafe value types
      count: { nested: 1 } as unknown as number,
      value: [1, 2, 3] as unknown as number,
      enabled: (() => true) as unknown as boolean,
    })
    expect(out).toEqual({})
  })

  it("drops NaN and infinite numbers", () => {
    const out = sanitizeProps({ count: NaN, value: Infinity, duration_ms: 1200 })
    expect(out).toEqual({ duration_ms: 1200 })
  })

  it("truncates over-long strings on allowlisted keys", () => {
    const long = "x".repeat(500)
    const out = sanitizeProps({ reason: long })
    expect((out.reason as string).length).toBeLessThanOrEqual(64)
  })

  it("preserves null on allowlisted keys", () => {
    const out = sanitizeProps({ tier: null })
    expect(out).toEqual({ tier: null })
  })

  it("never mutates the input object", () => {
    const input = { location: "header", email: "a@b.com" }
    const snapshot = { ...input }
    sanitizeProps(input)
    expect(input).toEqual(snapshot)
  })

  it("has a non-empty allowlist that excludes obvious PII keys", () => {
    expect(ALLOWED_PROP_KEYS.size).toBeGreaterThan(0)
    for (const piiKey of ["email", "name", "user_id", "file_name", "url", "token"]) {
      expect(ALLOWED_PROP_KEYS.has(piiKey)).toBe(false)
    }
  })
})
