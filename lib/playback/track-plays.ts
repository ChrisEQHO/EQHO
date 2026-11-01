// Per-track session play counts ("Plays") for the current training session.
//
// Two maps, both keyed by the track's stable id (never by playlist index), so
// reordering or removing tracks can never move a setting onto another track:
//   - targets:    how many consecutive plays each track gets per playlist cycle
//   - cyclePlays: how many natural completions each track has had this cycle
// Inclusion reuses the player's existing session-only hidden set, so there is a
// single source of truth for "excluded". None of this is saved to the playlist,
// IndexedDB or the cloud — it is session state only.

import {
  decideInterleavedAdvance,
  decideTrackEnd,
  type AdvanceDecision,
  type SequencerTrack,
  type TrackEndDecision,
} from "./sequencer";

export const MIN_TRACK_PLAYS = 1;
export const MAX_TRACK_PLAYS = 20;
export const DEFAULT_TRACK_PLAYS = 1;

export type TrackPlayTargets = Readonly<Record<string, number>>;
export type TrackCyclePlays = Readonly<Record<string, number>>;

export type TrackSessionConfig = {
  targetPlays: number;
  completedPlays: number;
  included: boolean;
  completed: boolean;
};

export function clampTargetPlays(value: number): number {
  if (!Number.isFinite(value)) return DEFAULT_TRACK_PLAYS;
  return Math.min(MAX_TRACK_PLAYS, Math.max(MIN_TRACK_PLAYS, Math.round(value)));
}

export function getTargetPlays(targets: TrackPlayTargets, trackId: string): number {
  const value = targets[trackId];
  return value === undefined ? DEFAULT_TRACK_PLAYS : clampTargetPlays(value);
}

/**
 * Plays a track needs before it is complete in this cycle. The existing
 * Back-to-Back setting doubles every track, so it multiplies the target.
 */
export function getEffectiveTargetPlays(
  targets: TrackPlayTargets,
  trackId: string,
  backToBack: boolean,
): number {
  return getTargetPlays(targets, trackId) * (backToBack ? 2 : 1);
}

export function getCompletedPlays(cyclePlays: TrackCyclePlays, trackId: string): number {
  return Math.max(0, cyclePlays[trackId] ?? 0);
}

export function isTrackCycleComplete(
  targets: TrackPlayTargets,
  cyclePlays: TrackCyclePlays,
  trackId: string,
  backToBack: boolean,
): boolean {
  return getCompletedPlays(cyclePlays, trackId) >= getEffectiveTargetPlays(targets, trackId, backToBack);
}

export function getCompletedTrackIds(
  trackIds: readonly string[],
  targets: TrackPlayTargets,
  cyclePlays: TrackCyclePlays,
  backToBack: boolean,
): Set<string> {
  const done = new Set<string>();
  for (const id of trackIds) {
    if (isTrackCycleComplete(targets, cyclePlays, id, backToBack)) done.add(id);
  }
  return done;
}

export function getTrackSessionConfig(
  trackId: string,
  targets: TrackPlayTargets,
  cyclePlays: TrackCyclePlays,
  hiddenTrackIds: ReadonlySet<string>,
  backToBack = false,
): TrackSessionConfig {
  return {
    targetPlays: getTargetPlays(targets, trackId),
    completedPlays: getCompletedPlays(cyclePlays, trackId),
    included: !hiddenTrackIds.has(trackId),
    completed: isTrackCycleComplete(targets, cyclePlays, trackId, backToBack),
  };
}

export function setTargetPlays(
  targets: TrackPlayTargets,
  trackId: string,
  value: number,
): Record<string, number> {
  return { ...targets, [trackId]: clampTargetPlays(value) };
}

export function recordCompletedPlay(cyclePlays: TrackCyclePlays, trackId: string): Record<string, number> {
  return { ...cyclePlays, [trackId]: getCompletedPlays(cyclePlays, trackId) + 1 };
}

export function clearCompletedPlays(cyclePlays: TrackCyclePlays, trackId: string): Record<string, number> {
  if (!(trackId in cyclePlays)) return cyclePlays as Record<string, number>;
  const next = { ...cyclePlays };
  delete next[trackId];
  return next;
}

/** Drops entries for tracks no longer in the playlist. Returns the same object when nothing changed. */
export function pruneToTrackIds<T extends Readonly<Record<string, number>>>(
  map: T,
  trackIds: readonly string[],
): T {
  const keep = new Set(trackIds);
  const keys = Object.keys(map);
  if (keys.every((k) => keep.has(k))) return map;
  const next: Record<string, number> = {};
  for (const k of keys) if (keep.has(k)) next[k] = map[k];
  return next as unknown as T;
}

/** "Play 2 of 3" while a multi-play track is current; null for single-play tracks. */
export function getPlayProgressLabel(completedPlays: number, effectiveTarget: number): string | null {
  if (effectiveTarget <= 1) return null;
  const playNumber = Math.min(completedPlays + 1, effectiveTarget);
  return `Play ${playNumber} of ${effectiveTarget}`;
}

export interface TrackPlaysSessionContext {
  playlist: readonly SequencerTrack[];
  currentIndex: number;
  hiddenTrackIds: ReadonlySet<string>;
  playlistRound: number;
  playlistRepeats: number;
  backToBack: boolean;
  targets: TrackPlayTargets;
  cyclePlays: TrackCyclePlays;
}

/**
 * The single natural-end reduction used by the JS player. Records exactly one
 * completed play for the ended track, then decides: replay the same track,
 * hold (autoplay off), advance to the next included incomplete track, start a
 * new whole-playlist round (progress reset, targets kept) or finish.
 */
export function resolveTrackEnd(
  ctx: TrackPlaysSessionContext & { autoplayNext: boolean },
): { decision: TrackEndDecision; cyclePlays: Record<string, number> } {
  const ended = ctx.playlist[ctx.currentIndex];
  if (!ended) {
    return { decision: { type: "finish" }, cyclePlays: { ...ctx.cyclePlays } };
  }
  const after = recordCompletedPlay(ctx.cyclePlays, ended.id);
  const ids = ctx.playlist.map((t) => t.id);
  const decision = decideTrackEnd({
    playlist: ctx.playlist,
    currentIndex: ctx.currentIndex,
    hiddenTrackIds: ctx.hiddenTrackIds,
    playlistRound: ctx.playlistRound,
    playlistRepeats: ctx.playlistRepeats,
    completedTrackIds: getCompletedTrackIds(ids, ctx.targets, after, ctx.backToBack),
    backToBack: ctx.backToBack,
    b2bRepeatedTrackId: null,
    autoplayNext: ctx.autoplayNext,
    trackPlays: {
      target: getEffectiveTargetPlays(ctx.targets, ended.id, ctx.backToBack),
      completedAfterThisPlay: after[ended.id],
    },
  });
  const newRound = decision.type === "play" && decision.nextRound !== ctx.playlistRound;
  return { decision, cyclePlays: newRound ? {} : after };
}

/**
 * Next: abandons the current track's remaining plays for this cycle (no play is
 * counted) and moves to the next included, incomplete track — or the next round.
 */
export function resolveSkipForward(
  ctx: TrackPlaysSessionContext,
): { decision: AdvanceDecision | { type: "noop" }; cyclePlays: Record<string, number> } {
  const ids = ctx.playlist.map((t) => t.id);
  const decision =
    ctx.playlist.length === 0
      ? ({ type: "noop" } as const)
      : decideInterleavedAdvance(
          {
            playlist: ctx.playlist,
            currentIndex: ctx.currentIndex,
            hiddenTrackIds: ctx.hiddenTrackIds,
            playlistRound: ctx.playlistRound,
            playlistRepeats: ctx.playlistRepeats,
            completedTrackIds: getCompletedTrackIds(ids, ctx.targets, ctx.cyclePlays, ctx.backToBack),
          },
          { allowCurrent: false },
        );
  const newRound = decision.type === "play" && decision.nextRound !== ctx.playlistRound;
  return { decision, cyclePlays: newRound ? {} : { ...ctx.cyclePlays } };
}

/** First included track that still has plays left this cycle, or -1. */
export function findFirstPlayableIndex(
  playlist: readonly SequencerTrack[],
  hiddenTrackIds: ReadonlySet<string>,
  targets: TrackPlayTargets,
  cyclePlays: TrackCyclePlays,
  backToBack: boolean,
): number {
  return playlist.findIndex(
    (t) => !hiddenTrackIds.has(t.id) && !isTrackCycleComplete(targets, cyclePlays, t.id, backToBack),
  );
}

/**
 * Lets exactly one natural `ended` count per started play. `arm()` runs when a
 * play starts; `consume()` returns true once, then false for any duplicate
 * `ended` (re-render, view switch, WebView double-fire) until re-armed.
 */
export function createPlayEndGuard() {
  let armed = true;
  return {
    arm() {
      armed = true;
    },
    consume(): boolean {
      if (!armed) return false;
      armed = false;
      return true;
    },
  };
}

/**
 * Expands included tracks into the flat order the native engine plays, one entry
 * per play (no audio is duplicated — entries share the same file). Returns the
 * entries plus, for each entry, the playlist index it came from.
 */
export function expandForNativeQueue<T extends { id: string }>(
  playlist: readonly T[],
  hiddenTrackIds: ReadonlySet<string>,
  targets: TrackPlayTargets,
): { entries: T[]; playlistIndexes: number[] } {
  const entries: T[] = [];
  const playlistIndexes: number[] = [];
  const included = playlist
    .map((track, index) => ({ track, index, plays: getTargetPlays(targets, track.id) }))
    .filter(({ track }) => !hiddenTrackIds.has(track.id));
  const passes = included.reduce((max, t) => Math.max(max, t.plays), 0);
  for (let pass = 0; pass < passes; pass++) {
    for (const { track, index, plays } of included) {
      if (pass >= plays) continue;
      entries.push(track);
      playlistIndexes.push(index);
    }
  }
  return { entries, playlistIndexes };
}
