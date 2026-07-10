// Native (Capacitor) audio playback helpers.
//
// WHY THIS EXISTS:
// On the iOS/iPadOS Capacitor build the app runs inside a WKWebView served from
// the `capacitor://` scheme. WKWebView cannot reliably play `blob:` object URLs
// in an <audio> element — the media loads via range requests that the custom
// scheme handler does not satisfy, so `audio.play()` rejects (or the element
// stalls) and the play/pause buttons appear completely dead on the phone even
// though everything works in a normal browser.
//
// The reliable, documented workaround is to feed the <audio> element a `data:`
// URL (base64) built from the track's underlying File/Blob instead of a blob URL.
// We only do this on native platforms; in the browser blob URLs are kept because
// they are far more memory-efficient.

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

// Convert a File/Blob into a base64 `data:` URL that WKWebView can play.
export const fileToDataUrl = (file: Blob): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });

// A tiny, always-playable silent WAV as a `data:` URL. Playing this on a user
// tap "unlocks" audio on iOS: once any gesture-initiated playback succeeds,
// WKWebView grants the document media-playback permission, so subsequent
// programmatic play() calls (including ones that resolve a data URL a few ms
// later) are allowed. Built lazily so it never runs during SSR.
let cachedSilentWav: string | null = null;
export const getSilentWavDataUrl = (): string => {
  if (cachedSilentWav) return cachedSilentWav;
  const sampleRate = 8000;
  const numSamples = 16; // ~2ms of silence
  const dataSize = numSamples * 2; // 16-bit mono
  const buffer = new ArrayBuffer(44 + dataSize);
  const view = new DataView(buffer);
  const writeString = (offset: number, str: string) => {
    for (let i = 0; i < str.length; i++) view.setUint8(offset + i, str.charCodeAt(i));
  };
  writeString(0, "RIFF");
  view.setUint32(4, 36 + dataSize, true);
  writeString(8, "WAVE");
  writeString(12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true); // PCM
  view.setUint16(22, 1, true); // mono
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  writeString(36, "data");
  view.setUint32(40, dataSize, true);
  // sample bytes are already zero (silence)
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
  cachedSilentWav = "data:audio/wav;base64," + btoa(binary);
  return cachedSilentWav;
};
