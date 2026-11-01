// Pure sequencing rules shared by every player view (main dashboard, desktop
// full-screen, mobile Coach Mode). The component owns the single <audio> element
// and React state; these functions decide WHAT happens next so the track-end and
// skip paths can never drift apart. Native sessions keep their own sequencer and
// are mirrored back through `applyNativeEvent`.

export interface SequencerTrack {
  id: string;
  title?: string;
  url?: string;
}

export interface QueueContext {
  playlist: readonly SequencerTrack[];
  currentIndex: number;
  hiddenTrackIds: ReadonlySet<string>;
  playlistRound: number;
  playlistRepeats: number;
  /**
   * Tracks that have already played all of their per-track "Plays" in the
   * current cycle. Skipped when advancing; cleared when a new round begins.
   */
  completedTrackIds?: ReadonlySet<string>;
}

function unionSets(a: ReadonlySet<string>, b?: ReadonlySet<string>): ReadonlySet<string> {
  if (!b || b.size === 0) return a;
  return new Set([...a, ...b]);
}

export function findNextVisibleIndex(
  playlist: readonly SequencerTrack[],
  fromExclusive: number,
  hidden: ReadonlySet<string>,
): number {
  for (let i = fromExclusive + 1; i < playlist.length; i++) {
    if (!hidden.has(playlist[i].id)) return i;
  }
  return -1;
}

export function findFirstVisibleIndex(
  playlist: readonly SequencerTrack[],
  hidden: ReadonlySet<string>,
): number {
  return findNextVisibleIndex(playlist, -1, hidden);
}

export function findPreviousVisibleIndex(
  playlist: readonly SequencerTrack[],
  fromExclusive: number,
  hidden: ReadonlySet<string>,
): number {
  for (let i = Math.min(fromExclusive, playlist.length) - 1; i >= 0; i--) {
    if (!hidden.has(playlist[i].id)) return i;
  }
  return -1;
}

export type AdvanceDecision =
  | { type: "play"; index: number; nextRound: number }
  | { type: "finish" };

/** Where the queue goes after the current track: next visible, next round, or done. */
export function decideAdvance(ctx: QueueContext): AdvanceDecision {
  const skip = unionSets(ctx.hiddenTrackIds, ctx.completedTrackIds);
  const next = findNextVisibleIndex(ctx.playlist, ctx.currentIndex, skip);
  if (next >= 0) return { type: "play", index: next, nextRound: ctx.playlistRound };
  if (ctx.playlistRound < ctx.playlistRepeats) {
    // A new round resets per-track progress, so only exclusion matters here.
    const first = findFirstVisibleIndex(ctx.playlist, ctx.hiddenTrackIds);
    if (first >= 0) return { type: "play", index: first, nextRound: ctx.playlistRound + 1 };
  }
  return { type: "finish" };
}

/**
 * Per-track "Plays" advance: each pass through the playlist plays every
 * included track that still has plays left once, in order, then wraps back to
 * the top (1, 3, 1, 3, …) instead of repeating a track consecutively. When no
 * track has plays left the next playlist round starts, or the session finishes.
 */
export function decideInterleavedAdvance(
  ctx: QueueContext,
  options: { allowCurrent: boolean },
): AdvanceDecision {
  const n = ctx.playlist.length;
  if (n > 0) {
    const skip = unionSets(ctx.hiddenTrackIds, ctx.completedTrackIds);
    const start = ctx.currentIndex >= 0 && ctx.currentIndex < n ? ctx.currentIndex : -1;
    for (let step = 1; step <= n; step++) {
      const i = (((start + step) % n) + n) % n;
      if (i === start && !options.allowCurrent) continue;
      if (!skip.has(ctx.playlist[i].id)) {
        return { type: "play", index: i, nextRound: ctx.playlistRound };
      }
    }
  }
  if (ctx.playlistRound < ctx.playlistRepeats) {
    const first = findFirstVisibleIndex(ctx.playlist, ctx.hiddenTrackIds);
    if (first >= 0) return { type: "play", index: first, nextRound: ctx.playlistRound + 1 };
  }
  return { type: "finish" };
}

export interface TrackEndContext extends QueueContext {
  backToBack: boolean;
  /** Id of the track that already consumed its back-to-back repeat, if any. */
  b2bRepeatedTrackId: string | null;
  autoplayNext: boolean;
  /**
   * Per-track "Plays" progress for the track that just ended. When present it
   * replaces the legacy back-to-back flag: `target` already includes the
   * back-to-back multiplier and `completedAfterThisPlay` includes this play.
   */
  trackPlays?: { target: number; completedAfterThisPlay: number };
}

export type TrackEndDecision =
  | { type: "replay"; index: number }
  | { type: "hold" }
  | AdvanceDecision;

/** Natural end of a track: per-track/back-to-back replay, autoplay-off hold, or advance. */
export function decideTrackEnd(ctx: TrackEndContext): TrackEndDecision {
  const ended = ctx.playlist[ctx.currentIndex];
  if (ctx.trackPlays) {
    const { target, completedAfterThisPlay } = ctx.trackPlays;
    // Back-to-Back still pairs each play with an immediate repeat.
    if (ctx.backToBack && ended?.url && completedAfterThisPlay < target && completedAfterThisPlay % 2 === 1) {
      return { type: "replay", index: ctx.currentIndex };
    }
    if (!ctx.autoplayNext) return { type: "hold" };
    const completed = new Set(ctx.completedTrackIds ?? []);
    if (ended && completedAfterThisPlay >= target) completed.add(ended.id);
    const decision = decideInterleavedAdvance(
      { ...ctx, completedTrackIds: completed },
      { allowCurrent: Boolean(ended?.url) },
    );
    if (decision.type === "play" && decision.index === ctx.currentIndex && decision.nextRound === ctx.playlistRound) {
      return { type: "replay", index: ctx.currentIndex };
    }
    return decision;
  }
  if (ctx.backToBack && ended?.url && ctx.b2bRepeatedTrackId !== ended.id) {
    return { type: "replay", index: ctx.currentIndex };
  }
  if (!ctx.autoplayNext) return { type: "hold" };
  return decideAdvance(ctx);
}

/** Manual skip forward ignores back-to-back and autoplay: it always moves on. */
export function decideSkipForward(ctx: QueueContext): AdvanceDecision | { type: "noop" } {
  if (ctx.playlist.length === 0) return { type: "noop" };
  return decideAdvance(ctx);
}

export const SKIP_BACK_RESTART_THRESHOLD_SECONDS = 2;

export type SkipBackDecision =
  | { type: "previous"; index: number }
  | { type: "restart" }
  | { type: "noop" };

/** Early in a track jumps to the previous visible track; otherwise restarts. */
export function decideSkipBack(
  ctx: Pick<QueueContext, "playlist" | "currentIndex" | "hiddenTrackIds">,
  currentTime: number,
): SkipBackDecision {
  if (ctx.playlist.length === 0) return { type: "noop" };
  const prev = findPreviousVisibleIndex(ctx.playlist, ctx.currentIndex, ctx.hiddenTrackIds);
  if (currentTime < SKIP_BACK_RESTART_THRESHOLD_SECONDS && prev >= 0) {
    return { type: "previous", index: prev };
  }
  return { type: "restart" };
}

/** Guarantees the "session finished" UI and analytics fire once per session. */
export function createCompletionLatch() {
  let fired = false;
  return {
    fire(): boolean {
      if (fired) return false;
      fired = true;
      return true;
    },
    reset() {
      fired = false;
    },
    get fired() {
      return fired;
    },
  };
}

// ---------------------------------------------------------------------------
// Shared view state. Every player view renders from this one shape.

export interface PlaybackViewState {
  currentIndex: number;
  currentTrackId: string | null;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  isGapPaused: boolean;
  gapCountdown: number;
  sessionFinished: boolean;
}

export const initialPlaybackViewState: PlaybackViewState = {
  currentIndex: 0,
  currentTrackId: null,
  isPlaying: false,
  currentTime: 0,
  duration: 0,
  isGapPaused: false,
  gapCountdown: 0,
  sessionFinished: false,
};

export type NativeSessionEvent =
  | { type: "trackChanged"; index: number; duration: number; trackId: string | null }
  | { type: "gapStarted"; seconds: number }
  | { type: "gapTick"; remaining: number }
  | { type: "gapEnded" }
  | { type: "position"; currentTime: number; duration: number }
  | { type: "playState"; playing: boolean }
  | { type: "sessionFinished"; reason: string };

/** Mirrors a native-sequencer event into the shared view state. */
export function applyNativeEvent(
  state: PlaybackViewState,
  event: NativeSessionEvent,
): PlaybackViewState {
  switch (event.type) {
    case "trackChanged":
      return {
        ...state,
        currentIndex: event.index,
        currentTrackId: event.trackId ?? state.currentTrackId,
        duration: event.duration || 0,
        currentTime: 0,
        isGapPaused: false,
        gapCountdown: 0,
        isPlaying: true,
      };
    case "gapStarted":
      return { ...state, isGapPaused: true, gapCountdown: event.seconds };
    case "gapTick":
      return { ...state, gapCountdown: event.remaining };
    case "gapEnded":
      return { ...state, isGapPaused: false, gapCountdown: 0 };
    case "position":
      return {
        ...state,
        currentTime: event.currentTime,
        duration: event.duration || state.duration,
      };
    case "playState":
      return { ...state, isPlaying: event.playing };
    case "sessionFinished":
      return {
        ...state,
        isPlaying: false,
        isGapPaused: false,
        gapCountdown: 0,
        sessionFinished: state.sessionFinished || event.reason === "completed",
      };
  }
}

export type PlayerView = "main" | "fullscreen" | "coach";

export interface NowPlayingSnapshot {
  trackId: string | null;
  title: string;
  index: number;
  isPlaying: boolean;
  progress: number;
  currentTime: number;
  duration: number;
  gapActive: boolean;
  gapRemaining: number;
}

/**
 * The one projection every view renders. The `view` argument is accepted so
 * callers can't accidentally branch playback data per view; it has no effect.
 */
export function selectNowPlaying(
  state: PlaybackViewState,
  playlist: readonly SequencerTrack[],
  _view: PlayerView,
): NowPlayingSnapshot {
  const track = playlist[state.currentIndex];
  const duration = state.duration > 0 ? state.duration : 0;
  return {
    trackId: track?.id ?? state.currentTrackId,
    title: track?.title ?? "",
    index: state.currentIndex,
    isPlaying: state.isPlaying,
    currentTime: state.currentTime,
    duration,
    progress: duration > 0 ? Math.min(1, state.currentTime / duration) : 0,
    gapActive: state.isGapPaused,
    gapRemaining: state.gapCountdown,
  };
}
