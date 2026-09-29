import { describe, expect, it } from "vitest";
import {
  applyNativeEvent,
  createCompletionLatch,
  decideSkipBack,
  decideSkipForward,
  decideTrackEnd,
  initialPlaybackViewState,
  selectNowPlaying,
  type PlaybackViewState,
  type PlayerView,
  type SequencerTrack,
  type TrackEndContext,
} from "./sequencer";

const tracks: SequencerTrack[] = [
  { id: "a", title: "Alpha", url: "blob:a" },
  { id: "b", title: "Bravo", url: "blob:b" },
  { id: "c", title: "Charlie", url: "blob:c" },
];

const views: PlayerView[] = ["main", "fullscreen", "coach"];

function endCtx(overrides: Partial<TrackEndContext> = {}): TrackEndContext {
  return {
    playlist: tracks,
    currentIndex: 0,
    hiddenTrackIds: new Set(),
    playlistRound: 1,
    playlistRepeats: 1,
    backToBack: false,
    b2bRepeatedTrackId: null,
    autoplayNext: true,
    ...overrides,
  };
}

function state(overrides: Partial<PlaybackViewState> = {}): PlaybackViewState {
  return { ...initialPlaybackViewState, ...overrides };
}

describe("shared view state", () => {
  it("main, full-screen and Coach Mode show the same current track", () => {
    const s = state({ currentIndex: 1, isPlaying: true, currentTime: 12, duration: 60 });
    const [main, ...others] = views.map((v) => selectNowPlaying(s, tracks, v));
    expect(main.trackId).toBe("b");
    for (const o of others) expect(o).toEqual(main);
  });

  it("play/pause from either view updates every view", () => {
    let s = state({ currentIndex: 0, isPlaying: true });
    s = applyNativeEvent(s, { type: "playState", playing: false });
    for (const v of views) expect(selectNowPlaying(s, tracks, v).isPlaying).toBe(false);
    s = applyNativeEvent(s, { type: "playState", playing: true });
    for (const v of views) expect(selectNowPlaying(s, tracks, v).isPlaying).toBe(true);
  });

  it("seeking updates the one session that every view reads", () => {
    const s = applyNativeEvent(state({ duration: 100 }), { type: "position", currentTime: 40, duration: 100 });
    for (const v of views) {
      const snap = selectNowPlaying(s, tracks, v);
      expect(snap.currentTime).toBe(40);
      expect(snap.progress).toBeCloseTo(0.4);
    }
  });

  it("entering/exiting full-screen does not change track or position", () => {
    const s = state({ currentIndex: 2, isPlaying: true, currentTime: 33, duration: 90 });
    const before = selectNowPlaying(s, tracks, "main");
    expect(selectNowPlaying(s, tracks, "fullscreen")).toEqual(before);
    expect(selectNowPlaying(s, tracks, "coach")).toEqual(before);
    expect(selectNowPlaying(s, tracks, "main")).toEqual(before);
  });
});

describe("skip forward/back share one queue", () => {
  const hidden = new Set(["b"]);

  it("skip forward skips hidden tracks", () => {
    expect(decideSkipForward({ ...endCtx(), hiddenTrackIds: hidden })).toEqual({
      type: "play",
      index: 2,
      nextRound: 1,
    });
  });

  it("skip forward past the end repeats a round, then finishes", () => {
    expect(decideSkipForward({ ...endCtx({ currentIndex: 2, playlistRepeats: 2 }) })).toEqual({
      type: "play",
      index: 0,
      nextRound: 2,
    });
    expect(decideSkipForward({ ...endCtx({ currentIndex: 2, playlistRound: 2, playlistRepeats: 2 }) })).toEqual({
      type: "finish",
    });
  });

  it("skip back goes to previous visible track early, restarts otherwise", () => {
    const ctx = { playlist: tracks, currentIndex: 2, hiddenTrackIds: hidden };
    expect(decideSkipBack(ctx, 1)).toEqual({ type: "previous", index: 0 });
    expect(decideSkipBack(ctx, 5)).toEqual({ type: "restart" });
    expect(decideSkipBack({ ...ctx, currentIndex: 0 }, 0)).toEqual({ type: "restart" });
  });

  it("track end and skip forward agree on the next track", () => {
    const ctx = endCtx({ currentIndex: 0, hiddenTrackIds: hidden });
    expect(decideTrackEnd(ctx)).toEqual(decideSkipForward(ctx));
  });

  it("empty playlist is a no-op", () => {
    expect(decideSkipForward({ ...endCtx(), playlist: [] })).toEqual({ type: "noop" });
    expect(decideSkipBack({ playlist: [], currentIndex: 0, hiddenTrackIds: new Set() }, 0)).toEqual({ type: "noop" });
  });
});

describe("gaps, back-to-back and repeats", () => {
  it("back-to-back replays once, then advances", () => {
    expect(decideTrackEnd(endCtx({ backToBack: true }))).toEqual({ type: "replay", index: 0 });
    expect(decideTrackEnd(endCtx({ backToBack: true, b2bRepeatedTrackId: "a" }))).toEqual({
      type: "play",
      index: 1,
      nextRound: 1,
    });
  });

  it("autoplay off holds after the routine", () => {
    expect(decideTrackEnd(endCtx({ autoplayNext: false }))).toEqual({ type: "hold" });
    // Back-to-back still replays first even with autoplay off.
    expect(decideTrackEnd(endCtx({ autoplayNext: false, backToBack: true }))).toEqual({ type: "replay", index: 0 });
  });

  it("playlist repeats restart from the first visible track", () => {
    const ctx = endCtx({ currentIndex: 2, playlistRepeats: 3, hiddenTrackIds: new Set(["a"]) });
    expect(decideTrackEnd(ctx)).toEqual({ type: "play", index: 1, nextRound: 2 });
  });

  it("all tracks hidden finishes instead of looping", () => {
    const ctx = endCtx({ playlistRepeats: 5, hiddenTrackIds: new Set(["a", "b", "c"]) });
    expect(decideTrackEnd(ctx)).toEqual({ type: "finish" });
  });

  it("gap countdown mirrors identically for every view", () => {
    let s = applyNativeEvent(state(), { type: "gapStarted", seconds: 10 });
    s = applyNativeEvent(s, { type: "gapTick", remaining: 3 });
    for (const v of views) {
      const snap = selectNowPlaying(s, tracks, v);
      expect(snap.gapActive).toBe(true);
      expect(snap.gapRemaining).toBe(3);
    }
    s = applyNativeEvent(s, { type: "gapEnded" });
    expect(selectNowPlaying(s, tracks, "coach").gapActive).toBe(false);
  });
});

describe("session completion", () => {
  it("latch fires once until reset", () => {
    const latch = createCompletionLatch();
    expect(latch.fire()).toBe(true);
    expect(latch.fire()).toBe(false);
    latch.reset();
    expect(latch.fire()).toBe(true);
  });

  it("repeated native finished events keep one completion", () => {
    let s = applyNativeEvent(state({ isPlaying: true }), { type: "sessionFinished", reason: "completed" });
    s = applyNativeEvent(s, { type: "sessionFinished", reason: "stopped" });
    expect(s.sessionFinished).toBe(true);
    expect(s.isPlaying).toBe(false);
  });

  it("a stopped session is not a completion", () => {
    const s = applyNativeEvent(state(), { type: "sessionFinished", reason: "stopped" });
    expect(s.sessionFinished).toBe(false);
  });
});

describe("native session events", () => {
  it("trackChanged updates displayed track and resets progress", () => {
    let s = state({ currentIndex: 0, currentTime: 50, duration: 60, isGapPaused: true, gapCountdown: 2 });
    s = applyNativeEvent(s, { type: "trackChanged", index: 2, duration: 120, trackId: "c" });
    const snap = selectNowPlaying(s, tracks, "coach");
    expect(snap.trackId).toBe("c");
    expect(snap.title).toBe("Charlie");
    expect(snap.currentTime).toBe(0);
    expect(snap.duration).toBe(120);
    expect(snap.isPlaying).toBe(true);
    expect(snap.gapActive).toBe(false);
  });

  it("position without duration keeps the known duration", () => {
    const s = applyNativeEvent(state({ duration: 90 }), { type: "position", currentTime: 10, duration: 0 });
    expect(s.duration).toBe(90);
    expect(s.currentTime).toBe(10);
  });
});
