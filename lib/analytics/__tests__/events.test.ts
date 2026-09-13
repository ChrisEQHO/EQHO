import { describe, it, expect } from "vitest"
import { ANALYTICS_EVENTS, ACTIVE_EVENTS, type AnalyticsEvent } from "../events"

describe("event catalogue", () => {
  it("exposes the critical events that fire today with stable names", () => {
    expect(ANALYTICS_EVENTS.signed_up).toBe("signed_up")
    expect(ANALYTICS_EVENTS.logged_in).toBe("logged_in")
    expect(ANALYTICS_EVENTS.track_imported).toBe("track_imported")
    expect(ANALYTICS_EVENTS.session_started).toBe("session_started")
    expect(ANALYTICS_EVENTS.track_completed).toBe("track_completed")
    expect(ANALYTICS_EVENTS.subscription_started).toBe("subscription_started")
    expect(ANALYTICS_EVENTS.subscription_cancelled).toBe("subscription_cancelled")
  })

  it("defines the dormant events so features can fire them later", () => {
    const dormant: AnalyticsEvent[] = [
      ANALYTICS_EVENTS.playlist_updated,
      ANALYTICS_EVENTS.competition_mode_entered,
      ANALYTICS_EVENTS.competition_mode_exited,
      ANALYTICS_EVENTS.podium_training_started,
      ANALYTICS_EVENTS.podium_training_completed,
      ANALYTICS_EVENTS.feedback_submitted,
      ANALYTICS_EVENTS.playback_delayed,
    ]
    for (const e of dormant) {
      expect(typeof e).toBe("string")
      expect(e.length).toBeGreaterThan(0)
    }
  })

  it("has unique event name values (no accidental duplicate strings)", () => {
    const values = Object.values(ANALYTICS_EVENTS)
    expect(new Set(values).size).toBe(values.length)
  })

  it("marks the subscription lifecycle events as active", () => {
    expect(ACTIVE_EVENTS.has(ANALYTICS_EVENTS.subscription_started)).toBe(true)
    expect(ACTIVE_EVENTS.has(ANALYTICS_EVENTS.subscription_cancelled)).toBe(true)
  })

  it("does not mark dormant events as active", () => {
    expect(ACTIVE_EVENTS.has(ANALYTICS_EVENTS.playback_delayed)).toBe(false)
    expect(ACTIVE_EVENTS.has(ANALYTICS_EVENTS.feedback_submitted)).toBe(false)
  })
})
