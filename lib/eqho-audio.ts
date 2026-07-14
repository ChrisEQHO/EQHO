// App-side bridge to the native EQHO audio-queue plugin.
//
// The native plugin (native/eqho-audio) owns locked-screen playback: it plays a
// queue of on-disk files with gaps, countdown beeps, repeats and back-to-back,
// and keeps advancing while the iPhone/iPad is LOCKED (which the JS <audio> +
// setInterval path cannot do, because WKWebView suspends JS timers when locked).
//
// On web/desktop this module is inert: `nativeQueueAvailable()` returns false and
// callers fall back to the existing JavaScript sequencer.

import { EqhoAudio } from "eqho-audio";
import type {
  EqhoConfigureOptions,
  EqhoQueueTrack,
  TrackChangedEvent,
  GapStartedEvent,
  GapTickEvent,
  PositionEvent,
  PlayStateEvent,
  SessionFinishedEvent,
  ErrorEvent as EqhoErrorEvent,
} from "eqho-audio";
import { isNativePlatform } from "./native-audio";

export type {
  EqhoConfigureOptions,
  EqhoQueueTrack,
  TrackChangedEvent,
  GapStartedEvent,
  GapTickEvent,
  PositionEvent,
  PlayStateEvent,
  SessionFinishedEvent,
};

// True only inside the Capacitor native shell where the plugin is registered.
// Everything else (web preview, desktop wrapper, SSR) uses the JS sequencer.
export const nativeQueueAvailable = (): boolean => {
  if (!isNativePlatform()) return false;
  try {
    return typeof (EqhoAudio as unknown as { configure?: unknown })?.configure === "function";
  } catch {
    return false;
  }
};

export { EqhoAudio };

// Small typed helpers so callers don't repeat the event-name string literals.
export const nativeQueue = {
  configure: (opts: EqhoConfigureOptions) => EqhoAudio.configure(opts),
  setQueue: (tracks: EqhoQueueTrack[], startIndex = 0) => EqhoAudio.setQueue({ tracks, startIndex }),
  play: () => EqhoAudio.play(),
  pause: () => EqhoAudio.pause(),
  resume: () => EqhoAudio.resume(),
  stop: () => EqhoAudio.stop(),
  skipNext: () => EqhoAudio.skipNext(),
  skipPrevious: () => EqhoAudio.skipPrevious(),
  seek: (seconds: number) => EqhoAudio.seek({ seconds }),
  setVolume: (volume: number) => EqhoAudio.setVolume({ volume }),
  getState: () => EqhoAudio.getState(),
  onTrackChanged: (cb: (e: TrackChangedEvent) => void) => EqhoAudio.addListener("trackChanged", cb),
  onGapStarted: (cb: (e: GapStartedEvent) => void) => EqhoAudio.addListener("gapStarted", cb),
  onGapTick: (cb: (e: GapTickEvent) => void) => EqhoAudio.addListener("gapTick", cb),
  onGapEnded: (cb: () => void) => EqhoAudio.addListener("gapEnded", cb),
  onPosition: (cb: (e: PositionEvent) => void) => EqhoAudio.addListener("position", cb),
  onPlayStateChanged: (cb: (e: PlayStateEvent) => void) => EqhoAudio.addListener("playStateChanged", cb),
  onSessionFinished: (cb: (e: SessionFinishedEvent) => void) => EqhoAudio.addListener("sessionFinished", cb),
  onRemoteCommand: (cb: (e: { command: string }) => void) => EqhoAudio.addListener("remoteCommand", cb),
  onError: (cb: (e: EqhoErrorEvent) => void) => EqhoAudio.addListener("error", cb),
  removeAllListeners: () => EqhoAudio.removeAllListeners(),
};
