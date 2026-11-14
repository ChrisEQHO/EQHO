/**
 * Add-only "Update playlist" planning.
 *
 * Identity is the SHA-256 of the audio bytes. Existing tracks whose stored audio
 * can't be resolved fall back to fileName + duration (whole seconds) — filename
 * alone is never treated as a match, because different routines often share a
 * name like "music.mp3".
 */

export const SUPPORTED_AUDIO_ACCEPT = "audio/*,.mp3,.wav,.m4a";

export function isSupportedAudioFile(file: { name: string; type: string }): boolean {
  const name = file.name.toLowerCase();
  return file.type.startsWith("audio/") || name.endsWith(".mp3") || name.endsWith(".wav") || name.endsWith(".m4a");
}

export interface ExistingTrackIdentity {
  /** Content hash, or null when the track's stored audio couldn't be read. */
  hash: string | null;
  fileName: string;
  durationSeconds: number;
}

export interface SelectedFileIdentity {
  hash: string;
  fileName: string;
}

export interface DedupeResult {
  /** Indices (into the selection) of files whose content isn't in the playlist yet. */
  candidates: number[];
  /** Selected files whose content already exists in the playlist. */
  alreadyInPlaylist: number;
  /** Extra copies of the same content inside this selection. */
  duplicatesInSelection: number;
}

/** Phase 1: content-hash matching, before any file is imported. */
export function dedupeByContent(existing: ExistingTrackIdentity[], selected: SelectedFileIdentity[]): DedupeResult {
  const existingHashes = new Set(existing.map((t) => t.hash).filter((h): h is string => !!h));
  const seen = new Set<string>();
  const candidates: number[] = [];
  let alreadyInPlaylist = 0;
  let duplicatesInSelection = 0;

  selected.forEach((file, index) => {
    if (seen.has(file.hash)) {
      duplicatesInSelection++;
      return;
    }
    seen.add(file.hash);
    if (existingHashes.has(file.hash)) {
      alreadyInPlaylist++;
      return;
    }
    candidates.push(index);
  });

  return { candidates, alreadyInPlaylist, duplicatesInSelection };
}

/**
 * Phase 2: once a candidate's duration is known, check it against existing tracks
 * whose bytes were unreadable. Each unresolved track can absorb at most one
 * selected file, so two different files sharing a name can't both be skipped.
 */
export function createLegacyMatcher(existing: ExistingTrackIdentity[]) {
  const unresolved = existing.filter((t) => t.hash === null).map((t) => ({ ...t, used: false }));
  return (fileName: string, durationSeconds: number): boolean => {
    const match = unresolved.find(
      (t) => !t.used && t.fileName === fileName && t.durationSeconds === durationSeconds,
    );
    if (!match) return false;
    match.used = true;
    return true;
  };
}

export function formatUpdateResult(added: number, alreadyInPlaylist: number, failed: number): string {
  const parts = [
    `${added} ${added === 1 ? "track" : "tracks"} added`,
    `${alreadyInPlaylist} already in playlist`,
  ];
  if (failed > 0) parts.push(`${failed} couldn't be added`);
  return parts.join(" · ");
}

export async function hashAudioFile(file: Blob): Promise<string> {
  const subtle = globalThis.crypto?.subtle;
  const bytes = await file.arrayBuffer();
  if (subtle) {
    const digest = await subtle.digest("SHA-256", bytes);
    return Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, "0")).join("");
  }
  // Insecure contexts have no SubtleCrypto: FNV-1a over the bytes plus length.
  const view = new Uint8Array(bytes);
  let h = 0x811c9dc5;
  for (let i = 0; i < view.length; i++) {
    h ^= view[i];
    h = Math.imul(h, 0x01000193);
  }
  return `fnv-${(h >>> 0).toString(16)}-${view.length}`;
}
