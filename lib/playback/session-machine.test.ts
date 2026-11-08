import { describe, expect, it, vi } from "vitest";
import {
  MISSING_AUDIO_ERROR,
  createSession,
  derivePlaybackPhase,
  remainingSeconds,
  sessionReducer,
  type SessionEvent,
  type SessionState,
  type SessionTrack,
} from "./session-machine";
import { createAudioController, getActiveAudioController, type AudioElementLike } from "./audio-controller";
import { createPlaybackEngine, type EngineClock } from "./playback-engine";
import { demoTrackUrl, parseDemoSnapshot, toDemoSessionTracks } from "./demo-session";

const tracks: SessionTrack[] = [
  { id: "a", src: "/a.mp3" },
  { id: "b", src: "/b.mp3" },
  { id: "c", src: "/c.mp3" },
];

function run(state: SessionState, ...events: SessionEvent[]) {
  return events.reduce(sessionReducer, state);
}

function loaded(config = { gapMs: 5000, countdownMs: 3000 }) {
  return run(createSession(config), { type: "LOAD_SESSION", playlistId: "p1", tracks });
}

function playing(state = loaded()) {
  const s = run(state, { type: "PLAY", now: 0 });
  return run(s, { type: "AUDIO_READY", token: s.playToken });
}

describe("session state model", () => {
  it("starts idle and goes loading -> playing", () => {
    const s = loaded();
    expect(s.phase).toBe("idle");
    const l = run(s, { type: "PLAY", now: 0 });
    expect(l.phase).toBe("loading");
    expect(run(l, { type: "AUDIO_READY", token: l.playToken }).phase).toBe("playing");
  });

  it("goes gap -> countdown -> next track on timestamps", () => {
    const p = playing();
    const g = run(p, { type: "AUDIO_ENDED", token: p.playToken, now: 10_000 });
    expect(g.phase).toBe("gap");
    expect(g.index).toBe(1);
    expect(run(g, { type: "TICK", now: 12_500 }).phase).toBe("countdown");
    const next = run(g, { type: "TICK", now: 15_000 });
    expect(next.phase).toBe("loading");
    expect(next.index).toBe(1);
  });

  it("transitions at the same instant regardless of tick cadence (throttled iPad vs desktop)", () => {
    const p = playing();
    const g = run(p, { type: "AUDIO_ENDED", token: p.playToken, now: 0 });
    let fast = g;
    for (let t = 0; t <= 5008; t += 16) fast = run(fast, { type: "TICK", now: t });
    const slow = run(g, { type: "TICK", now: 4999 }, { type: "TICK", now: 5001 });
    expect(fast.phase).toBe("loading");
    expect(slow.phase).toBe("loading");
    expect(run(g, { type: "TICK", now: 4999 }).phase).toBe("countdown");
  });

  it("pause works in playing, gap and countdown, and resume keeps the remaining time", () => {
    const p = playing();
    expect(run(p, { type: "PAUSE", now: 0 }).phase).toBe("paused");
    expect(run(p, { type: "PAUSE", now: 0 }, { type: "PLAY", now: 1 }).phase).toBe("playing");

    const g = run(p, { type: "AUDIO_ENDED", token: p.playToken, now: 0 });
    const held = run(g, { type: "TICK", now: 3000 }, { type: "PAUSE", now: 3000 });
    expect(held.phase).toBe("paused");
    expect(held.heldRemainingMs).toBe(2000);
    // Time passing while paused never advances the session.
    expect(run(held, { type: "TICK", now: 999_999 }).phase).toBe("paused");
    const resumed = run(held, { type: "PLAY", now: 50_000 });
    expect(resumed.phase).toBe("countdown");
    expect(remainingSeconds(resumed, 50_000)).toBe(2);
    expect(run(resumed, { type: "TICK", now: 52_000 }).phase).toBe("loading");
  });

  it("Next during a gap starts the upcoming track immediately; Previous goes back", () => {
    const p = playing();
    const g = run(p, { type: "AUDIO_ENDED", token: p.playToken, now: 0 });
    const n = run(g, { type: "NEXT", now: 100 });
    expect(n.phase).toBe("loading");
    expect(n.index).toBe(1);
    expect(n.deadlineAt).toBeNull();
    expect(run(n, { type: "PREVIOUS", now: 0 }).index).toBe(0);
  });

  it("ignores a double-fired or stale ended event", () => {
    const p = playing(loaded({ gapMs: 0, countdownMs: 0 }));
    const once = run(p, { type: "AUDIO_ENDED", token: p.playToken, now: 0 });
    expect(once.index).toBe(1);
    const twice = run(once, { type: "AUDIO_ENDED", token: p.playToken, now: 0 });
    expect(twice).toBe(once);
  });

  it("stop and reset invalidate late audio events", () => {
    const p = playing();
    const stopped = run(p, { type: "STOP" });
    expect(stopped.phase).toBe("idle");
    expect(run(stopped, { type: "AUDIO_ENDED", token: p.playToken, now: 0 })).toBe(stopped);
    const reset = run(playing(), { type: "NEXT", now: 0 }, { type: "RESET" });
    expect(reset.phase).toBe("idle");
    expect(reset.index).toBe(0);
  });

  it("completes after the last track and restarts from the top on Play", () => {
    let s = playing(loaded({ gapMs: 0, countdownMs: 0 }));
    for (let i = 0; i < 3; i++) {
      s = run(s, { type: "AUDIO_ENDED", token: s.playToken, now: 0 });
      if (s.phase === "loading") s = run(s, { type: "AUDIO_READY", token: s.playToken });
    }
    expect(s.phase).toBe("completed");
    const again = run(s, { type: "PLAY", now: 0 });
    expect(again.phase).toBe("loading");
    expect(again.index).toBe(0);
  });

  it("skips hidden tracks", () => {
    const s = run(createSession({ gapMs: 0 }), {
      type: "LOAD_SESSION",
      playlistId: "p",
      tracks: [{ id: "a", src: "/a" }, { id: "b", src: "/b", hidden: true }, { id: "c", src: "/c" }],
    });
    const p = playing(s);
    expect(run(p, { type: "AUDIO_ENDED", token: p.playToken, now: 0 }).index).toBe(2);
  });

  it("reports missing audio as a recoverable error", () => {
    const s = run(createSession(), {
      type: "LOAD_SESSION",
      playlistId: "p",
      tracks: [{ id: "a", src: null }, { id: "b", src: "/b" }],
    });
    const e = run(s, { type: "PLAY", now: 0 });
    expect(e.phase).toBe("error");
    expect(e.error).toBe(MISSING_AUDIO_ERROR);
    const skipped = run(e, { type: "NEXT", now: 0 });
    expect(skipped.phase).toBe("loading");
    expect(skipped.index).toBe(1);
  });

  it("recovers from a playback error with Retry", () => {
    const p = playing();
    const e = run(p, { type: "AUDIO_ERROR", token: p.playToken, message: "boom" });
    expect(e.phase).toBe("error");
    const r = run(e, { type: "RETRY" });
    expect(r.phase).toBe("loading");
    expect(r.index).toBe(0);
  });

  it("switching standard <-> fullscreen never changes the session", () => {
    const p = playing();
    const g = run(p, { type: "AUDIO_ENDED", token: p.playToken, now: 0 });
    const fs = run(g, { type: "SET_VIEW", view: "fullscreen" });
    expect({ ...fs, view: "standard" }).toEqual(g);
    expect(run(fs, { type: "SET_VIEW", view: "standard" }).deadlineAt).toBe(g.deadlineAt);
  });

  it("never mutates the saved playlist snapshot", () => {
    const snapshot = Object.freeze(tracks.map((t) => Object.freeze({ ...t })));
    const s = run(createSession(), { type: "LOAD_SESSION", playlistId: "p", tracks: snapshot });
    expect(() => playing(s)).not.toThrow();
  });
});

describe("derivePlaybackPhase (production player flags)", () => {
  const base = {
    hasTrack: true, isPlaying: false, isTransitioning: false, isGapPaused: false, isGapHeld: false,
    gapCountdown: 0, countdownSeconds: 3, sessionRunning: false, sessionFinished: false, hasError: false,
  };
  it("maps each flag combination to one phase", () => {
    expect(derivePlaybackPhase(base)).toBe("idle");
    expect(derivePlaybackPhase({ ...base, isPlaying: true })).toBe("playing");
    expect(derivePlaybackPhase({ ...base, sessionRunning: true })).toBe("paused");
    expect(derivePlaybackPhase({ ...base, isGapPaused: true, gapCountdown: 8 })).toBe("gap");
    expect(derivePlaybackPhase({ ...base, isGapPaused: true, gapCountdown: 2 })).toBe("countdown");
    expect(derivePlaybackPhase({ ...base, isGapPaused: true, isGapHeld: true })).toBe("paused");
    expect(derivePlaybackPhase({ ...base, isTransitioning: true })).toBe("loading");
    expect(derivePlaybackPhase({ ...base, hasError: true, isPlaying: true })).toBe("error");
    expect(derivePlaybackPhase({ ...base, sessionFinished: true })).toBe("completed");
  });
});

class FakeAudio implements AudioElementLike {
  src = "";
  currentTime = 0;
  paused = true;
  listeners = new Map<string, Set<() => void>>();
  playImpl: () => Promise<void> = () => Promise.resolve();
  play() { this.paused = false; return this.playImpl(); }
  pause() { this.paused = true; }
  load() {}
  removeAttribute() { this.src = ""; }
  addEventListener(t: string, l: () => void) {
    if (!this.listeners.has(t)) this.listeners.set(t, new Set());
    this.listeners.get(t)!.add(l);
  }
  removeEventListener(t: string, l: () => void) { this.listeners.get(t)?.delete(l); }
  emit(t: string) { this.listeners.get(t)?.forEach((l) => l()); }
  count() { let n = 0; this.listeners.forEach((s) => (n += s.size)); return n; }
}

describe("audio controller", () => {
  const noop = { onReady() {}, onEnded() {}, onError() {} };

  it("registers each listener once and emits ended once per load", () => {
    const el = new FakeAudio();
    const onEnded = vi.fn();
    const c = createAudioController(el, { ...noop, onEnded });
    expect(el.count()).toBe(3);
    c.load("/a", 1);
    el.emit("ended");
    el.emit("ended");
    expect(onEnded).toHaveBeenCalledTimes(1);
    expect(onEnded).toHaveBeenCalledWith(1);
    c.dispose();
  });

  it("keeps only one active controller and cleans up on dispose", () => {
    const el1 = new FakeAudio();
    const el2 = new FakeAudio();
    const c1 = createAudioController(el1, noop);
    el1.paused = false;
    const c2 = createAudioController(el2, noop);
    expect(c1.disposed).toBe(true);
    expect(el1.paused).toBe(true);
    expect(el1.count()).toBe(0);
    expect(getActiveAudioController()).toBe(c2);
    c2.dispose();
    expect(getActiveAudioController()).toBeNull();
  });

  it("reports a rejected play() as an error for the current token", async () => {
    const el = new FakeAudio();
    el.playImpl = () => Promise.reject(new Error("NotAllowedError"));
    const onError = vi.fn();
    const c = createAudioController(el, { ...noop, onError });
    c.load("/a", 7);
    expect(await c.play()).toBe(false);
    expect(onError).toHaveBeenCalledWith(7, "NotAllowedError");
    c.dispose();
  });
});

function fakeClock() {
  let now = 0;
  let timers: Array<{ at: number; fn: () => void; id: number }> = [];
  let id = 0;
  const clock: EngineClock = {
    now: () => now,
    setTimeout: (fn, ms) => { timers.push({ at: now + ms, fn, id: ++id }); return id; },
    clearTimeout: (h) => { timers = timers.filter((t) => t.id !== h); },
  };
  return {
    clock,
    advance(ms: number) {
      const end = now + ms;
      for (;;) {
        const due = timers.filter((t) => t.at <= end).sort((a, b) => a.at - b.at)[0];
        if (!due) break;
        timers = timers.filter((t) => t !== due);
        now = due.at;
        due.fn();
      }
      now = end;
    },
    pending: () => timers.length,
  };
}

describe("playback engine (shared by standard, fullscreen and demo)", () => {
  it("plays a full session through gaps and cleans up timers", () => {
    const el = new FakeAudio();
    const t = fakeClock();
    const engine = createPlaybackEngine({ audio: el, clock: t.clock, config: { gapMs: 2000, countdownMs: 1000 } });
    engine.dispatch({ type: "LOAD_SESSION", playlistId: "p", tracks });
    engine.dispatch({ type: "PLAY", now: t.clock.now() });
    expect(el.src).toBe("/a.mp3");
    el.emit("canplay");
    expect(engine.getState().phase).toBe("playing");

    el.emit("ended");
    el.emit("ended");
    expect(engine.getState().phase).toBe("gap");
    expect(engine.getState().index).toBe(1);

    engine.dispatch({ type: "SET_VIEW", view: "fullscreen" });
    t.advance(1500);
    expect(engine.getState().phase).toBe("countdown");
    t.advance(600);
    expect(engine.getState().phase).toBe("loading");
    expect(el.src).toBe("/b.mp3");
    expect(engine.getState().view).toBe("fullscreen");

    engine.dispatch({ type: "STOP" });
    expect(el.paused).toBe(true);
    expect(t.pending()).toBe(0);
    engine.dispose();
    expect(el.count()).toBe(0);
  });

  it("pausing during the countdown stops the timer and the next track", () => {
    const el = new FakeAudio();
    const t = fakeClock();
    const engine = createPlaybackEngine({ audio: el, clock: t.clock, config: { gapMs: 3000, countdownMs: 3000 } });
    engine.dispatch({ type: "LOAD_SESSION", playlistId: "p", tracks });
    engine.dispatch({ type: "PLAY", now: 0 });
    el.emit("canplay");
    el.emit("ended");
    t.advance(1000);
    engine.dispatch({ type: "PAUSE", now: t.clock.now() });
    t.advance(60_000);
    expect(engine.getState().phase).toBe("paused");
    expect(el.src).toBe("/a.mp3");
    expect(t.pending()).toBe(0);
    engine.dispose();
  });

  it("runs the demo through the same engine with demo tracks", () => {
    const parsed = parseDemoSnapshot({
      enabled: true,
      playlists: [{ id: "d", name: "Demo", tracks: [{ id: "t1", name: "One", durationSeconds: 60 }, { bad: 1 }] }],
    });
    expect(parsed[0].tracks).toHaveLength(1);
    expect(parseDemoSnapshot({ enabled: false, playlists: [] })).toEqual([]);
    expect(parseDemoSnapshot(null)).toEqual([]);

    const el = new FakeAudio();
    const engine = createPlaybackEngine({ audio: el, clock: fakeClock().clock });
    engine.dispatch({ type: "LOAD_SESSION", playlistId: "d", tracks: toDemoSessionTracks(parsed[0]) });
    engine.dispatch({ type: "PLAY", now: 0 });
    expect(el.src).toBe(demoTrackUrl("t1"));
    engine.dispose();
  });
});
