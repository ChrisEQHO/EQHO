/**
 * Explicit playback state model shared by every EQHO Player surface (standard,
 * fullscreen/coach, mobile and the public demo).
 *
 * This is a PURE reducer: no timers, no DOM, no audio. Time only enters through
 * the `now` value on events, and every countdown/gap is a wall-clock deadline
 * (`deadlineAt`), so a throttled iPad timer and a 60fps desktop loop reach the
 * same transition at the same instant.
 *
 * Temporary session state lives here only. Saved playlist data is never
 * mutated: tracks are passed in as an immutable snapshot of stable ids.
 */

export type PlaybackPhase =
  | "idle"
  | "loading"
  | "countdown"
  | "playing"
  | "paused"
  | "gap"
  | "completed"
  | "error";

export type PlayerView = "standard" | "fullscreen";

export interface SessionTrack {
  /** Stable id from the saved playlist. Never regenerated during a session. */
  id: string;
  /** Playable source, or null when the audio is missing on this device. */
  src: string | null;
  hidden?: boolean;
}

export interface SessionConfig {
  /** Silent wait between routines, in ms. 0 = advance immediately. */
  gapMs: number;
  /** Final part of the gap shown/beeped as the "get ready" countdown, in ms. */
  countdownMs: number;
}

export interface SessionState {
  phase: PlaybackPhase;
  playlistId: string | null;
  tracks: readonly SessionTrack[];
  index: number;
  /**
   * Incremented every time a track is (re)loaded or playback is stopped. Audio
   * events carry the token they were produced for, so a late `ended`/`error`
   * from a previous track can never advance the session.
   */
  playToken: number;
  /** Wall-clock ms at which the current gap/countdown ends. */
  deadlineAt: number | null;
  /** Remaining gap ms frozen while paused during a gap/countdown. */
  heldRemainingMs: number | null;
  /** Phase to return to when resuming from `paused`. */
  resumeTo: "playing" | "gap" | "countdown" | null;
  error: string | null;
  view: PlayerView;
  config: SessionConfig;
}

export type SessionEvent =
  | { type: "LOAD_SESSION"; playlistId: string; tracks: readonly SessionTrack[] }
  | { type: "PLAY"; now: number }
  | { type: "PAUSE"; now: number }
  | { type: "NEXT"; now: number }
  | { type: "PREVIOUS"; now: number }
  | { type: "STOP" }
  | { type: "RESET" }
  | { type: "AUDIO_READY"; token: number }
  | { type: "AUDIO_ENDED"; token: number; now: number }
  | { type: "AUDIO_ERROR"; token: number; message: string }
  | { type: "TICK"; now: number }
  | { type: "RETRY" }
  | { type: "SET_VIEW"; view: PlayerView }
  | { type: "SET_CONFIG"; config: Partial<SessionConfig> };

export const MISSING_AUDIO_ERROR = "This track's audio isn't available on this device.";

export function createSession(config: Partial<SessionConfig> = {}): SessionState {
  return {
    phase: "idle",
    playlistId: null,
    tracks: [],
    index: 0,
    playToken: 0,
    deadlineAt: null,
    heldRemainingMs: null,
    resumeTo: null,
    error: null,
    view: "standard",
    config: { gapMs: 0, countdownMs: 3000, ...config },
  };
}

export function visibleIndexFrom(tracks: readonly SessionTrack[], from: number, step: 1 | -1): number {
  for (let i = from; i >= 0 && i < tracks.length; i += step) {
    if (!tracks[i].hidden) return i;
  }
  return -1;
}

function startTrack(state: SessionState, index: number): SessionState {
  const base = {
    ...state,
    deadlineAt: null,
    heldRemainingMs: null,
    resumeTo: null,
    playToken: state.playToken + 1,
  };
  if (index < 0 || index >= state.tracks.length) return { ...base, phase: "idle", error: null };
  const track = state.tracks[index];
  if (!track.src) return { ...base, index, phase: "error", error: MISSING_AUDIO_ERROR };
  return { ...base, index, phase: "loading", error: null };
}

function beginGapOrAdvance(state: SessionState, nextIndex: number, now: number): SessionState {
  const { gapMs, countdownMs } = state.config;
  if (gapMs <= 0) return startTrack(state, nextIndex);
  return {
    ...state,
    index: nextIndex,
    // Bump the token so the finished track's audio can no longer affect state.
    playToken: state.playToken + 1,
    deadlineAt: now + gapMs,
    heldRemainingMs: null,
    resumeTo: null,
    phase: gapMs <= countdownMs ? "countdown" : "gap",
  };
}

function waitingPhase(remainingMs: number, countdownMs: number): "gap" | "countdown" {
  return remainingMs <= countdownMs ? "countdown" : "gap";
}

export function sessionReducer(state: SessionState, event: SessionEvent): SessionState {
  switch (event.type) {
    case "LOAD_SESSION":
      return {
        ...createSession(state.config),
        view: state.view,
        playlistId: event.playlistId,
        tracks: event.tracks,
        index: Math.max(0, visibleIndexFrom(event.tracks, 0, 1)),
        playToken: state.playToken + 1,
      };

    case "SET_VIEW":
      // Switching between standard and fullscreen is presentation only.
      return state.view === event.view ? state : { ...state, view: event.view };

    case "SET_CONFIG":
      return { ...state, config: { ...state.config, ...event.config } };

    case "PLAY":
      switch (state.phase) {
        case "idle":
          return startTrack(state, visibleIndexFrom(state.tracks, state.index, 1));
        case "completed":
          return startTrack(state, visibleIndexFrom(state.tracks, 0, 1));
        case "error":
          return startTrack(state, state.index);
        case "paused": {
          if (state.resumeTo === "playing") return { ...state, phase: "playing", resumeTo: null };
          if (state.heldRemainingMs != null) {
            return {
              ...state,
              deadlineAt: event.now + state.heldRemainingMs,
              heldRemainingMs: null,
              resumeTo: null,
              phase: waitingPhase(state.heldRemainingMs, state.config.countdownMs),
            };
          }
          // Paused while loading: reload the same track.
          return startTrack(state, state.index);
        }
        default:
          return state;
      }

    case "PAUSE":
      switch (state.phase) {
        case "playing":
          return { ...state, phase: "paused", resumeTo: "playing" };
        case "loading":
          return { ...state, phase: "paused", resumeTo: null, playToken: state.playToken + 1 };
        case "gap":
        case "countdown":
          return {
            ...state,
            phase: "paused",
            resumeTo: state.phase,
            heldRemainingMs: Math.max(0, (state.deadlineAt ?? event.now) - event.now),
            deadlineAt: null,
          };
        default:
          return state;
      }

    case "NEXT": {
      if (state.tracks.length === 0) return state;
      // During a gap the upcoming track is already `index`: Next starts it now.
      const waiting = state.phase === "gap" || state.phase === "countdown" ||
        (state.phase === "paused" && state.heldRemainingMs != null);
      const target = waiting ? state.index : visibleIndexFrom(state.tracks, state.index + 1, 1);
      if (target === -1) return { ...startTrack(state, -1), phase: "completed", index: state.index };
      return startTrack(state, target);
    }

    case "PREVIOUS": {
      if (state.tracks.length === 0) return state;
      const prev = visibleIndexFrom(state.tracks, state.index - 1, -1);
      return startTrack(state, prev === -1 ? Math.max(0, visibleIndexFrom(state.tracks, 0, 1)) : prev);
    }

    case "STOP":
      return {
        ...state,
        phase: "idle",
        playToken: state.playToken + 1,
        deadlineAt: null,
        heldRemainingMs: null,
        resumeTo: null,
        error: null,
      };

    case "RESET":
      return {
        ...state,
        phase: "idle",
        index: Math.max(0, visibleIndexFrom(state.tracks, 0, 1)),
        playToken: state.playToken + 1,
        deadlineAt: null,
        heldRemainingMs: null,
        resumeTo: null,
        error: null,
      };

    case "AUDIO_READY":
      if (event.token !== state.playToken || state.phase !== "loading") return state;
      return { ...state, phase: "playing" };

    case "AUDIO_ENDED": {
      // Stale token or not playing: a double-fired / late `ended` is ignored.
      if (event.token !== state.playToken || state.phase !== "playing") return state;
      const next = visibleIndexFrom(state.tracks, state.index + 1, 1);
      if (next === -1) {
        return { ...state, phase: "completed", playToken: state.playToken + 1, deadlineAt: null };
      }
      return beginGapOrAdvance(state, next, event.now);
    }

    case "AUDIO_ERROR":
      if (event.token !== state.playToken) return state;
      if (state.phase !== "loading" && state.phase !== "playing") return state;
      return { ...state, phase: "error", error: event.message, playToken: state.playToken + 1 };

    case "RETRY":
      return state.phase === "error" ? startTrack(state, state.index) : state;

    case "TICK": {
      if ((state.phase !== "gap" && state.phase !== "countdown") || state.deadlineAt == null) return state;
      const remaining = state.deadlineAt - event.now;
      if (remaining <= 0) return startTrack(state, state.index);
      const phase = waitingPhase(remaining, state.config.countdownMs);
      return phase === state.phase ? state : { ...state, phase };
    }
  }
}

/** Whole seconds left on the gap/countdown, as displayed (5, 4, 3, 2, 1). */
export function remainingSeconds(state: SessionState, now: number): number {
  if (state.heldRemainingMs != null) return Math.ceil(state.heldRemainingMs / 1000);
  if (state.deadlineAt == null) return 0;
  return Math.max(0, Math.ceil((state.deadlineAt - now) / 1000));
}

/**
 * Maps the production player's existing flags onto the explicit phase model so
 * every view (standard, fullscreen, mobile coach, demo) reports the same state.
 */
export function derivePlaybackPhase(flags: {
  hasTrack: boolean;
  isPlaying: boolean;
  isTransitioning: boolean;
  isGapPaused: boolean;
  isGapHeld: boolean;
  gapCountdown: number;
  countdownSeconds: number;
  sessionRunning: boolean;
  sessionFinished: boolean;
  hasError: boolean;
}): PlaybackPhase {
  if (flags.sessionFinished) return "completed";
  if (flags.hasError) return "error";
  if (flags.isGapPaused) {
    if (flags.isGapHeld) return "paused";
    return flags.gapCountdown > 0 && flags.gapCountdown <= flags.countdownSeconds ? "countdown" : "gap";
  }
  if (flags.isTransitioning) return "loading";
  if (flags.isPlaying) return "playing";
  if (flags.sessionRunning && flags.hasTrack) return "paused";
  return "idle";
}
