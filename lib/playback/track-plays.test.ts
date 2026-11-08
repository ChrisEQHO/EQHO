import { describe, expect, it } from "vitest";
import { selectNowPlaying, initialPlaybackViewState, type SequencerTrack } from "./sequencer";
import {
  DEFAULT_TRACK_PLAYS,
  MAX_TRACK_PLAYS,
  clampTargetPlays,
  clearCompletedPlays,
  createPlayEndGuard,
  expandForNativeQueue,
  findFirstPlayableIndex,
  getPlayProgressLabel,
  getTargetPlays,
  getTrackRowStatus,
  getTrackSessionConfig,
  pruneToTrackIds,
  resolveSkipForward,
  resolveTrackEnd,
  setTargetPlays,
  type TrackCyclePlays,
  type TrackPlayTargets,
} from "./track-plays";

// Offline playback uses local blob: URLs (IndexedDB) — no network is involved.
const balance = { id: "bal", title: "Balance", url: "blob:bal" };
const dynamic = { id: "dyn", title: "Dynamic", url: "blob:dyn" };
const combined = { id: "com", title: "Combined", url: "blob:com" };
const routines: SequencerTrack[] = [balance, dynamic, combined];

type Step = { type: "play"; id: string } | { type: "gap" };

/**
 * Drives the same reducers the player uses: start at the first playable track,
 * then feed one natural `ended` per play. A gap runs once between every play.
 */
function simulate(opts: {
  playlist?: SequencerTrack[];
  targets?: TrackPlayTargets;
  hidden?: Set<string>;
  repeats?: number;
  backToBack?: boolean;
  onEnded?: (state: { playCount: number; hidden: Set<string> }) => void;
}): Step[] {
  const playlist = opts.playlist ?? routines;
  const hidden = opts.hidden ?? new Set<string>();
  let targets = opts.targets ?? {};
  let cyclePlays: TrackCyclePlays = {};
  let round = 1;
  const steps: Step[] = [];
  let index = findFirstPlayableIndex(playlist, hidden, targets, cyclePlays, !!opts.backToBack);
  if (index < 0) return steps;
  steps.push({ type: "play", id: playlist[index].id });
  for (let guard = 0; guard < 500; guard++) {
    opts.onEnded?.({ playCount: steps.filter((s) => s.type === "play").length, hidden });
    const { decision, cyclePlays: next } = resolveTrackEnd({
      playlist,
      currentIndex: index,
      hiddenTrackIds: hidden,
      playlistRound: round,
      playlistRepeats: opts.repeats ?? 1,
      backToBack: !!opts.backToBack,
      autoplayNext: true,
      targets,
      cyclePlays,
    });
    cyclePlays = next;
    if (decision.type === "finish" || decision.type === "hold") break;
    if (decision.type === "play") round = decision.nextRound;
    index = decision.index;
    steps.push({ type: "gap" });
    steps.push({ type: "play", id: playlist[index].id });
  }
  targets = { ...targets };
  return steps;
}

const plays = (steps: Step[]) => steps.flatMap((s) => (s.type === "play" ? [s.id] : []));

describe("per-track play counts", () => {
  it("1. defaults every track to one play", () => {
    expect(DEFAULT_TRACK_PLAYS).toBe(1);
    expect(getTargetPlays({}, "bal")).toBe(1);
    expect(getTrackSessionConfig("bal", {}, {}, new Set())).toEqual({
      targetPlays: 1,
      completedPlays: 0,
      included: true,
      completed: false,
    });
    expect(plays(simulate({}))).toEqual(["bal", "dyn", "com"]);
  });

  it("clamps targets to 1..10", () => {
    expect(MAX_TRACK_PLAYS).toBe(10);
    expect(clampTargetPlays(0)).toBe(1);
    expect(clampTargetPlays(-4)).toBe(1);
    expect(clampTargetPlays(99)).toBe(MAX_TRACK_PLAYS);
    expect(clampTargetPlays(Number.NaN)).toBe(1);
    expect(setTargetPlays({}, "bal", 25)).toEqual({ bal: 10 });
  });

  it("track plays are the inner loop and Repeat Playlist the outer loop (interleaved)", () => {
    const order = plays(simulate({ playlist: [balance, dynamic], targets: { bal: 3, dyn: 2 }, repeats: 2 }));
    expect(order).toEqual(["bal", "dyn", "bal", "dyn", "bal", "bal", "dyn", "bal", "dyn", "bal"]);
  });

  it("never plays an excluded track, even with plays left", () => {
    const order = plays(simulate({ targets: { bal: 2, dyn: 3, com: 2 }, hidden: new Set(["dyn"]) }));
    expect(order).toEqual(["bal", "com", "bal", "com"]);
  });

  it("2/3. multi-play tracks play in playlist passes, not back-to-back", () => {
    const order = plays(simulate({ targets: { bal: 3, dyn: 3, com: 2 } }));
    expect(order).toEqual(["bal", "dyn", "com", "bal", "dyn", "com", "bal", "dyn"]);
  });

  it("4. skips excluded tracks", () => {
    const order = plays(simulate({ targets: { bal: 2 }, hidden: new Set(["dyn"]) }));
    expect(order).toEqual(["bal", "com", "bal"]);
  });

  it("4b. hidden tracks between multi-play tracks: 1, 3, 1, 3, 1, 3", () => {
    const four = { id: "four", title: "Four", url: "blob:four" };
    const order = plays(
      simulate({
        playlist: [balance, dynamic, combined, four],
        targets: { bal: 3, dyn: 3, com: 3, four: 3 },
        hidden: new Set(["dyn", "four"]),
      }),
    );
    expect(order).toEqual(["bal", "com", "bal", "com", "bal", "com"]);
  });

  it("5. returns a re-included incomplete track to the queue in playlist order", () => {
    const hidden = new Set(["dyn"]);
    const order = plays(
      simulate({
        hidden,
        targets: { bal: 2 },
        onEnded: ({ playCount }) => {
          if (playCount === 1) hidden.delete("dyn");
        },
      }),
    );
    expect(order).toEqual(["bal", "dyn", "com", "bal"]);
  });

  it("6. never replays a completed track in the same cycle", () => {
    const order = plays(simulate({ targets: { bal: 2, dyn: 1, com: 1 } }));
    expect(order.filter((id) => id === "bal")).toHaveLength(2);
    expect(order).toEqual(["bal", "dyn", "com", "bal"]);
  });

  it("7/8. whole-playlist repeat resets progress but keeps targets (3 plays x 2 rounds = 6)", () => {
    const order = plays(simulate({ targets: { bal: 3 }, repeats: 2 }));
    expect(order).toEqual(["bal", "dyn", "com", "bal", "bal", "bal", "dyn", "com", "bal", "bal"]);
    expect(order.filter((id) => id === "bal")).toHaveLength(6);
  });

  it("8. a single 1-play track with repeat 3 matches the old single-track repeat", () => {
    expect(plays(simulate({ playlist: [balance], repeats: 3 }))).toEqual(["bal", "bal", "bal"]);
  });

  it("back-to-back doubles each track's plays", () => {
    expect(plays(simulate({ targets: { bal: 2 }, backToBack: true }))).toEqual([
      "bal", "bal", "dyn", "dyn", "com", "com", "bal", "bal",
    ]);
  });

  it("9. reset clears progress without changing targets or inclusion", () => {
    const targets = { bal: 3 };
    const hidden = new Set(["com"]);
    const progressed: TrackCyclePlays = { bal: 3, dyn: 1 };
    const reset: TrackCyclePlays = {};
    expect(getTrackSessionConfig("bal", targets, progressed, hidden).completed).toBe(true);
    expect(getTrackSessionConfig("bal", targets, reset, hidden)).toEqual({
      targetPlays: 3,
      completedPlays: 0,
      included: true,
      completed: false,
    });
    expect(getTrackSessionConfig("com", targets, reset, hidden).included).toBe(false);
    expect(findFirstPlayableIndex(routines, hidden, targets, reset, false)).toBe(0);
  });

  it("10. main and fullscreen render the same snapshot from one state", () => {
    const state = { ...initialPlaybackViewState, currentIndex: 1, isPlaying: true, currentTime: 12, duration: 60 };
    const main = selectNowPlaying(state, routines, "main");
    expect(selectNowPlaying(state, routines, "fullscreen")).toEqual(main);
    expect(selectNowPlaying(state, routines, "coach")).toEqual(main);
    const label = getPlayProgressLabel(1, 3);
    expect(label).toBe("Play 2 of 3");
  });

  it("11. duplicate ended events (view switch / re-render) count once", () => {
    const guard = createPlayEndGuard();
    expect(guard.consume()).toBe(true);
    expect(guard.consume()).toBe(false);
    expect(guard.consume()).toBe(false);
    guard.arm();
    expect(guard.consume()).toBe(true);
  });

  it("12. runs exactly one gap between consecutive plays, including repeats", () => {
    const steps = simulate({ targets: { bal: 3 } });
    for (let i = 1; i < steps.length; i++) {
      expect(steps[i].type).not.toBe(steps[i - 1].type);
    }
    expect(steps.filter((s) => s.type === "gap")).toHaveLength(plays(steps).length - 1);
  });

  it("13. settings follow track ids through reorder and removal", () => {
    const targets = { bal: 3, dyn: 2 };
    const reordered = [combined, dynamic, balance];
    expect(plays(simulate({ playlist: reordered, targets }))).toEqual(["com", "dyn", "bal", "dyn", "bal", "bal"]);
    const pruned = pruneToTrackIds(targets, ["dyn", "com"]);
    expect(pruned).toEqual({ dyn: 2 });
    expect(getTargetPlays(pruned, "com")).toBe(1);
    const same = { dyn: 2 };
    expect(pruneToTrackIds(same, ["dyn"])).toBe(same);
  });

  it("14. an all-excluded playlist has nothing to start", () => {
    const hidden = new Set(routines.map((t) => t.id));
    expect(findFirstPlayableIndex(routines, hidden, {}, {}, false)).toBe(-1);
    expect(simulate({ hidden })).toEqual([]);
  });

  it("15. plays through offline (local blob URLs, no network)", () => {
    expect(routines.every((t) => t.url?.startsWith("blob:"))).toBe(true);
    expect(plays(simulate({ targets: { dyn: 2 } }))).toEqual(["bal", "dyn", "com", "dyn"]);
  });

  it("lowering the target below completed plays finishes after the current play", () => {
    const { decision, cyclePlays } = resolveTrackEnd({
      playlist: routines,
      currentIndex: 0,
      hiddenTrackIds: new Set(),
      playlistRound: 1,
      playlistRepeats: 1,
      backToBack: false,
      autoplayNext: true,
      targets: { bal: 1 },
      cyclePlays: { bal: 2 },
    });
    expect(decision).toEqual({ type: "play", index: 1, nextRound: 1 });
    expect(cyclePlays.bal).toBe(3);
  });

  it("Next abandons remaining plays and skips completed tracks", () => {
    const { decision } = resolveSkipForward({
      playlist: routines,
      currentIndex: 0,
      hiddenTrackIds: new Set(),
      playlistRound: 1,
      playlistRepeats: 1,
      backToBack: false,
      targets: { bal: 3 },
      cyclePlays: { bal: 1, dyn: 1 },
    });
    expect(decision).toEqual({ type: "play", index: 2, nextRound: 1 });
  });

  it("Next past the last track starts a fresh round", () => {
    const { decision, cyclePlays } = resolveSkipForward({
      playlist: routines,
      currentIndex: 2,
      hiddenTrackIds: new Set(),
      playlistRound: 1,
      playlistRepeats: 2,
      backToBack: false,
      targets: {},
      cyclePlays: { bal: 1, dyn: 1 },
    });
    expect(decision).toEqual({ type: "play", index: 0, nextRound: 2 });
    expect(cyclePlays).toEqual({});
  });

  it("Previous clears the destination track's progress", () => {
    expect(clearCompletedPlays({ bal: 3, dyn: 1 }, "bal")).toEqual({ dyn: 1 });
  });

  it("expands the native queue per play without duplicating files", () => {
    const { entries, playlistIndexes } = expandForNativeQueue(routines, new Set(["dyn"]), { bal: 2 });
    expect(entries.map((t) => t.id)).toEqual(["bal", "com", "bal"]);
    expect(playlistIndexes).toEqual([0, 2, 0]);
    expect(entries[0]).toBe(entries[2]);
  });
});

describe("Up Next row status", () => {
  const base = { included: true, isCurrent: false, hasAudio: true, hasError: false, completedPlays: 0, effectiveTarget: 3 };

  it("shows progress for the current track", () => {
    expect(getTrackRowStatus({ ...base, isCurrent: true })).toEqual({ kind: "current", label: "1 of 3" });
    expect(getTrackRowStatus({ ...base, isCurrent: true, completedPlays: 1 })).toEqual({ kind: "current", label: "2 of 3" });
    expect(getTrackRowStatus({ ...base, isCurrent: true, effectiveTarget: 1 })).toEqual({ kind: "current", label: "Current" });
  });

  it("marks complete, upcoming and partially played tracks", () => {
    expect(getTrackRowStatus({ ...base, completedPlays: 3 }).kind).toBe("complete");
    expect(getTrackRowStatus(base)).toEqual({ kind: "upcoming", label: "Upcoming" });
    expect(getTrackRowStatus({ ...base, completedPlays: 1 }).label).toBe("Upcoming · 1 of 3 done");
  });

  it("an explicit exclusion wins over every other state", () => {
    expect(getTrackRowStatus({ ...base, included: false, isCurrent: true, hasError: true }).kind).toBe("excluded");
  });

  it("reports missing audio and errors", () => {
    expect(getTrackRowStatus({ ...base, hasAudio: false }).kind).toBe("missing-audio");
    expect(getTrackRowStatus({ ...base, hasError: true, isCurrent: true }).kind).toBe("error");
  });
});
