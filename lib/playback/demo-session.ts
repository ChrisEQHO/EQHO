import type { SessionTrack } from "./session-machine";

export interface DemoSnapshotTrack {
  id: string;
  name: string;
  durationSeconds: number;
}

export interface DemoSnapshotPlaylist {
  id: string;
  name: string;
  tracks: DemoSnapshotTrack[];
}

/** Public, read-only demo audio stream for a snapshot track id. */
export function demoTrackUrl(trackId: string): string {
  return `/api/demo?action=audio&track=${encodeURIComponent(trackId)}`;
}

/** Validates the /api/demo payload; anything malformed yields no playlists. */
export function parseDemoSnapshot(data: unknown): DemoSnapshotPlaylist[] {
  if (!data || typeof data !== "object") return [];
  const { enabled, playlists } = data as { enabled?: unknown; playlists?: unknown };
  if (!enabled || !Array.isArray(playlists)) return [];
  return playlists
    .filter((p): p is DemoSnapshotPlaylist =>
      !!p && typeof p.id === "string" && typeof p.name === "string" && Array.isArray(p.tracks))
    .map((p) => ({
      id: p.id,
      name: p.name,
      tracks: p.tracks.filter(
        (t): t is DemoSnapshotTrack =>
          !!t && typeof t.id === "string" && typeof t.name === "string",
      ).map((t) => ({ ...t, durationSeconds: Number(t.durationSeconds) || 0 })),
    }));
}

/** Demo tracks feed the same session model as real playlists. */
export function toDemoSessionTracks(playlist: DemoSnapshotPlaylist): SessionTrack[] {
  return playlist.tracks.map((t) => ({ id: t.id, src: demoTrackUrl(t.id) }));
}
