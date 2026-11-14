import { describe, expect, it } from "vitest";
import {
  createLegacyMatcher,
  dedupeByContent,
  formatUpdateResult,
  hashAudioFile,
  isSupportedAudioFile,
  type ExistingTrackIdentity,
} from "./playlist-update";

const existing = (n: number): ExistingTrackIdentity[] =>
  Array.from({ length: n }, (_, i) => ({ hash: `h${i}`, fileName: `t${i}.mp3`, durationSeconds: 120 }));

describe("dedupeByContent", () => {
  it("adds only the three new files when 7 existing + 3 new are selected", () => {
    const selected = [...existing(7), { hash: "n1" }, { hash: "n2" }, { hash: "n3" }].map((t, i) => ({
      hash: t.hash as string,
      fileName: `f${i}.mp3`,
    }));
    const r = dedupeByContent(existing(7), selected);
    expect(r.candidates).toEqual([7, 8, 9]);
    expect(r.alreadyInPlaylist).toBe(7);
  });

  it("adds nothing when the same selection is repeated after adding", () => {
    const now = [...existing(7), ...["n1", "n2", "n3"].map((hash) => ({ hash, fileName: "x", durationSeconds: 1 }))];
    const r = dedupeByContent(now, now.map((t) => ({ hash: t.hash as string, fileName: t.fileName })));
    expect(r.candidates).toEqual([]);
    expect(r.alreadyInPlaylist).toBe(10);
  });

  it("treats two different files sharing a filename as different tracks", () => {
    const r = dedupeByContent(
      [{ hash: "a", fileName: "music.mp3", durationSeconds: 100 }],
      [{ hash: "b", fileName: "music.mp3" }],
    );
    expect(r.candidates).toEqual([0]);
  });

  it("dedupes repeated content within one selection", () => {
    const r = dedupeByContent([], [{ hash: "x", fileName: "a.mp3" }, { hash: "x", fileName: "copy.mp3" }]);
    expect(r.candidates).toEqual([0]);
    expect(r.duplicatesInSelection).toBe(1);
  });
});

describe("createLegacyMatcher", () => {
  it("matches an unreadable track by name + duration, once", () => {
    const match = createLegacyMatcher([{ hash: null, fileName: "music.mp3", durationSeconds: 150 }]);
    expect(match("music.mp3", 150)).toBe(true);
    expect(match("music.mp3", 150)).toBe(false);
  });

  it("does not match on filename alone", () => {
    const match = createLegacyMatcher([{ hash: null, fileName: "music.mp3", durationSeconds: 150 }]);
    expect(match("music.mp3", 95)).toBe(false);
  });

  it("ignores tracks whose content hash is known", () => {
    const match = createLegacyMatcher([{ hash: "h", fileName: "music.mp3", durationSeconds: 150 }]);
    expect(match("music.mp3", 150)).toBe(false);
  });
});

describe("helpers", () => {
  it("formats the result", () => {
    expect(formatUpdateResult(3, 7, 0)).toBe("3 tracks added · 7 already in playlist");
    expect(formatUpdateResult(1, 0, 2)).toBe("1 track added · 0 already in playlist · 2 couldn't be added");
  });

  it("accepts the same audio formats as folder import", () => {
    expect(isSupportedAudioFile({ name: "a.MP3", type: "" })).toBe(true);
    expect(isSupportedAudioFile({ name: "a.flac", type: "audio/flac" })).toBe(true);
    expect(isSupportedAudioFile({ name: "notes.txt", type: "text/plain" })).toBe(false);
  });

  it("hashes identical bytes identically and different bytes differently", async () => {
    const a = await hashAudioFile(new Blob([new Uint8Array([1, 2, 3])]));
    const b = await hashAudioFile(new Blob([new Uint8Array([1, 2, 3])]));
    const c = await hashAudioFile(new Blob([new Uint8Array([1, 2, 4])]));
    expect(a).toBe(b);
    expect(a).not.toBe(c);
  });
});
