import { describe, expect, it } from "vitest";
import {
  ONBOARDING_STORAGE_KEY,
  markOnboarding,
  readOnboarding,
  shouldShowSessionTip,
} from "./onboarding";

function memoryStorage(initial: Record<string, string> = {}) {
  const data = new Map(Object.entries(initial));
  return {
    getItem: (k: string) => data.get(k) ?? null,
    setItem: (k: string, v: string) => void data.set(k, v),
    data,
  };
}

describe("onboarding persistence", () => {
  it("returns empty state when nothing is stored", () => {
    expect(readOnboarding(memoryStorage())).toEqual({});
  });

  it("ignores corrupt or unexpected values", () => {
    expect(readOnboarding(memoryStorage({ [ONBOARDING_STORAGE_KEY]: "{not json" }))).toEqual({});
    expect(readOnboarding(memoryStorage({ [ONBOARDING_STORAGE_KEY]: "[1,2]" }))).toEqual({});
    expect(
      readOnboarding(memoryStorage({ [ONBOARDING_STORAGE_KEY]: '{"sessionTipDismissed":"yes"}' })),
    ).toEqual({});
  });

  it("persists a dismissed flag across reads", () => {
    const storage = memoryStorage();
    markOnboarding("sessionTipDismissed", storage);
    expect(readOnboarding(storage)).toEqual({ sessionTipDismissed: true });
  });

  it("tolerates missing storage", () => {
    expect(readOnboarding(null)).toEqual({});
    expect(markOnboarding("sessionTipDismissed", null)).toEqual({ sessionTipDismissed: true });
  });
});

describe("shouldShowSessionTip", () => {
  it("shows when the first playlist enters an empty session", () => {
    expect(shouldShowSessionTip({ state: {}, previousQueueLength: 0, addedTrackCount: 5 })).toBe(true);
  });

  it("does not show when the session already had music", () => {
    expect(shouldShowSessionTip({ state: {}, previousQueueLength: 3, addedTrackCount: 5 })).toBe(false);
  });

  it("does not show for empty playlists", () => {
    expect(shouldShowSessionTip({ state: {}, previousQueueLength: 0, addedTrackCount: 0 })).toBe(false);
  });

  it("never shows once dismissed", () => {
    expect(
      shouldShowSessionTip({ state: { sessionTipDismissed: true }, previousQueueLength: 0, addedTrackCount: 5 }),
    ).toBe(false);
  });
});
