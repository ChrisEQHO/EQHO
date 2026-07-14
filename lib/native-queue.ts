// Materialization pipeline: turn in-memory audio (File/Blob from IndexedDB or a
// blob: URL) into real on-disk files the native AVFoundation engine can play.
//
// WHY: AVFoundation cannot open blob:/data:/object URLs — those only exist inside
// the WKWebView. For the native plugin to keep advancing tracks while the screen
// is locked, each upcoming track must be a real file:// path in the app container.
// We write tracks to Directory.Cache (safe to be evicted; re-materialized on demand)
// and hand the file:// URIs to the plugin.

import { Filesystem, Directory } from "@capacitor/filesystem";
import type { EqhoQueueTrack } from "eqho-audio";

const CACHE_SUBDIR = "eqho-queue";

// key (track id) -> file:// uri already written this session, so we never rewrite
// the same track's bytes twice.
const materializedCache = new Map<string, string>();

const extFromName = (name: string): string => {
  const m = /\.([a-zA-Z0-9]+)$/.exec(name || "");
  return (m?.[1] || "mp3").toLowerCase();
};

// Read a Blob/File as a base64 string (no data: prefix), which is what
// Filesystem.writeFile expects for binary data.
const blobToBase64 = (blob: Blob): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(reader.error);
    reader.onload = () => {
      const result = reader.result as string;
      const comma = result.indexOf(",");
      resolve(comma >= 0 ? result.slice(comma + 1) : result);
    };
    reader.readAsDataURL(blob);
  });

/**
 * Write one track's audio to the Filesystem cache and return its file:// URI.
 * Cached by `key` for the session. Returns null if the bytes can't be written.
 */
export const materializeTrackFile = async (
  key: string,
  file: Blob,
  fileName: string,
): Promise<string | null> => {
  const cached = materializedCache.get(key);
  if (cached) return cached;

  try {
    const ext = extFromName(fileName);
    const path = `${CACHE_SUBDIR}/${key}.${ext}`;
    const base64 = await blobToBase64(file);
    await Filesystem.writeFile({
      path,
      data: base64,
      directory: Directory.Cache,
      recursive: true,
    });
    const { uri } = await Filesystem.getUri({ path, directory: Directory.Cache });
    materializedCache.set(key, uri);
    return uri;
  } catch (err) {
    console.log("[v0] materializeTrackFile failed", fileName, err);
    return null;
  }
};

export interface MaterializeInput {
  id: string;
  title: string;
  fileName: string;
  file?: Blob;
}

/**
 * Materialize an ordered list of tracks into native queue items. Tracks whose
 * audio can't be resolved/written are dropped (with a log) so the native queue
 * only ever contains playable file:// paths.
 */
export const buildNativeQueue = async (
  tracks: MaterializeInput[],
): Promise<EqhoQueueTrack[]> => {
  const out: EqhoQueueTrack[] = [];
  for (const t of tracks) {
    if (!t.file) {
      console.log("[v0] buildNativeQueue: skipping track without audio", t.title);
      continue;
    }
    const path = await materializeTrackFile(t.id, t.file, t.fileName);
    if (path) out.push({ id: t.id, title: t.title, path });
  }
  return out;
};

// Remove all cached queue files (call when clearing the session/library).
export const clearMaterializedQueue = async (): Promise<void> => {
  materializedCache.clear();
  try {
    await Filesystem.rmdir({
      path: CACHE_SUBDIR,
      directory: Directory.Cache,
      recursive: true,
    });
  } catch {
    /* nothing cached yet */
  }
};
