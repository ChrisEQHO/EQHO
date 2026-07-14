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

// True ONLY when running inside the Capacitor iOS/iPadOS native app (WKWebView).
// This is the one environment where JavaScript cannot control
// HTMLMediaElement.volume: iOS routes playback loudness to the physical/system
// volume buttons, so an in-app percentage slider is dishonest there. We use
// Capacitor's own platform string ("ios") rather than user-agent sniffing, and
// require the native shell so mobile Safari (a normal browser) is unaffected.
export const isNativeIOS = (): boolean => {
  if (typeof window === "undefined") return false;
  const cap = (window as unknown as {
    Capacitor?: { getPlatform?: () => string; isNativePlatform?: () => boolean; isNative?: boolean };
  }).Capacitor;
  if (!cap) return false;
  try {
    const platform = typeof cap.getPlatform === "function" ? cap.getPlatform() : "";
    const native = typeof cap.isNativePlatform === "function" ? cap.isNativePlatform() : !!cap.isNative;
    return native && platform === "ios";
  } catch {
    return false;
  }
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

// ---------------------------------------------------------------------------
// Byte-level format detection (magic numbers) — the definitive iOS fix
// ---------------------------------------------------------------------------
// Extension/stored-MIME correction is not enough: a file may have the wrong
// extension, or WKWebView may distrust a MIME that doesn't match the bytes. The
// only reliable signal is the actual file header. We sniff the first bytes and
// assign the MIME iOS expects for the REAL format.

export type DetectedFormat =
  | "mp3" | "mp4" | "wav" | "aiff" | "flac" | "ogg" | "opus" | "caf" | "unknown";

const ascii = (bytes: Uint8Array, start: number, len: number): string => {
  let s = "";
  for (let i = start; i < start + len && i < bytes.length; i++) {
    s += String.fromCharCode(bytes[i]);
  }
  return s;
};

// Inspect magic numbers and return the true container/codec format.
export const detectAudioFormat = (bytes: Uint8Array): DetectedFormat => {
  if (bytes.length < 4) return "unknown";
  // MP3: "ID3" tag, or an MPEG audio frame sync (0xFF followed by 0xE0-0xFF).
  if (ascii(bytes, 0, 3) === "ID3") return "mp3";
  if (bytes[0] === 0xff && (bytes[1] & 0xe0) === 0xe0) return "mp3";
  // WAV: "RIFF"...."WAVE"
  if (ascii(bytes, 0, 4) === "RIFF" && ascii(bytes, 8, 4) === "WAVE") return "wav";
  // AIFF: "FORM"...."AIFF"/"AIFC"
  if (ascii(bytes, 0, 4) === "FORM") {
    const form = ascii(bytes, 8, 4);
    if (form === "AIFF" || form === "AIFC") return "aiff";
  }
  // MP4 / M4A / AAC-in-mp4: an "ftyp" box near the start (offset 4).
  if (ascii(bytes, 4, 4) === "ftyp") return "mp4";
  // FLAC: "fLaC"
  if (ascii(bytes, 0, 4) === "fLaC") return "flac";
  // Ogg (Vorbis/Opus): "OggS"
  if (ascii(bytes, 0, 4) === "OggS") return "ogg";
  // CAF (Core Audio Format): "caff"
  if (ascii(bytes, 0, 4) === "caff") return "caf";
  return "unknown";
};

// The MIME type iOS WKWebView wants for each detected format.
export const mimeForFormat = (fmt: DetectedFormat): string => {
  switch (fmt) {
    case "mp3": return "audio/mpeg";
    case "mp4": return "audio/mp4";
    case "wav": return "audio/wav";
    case "aiff": return "audio/aiff";
    case "flac": return "audio/flac";
    case "ogg": return "audio/ogg";
    case "opus": return "audio/opus";
    case "caf": return "audio/x-caf";
    default: return "";
  }
};

// User-facing message shown whenever a "track" turns out to be an HTML page (the
// classic symptom of a relative URL resolving to index.html) or otherwise not
// real audio. Thrown as an Error message so callers can surface it directly.
export const NOT_AUDIO_MESSAGE =
  "Audio file could not be found. Please re-download or re-upload this track.";

// True when the given bytes are an HTML/XML document rather than audio. The
// index.html SPA fallback starts with "<!DOCTYPE html>", "<html", or (after
// optional whitespace/BOM) a "<" tag character — never a valid audio header.
export const looksLikeHtmlOrText = (bytes: Uint8Array): boolean => {
  if (!bytes || bytes.length === 0) return false;
  let i = 0;
  // Skip a UTF-8 BOM and leading ASCII whitespace.
  if (bytes.length >= 3 && bytes[0] === 0xef && bytes[1] === 0xbb && bytes[2] === 0xbf) i = 3;
  while (i < bytes.length && (bytes[i] === 0x20 || bytes[i] === 0x09 || bytes[i] === 0x0a || bytes[i] === 0x0d)) i++;
  const head = ascii(bytes, i, 14).toLowerCase();
  return (
    head.startsWith("<!doctype") ||
    head.startsWith("<html") ||
    head.startsWith("<?xml") ||
    head.startsWith("<head") ||
    head.startsWith("<body") ||
    head.startsWith("<!--")
  );
};

// True when a MIME type string indicates HTML/text rather than audio.
export const isHtmlOrTextMime = (type: string | undefined | null): boolean => {
  if (!type) return false;
  const t = type.toLowerCase();
  return t.includes("text/html") || t.includes("application/xhtml") || t.startsWith("text/");
};

// Rich result describing exactly what we did, for on-device diagnostics.
export interface PlayableBuildResult {
  url: string;
  filename: string;
  ext: string;
  originalMime: string;
  detectedFormat: DetectedFormat;
  correctedMime: string;
  size: number;
  first16Hex: string;
  corrected: boolean;
}

// Cache the full diagnostic result so loadAndPlay can reuse a sniffed URL
// synchronously inside the tap gesture on subsequent plays of the same track.
const playableBuildCache = new Map<string, PlayableBuildResult>();

// Synchronous peek: returns a previously-built (byte-sniffed) result if we have
// one for this track key, so the play path stays inside the user's tap gesture.
export const peekPlayableBuild = (key: string): PlayableBuildResult | null =>
  (key ? playableBuildCache.get(key) : undefined) ?? null;

// Definitive builder: read the file header, DETECT the real format from bytes,
// choose the correct MIME (byte-detected format wins; falls back to extension,
// then audio/mpeg), rebuild the Blob from a fresh ArrayBuffer with that MIME,
// and create the object URL from the CORRECTED blob. Async because it must read
// bytes; results are cached for synchronous reuse afterwards.
export const buildCorrectedPlayableUrl = async (
  file: File,
  key: string,
): Promise<PlayableBuildResult> => {
  const cached = key ? playableBuildCache.get(key) : undefined;
  if (cached) return cached;

  const filename = file.name || "(unknown)";
  const ext = (filename.split(".").pop() || "").toLowerCase();
  const originalMime = file.type || "(empty)";

  // Read the whole file once so we can both sniff and rebuild without re-reading.
  const buffer = await file.arrayBuffer();
  const head = new Uint8Array(buffer.slice(0, 16));
  const first16Hex = Array.from(head)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join(" ");

  const sniff = new Uint8Array(buffer.slice(0, 32));

  // HARD GATE: never treat an HTML page or a text/html file as audio. This is
  // the index.html fallback that a relative/broken URL resolves to. We must NOT
  // "correct" text/html into audio/mpeg — changing the label does not turn HTML
  // into MP3. Reject loudly so the caller can prompt a re-download/re-upload.
  if (looksLikeHtmlOrText(sniff) || isHtmlOrTextMime(originalMime)) {
    console.error(
      `[v0][audio-validate] REJECT non-audio content name="${filename}" originalMime="${originalMime}" size=${buffer.byteLength} first16=${first16Hex}`
    );
    throw new Error(NOT_AUDIO_MESSAGE);
  }

  const detectedFormat = detectAudioFormat(sniff);

  // Pick the MIME: prefer the byte-detected format, then the extension mapping,
  // then a safe default of audio/mpeg (most stored tracks are MP3).
  let correctedMime = mimeForFormat(detectedFormat);
  if (!correctedMime) correctedMime = audioMimeFromName(filename);
  if (!correctedMime) correctedMime = "audio/mpeg";

  const corrected = correctedMime !== originalMime;

  // Rebuild the Blob from a fresh copy of the bytes with the corrected MIME, so
  // the object URL carries a type WKWebView will accept.
  const blob = new Blob([buffer], { type: correctedMime });
  const url = URL.createObjectURL(blob);

  const result: PlayableBuildResult = {
    url,
    filename,
    ext,
    originalMime,
    detectedFormat,
    correctedMime,
    size: blob.size,
    first16Hex,
    corrected,
  };
  if (key) playableBuildCache.set(key, result);
  return result;
};
