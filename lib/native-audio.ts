// Native (Capacitor) audio playback helpers.
//
// WHY THIS EXISTS:
// On the iOS/iPadOS Capacitor build the app runs inside a WKWebView. Diagnostics
// on real devices proved that assigning a `data:` (base64) URL to an <audio>
// element FAILS on iOS with `NotSupportedError` / `MediaError` code 4
// (readyState 0, networkState 3). WKWebView simply refuses to decode inline
// base64 audio.
//
// The sources that DO play reliably everywhere (iPhone app, iPad app, mobile
// Safari, desktop) are:
//   • blob:      URLs from URL.createObjectURL(File | Blob)
//   • https:     URLs (Cloudflare R2 / signed download links)
//   • file: / capacitor:  URLs from the Capacitor Filesystem
//
// So the rule is: NEVER hand a data: URL to <audio>. If we ever encounter one
// (e.g. a track saved by an older app version that stored base64), we convert it
// to a real Blob and create a blob: object URL from it, then play that instead.

// True when running inside a Capacitor native shell (iOS/Android app), false in
// a normal web browser.
export const isNativePlatform = (): boolean => {
  if (typeof window === "undefined") return false;
  const cap = (window as unknown as { Capacitor?: { isNativePlatform?: () => boolean; isNative?: boolean } }).Capacitor;
  if (!cap) return false;
  try {
    if (typeof cap.isNativePlatform === "function") return cap.isNativePlatform();
  } catch {
    /* ignore */
  }
  return !!cap.isNative;
};

// Cache of original (data:) URL -> converted blob: URL, so a given data URL is
// only ever fetched/converted once and can be reused synchronously afterwards.
// The blob URLs live for the lifetime of the page (tracks that reference them
// stay loaded), so we intentionally do NOT revoke them here.
const dataUrlToBlobUrl = new Map<string, string>();

// Convert a `data:` audio URL into a real Blob object URL that iOS WKWebView can
// play. `fetch()` on a data: URL yields a Blob whose `type` is taken from the
// data URL's own MIME (e.g. audio/mpeg, audio/mp4, audio/wav), so the rebuilt
// Blob already carries the correct MIME type — no manual mapping required.
// Non-data URLs (blob:/https:/file:/capacitor:) are returned unchanged.
export const toPlayableUrl = async (url: string): Promise<string> => {
  if (!url || !url.startsWith("data:")) return url;
  const cached = dataUrlToBlobUrl.get(url);
  if (cached) return cached;
  const blob = await fetch(url).then((res) => res.blob());
  const blobUrl = URL.createObjectURL(blob);
  dataUrlToBlobUrl.set(url, blobUrl);
  return blobUrl;
};

// Synchronous lookup used inside the user's tap gesture: returns a
// natively-playable URL immediately when possible.
//   • non-data URL           -> returned unchanged
//   • data URL already cached -> returns the converted blob: URL
//   • data URL not yet cached -> returns null (caller must convert async)
export const peekPlayableUrl = (url: string): string | null => {
  if (!url) return null;
  if (!url.startsWith("data:")) return url;
  return dataUrlToBlobUrl.get(url) ?? null;
};

// ---------------------------------------------------------------------------
// MIME-type correction (the real iOS decode fix)
// ---------------------------------------------------------------------------
// On iOS, files picked from a folder / Files app frequently arrive with an
// EMPTY or "application/octet-stream" File.type. When we later do
// URL.createObjectURL(file), the resulting blob: URL carries that bad MIME, and
// WKWebView refuses to decode it -> MediaError code 4 (readyState 0,
// networkState 3). Desktop/Safari are lenient and sniff the bytes, which is why
// it only breaks in the native build.
//
// Fix: rebuild the Blob with a CORRECT audio MIME (inferred from the file
// extension when the type is missing/generic) and create the object URL from
// that. This is fully synchronous, so it preserves the iOS tap gesture.

// Map a filename extension to the MIME type iOS expects.
export const audioMimeFromName = (name: string): string => {
  const ext = (name.split(".").pop() || "").toLowerCase();
  switch (ext) {
    case "mp3":
      return "audio/mpeg";
    case "m4a":
    case "m4b":
    case "mp4":
    case "aac":
      return "audio/mp4";
    case "wav":
    case "wave":
      return "audio/wav";
    case "aif":
    case "aiff":
      return "audio/aiff";
    case "flac":
      return "audio/flac";
    case "ogg":
    case "oga":
      return "audio/ogg";
    case "opus":
      return "audio/opus";
    case "caf":
      return "audio/x-caf";
    default:
      return "";
  }
};

// True when a File/Blob type is unusable for <audio> and must be corrected.
export const needsMimeFix = (type: string | undefined | null): boolean => {
  if (!type) return true;
  const t = type.toLowerCase();
  return t === "application/octet-stream" || !t.startsWith("audio");
};

// Cache: original track url (blob:/https:/etc) -> corrected blob: URL, so we
// only rebuild each track's playable URL once. Not revoked for the page's life.
const correctedUrlCache = new Map<string, string>();

// Build a blob: object URL guaranteed to carry a correct audio MIME type from a
// File. Recreates the Blob with the inferred MIME when the File's own type is
// missing or generic. `key` (usually the track's original url) dedupes the work.
// Returns the corrected URL plus the resolved type/size for diagnostics.
export const buildPlayableUrlFromFile = (
  file: File,
  key: string,
): { url: string; type: string; size: number; corrected: boolean } => {
  const cachedUrl = key ? correctedUrlCache.get(key) : undefined;
  let type = file.type;
  let corrected = false;
  if (needsMimeFix(type)) {
    type = audioMimeFromName(file.name) || "audio/mpeg";
    corrected = true;
  }
  if (cachedUrl) {
    return { url: cachedUrl, type, size: file.size, corrected };
  }
  // new Blob([file], { type }) copies the bytes by reference and stamps the new
  // MIME regardless of the source File's original (bad) type.
  const blob = new Blob([file], { type });
  const url = URL.createObjectURL(blob);
  if (key) correctedUrlCache.set(key, url);
  return { url, type, size: blob.size, corrected };
};

// Read the first N bytes of a File/Blob as a hex string (for validating that a
// failed track actually contains real audio, e.g. "ID3" or an MP4 "ftyp" box).
export const firstBytesHex = async (blob: Blob, n = 32): Promise<string> => {
  const slice = blob.slice(0, n);
  const buf = await slice.arrayBuffer();
  const bytes = new Uint8Array(buf);
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join(" ");
};
