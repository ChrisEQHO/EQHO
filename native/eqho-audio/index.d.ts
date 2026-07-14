import type { PluginListenerHandle } from '@capacitor/core';

/** One item in the native playback queue. `path` MUST be a native-accessible
 *  file path (a `file://` URL or an absolute container path). blob:/data:/https:
 *  URLs are NOT playable by AVFoundation. */
export interface EqhoQueueTrack {
  /** Stable track id (matches the JS Track.id) so events can be correlated. */
  id: string;
  /** Display title for the lock-screen Now Playing info. */
  title: string;
  /** file:// URL or absolute path to a decoded audio file on disk. */
  path: string;
}

export interface EqhoConfigureOptions {
  /** Seconds of silence between tracks. */
  gapSeconds?: number;
  /** How many times the whole playlist repeats (1 = play once). */
  repeats?: number;
  /** When true, each track plays twice in a row before advancing. */
  backToBack?: boolean;
  /** When true, play a countdown beep during the final gap seconds. */
  countdownBeeps?: boolean;
  /** How many of the final gap seconds should beep (e.g. 3 => 3,2,1). */
  countdownSeconds?: number;
  /** Output volume, 0..1. */
  volume?: number;
}

export interface EqhoSetQueueOptions {
  tracks: EqhoQueueTrack[];
  /** Index to start playback from (default 0). */
  startIndex?: number;
}

export interface EqhoState {
  index: number;
  isPlaying: boolean;
  isGap: boolean;
  gapRemaining: number;
  position: number;
  duration: number;
  round: number;
}

export interface TrackChangedEvent {
  index: number;
  id: string;
  title: string;
  duration: number;
  round: number;
}
export interface GapStartedEvent {
  seconds: number;
  nextIndex: number;
  nextId: string;
  nextTitle: string;
}
export interface GapTickEvent { remaining: number }
export interface PositionEvent { position: number; duration: number }
export interface PlayStateEvent { isPlaying: boolean }
export interface SessionFinishedEvent { reason: 'completed' | 'stopped' }
export interface ErrorEvent { message: string; trackId?: string }

export interface EqhoAudioPlugin {
  configure(options: EqhoConfigureOptions): Promise<void>;
  setQueue(options: EqhoSetQueueOptions): Promise<void>;
  play(): Promise<void>;
  pause(): Promise<void>;
  resume(): Promise<void>;
  stop(): Promise<void>;
  skipNext(): Promise<void>;
  skipPrevious(): Promise<void>;
  seek(options: { seconds: number }): Promise<void>;
  setVolume(options: { volume: number }): Promise<void>;
  getState(): Promise<EqhoState>;

  addListener(eventName: 'trackChanged', cb: (e: TrackChangedEvent) => void): Promise<PluginListenerHandle>;
  addListener(eventName: 'gapStarted', cb: (e: GapStartedEvent) => void): Promise<PluginListenerHandle>;
  addListener(eventName: 'gapTick', cb: (e: GapTickEvent) => void): Promise<PluginListenerHandle>;
  addListener(eventName: 'gapEnded', cb: () => void): Promise<PluginListenerHandle>;
  addListener(eventName: 'positionUpdate', cb: (e: PositionEvent) => void): Promise<PluginListenerHandle>;
  addListener(eventName: 'playStateChanged', cb: (e: PlayStateEvent) => void): Promise<PluginListenerHandle>;
  addListener(eventName: 'sessionFinished', cb: (e: SessionFinishedEvent) => void): Promise<PluginListenerHandle>;
  addListener(eventName: 'remoteCommand', cb: (e: { command: string }) => void): Promise<PluginListenerHandle>;
  addListener(eventName: 'error', cb: (e: ErrorEvent) => void): Promise<PluginListenerHandle>;
  removeAllListeners(): Promise<void>;
}

export declare const EqhoAudio: EqhoAudioPlugin;
