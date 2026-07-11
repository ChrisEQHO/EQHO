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
