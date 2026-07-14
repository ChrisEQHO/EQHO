"use client";

// React integration for the native EQHO audio-queue plugin.
//
// This hook owns the bridge between the native AVFoundation sequencer and the
// app's React state. On web/desktop it is completely inert (`available` is false)
// and callers keep using the existing JavaScript <audio> sequencer.
//
// When active (native shell only), the NATIVE side is the source of truth for
// sequencing: it advances tracks, times gaps, plays countdown beeps and keeps
// running while the device is LOCKED. This hook just:
//   1. materializes the playlist to on-disk files and hands them to the plugin, and
//   2. forwards native events into React state via the supplied callbacks.

import { useCallback, useEffect, useRef, useState } from "react";
import type { PluginListenerHandle } from "@capacitor/core";
import { nativeQueue, nativeQueueAvailable } from "./eqho-audio";
import { buildNativeQueue, clearMaterializedQueue, type MaterializeInput } from "./native-queue";

export interface NativeSessionConfig {
  gapSeconds: number;
  repeats: number;
  backToBack: boolean;
  countdownBeeps: boolean;
  countdownSeconds: number;
  volume: number; // 0..1
}

export interface NativeSessionCallbacks {
  onTrackChanged?: (e: { index: number; id: string; title: string; duration: number; round: number }) => void;
  onGapStarted?: (e: { seconds: number; nextIndex: number; nextId: string; nextTitle: string }) => void;
  onGapTick?: (remaining: number) => void;
  onGapEnded?: () => void;
  onPosition?: (e: { index: number; currentTime: number; duration: number }) => void;
  onPlayStateChanged?: (isPlaying: boolean) => void;
  onSessionFinished?: (reason: string) => void;
  onRemoteCommand?: (command: string) => void;
  onError?: (message: string) => void;
}

export function useNativeSession(callbacks: NativeSessionCallbacks) {
  const available = nativeQueueAvailable();
  const [active, setActive] = useState(false);
  const activeRef = useRef(false);
  const setActiveBoth = (v: boolean) => {
    activeRef.current = v;
    setActive(v);
  };

  // Keep callbacks in a ref so we can register native listeners exactly once
  // without re-subscribing whenever the parent re-renders with new closures.
  const cbRef = useRef(callbacks);
  cbRef.current = callbacks;

  useEffect(() => {
    if (!available) return;
    const handles: PluginListenerHandle[] = [];
    let cancelled = false;

    const register = async () => {
      const add = async (fn: Promise<PluginListenerHandle>) => {
        const h = await fn;
        if (cancelled) {
          h.remove();
        } else {
          handles.push(h);
        }
      };
      await add(nativeQueue.onTrackChanged((e) => cbRef.current.onTrackChanged?.(e)));
      await add(nativeQueue.onGapStarted((e) => cbRef.current.onGapStarted?.(e)));
      await add(nativeQueue.onGapTick((e) => cbRef.current.onGapTick?.(e.remaining)));
      await add(nativeQueue.onGapEnded(() => cbRef.current.onGapEnded?.()));
      await add(nativeQueue.onPosition((e) => cbRef.current.onPosition?.(e)));
      await add(nativeQueue.onPlayStateChanged((e) => cbRef.current.onPlayStateChanged?.(e.isPlaying)));
      await add(
        nativeQueue.onSessionFinished((e) => {
          setActiveBoth(false);
          cbRef.current.onSessionFinished?.(e.reason);
        }),
      );
      await add(nativeQueue.onRemoteCommand((e) => cbRef.current.onRemoteCommand?.(e.command)));
      await add(nativeQueue.onError((e) => cbRef.current.onError?.(e.message)));
    };

    register().catch((err) => console.log("[v0] native listener registration failed", err));

    return () => {
      cancelled = true;
      handles.forEach((h) => h.remove());
    };
  }, [available]);

  // Start (or restart) a native session from the given ordered tracks. Returns
  // true if native took over, false if it couldn't (caller should fall back to JS).
  const start = useCallback(
    async (tracks: MaterializeInput[], startIndex: number, config: NativeSessionConfig): Promise<boolean> => {
      if (!available) return false;
      try {
        const queue = await buildNativeQueue(tracks);
        if (queue.length === 0) {
          console.log("[v0] native session: no playable files materialized, using JS fallback");
          return false;
        }
        // Clamp the start index to the tracks that actually materialized.
        const safeStart = Math.max(0, Math.min(startIndex, queue.length - 1));
        await nativeQueue.configure({
          gapSeconds: config.gapSeconds,
          repeats: config.repeats,
          backToBack: config.backToBack,
          countdownBeeps: config.countdownBeeps,
          countdownSeconds: config.countdownSeconds,
          volume: config.volume,
        });
        await nativeQueue.setQueue(queue, safeStart);
        await nativeQueue.play();
        setActiveBoth(true);
        return true;
      } catch (err) {
        console.log("[v0] native session start failed, using JS fallback", err);
        setActiveBoth(false);
        return false;
      }
    },
    [available],
  );

  const play = useCallback(async () => {
    if (!activeRef.current) return;
    await nativeQueue.resume();
  }, []);

  const pause = useCallback(async () => {
    if (!activeRef.current) return;
    await nativeQueue.pause();
  }, []);

  const next = useCallback(async () => {
    if (!activeRef.current) return;
    await nativeQueue.skipNext();
  }, []);

  const previous = useCallback(async () => {
    if (!activeRef.current) return;
    await nativeQueue.skipPrevious();
  }, []);

  const seek = useCallback(async (seconds: number) => {
    if (!activeRef.current) return;
    await nativeQueue.seek(seconds);
  }, []);

  const setVolume = useCallback(async (volume0to1: number) => {
    if (!activeRef.current) return;
    await nativeQueue.setVolume(Math.max(0, Math.min(1, volume0to1)));
  }, []);

  const stop = useCallback(async () => {
    if (!available) return;
    try {
      await nativeQueue.stop();
    } catch {
      /* ignore */
    }
    await clearMaterializedQueue();
    setActiveBoth(false);
  }, [available]);

  return {
    available,
    active,
    activeRef,
    start,
    play,
    pause,
    next,
    previous,
    seek,
    setVolume,
    stop,
  };
}
