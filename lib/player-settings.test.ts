import { describe, expect, it } from "vitest";
import {
  LEGACY_BEEP_PREFS_KEY,
  LEGACY_WARNING_PREFS_KEY,
  SETTINGS_STORAGE_KEY,
  createDefaultSettings,
  loadStoredSettings,
  sanitizeSettings,
  shouldApplyDefaultToLiveState,
} from "./player-settings";

const SOUNDS = ["classic", "soft"] as const;

function storageWith(entries: Record<string, unknown>) {
  return {
    getItem: (key: string) =>
      key in entries ? (typeof entries[key] === "string" ? (entries[key] as string) : JSON.stringify(entries[key])) : null,
  };
}

describe("sanitizeSettings", () => {
  it("keeps valid values and drops out-of-range or mistyped ones", () => {
    expect(
      sanitizeSettings(
        { gapSeconds: 30, playlistRepeats: 0, defaultVolume: "80", backToBack: true, beepSound: "nope", showCountdown: 1 },
        SOUNDS,
      ),
    ).toEqual({ gapSeconds: 30, backToBack: true });
  });

  it("returns nothing for non-objects", () => {
    expect(sanitizeSettings(null, SOUNDS)).toEqual({});
    expect(sanitizeSettings("x", SOUNDS)).toEqual({});
  });
});

describe("loadStoredSettings", () => {
  it("migrates legacy warning and beep keys", () => {
    const loaded = loadStoredSettings(
      storageWith({
        [LEGACY_WARNING_PREFS_KEY]: { showPauseWarning: false },
        [LEGACY_BEEP_PREFS_KEY]: { beepSound: "soft", countdownSound: false },
      }),
      SOUNDS,
    );
    expect(loaded).toEqual({ showPauseWarning: false, beepSound: "soft", countdownSound: false });
  });

  it("maps the legacy beep showCountdown flag to countdownSound only", () => {
    const loaded = loadStoredSettings(storageWith({ [LEGACY_BEEP_PREFS_KEY]: { showCountdown: false } }), SOUNDS);
    expect(loaded).toEqual({ countdownSound: false });
  });

  it("prefers the shared key over legacy keys", () => {
    const loaded = loadStoredSettings(
      storageWith({
        [LEGACY_WARNING_PREFS_KEY]: { showPauseWarning: false },
        [SETTINGS_STORAGE_KEY]: { showPauseWarning: true, gapSeconds: 45 },
      }),
      SOUNDS,
    );
    expect(loaded).toEqual({ showPauseWarning: true, gapSeconds: 45 });
  });

  it("ignores malformed JSON", () => {
    expect(loadStoredSettings(storageWith({ [SETTINGS_STORAGE_KEY]: "{bad" }), SOUNDS)).toEqual({});
  });

  it("round-trips a full default settings object", () => {
    const defaults = createDefaultSettings("classic");
    expect(loadStoredSettings(storageWith({ [SETTINGS_STORAGE_KEY]: defaults }), SOUNDS)).toEqual(defaults);
  });
});

describe("shouldApplyDefaultToLiveState", () => {
  it("applies session defaults to the live player only when idle", () => {
    expect(shouldApplyDefaultToLiveState("gapSeconds", false)).toBe(true);
    expect(shouldApplyDefaultToLiveState("defaultVolume", false)).toBe(true);
    expect(shouldApplyDefaultToLiveState("gapSeconds", true)).toBe(false);
    expect(shouldApplyDefaultToLiveState("backToBack", true)).toBe(false);
  });

  it("never mirrors non-session settings", () => {
    expect(shouldApplyDefaultToLiveState("showCountdown", false)).toBe(false);
  });
});
