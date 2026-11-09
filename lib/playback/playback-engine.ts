/**
 * Shared playback engine: the session reducer plus the single audio controller
 * plus one timestamp-driven ticker. Every surface subscribes to the same engine
 * instance, so switching standard <-> fullscreen never restarts or forks state.
 */
import {
  createAudioController,
  type AudioController,
  type AudioElementLike,
} from "./audio-controller";
import {
  createSession,
  sessionReducer,
  type SessionConfig,
  type SessionEvent,
  type SessionState,
} from "./session-machine";

export interface EngineClock {
  now(): number;
  setTimeout(fn: () => void, ms: number): unknown;
  clearTimeout(handle: unknown): void;
}

const defaultClock: EngineClock = {
  now: () => Date.now(),
  setTimeout: (fn, ms) => setTimeout(fn, ms),
  clearTimeout: (h) => clearTimeout(h as ReturnType<typeof setTimeout>),
};

export interface PlaybackEngine {
  getState(): SessionState;
  dispatch(event: SessionEvent): void;
  subscribe(listener: (state: SessionState) => void): () => void;
  dispose(): void;
}

/** Ticker cadence. Correctness never depends on it: deadlines are wall-clock. */
export const TICK_MS = 250;

export function createPlaybackEngine(options: {
  audio: AudioElementLike;
  config?: Partial<SessionConfig>;
  clock?: EngineClock;
}): PlaybackEngine {
  const clock = options.clock ?? defaultClock;
  let state = createSession(options.config);
  let tickHandle: unknown = null;
  let disposed = false;
  const listeners = new Set<(s: SessionState) => void>();

  const controller: AudioController = createAudioController(options.audio, {
    onReady: (token) => dispatch({ type: "AUDIO_READY", token }),
    onEnded: (token) => dispatch({ type: "AUDIO_ENDED", token, now: clock.now() }),
    onError: (token, message) => dispatch({ type: "AUDIO_ERROR", token, message }),
  });

  function stopTicker() {
    if (tickHandle != null) clock.clearTimeout(tickHandle);
    tickHandle = null;
  }

  function scheduleTick() {
    stopTicker();
    if (state.deadlineAt == null) return;
    const wait = Math.max(0, Math.min(TICK_MS, state.deadlineAt - clock.now()));
    tickHandle = clock.setTimeout(() => {
      tickHandle = null;
      dispatch({ type: "TICK", now: clock.now() });
    }, wait);
  }

  function applyEffects(prev: SessionState, next: SessionState) {
    const reloaded = next.phase === "loading" && next.playToken !== prev.playToken;
    if (reloaded) {
      const src = next.tracks[next.index]?.src;
      if (src) {
        controller.load(src, next.playToken);
        void controller.play();
      }
    } else if (prev.phase === "paused" && next.phase === "playing") {
      void controller.play();
    } else if (prev.phase === "playing" && next.phase === "paused") {
      controller.pause();
    } else if (
      next.phase !== prev.phase &&
      (next.phase === "idle" || next.phase === "completed" || next.phase === "error" ||
        next.phase === "gap" || next.phase === "countdown")
    ) {
      controller.stop();
    }

    if (next.phase === "gap" || next.phase === "countdown") scheduleTick();
    else stopTicker();
  }

  function dispatch(event: SessionEvent) {
    if (disposed) return;
    const prev = state;
    const next = sessionReducer(prev, event);
    if (next === prev) {
      // A tick that changes nothing must still keep the ticker alive until the deadline.
      if (event.type === "TICK" && (state.phase === "gap" || state.phase === "countdown")) scheduleTick();
      return;
    }
    state = next;
    applyEffects(prev, next);
    listeners.forEach((l) => l(state));
  }

  return {
    getState: () => state,
    dispatch,
    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    dispose() {
      if (disposed) return;
      disposed = true;
      stopTicker();
      listeners.clear();
      controller.dispose();
    },
  };
}
