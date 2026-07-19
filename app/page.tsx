"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import Image from "next/image";
import {
  DndContext,
  closestCenter,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
  arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { clearCachedPlaylist, saveSavedPlaylistsWithTracks, getSavedPlaylistsWithTracks, saveCurrentPlaylistWithFiles, getCurrentPlaylistWithFiles, getAllLocalAudioFiles, clearSavedPlaylists } from "@/lib/eqho-db";
import { isNativePlatform, isNativeIOS, toPlayableUrl, peekPlayableUrl, firstBytesHex, buildCorrectedPlayableUrl, peekPlayableBuild, NOT_AUDIO_MESSAGE } from "@/lib/native-audio";
import { useNativeSession } from "@/lib/use-native-session";
import { createClient } from "@/lib/supabase/client";
import { isV0Preview, mockUser } from "@/lib/utils/preview";
import { clearEntitlementVerified, recordEntitlementVerified } from "@/lib/access";
import { 
  fetchCloudPlaylists, 
  fetchPlaylistWithFiles, 
  fetchPlaylistWithFilesDetailed, 
  syncPlaylistToCloud, 
  deleteCloudPlaylist,
  isCloudSyncAvailable,
  checkProStatus,
  pushToApps,
  uploadPlaylistToCloud,
  syncAllPlaylistsToCloud,
  downloadAllPlaylistsFromCloud,
  isCloudStorageAvailable,
  fetchCloudPlaylistSignatures,
  localTrackKey,
  deleteTrackFromCloudDirect,
  type CloudPlaylist,
  type CloudPlaylistTrack,
  type SyncStatus 
} from "@/lib/cloud-sync";
import { useRouter } from "next/navigation";
import type { User } from "@supabase/supabase-js";
import { ProBadge } from "@/components/pro-badge";
import { useSubscription } from "@/lib/subscription-context";
import { formatTrialEndDate, getDaysUntil, getCountdownTarget, TRIAL_LENGTH_DAYS, hasActiveSubscription, SUBSCRIPTION_LAUNCH_LABEL } from "@/lib/subscription-types";
import { deleteAccount } from "@/app/actions/account";
import { cancelSubscription, resumeSubscription } from "@/app/actions/subscription";
import { SortableTrackList, SortableTrackItem, TrackDragHandle } from "@/components/sortable-track-list";
import { ContactPage } from "@/components/contact-page";
import Link from "next/link";
import {
  Home,
  ListMusic,
  Music,
  Music2,
  WifiOff,
  Timer,
  Settings,
  UploadCloud,
  Info,
  Folder,
  Users,
  RefreshCw,
  Clock,
  Minus,
  Plus,
  Volume2,
  VolumeX,
  X,
  StepBack,
  StepForward,
  Pause,
  Play,
  MoreVertical,
  GripVertical,
  ChevronUp,
  ChevronDown,
  ChevronRight,
  ChevronLeft,
  Search,
  Upload,
  SlidersHorizontal,
  AlertTriangle,
  AlertCircle,
  Headphones,
  Save,
  Repeat,
  Maximize2,
  Minimize2,
  LogOut,
  ExternalLink,
  Cloud,
  CloudOff,
  Trash2,
  Download,
  Monitor,
  Check,
  Loader2,
  RotateCcw,
  Bell,
  Crown,
  CreditCard,
  HelpCircle,
  BookOpen,
  MousePointer,
  Move,
  Fullscreen,
  Smartphone,
  Send,
  CloudUpload,
  CloudDownload,
  FileDown,
  Shield,
  Mail,
  KeyRound,
} from "lucide-react";

const uploads = [
  ["NDP Group Warm Up.mp3", "02:18", "Just now"],
  ["Tumble Pass 2.mp3", "01:47", "1 min ago"],
  ["Full Out Music.mp3", "02:32", "3 min ago"],
  ["Dance Section.mp3", "01:56", "5 min ago"],
  ["Competition Intro.mp3", "00:45", "8 min ago"],
  ["British Champs 2024.mp3", "02:04", "12 min ago"],
  ["Fast Paced Track.mp3", "01:59", "15 min ago"],
  ["Ending Pose.mp3", "00:32", "18 min ago"],
];



const tracks = [
  ["Josh and Grace", "Grade 3 Mix Pair", "01:58", "30s", "00:00", "Playing"],
  ["Henry and Ben", "Grade 2 Men’s Pair", "02:01", "30s", "02:28", "Up Next"],
  ["Harriet, Ava and Lily", "Grade 4 Women’s Group", "01:55", "30s", "05:29", "Pending"],
  ["Mia and Ella", "Grade 3 Women’s Pair", "01:53", "30s", "07:54", "Pending"],
  ["Jack and Luke", "Grade 4 Men’s Individual", "02:00", "30s", "10:17", "Pending"],
  ["Sophie, Ava and Ruby", "Grade 3 Women’s Group", "01:59", "—", "12:47", "Pending"],
];

const queue = [
  ["1", "Josh and Grace", "Grade 3 Mix Pair", "00:00", "01:58", "text-pink-500"],
  ["2", "Henry and Ben", "Grade 2 Men's Pair", "02:28", "02:01", "text-blue-500"],
  ["3", "Harriet, Ava and Lily", "Grade 4 Women's Group", "05:29", "01:55", "text-orange-500"],
  ["4", "Mia and Ella", "Grade 3 Women's Pair", "07:54", "01:53", "text-cyan-500"],
  ["5", "Jack and Luke", "Grade 4 Men's Individual", "10:17", "02:00", "text-pink-500"],
  ["6", "Sophie, Ava and Ruby", "Grade 3 Women's Group", "12:47", "01:59", "text-blue-500"],
];






function SettingsSection({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-3xl border border-white/10 bg-[rgba(9,15,28,0.96)] p-6 shadow-[0_18px_45px_rgba(0,0,0,0.35)]">
      <div className="flex items-center gap-3 mb-5">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#ff4fa3] to-[#ff8a00] flex items-center justify-center">
          {icon}
        </div>
        <h2 className="text-xl font-black">{title}</h2>
      </div>
      <div className="space-y-4">{children}</div>
    </div>
  );
}

function NumberSetting({ 
  label, 
  value, 
  suffix, 
  min, 
  max, 
  step, 
  onChange 
}: { 
  label: string; 
  value: number; 
  suffix: string; 
  min: number; 
  max: number; 
  step: number; 
  onChange: (value: number) => void;
}) {
  return (
    <div className="flex items-center justify-between rounded-2xl bg-white/[0.03] border border-white/10 p-4 backdrop-blur-sm">
      <span className="text-white/70">{label}</span>
      <div className="flex items-center gap-3">
        <button
          onClick={() => onChange(Math.max(min, value - step))}
          className="w-9 h-9 rounded-xl bg-white/[0.05] border border-white/10 flex items-center justify-center hover:bg-white/10 hover:border-[#ff8a00]/30 transition-all"
        >
          −
        </button>
        <span className="w-20 text-center font-bold">
          {value} {suffix}
        </span>
        <button
          onClick={() => onChange(Math.min(max, value + step))}
          className="w-9 h-9 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10"
        >
          +
        </button>
      </div>
    </div>
  );
}

function ToggleSetting({ 
  label, 
  value, 
  onChange 
}: { 
  label: string; 
  value: boolean; 
  onChange: (value: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between rounded-2xl bg-white/[0.03] border border-white/10 p-4">
      <span className="text-white/70">{label}</span>
      <button
        onClick={() => onChange(!value)}
        className={`w-16 h-8 rounded-full p-1 transition ${
          value ? "bg-cyan-400" : "bg-white/15"
        }`}
      >
        <div
          className={`w-6 h-6 rounded-full bg-white transition ${
            value ? "translate-x-8" : "translate-x-0"
          }`}
        />
      </button>
    </div>
  );
}

function TextSetting({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between rounded-2xl bg-white/[0.03] border border-white/10 p-4">
      <span className="text-white/70">{label}</span>
      <span className="font-bold text-cyan-300">{value}</span>
    </div>
  );
}

interface Track {
  id: string;
  title: string;
  sub: string;
  duration: string;
  fileName: string;
  url: string;
  durationSeconds: number;
  uploadedAt: string;
  file?: File;
}

interface GapItem {
  type: "gap";
  duration: number;
}

type QueueItem = Track | GapItem;

const buildSessionQueue = ({
  playlist,
  playlistRepeats,
  backToBack,
  gapSeconds,
}: {
  playlist: Track[];
  playlistRepeats: number;
  backToBack: boolean;
  gapSeconds: number;
}): QueueItem[] => {
  const queue: QueueItem[] = [];

  for (let repeat = 0; repeat < playlistRepeats; repeat++) {
    playlist.forEach((track) => {
      queue.push(track);

      if (backToBack) {
        queue.push(track);
      }

      queue.push({
        type: "gap",
        duration: gapSeconds,
      });
    });
  }

  // remove final gap
  if (queue.length > 0 && (queue[queue.length - 1] as GapItem).type === "gap") {
    queue.pop();
  }

  return queue;
};

function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`rounded-xl border border-white/10 bg-[#090f1c]/85 shadow-[0_0_35px_rgba(0,180,255,0.05)] ${className}`}>
      {children}
    </div>
  );
}

// Expandable track list for a playlist card, with a permanent-delete button on
// every track row. Collapsed by default (shows 2 tracks); expanding reveals the
// full, scrollable list. Used in both the desktop grid and the compact library
// views so per-track deletion is available everywhere a playlist is shown.
function PlaylistTrackRows({
  tracks,
  expanded,
  onToggleExpand,
  onRequestDelete,
  deletingTrackId,
  formatDuration,
  compact = false,
}: {
  tracks: Array<{ id: string; title: string; durationSeconds?: number }>;
  expanded: boolean;
  onToggleExpand: () => void;
  onRequestDelete: (trackId: string) => void;
  deletingTrackId: string | null;
  formatDuration: (seconds?: number) => string;
  compact?: boolean;
}) {
  const rowText = compact ? "text-[10px]" : "text-[11px]";
  const moreText = compact ? "text-[9px]" : "text-[10px]";
  const visible = expanded ? tracks : tracks.slice(0, 2);
  const hiddenCount = tracks.length - 2;

  return (
    <div className="mb-2">
      <div className={expanded ? "space-y-0.5 max-h-52 overflow-y-auto pr-1" : "space-y-0.5"}>
        {visible.map((track, idx) => {
          const isDeleting = deletingTrackId === track.id;
          return (
            <div
              key={track.id}
              className={`group/track flex items-center gap-1.5 ${rowText} text-white/40 rounded px-1 py-0.5 hover:bg-white/5 transition`}
            >
              <span className="w-3 text-white/25 shrink-0">{idx + 1}.</span>
              <span className="truncate flex-1">{track.title}</span>
              <span className="text-white/25 shrink-0">{formatDuration(track.durationSeconds || 0)}</span>
              <button
                type="button"
                // Stop the pointer/touch event before it can reach the row (select/
                // play) or any drag/scroll sensor. Do NOT preventDefault here — that
                // would cancel the subsequent click on iOS WKWebView.
                onPointerDown={(e) => { e.stopPropagation(); }}
                onTouchStart={(e) => { e.stopPropagation(); }}
                onClick={(e) => {
                  // preventDefault + stopPropagation so the tap never reaches the
                  // row (select/play) or any drag sensor; safe here because this is
                  // a click (not touchstart), so it won't cancel the tap on iOS.
                  e.preventDefault();
                  e.stopPropagation();
                  console.log("[v0] DELETE TAP RECEIVED — selected track ID:", track.id, "title:", track.title);
                  try {
                    onRequestDelete(track.id);
                    console.log("[v0] DELETE confirmation opened for track ID:", track.id);
                  } catch (err) {
                    console.error("[v0] DELETE tap handler error:", (err as Error)?.message || String(err));
                  }
                }}
                disabled={isDeleting}
                title="Delete track permanently"
                aria-label={`Delete ${track.title} permanently`}
                className="w-5 h-5 rounded flex items-center justify-center text-white/30 hover:text-red-400 hover:bg-red-500/15 transition shrink-0 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isDeleting ? <Loader2 size={11} className="animate-spin" /> : <Trash2 size={11} />}
              </button>
            </div>
          );
        })}
      </div>
      {tracks.length > 2 && (
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); onToggleExpand(); }}
          className={`mt-0.5 pl-4 flex items-center gap-1 ${moreText} text-cyan-400/70 hover:text-cyan-300 transition`}
        >
          {expanded ? (
            <><ChevronUp size={10} /> Show less</>
          ) : (
            <><ChevronDown size={10} /> +{hiddenCount} more {hiddenCount === 1 ? "track" : "tracks"}</>
          )}
        </button>
      )}
    </div>
  );
}

function DraggableTrackRow({ 
  track, 
  index, 
  children,
  onDragStart,
  onDragOver,
  onDrop,
  isDragging,
}: { 
  track: any;
  index: number;
  children: React.ReactNode;
  onDragStart: (index: number) => void;
  onDragOver: (event: React.DragEvent) => void;
  onDrop: (index: number) => void;
  isDragging: boolean;
}) {
  return (
    <div
      draggable
      onDragStart={() => onDragStart(index)}
      onDragOver={onDragOver}
      onDrop={() => onDrop(index)}
      className={`border-t border-white/10 py-8 px-6 flex items-center gap-6 cursor-grab active:cursor-grabbing transition ${
        isDragging ? "opacity-50 bg-white/5" : "hover:bg-white/[0.02]"
      }`}
    >
      {children}
    </div>
  );
}

// Selectable countdown beep styles for the web players (iPhone Safari + iPad
// Safari). All three are generated with the Web Audio API and are driven by the
// same last-N-seconds countdown logic, so the beeps stay perfectly in sync with
// the on-screen numbers regardless of which style is chosen. "classic" is the
// recommended default: it is the brightest and most audible over music.
type BeepSoundId = "classic" | "chime" | "tick";
const BEEP_SOUNDS: { id: BeepSoundId; label: string; description: string }[] = [
  { id: "classic", label: "Classic Beep", description: "Bright, punchy — best over music (recommended)" },
  { id: "chime", label: "Soft Chime", description: "Warm, musical rising tones" },
  { id: "tick", label: "Sharp Tick", description: "Crisp, minimal digital blips" },
];

export default function Page() {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  // Web Audio volume control. iOS/iPadOS WKWebView makes HTMLMediaElement.volume
  // READ-ONLY (writes are silently ignored), so the slider changed state/visuals
  // but never the actual loudness. Routing the <audio> element through a GainNode
  // lets us control real output level on ALL platforms, since GainNode.gain IS
  // honored on iOS. Created lazily on the first play gesture (AudioContext must be
  // resumed from a user gesture on iOS). createMediaElementSource can only run
  // once per element, hence the refs/guard.
  const audioCtxRef = useRef<AudioContext | null>(null);
  const mediaSourceRef = useRef<MediaElementAudioSourceNode | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);
  // SINGLE persistent AudioContext dedicated to countdown/notification beeps.
  // Created once and reused for every beep (never `new AudioContext()` per beep):
  // on iOS a context created outside a user gesture starts "suspended" and stays
  // silent, and Safari caps the number of live contexts — both of which silenced
  // fresh-per-beep contexts. This one is unlocked on the play gesture (safePlay)
  // and resumed before each beep, so beeps are audible on all four platforms
  // (iPhone/iPad, app + Safari) and overlay the music without touching playback.
  const beepCtxRef = useRef<AudioContext | null>(null);
  // Cached result of "does writing element.volume actually change loudness?".
  // Desktop + Android honor element.volume (and it routes correctly to Bluetooth/
  // AirPlay); iOS/iPadOS WKWebView silently ignores it. We ONLY fall back to the
  // Web Audio GainNode when element.volume is proven ineffective, because routing
  // audio through createMediaElementSource breaks Bluetooth/AirPlay output — which
  // was the cause of the "no volume over Bluetooth" regression. null = untested.
  const volumeWritableRef = useRef<boolean | null>(null);
  // Mirror of currentTrack for use inside stable event listeners / diagnostics.
  const currentTrackRef = useRef<Track | null>(null);

  // --- TEMPORARY on-device audio diagnostics ---------------------------------
  // Internal audio diagnostics state. The on-screen debug panel was removed; the
  // refreshAudioDiag() calls throughout playback remain as harmless no-op updates
  // (kept to avoid a large, risky refactor of ~20 call sites).
  const [audioDiag, setAudioDiag] = useState({
    hasCurrentTrack: false,
    hasAudioEl: false,
    hasSrc: false,
    srcType: "none" as "none" | "blob" | "https" | "http" | "data" | "file" | "capacitor" | "other",
    readyState: -1,
    networkState: -1,
    paused: null as boolean | null,
    isNative: false,
    lastEvent: "-",
    playError: "-",
    mediaError: "-",
    blobType: "-",
    blobSize: -1,
    filename: "-",
    ext: "-",
    detectedFormat: "-",
    originalMime: "-",
    correctedMime: "-",
    first16Hex: "-",
    updatedAt: "-",
  });

  // Update just the blob probe fields (called from safePlay after fetching the
  // bytes behind the current audio source).
  const setBlobDiag = (blobType: string, blobSize: number) => {
    setAudioDiag((prev) => ({ ...prev, blobType, blobSize }));
  };

  // Update the format-detection fields (called after byte-sniffing a track's
  // File in buildCorrectedPlayableUrl).
  const setFormatDiag = (info: {
    filename: string; ext: string; detectedFormat: string;
    originalMime: string; correctedMime: string; size: number; first16Hex: string;
  }) => {
    setAudioDiag((prev) => ({
      ...prev,
      filename: info.filename,
      ext: info.ext || "(none)",
      detectedFormat: info.detectedFormat,
      originalMime: info.originalMime,
      correctedMime: info.correctedMime,
      blobType: info.correctedMime,
      blobSize: info.size,
      first16Hex: info.first16Hex,
    }));
  };

  // Classify the current audio source so we can see (on device) whether we're
  // feeding the element a blob:, data:, https: or capacitor: URL.
  const classifySrc = (src: string): typeof audioDiag.srcType => {
    if (!src) return "none";
    if (src.startsWith("blob:")) return "blob";
    if (src.startsWith("data:")) return "data";
    if (src.startsWith("https:")) return "https";
    if (src.startsWith("http:")) return "http";
    if (src.startsWith("file:")) return "file";
    if (src.startsWith("capacitor:")) return "capacitor";
    return "other";
  };

  // Snapshot the live <audio> element + current track into the diagnostics panel.
  const refreshAudioDiag = (event?: string, playError?: string) => {
    const audio = audioRef.current;
    const src = audio ? (audio.currentSrc || audio.src || "") : "";
    const mediaErr = audio?.error
      ? `code ${audio.error.code}: ${audio.error.message || "(no message)"}`
      : "-";
    setAudioDiag((prev) => ({
      ...prev,
      hasCurrentTrack: !!currentTrackRef.current,
      hasAudioEl: !!audio,
      hasSrc: !!src,
      srcType: classifySrc(src),
      readyState: audio ? audio.readyState : -1,
      networkState: audio ? audio.networkState : -1,
      paused: audio ? audio.paused : null,
      isNative: isNativePlatform(),
      lastEvent: event ?? prev.lastEvent,
      playError: playError ?? prev.playError,
      mediaError: mediaErr,
      updatedAt: new Date().toLocaleTimeString(),
    }));
  };

  const [activePage, setActivePage] = useState("player");
  const { isPro, isTrialing, profile, isLoading: isSubscriptionLoading, refetch: refetchSubscription } = useSubscription();

  // Sidebar navigation items (desktop only)
  const sidebarItems = [
    { icon: Home, page: "player", color: "pink" },
    { icon: ListMusic, page: "playlists", color: "pink" },
    { icon: Cloud, page: "cloud", color: "pink" },
    { icon: Settings, page: "settings", color: "pink" },
    { icon: HelpCircle, page: "help", color: "pink" },
    { icon: Mail, page: "contact", color: "pink" },
  ] as const;

  const activeColors: Record<string, string> = {
    pink: "text-[#ff4fa3] bg-gradient-to-r from-[#ff4fa3]/15 to-[#ff8a00]/10",
  };

  // Mobile tab state
  const [mobileTab, setMobileTab] = useState<"nowplaying" | "playlists" | "settings">("nowplaying");
  // Full-screen mobile contact/feedback overlay (opened from the mobile Settings tab).
  const [showContactMobile, setShowContactMobile] = useState(false);

  const [playlistRepeats, setPlaylistRepeats] = useState(1);
  const [gapSeconds, setGapSeconds] = useState(10);
  const [backToBack, setBackToBack] = useState(false);
  const [backToBackPlayed, setBackToBackPlayed] = useState(false); // true if current track already played its b2b repeat
  const [playlistRound, setPlaylistRound] = useState(1); // which repeat round we're on (1-based)
  const [finishedTracks, setFinishedTracks] = useState<Set<string>>(new Set()); // track IDs fully finished across all repeats
  const [isGapPaused, setIsGapPaused] = useState(false);
  const [gapCountdown, setGapCountdown] = useState(0);
  const gapCallbackRef = useRef<(() => void) | null>(null);
  // Absolute wall-clock time (ms, Date.now()) at which the next track must start.
  // The gap countdown is DERIVED from this timestamp rather than decremented once
  // per second, so it stays correct even when iOS suspends/throttles JS timers
  // while the app is backgrounded or the phone is locked. null = no gap pending.
  const nextTrackStartAtRef = useRef<number | null>(null);
  // Mirror of isGapPaused for the Capacitor app-state listener closure.
  const isGapPausedRef = useRef(false);
  isGapPausedRef.current = isGapPaused;
  // Title of the track that will actually play after the current gap.
  // Captured at the moment the gap is scheduled so back-to-back repeats
  // display the correct (same) track instead of skipping ahead.
  const [nextUpTitle, setNextUpTitle] = useState<string | null>(null);
  // ID of the track that will actually play after the current gap. Captured
  // at gap-scheduling time so the track number stays in sync with the title
  // (critical for back-to-back, where the same track plays again).
  const [nextUpTrackId, setNextUpTrackId] = useState<string | null>(null);
  const [currentPlaylistName, setCurrentPlaylistName] = useState("Untitled Playlist");
  const [dropMessage, setDropMessage] = useState("");
  const [uploadedTracks, setUploadedTracks] = useState<Track[]>([]);
  const [playlist, setPlaylist] = useState<Track[]>([]);
  const [originalPlaylistOrder, setOriginalPlaylistOrder] = useState<Track[]>([]); // Store original order when first loaded
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(80);
  const [isMuted, setIsMuted] = useState(false);
  // True on iPadOS/iOS, where JS cannot control playback loudness (iOS routes it
  // to the hardware volume buttons) — this now covers BOTH the Capacitor app and
  // iPad Safari, since the web page has the same limitation. Set after mount to
  // avoid an SSR/hydration mismatch. When true, the in-app percentage volume
  // slider is replaced by guidance to use the device volume buttons. iPhone Safari
  // keeps the working slider (its narrow layout relies on it) and desktop / macOS
  // wrapper are unchanged.
  const [iosVolumeControl, setIosVolumeControl] = useState(false);
  useEffect(() => {
    // iPad detection mirrors app/layout.tsx: real iPads plus iPadOS masquerading
    // as "Macintosh"/"MacIntel" with multi-touch. iPhone is intentionally excluded
    // here (handled by its own slider layout) and only picks up the message via the
    // native-app check below.
    const ua = navigator.userAgent || "";
    const isIpad =
      /iPad/.test(ua) ||
      ((/Macintosh/.test(ua) || navigator.platform === "MacIntel") &&
        (navigator.maxTouchPoints || 0) > 1);
    setIosVolumeControl(isNativeIOS() || isIpad);
  }, []);
  const [sessionRunning, setSessionRunning] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [trackDuration, setTrackDuration] = useState(0);
  const [savedPlaylists, setSavedPlaylists] = useState<{
    id: string;
    name: string;
    tracks: Track[];
  }[]>([]);
  const [showPlaylistModal, setShowPlaylistModal] = useState(false);
  const [newPlaylistName, setNewPlaylistName] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  // True once the initial Supabase auth check has completed (so we can tell
  // "logged out" apart from "still loading").
  const [authChecked, setAuthChecked] = useState(false);
  // Free access, but login is required. The gate starts "checking" until the
  // Supabase auth check resolves: logged-in users are "granted", logged-out users
  // are redirected to /login. (No subscription/trial check - login alone is enough.)
  const [gate, setGate] = useState<"checking" | "granted" | "blocked-offline" | "error">(
    isV0Preview ? "granted" : "checking"
  );
  // Bumped by "Try Again" on the recoverable-error screen to re-run the auth
  // bootstrap without a full page reload (a reload can re-hang on iPad Capacitor).
  const [accessRetryToken, setAccessRetryToken] = useState(0);
  const router = useRouter();
  const supabase = createClient();
  const [currentTrack, setCurrentTrack] = useState<Track | null>(null);
  // Keep the ref in lockstep so stable listeners / diagnostics see the latest track.
  currentTrackRef.current = currentTrack;
  const [isFullscreen, setIsFullscreen] = useState(false);
  const fullscreenRef = useRef<HTMLDivElement>(null);
  const [showPauseConfirm, setShowPauseConfirm] = useState(false);
  const [showMuteConfirm, setShowMuteConfirm] = useState(false);
  const [showSkipBackConfirm, setShowSkipBackConfirm] = useState(false);
  const [showSkipForwardConfirm, setShowSkipForwardConfirm] = useState(false);
  const [showSessionFinished, setShowSessionFinished] = useState(false);
  const [showFullscreenQueuePlaylist, setShowFullscreenQueuePlaylist] = useState(false);
  const [showClearPlaylistConfirm, setShowClearPlaylistConfirm] = useState(false);
  // Saved-playlist removal confirmation (guards accidental clicks on the "Clear" link).
  const [playlistToRemove, setPlaylistToRemove] = useState<{ id: string; name: string } | null>(null);
  const [showClearLibraryConfirm, setShowClearLibraryConfirm] = useState(false);
  const [showDeleteAccountConfirm, setShowDeleteAccountConfirm] = useState(false);
  const [deleteAccountLoading, setDeleteAccountLoading] = useState(false);
  // Subscription cancel/resume (unsubscribe) state — shared by the desktop and
  // mobile settings UIs. Cancellation runs through the Stripe-connected server
  // action (cancel_at_period_end), and the Stripe webhook syncs Supabase.
  const [showCancelSubConfirm, setShowCancelSubConfirm] = useState(false);
  const [cancelSubLoading, setCancelSubLoading] = useState(false);
  const [resumeSubLoading, setResumeSubLoading] = useState(false);
  const [subActionError, setSubActionError] = useState<string | null>(null);
  // Tracks that the user has scheduled cancellation this session (mirrors the
  // /billing page's client-side tracking, since `profiles` does not expose the
  // Stripe cancel_at_period_end flag directly).
  const [subCancelPending, setSubCancelPending] = useState(false);
  // Sign-out UI state: drives the "Signing out…" loading label and the
  // "Sign out failed" error message on the Sign Out buttons.
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [signOutError, setSignOutError] = useState<string | null>(null);
  // Change Password (Settings): email-confirmed flow. Tapping "Change Password"
  // never edits the password directly — it sends a Supabase recovery link to the
  // signed-in user's own email (proving email ownership), and the actual update
  // happens on /reset-password. 'confirm' shows the "send link?" dialog, 'sent'
  // shows the "check your email" state. A resend cooldown throttles repeat sends.
  const [showChangePasswordModal, setShowChangePasswordModal] = useState(false);
  const [changePwStep, setChangePwStep] = useState<'confirm' | 'sent'>('confirm');
  const [changePwEmail, setChangePwEmail] = useState<string | null>(null);
  const [changePwLoading, setChangePwLoading] = useState(false);
  const [changePwError, setChangePwError] = useState<string | null>(null);
  const [changePwCooldown, setChangePwCooldown] = useState(0);
  const [showSendToSessionConfirm, setShowSendToSessionConfirm] = useState<{ name: string; tracks: Track[] } | null>(null);
  const [showRemoveTrackConfirm, setShowRemoveTrackConfirm] = useState<{ track: Track; originalIndex: number } | null>(null);

  // Cloud sync state
  const isMobileBuild = process.env.NEXT_PUBLIC_BUILD_TARGET === 'mobile';
  const [cloudPlaylists, setCloudPlaylists] = useState<CloudPlaylist[]>([]);
  // Per-cloud-playlist ordered track identity keys, used to detect whether a local
  // playlist is new, modified, or fully synced against its cloud version.
  const [cloudSignatures, setCloudSignatures] = useState<Record<string, string[]>>({});
  const [syncStatus, setSyncStatus] = useState<SyncStatus>('idle');
  const [syncingPlaylistId, setSyncingPlaylistId] = useState<string | null>(null);
  const [showDeletePlaylistConfirm, setShowDeletePlaylistConfirm] = useState<{ id: string; name: string } | null>(null);
  // Which playlist cards have their full track list expanded (by playlist id).
  const [expandedPlaylistIds, setExpandedPlaylistIds] = useState<Set<string>>(new Set());
  // Pending "delete this track permanently?" confirmation.
  const [confirmDeleteTrack, setConfirmDeleteTrack] = useState<{ playlistId: string; track: Track } | null>(null);
  // The track id currently being deleted (drives the per-row spinner).
  const [deletingTrackId, setDeletingTrackId] = useState<string | null>(null);
  const [downloadingPlaylistId, setDownloadingPlaylistId] = useState<string | null>(null);
  // Per-playlist "Download to Device" status for the main left playlist list.
  // Keyed by local playlist id -> { signature of the downloaded tracks, status }.
  // Used to drive the small Download button states (Downloaded / Update / Failed).
  const [deviceDownloads, setDeviceDownloads] = useState<Record<string, { signature: string; status: 'downloaded' | 'failed' }>>({});
  // Inline result feedback for the cloud "Download to Device" buttons. The global
  // cloudSaveMessage toast only renders on the Cloud page, so a download started
  // from the Playlists page showed no success/error there. Keyed by cloud playlist
  // id -> { ok, message } so each button can show its own green/red result inline.
  const [cloudDownloadResult, setCloudDownloadResult] = useState<Record<string, { ok: boolean; message: string }>>({});
  // Download queue + live progress for the compact offline-download status icon.
  const [downloadQueue, setDownloadQueue] = useState<string[]>([]); // local playlist ids waiting to download
  const [downloadProgress, setDownloadProgress] = useState<Record<string, number>>({}); // local playlist id -> 0..100
  const [showFullscreenMobilePlayer, setShowFullscreenMobilePlayer] = useState(false);
  
  // Cloud sync state
  const [isExporting, setIsExporting] = useState(false);
  const [isPushingToApps, setIsPushingToApps] = useState(false);
  const [isDownloadingFromCloud, setIsDownloadingFromCloud] = useState(false);
  const [isUploadingToCloud, setIsUploadingToCloud] = useState(false);
  // "Sync All" progress + result state.
  const [isSyncingAll, setIsSyncingAll] = useState(false);
  const [syncAllProgress, setSyncAllProgress] = useState<{ current: number; total: number } | null>(null);
  // Per-playlist push/sync button status. No entry = default (blue "Push Updates").
  //  - 'pushing' => disabled "Pushing..."
  //  - 'success' => green "Push Successful" (auto-reverts to the Synced pill)
  //  - 'failed'  => red "Push Unsuccessful" (clickable to retry; persists)
  const [pushStatus, setPushStatus] = useState<Record<string, 'pushing' | 'success' | 'failed'>>({});
  const [cloudSaveMessage, setCloudSaveMessage] = useState<string | null>(null);
  // Drives the cloud status banner colour: true => green (full success), false => pink/red (partial/error).
  const [cloudSaveSuccess, setCloudSaveSuccess] = useState<boolean>(false);

  // Session-only hidden tracks (does not affect saved playlists or cloud)
  const [hiddenTrackIds, setHiddenTrackIds] = useState<Set<string>>(new Set());
  
  // Computed: visible tracks in current session (filters out hidden)
  const visiblePlaylist = playlist.filter(track => !hiddenTrackIds.has(track.id));
  
  // Get the visible index for a track (for display numbering)
  const getVisibleIndex = (trackId: string) => visiblePlaylist.findIndex(t => t.id === trackId);

  // Fetch user on mount.
  //
  // iPad Capacitor fix: this MUST be finite. The old code awaited
  // supabase.auth.getUser() (a NETWORK call with no timeout) before anything
  // else; on a static export with flaky network or a broken stored refresh
  // token that await could hang forever, so `setAuthChecked(true)` never ran and
  // the app was stuck on "Checking your access…". We now:
  //   1. Read the LOCAL session first (getSession — reliable, storage-based).
  //   2. Race everything against an 8s timeout so startup can never hang.
  //   3. Recover from invalid/expired stored sessions by signing out locally.
  //   4. Always resolve loading in `finally`; show a recoverable error screen
  //      (Try Again / Sign Out) instead of an endless spinner if we time out.
  useEffect(() => {
    // V0 Preview: use mock user, do not call Supabase
    if (isV0Preview) {
      setUser(mockUser as unknown as User);
      setAuthChecked(true);
      return;
    }

    if (!supabase) {
      setAuthChecked(true);
      return;
    }

    let cancelled = false;
    const STARTUP_TIMEOUT_MS = 8000;

    // Reject after `ms` so a hung Supabase/network call can never block startup.
    const withTimeout = <T,>(p: PromiseLike<T>, ms: number): Promise<T> =>
      Promise.race([
        Promise.resolve(p),
        new Promise<T>((_, reject) =>
          setTimeout(() => reject(new Error("ACCESS_CHECK_TIMEOUT")), ms)
        ),
      ]);

    // Stored session is unusable (expired / revoked / not found). We must clear it
    // locally and treat the user as logged out rather than retrying forever.
    const isInvalidSessionError = (msg: string | undefined | null): boolean => {
      if (!msg) return false;
      const m = msg.toLowerCase();
      return (
        m.includes("refresh token") ||
        m.includes("session") && m.includes("expired") ||
        m.includes("invalid") && m.includes("token") ||
        m.includes("jwt expired") ||
        m.includes("user not found")
      );
    };

    const bootstrapAccess = async () => {
      console.log("[v0] ACCESS CHECK STARTED");
      console.log("[v0] PLATFORM", isMobileBuild ? "native" : "web");
      try {
        // 1. Local session read first (no hard network dependency).
        const { data: { session }, error: sessionError } = await withTimeout(
          supabase.auth.getSession(),
          STARTUP_TIMEOUT_MS
        );

        if (cancelled) return;

        // 2. Recover from a broken stored session -> normal logged-out state.
        if (sessionError && isInvalidSessionError(sessionError.message)) {
          console.log("[v0] ACCESS CHECK ERROR invalid stored session; clearing");
          try { await supabase.auth.signOut({ scope: "local" }); } catch {}
          if (cancelled) return;
          setUser(null);
          return;
        }

        console.log("[v0] SESSION FOUND", !!session);

        // 3. No session -> logged out (the gate effect sends them to /login).
        if (!session) {
          setUser(null);
          return;
        }

        // 4. Valid local session -> logged in. Render the shell immediately and
        //    record that we verified access while we had connectivity.
        setUser(session.user);
        recordEntitlementVerified();
      } catch (err) {
        if (cancelled) return;
        const message = err instanceof Error ? err.message : String(err);
        if (message === "ACCESS_CHECK_TIMEOUT") {
          console.log("[v0] ACCESS CHECK TIMEOUT");
        } else {
          console.log("[v0] ACCESS CHECK ERROR", message);
        }
        // If we can't confirm anything, show a recoverable error (not a white
        // screen / infinite spinner). authChecked is still set in `finally`;
        // the gate effect below leaves "error" untouched.
        setGate("error");
      } finally {
        if (!cancelled) setAuthChecked(true);
        console.log("[v0] ACCESS CHECK COMPLETE");
      }
    };

    bootstrapAccess();

    // React to later auth changes (sign in/out, token refresh) so the gate stays
    // correct after the initial bootstrap. This is event-driven, never awaited.
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (cancelled) return;
      if (event === "SIGNED_OUT") {
        setUser(null);
      } else {
        setUser(session?.user ?? null);
      }
      setAuthChecked(true);
    });

    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, [supabase, accessRetryToken]);

  // -------------------------------------------------------------------------
  // Client-side login gate.
  // Web is also covered by middleware, but mobile/desktop (Capacitor) builds use
  // static export with no middleware, so the player enforces login here too.
  // Free access = any logged-in user is allowed; logged-out users go to /login.
  // -------------------------------------------------------------------------
  useEffect(() => {
    if (isV0Preview) {
      setGate("granted");
      return;
    }
    // Wait for the initial auth check to settle before deciding.
    if (!authChecked) return;

    // A recoverable startup error is showing (timeout / unverifiable). Leave it
    // in place — the user recovers via its Try Again / Sign Out buttons — instead
    // of bouncing to /login and hiding the network error.
    if (gate === "error") return;

    if (user) {
      setGate("granted");
    } else {
      // Keep the loader visible (never flash the player) while redirecting.
      setGate("checking");
      router.replace("/login");
    }
  }, [authChecked, user, router, gate]);

  // STRIPE TEMPORARILY DISABLED - Allow direct access to player
  // const STRIPE_PAYMENT_LINK = 'https://buy.stripe.com/4gMfZbfZDbPW33Fbop3F603';

  const handleLogout = async () => {
    if (isSigningOut) return; // guard against double taps
    setSignOutError(null);
    setIsSigningOut(true);

    try {
      // 1. Sign out of Supabase (scope: 'local' clears this device's session
      //    reliably, including offline, without needing a valid refresh token).
      if (supabase) {
        const { error } = await supabase.auth.signOut({ scope: 'local' });
        if (error) throw error;
      }

      // 2. Clear app auth state.
      setUser(null);

      // 3. Clear cached local/session auth data + the offline grace window so a
      //    signed-out device can't keep playing or auto-restore the session.
      clearEntitlementVerified();
      if (typeof window !== 'undefined') {
        const keysToRemove = [
          'userEmail', 'email', 'user_email', 'user', 'profile',
          'subscription', 'stripe', 'trial', 'account', 'session',
        ];
        keysToRemove.forEach((key) => {
          try { localStorage.removeItem(key); } catch {}
          try { sessionStorage.removeItem(key); } catch {}
        });
      }

      // 4. Hard-redirect to /login. Using location.replace (not router.push)
      //    drops the player from history so Back can't return to it, and fully
      //    tears down cached player state. Works in the browser, Capacitor
      //    (iPhone/iPad) and the desktop wrapper, which all run a web view.
      if (typeof window !== 'undefined') {
        window.location.replace('/login');
      } else {
        router.replace('/login');
      }
      // Note: we intentionally do NOT clear isSigningOut here - the page is
      // navigating away, so the button stays in its "Signing out…" state.
    } catch (err) {
      console.error('[v0] sign out failed:', err);
      setSignOutError('Sign out failed. Please try again.');
      setIsSigningOut(false);
    }
  };

  // Mask an email for display, e.g. "chris@example.com" -> "c***@example.com".
  const maskEmail = (email: string) => {
    const [local, domain] = email.split('@');
    if (!domain) return email;
    const first = local.slice(0, 1);
    return `${first}${'*'.repeat(Math.max(1, local.length - 1))}@${domain}`;
  };

  // Open the Change Password dialog. We resolve the authenticated email fresh
  // from Supabase (never trust only cached state) so the confirmation shows the
  // real account address the link will be sent to.
  const openChangePassword = async () => {
    setChangePwError(null);
    setChangePwStep('confirm');

    if (isV0Preview) {
      setChangePwEmail(user?.email ?? 'you@example.com');
      setShowChangePasswordModal(true);
      return;
    }

    if (!supabase) {
      setChangePwEmail(user?.email ?? null);
      setShowChangePasswordModal(true);
      return;
    }

    try {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      const email = authUser?.email ?? user?.email ?? null;
      setChangePwEmail(email);
    } catch {
      setChangePwEmail(user?.email ?? null);
    }
    setShowChangePasswordModal(true);
  };

  // Send the email-ownership confirmation link. This is the SAME Supabase
  // recovery mechanism as Forgot Password (no custom token system); the actual
  // password change only happens on /reset-password. `?source=settings` lets the
  // reset page tailor its copy. A 60s cooldown throttles repeated sends.
  const sendChangePasswordEmail = async () => {
    if (changePwCooldown > 0 || changePwLoading) return;
    setChangePwError(null);
    setChangePwLoading(true);

    const email = changePwEmail;
    if (!email) {
      setChangePwError('Unable to send the confirmation email. Please try again.');
      setChangePwLoading(false);
      return;
    }

    if (isV0Preview) {
      setChangePwStep('sent');
      setChangePwLoading(false);
      setChangePwCooldown(60);
      return;
    }

    if (!supabase) {
      setChangePwError('Unable to send the confirmation email. Please try again.');
      setChangePwLoading(false);
      return;
    }

    // Inside Capacitor, window.location.origin is capacitor://localhost (not a
    // valid redirect), so the mobile build always points at the production web
    // reset page. On web we use the current origin so local + prod both work.
    const isMobileBuildLocal = process.env.NEXT_PUBLIC_BUILD_TARGET === 'mobile';
    const redirectTo = isMobileBuildLocal
      ? 'https://www.eqho-player.com/reset-password?source=settings'
      : `${window.location.origin}/reset-password?source=settings`;

    try {
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, { redirectTo });
      if (resetError) {
        const message = (resetError.message || '').toLowerCase();
        if (message.includes('rate') || message.includes('too many') || (resetError as { status?: number }).status === 429) {
          setChangePwError('Too many attempts. Please wait a few minutes before requesting another email.');
        } else {
          setChangePwError('Unable to send the confirmation email. Please try again.');
        }
        setChangePwLoading(false);
        return;
      }
      setChangePwStep('sent');
      setChangePwLoading(false);
      setChangePwCooldown(60);
    } catch {
      setChangePwError('Unable to send the confirmation email. Please try again.');
      setChangePwLoading(false);
    }
  };

  // Resend cooldown ticker.
  useEffect(() => {
    if (changePwCooldown <= 0) return;
    const t = setTimeout(() => setChangePwCooldown((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [changePwCooldown]);

  const handleDeleteAccount = async () => {
    setDeleteAccountLoading(true);
    try {
      const result = await deleteAccount();
      if (result.success) {
        router.push('/login');
        router.refresh();
      } else {
        alert(result.error || 'Failed to delete account');
      }
    } catch (error) {
      console.error('Delete account error:', error);
      alert('An error occurred while deleting your account');
    } finally {
      setDeleteAccountLoading(false);
      setShowDeleteAccountConfirm(false);
    }
  };

  // Cancel the subscription at period end via the Stripe-connected server action.
  // Stripe sets cancel_at_period_end=true and its webhook updates Supabase; we
  // refetch the subscription so the UI reflects the new state.
  const handleCancelSubscription = async () => {
    if (cancelSubLoading) return;
    setSubActionError(null);
    setCancelSubLoading(true);
    try {
      const result = await cancelSubscription();
      if (result.error) {
        console.log("[v0] cancel subscription error:", result.error);
        setSubActionError(result.error);
      } else {
        setSubCancelPending(true);
        await refetchSubscription();
        setShowCancelSubConfirm(false);
      }
    } catch (err) {
      console.error("[v0] cancel subscription failed:", err);
      setSubActionError("Failed to cancel subscription. Please try again.");
    } finally {
      setCancelSubLoading(false);
    }
  };

  // Resume a subscription that was scheduled to cancel (Stripe
  // cancel_at_period_end=false), then refetch so the UI updates.
  const handleResumeSubscription = async () => {
    if (resumeSubLoading) return;
    setSubActionError(null);
    setResumeSubLoading(true);
    try {
      const result = await resumeSubscription();
      if (result.error) {
        console.log("[v0] resume subscription error:", result.error);
        setSubActionError(result.error);
      } else {
        setSubCancelPending(false);
        await refetchSubscription();
      }
    } catch (err) {
      console.error("[v0] resume subscription failed:", err);
      setSubActionError("Failed to resume subscription. Please try again.");
    } finally {
      setResumeSubLoading(false);
    }
  };

  // Keep currentIndex in sync with the track that is ACTUALLY loaded/playing.
  // currentTrack is the source of truth (it's what the <audio> element has loaded).
  // When the playlist is reordered, the playing track moves to a new array slot,
  // so we re-derive currentIndex from currentTrack rather than overwriting
  // currentTrack from a possibly-stale currentIndex (which caused the title/audio desync).
  useEffect(() => {
    if (playlist.length === 0) return;
    if (currentTrack) {
      const realIndex = playlist.findIndex((t) => t.id === currentTrack.id);
      if (realIndex >= 0) {
        if (realIndex !== currentIndex) setCurrentIndex(realIndex);
      } else {
        // The playing track is no longer in the playlist (e.g. removed) -
        // fall back to whatever currently sits at currentIndex.
        if (currentIndex >= 0 && currentIndex < playlist.length) {
          setCurrentTrack(playlist[currentIndex]);
        }
      }
    } else if (currentIndex >= 0 && currentIndex < playlist.length) {
      // No track selected yet - seed from the index.
      setCurrentTrack(playlist[currentIndex]);
    }
  }, [currentIndex, currentTrack, playlist]);

  // Track if initial load has completed
  const [playlistLoaded, setPlaylistLoaded] = useState(false);

  // Load current playlist from IndexedDB on mount (before save effect runs)
  useEffect(() => {
    const loadCurrentPlaylist = async () => {
      try {
        const cached = await getCurrentPlaylistWithFiles();
        if (cached.length > 0) {
          const restored = cached.map((t) => ({
            id: t.id,
            title: t.title,
            sub: t.sub || "Uploaded Track",
            duration: t.duration || formatDuration(t.durationSeconds),
            fileName: t.fileName,
            url: URL.createObjectURL(t.file),
            durationSeconds: t.durationSeconds,
            uploadedAt: t.uploadedAt,
            file: t.file,
          }));
          setPlaylist(restored);
          // Restore the saved playlist name so the session card shows the correct title
          try {
            const savedName = localStorage.getItem("currentPlaylistName");
            if (savedName) setCurrentPlaylistName(savedName);
          } catch {}
        }
      } catch (error) {
        console.error("Failed to load current playlist:", error);
      } finally {
        setPlaylistLoaded(true);
      }
    };

    loadCurrentPlaylist();
  }, []);

  // Save current playlist to IndexedDB when it changes (only after initial load)
  useEffect(() => {
    if (!playlistLoaded) return; // Don't save until initial load completes
    
    if (playlist.length > 0) {
      saveCurrentPlaylistWithFiles(
        playlist.map((t) => ({
          id: t.id,
          title: t.title,
          fileName: t.fileName,
          durationSeconds: t.durationSeconds,
          uploadedAt: t.uploadedAt,
          file: t.file!,
        }))
      );
    } else {
      clearCachedPlaylist();
    }
  }, [playlist, playlistLoaded]);

  // Persist the current playlist name so the session title survives reloads
  useEffect(() => {
    if (!playlistLoaded) return;
    try {
      if (playlist.length > 0) {
        localStorage.setItem("currentPlaylistName", currentPlaylistName);
      } else {
        localStorage.removeItem("currentPlaylistName");
      }
    } catch {}
  }, [currentPlaylistName, playlist.length, playlistLoaded]);

  // Fullscreen toggle function
  const toggleFullscreen = useCallback(async () => {
    if (!isFullscreen) {
      // Enter fullscreen
      setIsFullscreen(true);
      // Try browser fullscreen API if available
      if (fullscreenRef.current && document.fullscreenEnabled) {
        try {
          await fullscreenRef.current.requestFullscreen();
        } catch {
          // Browser fullscreen failed, but we still show our fullscreen view
        }
      }
    } else {
      // Exit fullscreen
      setIsFullscreen(false);
      if (document.fullscreenElement) {
        try {
          await document.exitFullscreen();
        } catch {
          // Ignore exit errors
        }
      }
    }
  }, [isFullscreen]);

  // Listen for fullscreen changes (e.g., user presses Escape)
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  // iPad Safari Coach View height (section 6). `100dvh` is unreliable across iPadOS
  // Safari versions as the toolbar shows/hides: the Coach overlay could grow taller
  // than the visible viewport, pushing its own bottom controls off-screen. While a
  // Coach view is active we publish the REAL visual-viewport height as
  // `--coach-viewport-height` and recompute it on resize / orientationchange /
  // visualViewport resize+scroll. The overlay uses this var (falling back to 100dvh),
  // so its bottom controls always sit inside the visible area. Scoped to Coach only.
  useEffect(() => {
    const coachActive = isFullscreen || showFullscreenMobilePlayer;
    if (!coachActive || typeof window === "undefined") return;
    const vv = window.visualViewport;
    const setVH = () => {
      const h = vv?.height ?? window.innerHeight;
      document.documentElement.style.setProperty(
        "--coach-viewport-height",
        `${Math.round(h)}px`,
      );
    };
    setVH();
    window.addEventListener("resize", setVH);
    window.addEventListener("orientationchange", setVH);
    vv?.addEventListener("resize", setVH);
    vv?.addEventListener("scroll", setVH);
    return () => {
      window.removeEventListener("resize", setVH);
      window.removeEventListener("orientationchange", setVH);
      vv?.removeEventListener("resize", setVH);
      vv?.removeEventListener("scroll", setVH);
      document.documentElement.style.removeProperty("--coach-viewport-height");
    };
  }, [isFullscreen, showFullscreenMobilePlayer]);

  // Coach Mode body scroll-lock. When either the mobile/iPad Coach overlay
  // (showFullscreenMobilePlayer) or the desktop Coach overlay (isFullscreen) is
  // active we lock the underlying document so the hidden Playing page cannot be
  // scrolled or "peek" behind the overlay on iPad Safari, then restore the exact
  // prior scroll position on close. This does NOT touch the <audio> element or any
  // playback state — it only freezes the background document.
  useEffect(() => {
    const coachActive = isFullscreen || showFullscreenMobilePlayer;
    if (!coachActive) return;

    const scrollY = window.scrollY;
    const { body } = document;
    const prev = {
      overflow: body.style.overflow,
      position: body.style.position,
      top: body.style.top,
      width: body.style.width,
    };
    // Fully immobilise the background document (belt-and-braces for iOS Safari,
    // where `overflow: hidden` alone does not always stop touch scrolling).
    body.style.overflow = 'hidden';
    body.style.position = 'fixed';
    body.style.top = `-${scrollY}px`;
    body.style.width = '100%';

    let raf = 0;
    if (process.env.NODE_ENV !== 'production') {
      const vv = typeof window !== 'undefined' ? window.visualViewport : null;
      console.log('[v0] IPAD COACH MODE OPEN', {
        coachModeActive: coachActive,
        isFullscreen,
        showFullscreenMobilePlayer,
        viewportW: window.innerWidth,
        viewportH: window.innerHeight,
        visualViewportW: vv?.width,
        visualViewportH: vv?.height,
        orientation:
          window.innerWidth >= window.innerHeight ? 'landscape' : 'portrait',
      });
      // Count VISIBLE (not display:none) coach overlays vs normal layouts after
      // paint. When Coach Mode is active this must be exactly 1 coach root and 0
      // visible normal layouts — proving the "replace, don't overlay" behaviour.
      raf = requestAnimationFrame(() => {
        const isVisible = (el: Element) => (el as HTMLElement).offsetParent !== null
          || getComputedStyle(el as HTMLElement).position === 'fixed';
        const coachRoots = [...document.querySelectorAll('[data-coach-overlay]')]
          .filter((el) => getComputedStyle(el as HTMLElement).display !== 'none');
        const normalVisible = [...document.querySelectorAll('[data-normal-layout]')]
          .filter(isVisible);
        console.log('[v0] IPAD COACH MODE DOM COUNTS', {
          coachRootsMounted: coachRoots.length,
          normalLayoutsVisible: normalVisible.length,
          expected: 'coachRootsMounted=1, normalLayoutsVisible=0',
        });
      });
    }

    // Single unified cleanup: cancel any pending diagnostic frame AND restore the
    // background document exactly as it was, including the prior scroll position.
    return () => {
      if (raf) cancelAnimationFrame(raf);
      body.style.overflow = prev.overflow;
      body.style.position = prev.position;
      body.style.top = prev.top;
      body.style.width = prev.width;
      window.scrollTo(0, scrollY);
      if (process.env.NODE_ENV !== 'production') {
        console.log('[v0] IPAD COACH MODE CLOSE', { restoredScrollY: scrollY });
      }
    };
  }, [isFullscreen, showFullscreenMobilePlayer]);

  const trackProgress =
    Number.isFinite(trackDuration) && trackDuration > 0
      ? Math.min(Math.max((currentTime / trackDuration) * 100, 0), 100)
      : 0;

  const remainingTime = Math.max(trackDuration - currentTime, 0);

  const formatDuration = (seconds = 0) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const formatSessionTime = (seconds = 0) => {
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    if (hours >= 1) {
      return `${hours}h ${mins}min`;
    }
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  // Current Playlist computed values (full playlist - unchanged for saved playlist display)
  const trackCount = playlist.length;

  const totalRoutineSeconds = playlist.reduce(
    (total, track) => total + (track.durationSeconds),
    0
  );

  // Session-only computed values (visible tracks only - excludes hidden)
  const visibleTrackCount = visiblePlaylist.length;
  const visibleRoutineSeconds = visiblePlaylist.reduce(
    (total, track) => total + track.durationSeconds,
    0
  );
  const visibleGapSeconds = visibleTrackCount > 1 ? (visibleTrackCount - 1) * gapSeconds : 0;
  const visibleSessionSeconds = visibleRoutineSeconds + visibleGapSeconds;

  const totalGapSeconds = trackCount > 1 ? (trackCount - 1) * gapSeconds : 0;

  const estimatedSessionSeconds = totalRoutineSeconds + totalGapSeconds;

  // Calculate full session time including repeats and back-to-back (using visible tracks only)
  const totalVisibleTracksWithRepeats = visibleTrackCount * playlistRepeats * (backToBack ? 2 : 1);
  const fullSessionSeconds = 
    visibleRoutineSeconds * playlistRepeats * (backToBack ? 2 : 1) +
    Math.max(0, totalVisibleTracksWithRepeats - 1) * gapSeconds;

  // Calculate completed tracks across all rounds (using visible playlist)
  const currentRoundIndex = playlistRound - 1;
  const tracksCompletedInPreviousRounds = currentRoundIndex * visibleTrackCount * (backToBack ? 2 : 1);
  
  // Find current track's position in visible playlist
  const currentVisibleIndex = currentTrack ? visiblePlaylist.findIndex(t => t.id === currentTrack.id) : -1;
  const visibleTracksCompleted = tracksCompletedInPreviousRounds + Math.max(0, currentVisibleIndex);

  // Real-time progress: sum of completed visible tracks' durations + current track elapsed time
  const completedSeconds = visiblePlaylist
    .slice(0, Math.max(0, currentVisibleIndex))
    .reduce((sum, t) => sum + t.durationSeconds, 0);
  const previousRoundsSeconds = currentRoundIndex * visibleRoutineSeconds * (backToBack ? 2 : 1);
  const completedGapSeconds = visibleTracksCompleted > 0 ? visibleTracksCompleted * gapSeconds : 0;
  const elapsedSeconds = previousRoundsSeconds + completedSeconds + completedGapSeconds + currentTime;

  const progressPercent = fullSessionSeconds > 0
    ? Math.min(100, Math.round((elapsedSeconds / fullSessionSeconds) * 100))
    : 0;

  const remainingSeconds = Math.max(0, fullSessionSeconds - elapsedSeconds);
  
  // Track completion count for display
  const completedTracks = currentIndex;

  // Display labels - use visible playlist for accurate session data
  const currentPlaylistDisplayName =
    playlist.length > 0 ? currentPlaylistName : "No playlist selected";

  const trackCountLabel =
    `${visibleTrackCount} ${visibleTrackCount === 1 ? "track" : "tracks"}`;

  const routineTimeLabel = formatSessionTime(visibleRoutineSeconds);

  const estimatedSessionLabel = formatSessionTime(fullSessionSeconds);

  const remainingTimeLabel = formatDuration(remainingSeconds);

  const handleFiles = (fileList: FileList | null) => {
    const files = Array.from(fileList || []).filter((file) =>
      file.type.startsWith("audio/")
    );

    files.forEach((file) => {
      const url = URL.createObjectURL(file);
      const audio = new Audio(url);

      audio.onloadedmetadata = async () => {
        const newTrack: Track = {
          id: crypto.randomUUID(),
          title: file.name.replace(/\.[^/.]+$/, ""),
          sub: "Uploaded Track",
          duration: formatDuration(Math.round(audio.duration)),
          fileName: file.name,
          url,
          durationSeconds: Math.round(audio.duration),
          uploadedAt: new Date().toISOString(),
          file,
        };

        setUploadedTracks((current) => [...current, newTrack]);
      };
    });
  };

  const handleTrackUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    handleFiles(event.target.files);
    event.target.value = "";
  };

  const [isDraggingUpload, setIsDraggingUpload] = useState(false);
  const [showStopConfirm, setShowStopConfirm] = useState(false);
  // Mobile-only: whether the bottom control bar settings (Gap/B2B/Time/Reps)
  // grid is expanded. When collapsed, only the session button remains, and the
  // orange divider line acts as the collapse/expand handle.
  const [bottomBarExpanded, setBottomBarExpanded] = useState(true);
  // Ref to the fixed mobile session-controls bar. We MEASURE its real rendered
  // height (which varies by device safe-area and expanded/collapsed state) and
  // publish it as the CSS var `--mobile-controls-height`, so the scrollable
  // page content can reserve exactly the right amount of space instead of a
  // hardcoded guess that let the bar cover the final playlist on iPhone.
  const mobileControlsRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (typeof window === "undefined") return;
    const el = mobileControlsRef.current;
    if (!el) return;
    const setVar = () => {
      const h = el.offsetHeight;
      if (h > 0) {
        document.documentElement.style.setProperty("--mobile-controls-height", `${h}px`);
      }
    };
    setVar();
    // Re-measure whenever the bar itself resizes (expand/collapse, font scaling).
    const ro = typeof ResizeObserver !== "undefined" ? new ResizeObserver(setVar) : null;
    ro?.observe(el);
    window.addEventListener("resize", setVar);
    window.addEventListener("orientationchange", setVar);
    // A late relayout (safe-area insets settle after first paint on iOS) — remeasure.
    const t = window.setTimeout(setVar, 300);
    return () => {
      ro?.disconnect();
      window.removeEventListener("resize", setVar);
      window.removeEventListener("orientationchange", setVar);
      window.clearTimeout(t);
    };
  }, [bottomBarExpanded]);
  const [draggedTrackIndex, setDraggedTrackIndex] = useState<number | null>(null);
  const [dropTargetIndex, setDropTargetIndex] = useState<number | null>(null);
  const [dropPosition, setDropPosition] = useState<"above" | "below">("below");
  const dropPositionRef = useRef<"above" | "below">("below");

  // Save saved playlists to IndexedDB when they change (with full track data).
  // Skip the very first render (before the on-mount load effect has restored the
  // cache) so we never clobber stored playlists with the initial empty array.
  const savedPlaylistsHydrated = useRef(false);
  useEffect(() => {
    // Ignore the initial empty state until the load effect has run once; after
    // that, ALWAYS persist — including the empty array. Previously this was
    // guarded by `savedPlaylists.length > 0`, which meant deleting your LAST
    // playlist never wrote through, so IndexedDB kept the stale copy and the
    // deletion "came back" on refresh/app restart.
    if (!savedPlaylistsHydrated.current) {
      savedPlaylistsHydrated.current = true;
      if (savedPlaylists.length === 0) return; // nothing loaded yet — don't wipe
    }
    if (savedPlaylists.length === 0) {
      // Deleted the last playlist: empty the store so it stays deleted.
      clearSavedPlaylists().catch((err) =>
        console.error("[v0] DELETE persist: failed clearing saved playlists store", err)
      );
      return;
    }
    saveSavedPlaylistsWithTracks(
      savedPlaylists.map((pl) => ({
        id: pl.id,
        name: pl.name,
        tracks: pl.tracks.map((t) => ({
          id: t.id,
          title: t.title,
          fileName: t.fileName,
          durationSeconds: t.durationSeconds,
          uploadedAt: t.uploadedAt,
          file: t.file!,
        })),
      }))
    );
  }, [savedPlaylists]);

  // Load saved playlists from IndexedDB on mount
  useEffect(() => {
    const loadSavedPlaylistsData = async () => {
      try {
        const cached = await getSavedPlaylistsWithTracks();
        if (cached.length > 0) {
          const restored = cached.map((pl) => ({
            id: pl.id,
            name: pl.name,
            tracks: pl.tracks.map((t) => ({
              id: t.id,
              title: t.title,
              sub: t.sub || "Uploaded Track",
              duration: t.duration || formatDuration(t.durationSeconds),
              fileName: t.fileName,
              url: URL.createObjectURL(t.file),
              durationSeconds: t.durationSeconds,
              uploadedAt: t.uploadedAt,
              file: t.file,
            })),
          }));
          setSavedPlaylists(restored);
        }
      } catch (error) {
        console.error("Failed to load saved playlists:", error);
      }
    };

    loadSavedPlaylistsData();
  }, []);

  // Restore the small "Download to Device" status map (lightweight UI metadata only;
  // the actual offline audio lives in IndexedDB via savedPlaylists).
  useEffect(() => {
    try {
      const raw = localStorage.getItem('eqho-device-downloads');
      if (raw) setDeviceDownloads(JSON.parse(raw));
    } catch {
      /* ignore */
    }
  }, []);

  // Persist the status map whenever it changes.
  useEffect(() => {
    try {
      localStorage.setItem('eqho-device-downloads', JSON.stringify(deviceDownloads));
    } catch {
      /* ignore */
    }
  }, [deviceDownloads]);

  // On launch, verify downloaded playlists still have valid local audio files.
  // If a playlist marked "downloaded" is missing/corrupted locally, flip it to
  // failed (red icon) so the user knows to re-download.
  const verifiedDownloadsRef = useRef(false);
  useEffect(() => {
    if (verifiedDownloadsRef.current) return;
    if (savedPlaylists.length === 0 && Object.keys(deviceDownloads).length === 0) return;
    verifiedDownloadsRef.current = true;

    setDeviceDownloads(prev => {
      let changed = false;
      const next = { ...prev };
      for (const [plId, record] of Object.entries(prev)) {
        if (record.status !== 'downloaded') continue;
        const local = savedPlaylists.find(p => p.id === plId);
        // Valid if the playlist exists locally with at least one real, non-empty file.
        const valid =
          !!local &&
          local.tracks.length > 0 &&
          local.tracks.every(t => t.file instanceof File && t.file.size > 0);
        if (!valid) {
          console.log(`[v0][device-download] Launch verify: "${local?.name ?? plId}" missing/corrupted — marking failed`);
          next[plId] = { signature: '', status: 'failed' };
          changed = true;
        }
      }
      return changed ? next : prev;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [savedPlaylists]);

  // Cloud sync: Fetch cloud playlists on mount (for logged-in users)
  useEffect(() => {
    const loadCloudPlaylists = async () => {
      if (!user || !isCloudSyncAvailable()) return;
      
      try {
        const playlists = await fetchCloudPlaylists();
        setCloudPlaylists(playlists);
      } catch (error) {
        console.error("Failed to load cloud playlists:", error);
      }
    };

    loadCloudPlaylists();
  }, [user]);

  // Cloud sync handlers
  // Refresh per-playlist cloud signatures whenever the set of cloud playlists changes
  // so each card can show an accurate "Upload to Cloud" / "Push Updates" / "Synced" state.
  useEffect(() => {
    if (isMobileBuild) return;
    if (cloudPlaylists.length === 0) {
      setCloudSignatures({});
      return;
    }
    let cancelled = false;
    fetchCloudPlaylistSignatures()
      .then((sigs) => { if (!cancelled) setCloudSignatures(sigs); })
      .catch(() => { /* non-fatal: cards just fall back to default state */ });
    return () => { cancelled = true; };
  }, [cloudPlaylists, isMobileBuild]);

  // Find the cloud playlist that corresponds to a local one. After upload the cloud
  // id may be a server-generated UUID (different from the local id), so match by id
  // first and fall back to matching by name.
  const findCloudPlaylistFor = (localPlaylist: { id: string; name: string }) =>
    cloudPlaylists.find(cp => cp.id === localPlaylist.id) ||
    cloudPlaylists.find(cp => cp.name === localPlaylist.name);

  // "Cloud Available" playlists: exist in the cloud but are NOT present on this
  // device yet. Match by id OR name (an uploaded playlist keeps its local id while
  // the cloud copy gets a server UUID), so a synced local playlist never also
  // appears as a duplicate cloud-only card.
  const cloudOnlyPlaylists = cloudPlaylists.filter(
    cp => !savedPlaylists.some(sp => sp.id === cp.id || sp.name === cp.name)
  );

  // Per-playlist cloud sync status:
  //  - 'new'      => never uploaded                 => "Upload to Cloud"
  //  - 'modified' => in cloud but tracks differ     => "Push Updates"
  //  - 'synced'   => playlist + tracks match cloud   => blue "Synced", no upload button
  const getPlaylistCloudStatus = (localPlaylist: { id: string; name: string; tracks: Array<{ title: string; fileName: string }> }): 'new' | 'modified' | 'synced' => {
    const cloud = findCloudPlaylistFor(localPlaylist);
    if (!cloud) return 'new';
    const localKeys = localPlaylist.tracks.map(t => localTrackKey(t.title, t.fileName));
    const cloudKeys = cloudSignatures[cloud.id] || [];
    const matches =
      localKeys.length === cloudKeys.length &&
      localKeys.every((k, i) => k === cloudKeys[i]);
    return matches ? 'synced' : 'modified';
  };

  const handleSyncPlaylistToCloud = async (playlistId: string) => {
    if (isMobileBuild) return; // Read-only on mobile
    
    const localPlaylist = savedPlaylists.find(p => p.id === playlistId);
    if (!localPlaylist) return;

    // Capture whether this playlist already exists in the cloud so we can show the
    // correct success message: pushing updates vs a first-time upload.
    const wasModified = getPlaylistCloudStatus(localPlaylist) === 'modified';

    setSyncingPlaylistId(playlistId);
    setSyncStatus('syncing');
    setPushStatus((prev) => ({ ...prev, [playlistId]: 'pushing' }));
    setCloudSaveSuccess(false);
    setCloudSaveMessage(`Syncing ${localPlaylist.name}...`);

    try {
      const result = await syncPlaylistToCloud({
        id: localPlaylist.id,
        name: localPlaylist.name,
        tracks: localPlaylist.tracks.map(t => ({
          id: t.id,
          title: t.title,
          fileName: t.fileName,
          durationSeconds: t.durationSeconds,
          uploadedAt: t.uploadedAt,
          file: t.file!,
        })),
      });

      // Requirement #5: a partial failure (some tracks failed) is treated as
      // unsuccessful and must NOT be marked as fully synced.
      const partialFailure = result.success && (result.failedTracks ?? 0) > 0;

      if (result.success && !partialFailure) {
        setSyncStatus('success');
        setPushStatus((prev) => ({ ...prev, [playlistId]: 'success' }));
        // Single-playlist success messages (green banner via cloudSaveSuccess).
        setCloudSaveMessage(
          wasModified
            ? 'Updates pushed successfully'
            : `Uploaded ${localPlaylist.name} successfully`
        );
        setCloudSaveSuccess(true);
        // Refresh cloud playlists so the card flips to the blue "Synced" state.
        const playlists = await fetchCloudPlaylists();
        setCloudPlaylists(playlists);
        // Auto-clear the green "Push Successful" state so the card returns to the
        // "Synced" pill shortly after.
        setTimeout(() => {
          setPushStatus((prev) => {
            if (prev[playlistId] !== 'success') return prev;
            const next = { ...prev };
            delete next[playlistId];
            return next;
          });
        }, 2500);
      } else {
        setSyncStatus('error');
        setPushStatus((prev) => ({ ...prev, [playlistId]: 'failed' }));
        setCloudSaveSuccess(false);
        setCloudSaveMessage(
          partialFailure
            ? `Some tracks failed to upload for ${localPlaylist.name}`
            : `Failed to sync ${localPlaylist.name}`
        );
        // Refresh cloud state so partially-synced playlists keep a non-synced status.
        if (partialFailure) {
          try {
            const playlists = await fetchCloudPlaylists();
            setCloudPlaylists(playlists);
          } catch { /* non-fatal */ }
        }
      }
    } catch (error) {
      console.error("Sync failed:", error);
      setSyncStatus('error');
      setPushStatus((prev) => ({ ...prev, [playlistId]: 'failed' }));
      setCloudSaveSuccess(false);
      setCloudSaveMessage(`Failed to sync ${localPlaylist.name}`);
    } finally {
      setTimeout(() => {
        setSyncingPlaylistId(null);
        setSyncStatus('idle');
      }, 2000);
    }
  };

  // "Sync All": upload/sync every local playlist that is not fully synced.
  // Covers new playlists, playlists with new tracks, changed track order, and
  // renamed/updated metadata. Already-synced/unchanged tracks are skipped by the
  // uploader (it matches by title + fileName), so nothing is re-uploaded needlessly.
  const handleSyncAll = async () => {
    if (isMobileBuild || isSyncingAll) return;

    // Only sync playlists that aren't already fully synced ('new' or 'modified').
    const playlistsToSync = savedPlaylists.filter(
      (pl) => getPlaylistCloudStatus(pl) !== 'synced'
    );

    if (playlistsToSync.length === 0) {
      setCloudSaveSuccess(true);
      setCloudSaveMessage('All playlists already synced');
      setTimeout(() => setCloudSaveMessage(null), 4000);
      return;
    }

    setIsSyncingAll(true);
    setCloudSaveSuccess(false);
    // Reset push status only for the playlists we're about to (re)sync.
    setPushStatus((prev) => {
      const next = { ...prev };
      for (const pl of playlistsToSync) next[pl.id] = 'pushing';
      return next;
    });

    const total = playlistsToSync.length;
    let syncedCount = 0;
    const failed: { id: string; name: string }[] = [];
    const succeeded: string[] = [];

    for (let i = 0; i < total; i++) {
      const pl = playlistsToSync[i];
      // Show clear progress ("Syncing 1 of 4", ...).
      setSyncAllProgress({ current: i + 1, total });
      setCloudSaveMessage(`Syncing ${i + 1} of ${total}...`);

      try {
        const result = await syncPlaylistToCloud({
          id: pl.id,
          name: pl.name,
          tracks: pl.tracks.map((t) => ({
            id: t.id,
            title: t.title,
            fileName: t.fileName,
            durationSeconds: t.durationSeconds,
            uploadedAt: t.uploadedAt,
            file: t.file!,
          })),
        });

        // Requirement #5: partial failure counts as unsuccessful.
        const partialFailure = result.success && (result.failedTracks ?? 0) > 0;

        if (result.success && !partialFailure) {
          // Requirement #7: mark this card green "Push Successful".
          syncedCount++;
          succeeded.push(pl.id);
          setPushStatus((prev) => ({ ...prev, [pl.id]: 'success' }));
        } else {
          // Requirement #8: one failure must not stop the whole sync.
          // Requirement #7: mark this card red "Push Unsuccessful".
          failed.push({ id: pl.id, name: pl.name });
          setPushStatus((prev) => ({ ...prev, [pl.id]: 'failed' }));
          console.error(`[v0][sync-all] Failed to sync "${pl.name}"`);
        }
      } catch (error) {
        failed.push({ id: pl.id, name: pl.name });
        setPushStatus((prev) => ({ ...prev, [pl.id]: 'failed' }));
        console.error(`[v0][sync-all] Error syncing "${pl.name}":`, error);
      }
    }

    // Refresh cloud status/count so cards reflect the synced state.
    try {
      const playlists = await fetchCloudPlaylists();
      setCloudPlaylists(playlists);
    } catch {
      /* non-fatal: signatures effect will retry on next change */
    }

    // Auto-clear the green "Push Successful" states so successful cards revert to the
    // "Synced" pill. Failed cards stay red until the user retries.
    setTimeout(() => {
      setPushStatus((prev) => {
        const next = { ...prev };
        for (const id of succeeded) {
          if (next[id] === 'success') delete next[id];
        }
        return next;
      });
    }, 2500);

    if (failed.length === 0) {
      // Requirement #7: green success summary.
      setCloudSaveSuccess(true);
      setCloudSaveMessage(`${syncedCount} / ${total} playlists synced`);
    } else {
      setCloudSaveSuccess(false);
      const failedNames = failed.map((f) => f.name).join(', ');
      setCloudSaveMessage(
        `${syncedCount} / ${total} synced — failed: ${failedNames}`
      );
    }

    setIsSyncingAll(false);
    setSyncAllProgress(null);
    setTimeout(() => setCloudSaveMessage(null), 6000);
  };

  // Toggle a playlist card's full track list (collapsed shows 2 tracks).
  const togglePlaylistExpanded = (playlistId: string) => {
    setExpandedPlaylistIds((prev) => {
      const next = new Set(prev);
      if (next.has(playlistId)) next.delete(playlistId);
      else next.add(playlistId);
      return next;
    });
  };

  // Permanently delete ONE track from a playlist. Order matters:
  //   1. If the track exists in the cloud, delete it there first (authoritative
  //      Supabase metadata delete via supabase-js + best-effort R2 object delete).
  //      If that Supabase delete fails, we DO NOT remove it locally and surface
  //      an error — so the two never drift out of sync.
  //   2. Local-only tracks (never uploaded) skip the cloud step entirely.
  //   3. On success, remove it from local state (the savedPlaylists effect
  //      re-persists IndexedDB) and refresh cloud playlists.
  const handleDeleteTrackPermanently = async (playlistId: string, track: Track) => {
    console.log("[v0] DELETE request started", { trackId: track.id, title: track.title, playlistId });
    setDeletingTrackId(track.id);
    // Stable identity key so we can also purge copies in the active session queue
    // / library that may carry a different generated id than the saved-playlist row.
    const wantKey = localTrackKey(track.title, track.fileName);
    try {
      const localPlaylist = savedPlaylists.find((p) => p.id === playlistId);
      const cloud = localPlaylist ? findCloudPlaylistFor(localPlaylist) : undefined;

      // Match the local track to its cloud row by id, else by title::fileName.
      let cloudTrack: CloudPlaylistTrack | undefined;
      if (cloud) {
        cloudTrack =
          cloud.tracks.find((ct) => ct.id === track.id) ||
          cloud.tracks.find((ct) => localTrackKey(ct.title, ct.fileName) === wantKey);
      }

      if (cloudTrack) {
        // Authoritative cloud delete (Supabase metadata) + best-effort R2 object.
        const { supabaseOk, r2Ok } = await deleteTrackFromCloudDirect(cloudTrack.id, cloudTrack.storage_path);
        console.log("[v0] DELETE storage records (cloud) result", { supabaseOk, r2Ok, storage_path: cloudTrack.storage_path });
        if (!supabaseOk) {
          // D.11: cloud deletion failed for an uploaded track — keep it everywhere
          // and surface the exact failure. Do NOT pretend it succeeded.
          setCloudSaveMessage(`Couldn't delete "${track.title}" from the cloud. It was NOT removed. Please try again.`);
          setCloudSaveSuccess(false);
          setTimeout(() => setCloudSaveMessage(null), 6000);
          console.error("[v0] DELETE aborted: cloud metadata delete failed; track kept intact");
          return;
        }
        if (!r2Ok) {
          console.warn(`[v0] DELETE: track "${track.title}" metadata deleted; R2 object delete was best-effort and did not confirm`);
        }
      } else {
        console.log("[v0] DELETE: no cloud copy found — treating as local/offline-only track");
      }

      // Remove from the SAVED playlist (state change triggers the IndexedDB persist
      // effect, which drops the stored File = offline copy for this track).
      setSavedPlaylists((prev) =>
        prev.map((p) =>
          p.id === playlistId ? { ...p, tracks: p.tracks.filter((t) => t.id !== track.id) } : p
        )
      );

      // Remove any copy from the ACTIVE session queue and the uploaded-library, so
      // it disappears from Now Playing / Up Next and the numbering recalculates
      // (indices are derived from array position at render time).
      const matches = (t: Track) => t.id === track.id || localTrackKey(t.title, t.fileName) === wantKey;
      setPlaylist((prev) => prev.filter((t) => !matches(t)));
      setOriginalPlaylistOrder((prev) => prev.filter((t) => !matches(t)));
      setUploadedTracks((prev) => prev.filter((t) => !matches(t)));
      // If the deleted track is the one loaded in the player, clear it.
      if (currentTrack && matches(currentTrack)) {
        const audio = audioRef.current;
        if (audio) { try { audio.pause(); } catch {} }
        setIsPlaying(false);
        setCurrentTrack(null);
      }

      // Refresh cloud playlists so counts/previews reflect the deletion.
      try {
        const playlists = await fetchCloudPlaylists();
        setCloudPlaylists(playlists);
      } catch (err) {
        console.warn('[v0] handleDeleteTrackPermanently: failed to refresh cloud playlists', err);
      }

      console.log("[v0] DELETE completed", { trackId: track.id, title: track.title });
      setCloudSaveMessage(`Deleted "${track.title}"`);
      setCloudSaveSuccess(true);
      setTimeout(() => setCloudSaveMessage(null), 3000);
    } catch (err) {
      console.error('[v0] DELETE failed:', (err as Error)?.message || String(err));
      setCloudSaveMessage(`Couldn't delete "${track.title}". Please try again.`);
      setCloudSaveSuccess(false);
      setTimeout(() => setCloudSaveMessage(null), 6000);
    } finally {
      setDeletingTrackId(null);
      setConfirmDeleteTrack(null);
    }
  };

  const handleDownloadCloudPlaylist = async (playlistId: string) => {
    console.log("[v0] DOWNLOAD handler started", { playlistId });
    setDownloadingPlaylistId(playlistId);
    // Clear any previous inline result for this button so the spinner shows cleanly.
    setCloudDownloadResult((prev) => {
      if (!prev[playlistId]) return prev;
      const next = { ...prev };
      delete next[playlistId];
      return next;
    });

    try {
      const { playlist: localPlaylist, failedTracks, reason } = await fetchPlaylistWithFilesDetailed(playlistId);
      if (localPlaylist) {
        // Convert to the format expected by savedPlaylists. The object URL makes
        // the restored audio immediately playable; the savedPlaylists effect
        // persists the files into IndexedDB.
        const newPlaylist = {
          id: localPlaylist.id,
          name: localPlaylist.name,
          tracks: localPlaylist.tracks.map(t => ({
            id: t.id,
            title: t.title,
            sub: "Cloud Track",
            duration: formatDuration(t.durationSeconds),
            fileName: t.fileName,
            url: URL.createObjectURL(t.file),
            durationSeconds: t.durationSeconds,
            uploadedAt: t.uploadedAt,
            file: t.file,
          })),
        };

        // Add to savedPlaylists (or update if exists)
        setSavedPlaylists(prev => {
          const exists = prev.find(p => p.id === playlistId);
          if (exists) {
            return prev.map(p => p.id === playlistId ? newPlaylist : p);
          }
          return [...prev, newPlaylist];
        });

        console.log(`[v0][cloud-restore] Final restored playlist count: 1 ("${newPlaylist.name}")`);
        if (failedTracks.length > 0) {
          console.log('[v0][cloud-restore] Failed tracks:', failedTracks);
          const msg = `Restored ${newPlaylist.name} (${failedTracks.length} track${failedTracks.length === 1 ? '' : 's'} failed)`;
          setCloudSaveMessage(msg);
          setCloudSaveSuccess(false);
          setCloudDownloadResult((prev) => ({ ...prev, [playlistId]: { ok: false, message: msg } }));
        } else {
          const msg = `Downloaded ${newPlaylist.name} to this device`;
          setCloudSaveMessage(msg);
          setCloudSaveSuccess(true);
          setCloudDownloadResult((prev) => ({ ...prev, [playlistId]: { ok: true, message: msg } }));
        }
        console.log("[v0] DOWNLOAD handler completed", { playlistId, failed: failedTracks.length });
        setTimeout(() => setCloudSaveMessage(null), 5000);
      } else {
        // No audio could be downloaded — do not create an empty playlist folder.
        // Show WHY, using the reason classified during the download attempt.
        console.log('[v0][cloud-restore] Failed tracks:', failedTracks, 'reason:', reason);
        const reasonMessage: Record<string, string> = {
          'access-denied': "Can't download — this playlist was uploaded by a different account.",
          'not-configured': 'Cloud storage is not configured. Please contact support.',
          'missing': 'The audio files for this playlist are no longer in cloud storage.',
          'offline': 'Download failed. Check your connection and try again.',
        };
        const failMsg =
          (reason && reasonMessage[reason]) ||
          (failedTracks.length > 0
            ? `Could not restore playlist — ${failedTracks.length} track(s) failed to download`
            : 'Could not restore playlist from cloud');
        setCloudSaveMessage(failMsg);
        setCloudSaveSuccess(false);
        setCloudDownloadResult((prev) => ({ ...prev, [playlistId]: { ok: false, message: failMsg } }));
        console.log("[v0] DOWNLOAD handler completed (no audio downloaded)", { playlistId, reason });
        setTimeout(() => setCloudSaveMessage(null), 6000);
      }
    } catch (error) {
      const detail = (error as Error)?.message || String(error);
      console.error("[v0] DOWNLOAD handler error:", detail);
      const failMsg = `Download failed: ${detail}`;
      setCloudSaveMessage(failMsg);
      setCloudSaveSuccess(false);
      setCloudDownloadResult((prev) => ({ ...prev, [playlistId]: { ok: false, message: failMsg } }));
      setTimeout(() => setCloudSaveMessage(null), 6000);
    } finally {
      setDownloadingPlaylistId(null);
    }
  };

  // Signature of a local playlist's track identity + order, used to detect whether
  // a device download is still current ("Downloaded") or stale ("Update").
  const playlistSignature = (pl: { tracks: Array<{ title: string; fileName: string }> }) =>
    pl.tracks.map(t => localTrackKey(t.title, t.fileName)).join('|');

  // Returns the Download-to-Device status for a left-list playlist.
  const getDeviceDownloadState = (
    localPlaylist: { id: string; name: string; tracks: Array<{ title: string; fileName: string }> }
  ): 'download' | 'downloading' | 'queued' | 'downloaded' | 'update' | 'failed' => {
    if (downloadingPlaylistId === localPlaylist.id) return 'downloading';
    if (downloadQueue.includes(localPlaylist.id)) return 'queued';
    const record = deviceDownloads[localPlaylist.id];
    if (!record) return 'download';
    if (record.status === 'failed') return 'failed';
    // Downloaded previously — if the playlist's tracks changed, offer an Update.
    return record.signature === playlistSignature(localPlaylist) ? 'downloaded' : 'update';
  };

  // "Download to Device": fetch the exact playlist's tracks from Supabase, download
  // the real audio from Cloudflare R2, and store everything locally (IndexedDB via
  // savedPlaylists) so the playlist plays offline from local files first.
  const handleDownloadToDevice = async (localPlaylist: { id: string; name: string; tracks: Array<{ title: string; fileName: string }> }) => {
    if (downloadingPlaylistId) return;

    // 1. Find that exact playlist's cloud record.
    const cloud = findCloudPlaylistFor(localPlaylist);
    if (!cloud) {
      setDeviceDownloads(prev => ({ ...prev, [localPlaylist.id]: { signature: '', status: 'failed' } }));
      setCloudSaveMessage(`"${localPlaylist.name}" is not in the cloud yet — upload it first`);
      setCloudSaveSuccess(false);
      setTimeout(() => setCloudSaveMessage(null), 4000);
      return;
    }

    setDownloadingPlaylistId(localPlaylist.id);
    setDownloadProgress(prev => ({ ...prev, [localPlaylist.id]: 0 }));
    try {
      // 2 + 3. Fetch tracks from Supabase and download real audio files from R2,
      // reporting per-track progress so the icon tooltip can show a percentage.
      const { playlist: restored, failedTracks } = await fetchPlaylistWithFilesDetailed(
        cloud.id,
        (completed, total) => {
          const pct = total > 0 ? Math.round((completed / total) * 100) : 0;
          setDownloadProgress(prev => ({ ...prev, [localPlaylist.id]: pct }));
        }
      );

      if (restored && restored.tracks.length > 0) {
        // 4 + 5. Save audio + metadata locally with the same order/title/duration.
        // The savedPlaylists effect persists the File objects into IndexedDB.
        const downloaded = {
          id: localPlaylist.id,
          name: restored.name,
          tracks: restored.tracks.map(t => ({
            id: t.id,
            title: t.title,
            sub: "Downloaded Track",
            duration: formatDuration(t.durationSeconds),
            fileName: t.fileName,
            url: URL.createObjectURL(t.file),
            durationSeconds: t.durationSeconds,
            uploadedAt: t.uploadedAt,
            file: t.file,
          })),
        };

        // 6. Replace the local playlist so playback uses the local downloaded file first.
        setSavedPlaylists(prev => {
          const exists = prev.some(p => p.id === localPlaylist.id);
          return exists
            ? prev.map(p => p.id === localPlaylist.id ? downloaded : p)
            : [...prev, downloaded];
        });

        const allOk = failedTracks.length === 0;
        setDeviceDownloads(prev => ({
          ...prev,
          [localPlaylist.id]: {
            signature: playlistSignature(downloaded),
            status: allOk ? 'downloaded' : 'failed',
          },
        }));
        setCloudSaveMessage(
          allOk
            ? `Downloaded "${downloaded.name}" to this device`
            : `Downloaded "${downloaded.name}" (${failedTracks.length} track${failedTracks.length === 1 ? '' : 's'} failed)`
        );
        setCloudSaveSuccess(allOk);
        setTimeout(() => setCloudSaveMessage(null), 5000);
        // 10. Do not autoplay anything after download.
      } else {
        setDeviceDownloads(prev => ({ ...prev, [localPlaylist.id]: { signature: '', status: 'failed' } }));
        setCloudSaveMessage(`Failed to download "${localPlaylist.name}" to this device`);
        setCloudSaveSuccess(false);
        setTimeout(() => setCloudSaveMessage(null), 5000);
      }
    } catch (error) {
      console.error("[v0][device-download] Failed:", error);
      setDeviceDownloads(prev => ({ ...prev, [localPlaylist.id]: { signature: '', status: 'failed' } }));
      setCloudSaveMessage(`Failed to download "${localPlaylist.name}" to this device`);
      setCloudSaveSuccess(false);
      setTimeout(() => setCloudSaveMessage(null), 4000);
    } finally {
      setDownloadingPlaylistId(null);
      setDownloadProgress(prev => {
        const next = { ...prev };
        delete next[localPlaylist.id];
        return next;
      });
      // Remove from the queue and start the next queued playlist, if any.
      setDownloadQueue(prev => prev.filter(id => id !== localPlaylist.id));
    }
  };

  // Drain the download queue one playlist at a time (serial downloads).
  useEffect(() => {
    if (downloadingPlaylistId) return; // a download is already running
    if (downloadQueue.length === 0) return;
    const nextId = downloadQueue[0];
    const pl = savedPlaylists.find(p => p.id === nextId);
    if (pl) {
      void handleDownloadToDevice(pl);
    } else {
      // Playlist no longer exists; drop it from the queue.
      setDownloadQueue(prev => prev.filter(id => id !== nextId));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [downloadQueue, downloadingPlaylistId]);

  // Enqueue a playlist for offline download (used by the compact status icon).
  const enqueueDeviceDownload = (localPlaylist: { id: string }) => {
    setDownloadQueue(prev => (prev.includes(localPlaylist.id) ? prev : [...prev, localPlaylist.id]));
  };
  const handleDownloadAllPlaylists = async () => {
    if (isExporting) return;

    if (savedPlaylists.length === 0) {
      setCloudSaveMessage('No playlists to download');
      setTimeout(() => setCloudSaveMessage(null), 3000);
      return;
    }

    setIsExporting(true);
    setCloudSaveMessage('Preparing playlist...');

    try {
      const { default: JSZip } = await import('jszip');
      const zip = new JSZip();

      // Sanitize a string so it is safe to use as a file/folder name in the ZIP
      const sanitize = (name: string) =>
        (name || 'Untitled').replace(/[\/\\?%*:|"<>]/g, '-').trim();

      // Derive a file extension from the original fileName (default to mp3)
      const getExt = (fileName: string) => {
        const match = /\.([a-zA-Z0-9]+)$/.exec(fileName || '');
        return match ? match[1].toLowerCase() : 'mp3';
      };

      // When there is more than one saved playlist, nest each in its own folder.
      const multiple = savedPlaylists.length > 1;

      // Count total tracks for progress reporting
      const totalTracks = savedPlaylists.reduce((sum, pl) => sum + pl.tracks.length, 0);
      let processed = 0;
      const missingTracks: string[] = [];

      for (const playlist of savedPlaylists) {
        const folder = multiple ? zip.folder(sanitize(playlist.name)) : zip;
        if (!folder) continue;

        // playlist_info.json (metadata only) inside each playlist
        folder.file(
          'playlist_info.json',
          JSON.stringify(
            {
              name: playlist.name,
              trackCount: playlist.tracks.length,
              exportedAt: new Date().toISOString(),
              tracks: playlist.tracks.map((t, i) => ({
                order: i + 1,
                title: t.title,
                fileName: t.fileName,
                durationSeconds: t.durationSeconds,
              })),
            },
            null,
            2
          )
        );

        for (let i = 0; i < playlist.tracks.length; i++) {
          const track = playlist.tracks[i];
          processed++;
          setCloudSaveMessage(`Adding ${processed} of ${totalTracks} tracks...`);

          let blob: Blob | null = null;

          // 1) Prefer the locally stored File/Blob reference if available
          if (track.file instanceof Blob) {
            blob = track.file;
          } else if (track.url) {
            // 2) Otherwise fetch from its storage URL (cloud or object URL) and convert to Blob
            try {
              const res = await fetch(track.url);
              if (res.ok) {
                blob = await res.blob();
              }
            } catch (err) {
              console.log('[v0] Failed to fetch track for ZIP:', track.title, err);
            }
          }

          if (!blob) {
            missingTracks.push(track.title || track.fileName);
            continue;
          }

          const order = String(i + 1).padStart(2, '0');
          const ext = getExt(track.fileName);
          folder.file(`${order} - ${sanitize(track.title)}.${ext}`, blob);
        }
      }

      // If nothing could be added, stop and warn
      if (processed > 0 && missingTracks.length === totalTracks) {
        setCloudSaveMessage('Some audio files could not be found. Please re-upload missing tracks before downloading.');
        setTimeout(() => setCloudSaveMessage(null), 6000);
        setIsExporting(false);
        return;
      }

      setCloudSaveMessage('Creating ZIP...');
      const content = await zip.generateAsync({ type: 'blob' });

      const date = new Date().toISOString().split('T')[0];
      const zipName = multiple
        ? `EQHO-Playlists-${date}.zip`
        : `EQHO-Playlist-${sanitize(savedPlaylists[0].name)}-${date}.zip`;

      const url = URL.createObjectURL(content);
      const a = document.createElement('a');
      a.href = url;
      a.download = zipName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      if (missingTracks.length > 0) {
        setCloudSaveMessage('Some audio files could not be found. Please re-upload missing tracks before downloading.');
        setTimeout(() => setCloudSaveMessage(null), 6000);
      } else {
        setCloudSaveMessage('Download ready');
        setTimeout(() => setCloudSaveMessage(null), 3000);
      }
    } catch (error) {
      console.error("Export failed:", error);
      setCloudSaveMessage('Export failed');
      setTimeout(() => setCloudSaveMessage(null), 3000);
    } finally {
      setIsExporting(false);
    }
  };

  // Build a lookup of original audio File objects straight from IndexedDB, which is
  // the authoritative local store. Files are keyed by track id AND by fileName so we
  // can resolve them even when the in-memory React state has lost its live File
  // reference or its blob: URL has been revoked.
  const buildIndexedDbFileMap = async (): Promise<{
    byId: Map<string, File>;
    byName: Map<string, File>;
  }> => {
    const byId = new Map<string, File>();
    const byName = new Map<string, File>();

    try {
      // Robustly read the raw records from the eqho-player-db savedPlaylists and
      // currentQueue stores and extract a File from whatever audio representation
      // each track holds (File / Blob / ArrayBuffer / audioData / url). This also
      // emits the detailed [v0] logging (db opened, store counts, per-track source).
      const localFiles = await getAllLocalAudioFiles();
      for (const lf of localFiles) {
        if (lf.id) byId.set(lf.id, lf.file);
        if (lf.fileName) byName.set(lf.fileName, lf.file);
      }
    } catch (err) {
      console.log('[v0] buildIndexedDbFileMap: failed reading audio from IndexedDB', err);
    }

    return { byId, byName };
  };

  // Resolve a usable File for a track from any available audio source, in priority:
  // 1) a live File/Blob reference, 2) the original File in IndexedDB (by id/fileName),
  // 3) a fetchable URL (blob:/object URL/cloud). This ensures cloud sync uploads the
  // actual local audio and never skips a track just because file_url/url is missing.
  const resolveTrackFileForSync = async (
    track: any,
    idbFiles: { byId: Map<string, File>; byName: Map<string, File> }
  ): Promise<File | undefined> => {
    // 1) Prefer an existing File/Blob reference held in memory
    if (track.file instanceof File) return track.file;
    if (track.file instanceof Blob) {
      return new File([track.file], track.fileName || 'audio', {
        type: track.file.type || 'audio/mpeg',
      });
    }

    // 2) Look up the original File in IndexedDB (authoritative local store)
    const fromIdb =
      (track.id && idbFiles.byId.get(track.id)) ||
      (track.fileName && idbFiles.byName.get(track.fileName));
    if (fromIdb) return fromIdb;

    // 3) Otherwise fetch from its URL (blob:/object URL/cloud) and convert to a File
    if (track.url) {
      try {
        const res = await fetch(track.url);
        if (res.ok) {
          const blob = await res.blob();
          return new File([blob], track.fileName || 'audio', {
            type: blob.type || 'audio/mpeg',
          });
        }
      } catch (err) {
        console.log('[v0] resolveTrackFileForSync: failed to fetch track audio', track.title, err);
      }
    }
    return undefined;
  };

  // Build sync-ready playlists using EXACTLY the same source that renders the
  // visible Playlists sidebar: the `savedPlaylists` state array. We never scan
  // IndexedDB for arbitrary objects, so the current queue, session state, player
  // settings, coach settings, profiles, cloud manifests, and metadata-only/old
  // playlists are all excluded. IndexedDB is only consulted to resolve each
  // visible track's audio File (never to discover playlists).
  const buildPlaylistsToSync = async () => {
    // The sidebar renders `savedPlaylists.map(...)` directly, so these names are
    // exactly what the user sees.
    console.log(
      `[v0] buildPlaylistsToSync: visible sidebar playlists (${savedPlaylists.length}):`,
      savedPlaylists.map((p) => p.name)
    );

    // Audio is resolved from IndexedDB only for tracks that belong to visible playlists.
    const idbFiles = await buildIndexedDbFileMap();

    const resolved = await Promise.all(
      savedPlaylists.map(async (pl) => {
        const hasName = typeof pl.name === 'string' && pl.name.trim().length > 0;
        const hasTracksArray = Array.isArray(pl.tracks);
        const tracks = hasTracksArray
          ? await Promise.all(
              pl.tracks.map(async (track: any) => ({
                id: track.id,
                title: track.title,
                fileName: track.fileName,
                durationSeconds: track.durationSeconds,
                uploadedAt: track.uploadedAt,
                file: await resolveTrackFileForSync(track, idbFiles),
              }))
            )
          : [];
        const tracksWithAudio = tracks.filter((t) => t.file);
        return { pl, hasName, hasTracksArray, tracks, tracksWithAudio };
      })
    );

    const playlistsToUpload: { id: string; name: string; tracks: any[] }[] = [];

    for (const { pl, hasName, hasTracksArray, tracks, tracksWithAudio } of resolved) {
      // Only upload objects that are real, visible playlist folders with audio.
      if (!hasName) {
        console.log(`[v0] buildPlaylistsToSync: SKIP playlist id=${pl.id} — reason: no playlist name`);
        continue;
      }
      if (!hasTracksArray) {
        console.log(`[v0] buildPlaylistsToSync: SKIP "${pl.name}" — reason: no real tracks array`);
        continue;
      }
      if (tracksWithAudio.length === 0) {
        console.log(`[v0] buildPlaylistsToSync: SKIP "${pl.name}" — reason: no track with audio data (${tracks.length} track(s), 0 with audio)`);
        continue;
      }
      // Upload only the tracks that actually have audio.
      playlistsToUpload.push({ id: pl.id, name: pl.name, tracks: tracksWithAudio });
    }

    const totalTracks = playlistsToUpload.reduce((n, p) => n + p.tracks.length, 0);
    console.log(
      `[v0] buildPlaylistsToSync: selected ${playlistsToUpload.length} playlist(s) for upload with ${totalTracks} audio track(s):`,
      playlistsToUpload.map((p) => `${p.name} (${p.tracks.length})`)
    );
    return playlistsToUpload;
  };

  // Handler for Upload to Cloud button - uploads playlists to R2 storage
  const handleUploadToCloud = async () => {
    if (isUploadingToCloud) return;
    
    setIsUploadingToCloud(true);
    setCloudSaveSuccess(false);
    setCloudSaveMessage('Uploading to cloud...');
    
    try {
      if (!isCloudStorageAvailable()) {
        setCloudSaveMessage('Cloud storage not configured');
        setTimeout(() => setCloudSaveMessage(null), 3000);
        return;
      }

      // Prepare playlists for upload using ONLY the visible sidebar playlists
      // (savedPlaylists). IndexedDB is consulted only to resolve each track's audio.
      const playlistsToSync = await buildPlaylistsToSync();

      // Upload ONLY playlists + audio + a simple manifest. We intentionally do NOT
      // sync profiles, coach_settings, subscription, or player settings.
      const result = await syncAllPlaylistsToCloud(playlistsToSync);
      console.log('[v0] handleUploadToCloud: result', result);

      // Total visible playlists we attempted to sync (matches the sidebar folders).
      const totalPlaylists = playlistsToSync.length;
      const syncedPlaylists = result.syncedPlaylists;

      if (result.success && syncedPlaylists >= totalPlaylists && totalPlaylists > 0) {
        // All visible playlists synced successfully -> green banner.
        setCloudSaveMessage(`Uploaded ${syncedPlaylists}/${totalPlaylists} playlists successfully`);
        setCloudSaveSuccess(true);
        const playlists = await fetchCloudPlaylists();
        setCloudPlaylists(playlists);
      } else if (result.success) {
        // Succeeded but not every visible playlist synced -> keep pink (partial).
        setCloudSaveMessage(`Uploaded ${syncedPlaylists}/${totalPlaylists} playlists`);
        setCloudSaveSuccess(false);
        const playlists = await fetchCloudPlaylists();
        setCloudPlaylists(playlists);
      } else if (result.errors && result.errors.length > 0) {
        // Show the real reason (e.g. R2 not configured) rather than a misleading success.
        setCloudSaveMessage(result.errors[0]);
        setCloudSaveSuccess(false);
      } else {
        setCloudSaveMessage('Upload completed with some errors');
        setCloudSaveSuccess(false);
      }
      
      setTimeout(() => setCloudSaveMessage(null), 5000);
    } catch (error) {
      console.error("Upload to cloud failed:", error);
      setCloudSaveSuccess(false);
      setCloudSaveMessage('Upload failed. Check your connection.');
      setTimeout(() => setCloudSaveMessage(null), 3000);
    } finally {
      setIsUploadingToCloud(false);
    }
  };

  // Handler for Download from Cloud button - downloads all playlists from R2
  const handleDownloadFromCloud = async () => {
    if (isDownloadingFromCloud) return;
    
    setIsDownloadingFromCloud(true);
    setCloudSaveSuccess(false);
    setCloudSaveMessage('Downloading from cloud...');
    
    try {
      if (!isCloudStorageAvailable()) {
        setCloudSaveMessage('Cloud storage not configured');
        setTimeout(() => setCloudSaveMessage(null), 3000);
        return;
      }

      const result = await downloadAllPlaylistsFromCloud();
      
      if (result.error) {
        setCloudSaveMessage(result.error);
        setTimeout(() => setCloudSaveMessage(null), 3000);
        return;
      }

      if (result.playlists.length > 0) {
        // Merge cloud playlists with local playlists (match by id or name so a
        // playlist already present locally isn't duplicated).
        const newPlaylists = result.playlists
          .filter(p => !savedPlaylists.some(sp => sp.id === p.id || sp.name === p.name))
          .map(p => ({
            id: p.id,
            name: p.name,
            tracks: p.tracks.map(t => ({
              id: t.id,
              title: t.title,
              sub: "Cloud Track",
              duration: formatDuration(t.durationSeconds),
              fileName: t.fileName,
              // Object URL so the restored audio is immediately playable.
              url: URL.createObjectURL(t.file),
              durationSeconds: t.durationSeconds,
              uploadedAt: t.uploadedAt,
              file: t.file,
            })),
          }));

        if (newPlaylists.length > 0) {
          // Each cloud playlist becomes its own separate local playlist folder.
          // The savedPlaylists effect persists them (with audio) into IndexedDB.
          setSavedPlaylists(prev => [...prev, ...newPlaylists]);
          console.log(`[v0][cloud-restore] Final restored playlist count: ${newPlaylists.length}`);
          const failNote = result.failedTracks.length > 0
            ? ` (${result.failedTracks.length} track${result.failedTracks.length === 1 ? '' : 's'} failed)`
            : '';
          setCloudSaveMessage(`Restored ${newPlaylists.length} playlist${newPlaylists.length === 1 ? '' : 's'} from cloud${failNote}`);
          setCloudSaveSuccess(result.failedTracks.length === 0);
        } else {
          setCloudSaveMessage('All cloud playlists already restored locally');
          setCloudSaveSuccess(true);
        }

        // Surface exactly which tracks failed to download.
        if (result.failedTracks.length > 0) {
          console.log('[v0][cloud-restore] Failed tracks:', result.failedTracks);
        }
      } else if (result.failedTracks.length > 0) {
        console.log('[v0][cloud-restore] Failed tracks:', result.failedTracks);
        setCloudSaveMessage(`No playlists restored — ${result.failedTracks.length} track(s) failed to download`);
        setCloudSaveSuccess(false);
      } else {
        setCloudSaveMessage('No playlists found in cloud');
      }
      
      setTimeout(() => setCloudSaveMessage(null), 5000);
    } catch (error) {
      console.error("Download from cloud failed:", error);
      setCloudSaveMessage('Download failed. Check your connection.');
      setTimeout(() => setCloudSaveMessage(null), 3000);
    } finally {
      setIsDownloadingFromCloud(false);
    }
  };

  // Handler for Push to Apps button (Desktop only) - Uses R2 + Supabase
  const handlePushToApps = async () => {
    if (isPushingToApps || isMobileBuild) return;
    
    setIsPushingToApps(true);
    setCloudSaveSuccess(false);
    setCloudSaveMessage('Uploading playlists to cloud...');
    
    try {
      // Check if cloud storage is available
      if (!isCloudStorageAvailable()) {
        setCloudSaveMessage('Cloud storage not configured. Please check your R2 settings.');
        setTimeout(() => setCloudSaveMessage(null), 4000);
        return;
      }

      // Prepare playlists for sync, resolving each track's audio from any
      // playable source (File, blob URL, object URL, cloud URL, or IndexedDB)
      // so the same tracks the player can queue are eligible for cloud sync.
      const playlistsToSync = await buildPlaylistsToSync();

      // Prepare coach settings
      const coachSettingsToSync = {
        gapSeconds: settings.gapSeconds,
        countdownEnabled: settings.showCountdown,
        countdownSeconds: settings.countdownSeconds,
        autoplayNext: settings.autoplayNext,
        backToBackDefault: settings.backToBack,
        showPauseWarning: settings.showPauseWarning,
        showSkipWarning: settings.showSkipWarning,
        playlistRepeats: settings.playlistRepeats,
      };

      // Sync all playlists to cloud (R2 for files, Supabase for metadata)
      const result = await syncAllPlaylistsToCloud(playlistsToSync, coachSettingsToSync);
      
      if (result.success) {
        setCloudSaveMessage(`${result.syncedPlaylists} playlist${result.syncedPlaylists !== 1 ? 's' : ''} synced (${result.totalUploaded} new tracks uploaded)`);
        // Refresh cloud playlists
        const playlists = await fetchCloudPlaylists();
        setCloudPlaylists(playlists);
      } else if (result.syncedPlaylists > 0) {
        setCloudSaveMessage(`${result.syncedPlaylists} playlist${result.syncedPlaylists !== 1 ? 's' : ''} synced with some errors`);
        const playlists = await fetchCloudPlaylists();
        setCloudPlaylists(playlists);
      } else {
        setCloudSaveMessage('No playlists to sync. Add tracks with audio files first.');
      }
      
      setTimeout(() => setCloudSaveMessage(null), 4000);
    } catch (error) {
      console.error("Push to apps failed:", error);
      setCloudSaveMessage('Unable to push playlists. Check your internet connection and try again.');
      setTimeout(() => setCloudSaveMessage(null), 4000);
    } finally {
      setIsPushingToApps(false);
    }
  };

  useEffect(() => {
    const preventBrowserFileOpen = (event: DragEvent) => {
      // Only prevent default behavior, don't stop propagation
      // so that our component's onDrop handlers still receive the event
      event.preventDefault();
    };
    
    window.addEventListener("dragover", preventBrowserFileOpen);
    window.addEventListener("drop", preventBrowserFileOpen);

    return () => {
      window.removeEventListener("dragover", preventBrowserFileOpen);
      window.removeEventListener("drop", preventBrowserFileOpen);
    };
  }, []);

  const handleDropUpload = async (event: React.DragEvent) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDraggingUpload(false);
    
    const items = event.dataTransfer?.items;
    const files = event.dataTransfer?.files;
    
    if (!items || items.length === 0) {
      // Fallback to files if items not available
      if (files && files.length > 0) {
        const audioFiles = Array.from(files).filter(file => 
          file.type.startsWith("audio/") || /\.(mp3|wav|m4a|flac|ogg|aac)$/i.test(file.name)
        );
        if (audioFiles.length > 0) {
          const playlistName = `Playlist ${savedPlaylists.length + 1}`;
          await createPlaylistFromFiles(playlistName, audioFiles);
        }
      }
      return;
    }

    // Check if any item is a directory (folder/playlist)
    const entries: FileSystemEntry[] = [];
    for (let i = 0; i < items.length; i++) {
      const entry = items[i].webkitGetAsEntry?.();
      if (entry) {
        entries.push(entry);
      }
    }

    // Process entries - separate folders from individual files
    const individualFiles: File[] = [];
    const folderEntries: { name: string; entry: FileSystemDirectoryEntry }[] = [];

    for (const entry of entries) {
      if (entry.isDirectory) {
        folderEntries.push({ name: entry.name, entry: entry as FileSystemDirectoryEntry });
      } else if (entry.isFile) {
        const fileEntry = entry as FileSystemFileEntry;
        const file = await new Promise<File>((resolve, reject) => {
          fileEntry.file(resolve, reject);
        });
        if (file.type.startsWith("audio/") || /\.(mp3|wav|m4a|flac|ogg|aac)$/i.test(file.name)) {
          individualFiles.push(file);
        }
      }
    }

    // Process individual files - add to uploadedTracks
    if (individualFiles.length > 0) {
      processFilesToUploadedTracks(individualFiles);
    }

    // Process folders as playlists - add to savedPlaylists.
    // A dropped folder that itself contains subfolders becomes ONE playlist per
    // subfolder (matching the folder picker behaviour), so a parent folder of
    // playlists no longer merges into a single giant playlist.
    for (const folder of folderEntries) {
      const groups = await getPlaylistGroupsFromDirectory(folder.entry, folder.name);
      console.log(`[v0][folder-upload] Dropped "${folder.name}" -> ${groups.length} playlist(s):`, groups.map(g => g.name));
      for (const group of groups) {
        if (group.files.length > 0) {
          await createPlaylistFromFiles(group.name, group.files);
        }
      }
    }
  };

  // Helper function to get all audio files from a directory recursively
  const getAudioFilesFromDirectory = async (dirEntry: FileSystemDirectoryEntry): Promise<File[]> => {
    const audioFiles: File[] = [];
    
    const readEntries = (reader: FileSystemDirectoryReader): Promise<FileSystemEntry[]> => {
      return new Promise((resolve, reject) => {
        reader.readEntries(resolve, reject);
      });
    };

    const processEntry = async (entry: FileSystemEntry): Promise<void> => {
      if (entry.isFile) {
        const fileEntry = entry as FileSystemFileEntry;
        const file = await new Promise<File>((resolve, reject) => {
          fileEntry.file(resolve, reject);
        });
        if (file.type.startsWith("audio/") || /\.(mp3|wav|m4a|flac|ogg|aac)$/i.test(file.name)) {
          audioFiles.push(file);
        }
      } else if (entry.isDirectory) {
        const subDirEntry = entry as FileSystemDirectoryEntry;
        const reader = subDirEntry.createReader();
        let subEntries = await readEntries(reader);
        while (subEntries.length > 0) {
          for (const subEntry of subEntries) {
            await processEntry(subEntry);
          }
          subEntries = await readEntries(reader);
        }
      }
    };

    const reader = dirEntry.createReader();
    let entryList = await readEntries(reader);
    while (entryList.length > 0) {
      for (const entry of entryList) {
        await processEntry(entry);
      }
      entryList = await readEntries(reader);
    }

    return audioFiles;
  };

  // Split a dropped directory into playlist groups:
  // - direct audio files in the folder -> one playlist named after the folder
  // - each immediate subfolder -> its own playlist (audio gathered recursively)
  // This handles both "drop a single playlist folder" and "drop a parent folder
  // containing many playlist subfolders".
  const getPlaylistGroupsFromDirectory = async (
    dirEntry: FileSystemDirectoryEntry,
    folderName: string
  ): Promise<{ name: string; files: File[] }[]> => {
    const readEntries = (reader: FileSystemDirectoryReader): Promise<FileSystemEntry[]> => {
      return new Promise((resolve, reject) => {
        reader.readEntries(resolve, reject);
      });
    };

    // Read this directory's immediate children.
    const children: FileSystemEntry[] = [];
    const reader = dirEntry.createReader();
    let batch = await readEntries(reader);
    while (batch.length > 0) {
      children.push(...batch);
      batch = await readEntries(reader);
    }

    const groups: { name: string; files: File[] }[] = [];

    // Direct audio files become a playlist named after this folder.
    const directFiles: File[] = [];
    for (const child of children) {
      if (child.isFile) {
        const fileEntry = child as FileSystemFileEntry;
        const file = await new Promise<File>((resolve, reject) => {
          fileEntry.file(resolve, reject);
        });
        if (file.type.startsWith("audio/") || /\.(mp3|wav|m4a|flac|ogg|aac)$/i.test(file.name)) {
          directFiles.push(file);
        }
      }
    }
    if (directFiles.length > 0) {
      groups.push({ name: folderName, files: directFiles });
    }

    // Each immediate subfolder becomes its own playlist (recursively gathering audio).
    for (const child of children) {
      if (child.isDirectory) {
        const subDir = child as FileSystemDirectoryEntry;
        const subFiles = await getAudioFilesFromDirectory(subDir);
        if (subFiles.length > 0) {
          groups.push({ name: child.name, files: subFiles });
        }
      }
    }

    return groups;
  };

  // Helper function to process files into uploadedTracks
  const processFilesToUploadedTracks = (files: File[]) => {
    files.forEach((file) => {
      const url = URL.createObjectURL(file);
      const audio = new Audio(url);

      audio.onloadedmetadata = () => {
        const newTrack: Track = {
          id: crypto.randomUUID(),
          title: file.name.replace(/\.[^/.]+$/, ""),
          sub: "Uploaded Track",
          duration: formatDuration(Math.round(audio.duration)),
          fileName: file.name,
          url,
          durationSeconds: Math.round(audio.duration),
          uploadedAt: new Date().toISOString(),
          file,
        };

        setUploadedTracks((current) => [...current, newTrack]);
      };
    });
  };

  // Helper function to create a playlist from files
  const createPlaylistFromFiles = async (playlistName: string, files: File[]): Promise<void> => {
    const tracks: Track[] = [];
    let processed = 0;

    return new Promise((resolve) => {
      if (files.length === 0) {
        resolve();
        return;
      }

      files.forEach((file) => {
        const url = URL.createObjectURL(file);
        const audio = new Audio(url);

        audio.onloadedmetadata = () => {
          const newTrack: Track = {
            id: crypto.randomUUID(),
            title: file.name.replace(/\.[^/.]+$/, ""),
            sub: playlistName,
            duration: formatDuration(Math.round(audio.duration)),
            fileName: file.name,
            url,
            durationSeconds: Math.round(audio.duration),
            uploadedAt: new Date().toISOString(),
            file,
          };
          tracks.push(newTrack);
          processed++;

          if (processed === files.length) {
            // Sort tracks by filename for consistent ordering
            tracks.sort((a, b) => a.fileName.localeCompare(b.fileName));
            
            const newPlaylist = {
              id: crypto.randomUUID(),
              name: playlistName,
              tracks,
            };
            setSavedPlaylists((prev) => [...prev, newPlaylist]);
            resolve();
          }
        };

        audio.onerror = () => {
          processed++;
          if (processed === files.length) {
            if (tracks.length > 0) {
              tracks.sort((a, b) => a.fileName.localeCompare(b.fileName));
              const newPlaylist = {
                id: crypto.randomUUID(),
                name: playlistName,
                tracks,
              };
              setSavedPlaylists((prev) => [...prev, newPlaylist]);
            }
            resolve();
          }
        };
      });
    });
  };

  // Group a flat webkitdirectory file list by each file's immediate parent folder,
  // then create ONE playlist per folder. This fixes the bug where selecting a parent
  // folder that contains multiple subfolders merged everything into a single playlist.
  // - "Parent/SubA/track.mp3" -> playlist "SubA"
  // - "Parent/track.mp3"      -> playlist "Parent"
  const createPlaylistsFromFolderSelection = async (files: File[]): Promise<void> => {
    if (files.length === 0) return;

    const groups = new Map<string, File[]>();
    for (const file of files) {
      const relPath = (file as File & { webkitRelativePath?: string }).webkitRelativePath || file.name;
      const segments = relPath.split("/").filter(Boolean);
      // Immediate parent folder of the file (most specific folder name).
      const folderName =
        segments.length >= 2
          ? segments[segments.length - 2]
          : segments[0]?.replace(/\.[^/.]+$/, "") || `Playlist ${savedPlaylists.length + 1}`;
      const arr = groups.get(folderName) || [];
      arr.push(file);
      groups.set(folderName, arr);
    }

    console.log(`[v0][folder-upload] ${files.length} file(s) grouped into ${groups.size} playlist(s):`, Array.from(groups.keys()));

    // Create each folder as its own separate playlist (sequentially so names/order are stable).
    for (const [folderName, folderFiles] of groups) {
      await createPlaylistFromFiles(folderName, folderFiles);
    }
  };

  const handleDragEnterUpload = (event: React.DragEvent) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDraggingUpload(true);
  };

  const handleDragLeaveUpload = (event: React.DragEvent) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDraggingUpload(false);
  };

  const handleDragOverUpload = (event: React.DragEvent) => {
    event.preventDefault();
    event.stopPropagation();
  };

  // True while we programmatically swap the audio source. Changing <audio>.src on a
  // playing element fires a transient `pause` event; this flag lets onPause ignore it
  // so the shared isPlaying state never flickers off during a track transition.
  const isTransitioningRef = useRef(false);
  // The exact URL we last assigned to the <audio> element. Comparing against this
  // is far more reliable than `audio.src === url`: the element's `.src` getter
  // returns a RESOLVED/normalized URL, which on the iOS Capacitor WKWebView does
  // NOT string-match the original blob:/capacitor: URL we stored on the track.
  // That mismatch made "resume" fall through to a full reload (or fail silently),
  // which is why play/pause appeared broken in the iPhone/iPad app.
  const loadedUrlRef = useRef<string>("");

  // Single, reliable way to load a track into the shared <audio> element and play
  // it. Every play path (start, skip, auto-advance, back-to-back, repeat) goes
  // through here.
  //
  // The track.url is ALWAYS a natively-playable source:
  //   • local uploads  -> blob:      (URL.createObjectURL(file))
  //   • cloud tracks    -> https:     (R2/Supabase)
  //   • offline saves   -> file:/capacitor: (Capacitor Filesystem)
  // We NEVER convert to a data: URL — iOS WKWebView rejects data: audio with
  // NotSupportedError / MediaError code 4 (readyState 0, networkState 3).
  //
  // CRITICAL for iOS/Capacitor: play() MUST be called synchronously inside the
  // user's tap, so we assign src and call play() immediately with no async work.
  const loadAndPlay = (track: Track, fromStart: boolean = true) => {
    const audio = audioRef.current;
    const url = track?.url;
    if (!audio || !url) return;

    // Inner routine: assign a KNOWN-playable src (never a data: URL) and play.
    // We always key loadedUrlRef on the ORIGINAL track.url so resume/same-track
    // checks stay consistent even when `src` is a converted blob URL.
    const startPlayback = (playableSrc: string) => {
      isTransitioningRef.current = true;
      if (loadedUrlRef.current !== url || audio.src !== playableSrc) {
        audio.src = playableSrc;
        loadedUrlRef.current = url;
        audio.load();
      }
      if (fromStart) {
        try { audio.currentTime = 0; } catch { /* ignore */ }
      }
      // safePlay logs the final src prefix and hard-guards against data: URLs.
      safePlay("loadAndPlay")
        .then(() => {
          console.log("[v0] audio play promise: success (loadAndPlay)");
          setIsPlaying(true);
          refreshAudioDiag("play() ok", "none");
        })
        .catch((error) => {
          const detail = `${error?.name || "Error"}: ${error?.message || String(error)}`;
          console.error("[v0] audio play promise: error (loadAndPlay):", detail);
          setIsPlaying(false);
          refreshAudioDiag("play() rejected", detail);
        })
        .finally(() => {
          isTransitioningRef.current = false;
        });
    };

    // NATIVE FORMAT FIX: on iOS, detect the REAL audio format from the file's
    // magic-number bytes and rebuild the blob URL with the correct MIME. This
    // fixes MediaError code 4 caused by files stored with an empty/generic or
    // mismatched MIME type. Uses a cached byte-sniffed result synchronously when
    // available (keeps the tap gesture); otherwise sniffs asynchronously.
    if (isNativePlatform() && track.file) {
      const cached = peekPlayableBuild(url);
      if (cached) {
        console.log(`[v0] loadAndPlay (cached) detected=${cached.detectedFormat} mime="${cached.correctedMime}" size=${cached.size} name="${cached.filename}"`);
        setFormatDiag(cached);
        startPlayback(cached.url);
      } else {
        buildCorrectedPlayableUrl(track.file, url)
          .then((res) => {
            console.log(`[v0] loadAndPlay sniff: name="${res.filename}" ext=${res.ext} detected=${res.detectedFormat} orig="${res.originalMime}" corrected="${res.correctedMime}" size=${res.size} first16=${res.first16Hex}`);
            setFormatDiag(res);
            startPlayback(res.url);
          })
          .catch((error) => {
            const message = (error as Error)?.message || String(error);
            console.error("[v0] loadAndPlay byte-sniff failed:", message);
            setIsPlaying(false);
            refreshAudioDiag("sniff failed", message);
            // Non-audio content (HTML fallback / corrupted download): prompt the
            // coach to re-download or re-upload instead of failing silently.
            if (message === NOT_AUDIO_MESSAGE) {
              setCloudSaveMessage(NOT_AUDIO_MESSAGE);
              setCloudSaveSuccess(false);
              setTimeout(() => setCloudSaveMessage(null), 6000);
            }
          });
      }
      return;
    }

    // iOS WKWebView cannot play data: URLs. For the normal blob:/https:/file:
    // case peekPlayableUrl returns the URL unchanged (synchronous, keeps the tap
    // gesture intact). For a legacy data: URL we convert it to a blob URL first
    // (async), which is unavoidable but only happens for old base64 tracks.
    const sync = peekPlayableUrl(url);
    if (sync) {
      startPlayback(sync);
    } else {
      toPlayableUrl(url)
        .then((blobUrl) => startPlayback(blobUrl))
        .catch((error) => {
          const detail = `convert failed: ${error?.message || String(error)}`;
          console.error("[v0] loadAndPlay data->blob conversion failed:", detail);
          setIsPlaying(false);
          refreshAudioDiag("convert failed", detail);
        });
    }
  };

  // Assign a natively-playable src to the shared <audio> element WITHOUT playing
  // (used by paused preload paths). Converts a legacy data: URL to a blob URL so
  // a later resume tap never hits an unplayable data: source. loadedUrlRef is
  // always keyed on the ORIGINAL url for resume/same-track consistency.
  const preloadPausedSrc = (url: string, file?: File | null) => {
    const audio = audioRef.current;
    if (!audio || !url) return;
    const assign = (playableSrc: string) => {
      audio.src = playableSrc;
      loadedUrlRef.current = url;
      try { audio.currentTime = 0; } catch { /* ignore */ }
      audio.load();
    };
    // NATIVE FORMAT FIX: prefer a byte-sniffed, MIME-corrected blob URL built
    // from the File so a later resume tap plays a decodable source. Use the
    // cached sniff result synchronously if present; otherwise sniff async.
    if (isNativePlatform() && file) {
      const cached = peekPlayableBuild(url);
      if (cached) {
        assign(cached.url);
      } else {
        buildCorrectedPlayableUrl(file, url)
          .then((res) => { setFormatDiag(res); assign(res.url); })
          .catch(() => { /* ignore */ });
      }
      return;
    }
    const sync = peekPlayableUrl(url);
    if (sync) {
      assign(sync);
    } else {
      toPlayableUrl(url).then(assign).catch(() => { /* ignore */ });
    }
  };

  // HARD SAFETY GUARD — call this INSTEAD of audioRef.current.play() everywhere.
  // Requirement: the final value assigned to HTMLAudioElement.src must NEVER begin
  // with "data:" on iOS (WKWebView rejects data: audio -> NotSupportedError /
  // MediaError code 4, readyState 0, networkState 3). Immediately before playing
  // we (1) log the exact src prefix, and (2) if it is a data: URL, synchronously
  // convert it to a blob: object URL and wait for that before calling play().
  const safePlay = async (context: string): Promise<void> => {
    const audio = audioRef.current;
    if (!audio) return;
    let src = audio.currentSrc || audio.src || "";
    // Log the exact prefix so the on-device panel / console shows what we play.
    console.log(`[v0] safePlay(${context}) final src prefix: "${src.slice(0, 32)}"`);
    if (src.startsWith("data:")) {
      console.warn(`[v0] safePlay(${context}) BLOCKED data: URL — converting to blob: before play`);
      refreshAudioDiag(`converting data: (${context})`);
      const blobUrl = await toPlayableUrl(src); // fetch -> Blob -> object URL
      audio.src = blobUrl;
      audio.load();
      src = blobUrl;
      console.log(`[v0] safePlay(${context}) converted src prefix: "${src.slice(0, 32)}"`);
    }

    // Inspect the actual bytes behind the current source so we can see whether
    // the <audio> element is being handed decodable media on device. Fetching a
    // blob:/https:/file: URL yields the underlying Blob (with its real MIME type
    // and byte size); a size of 0 or an empty type points at a bad/expired source.
    let probeBlob: Blob | null = null;
    try {
      const b = await fetch(src).then((res) => res.blob());
      probeBlob = b;
      console.log(`[v0] safePlay(${context}) blob.type: "${b.type}"`);
      console.log(`[v0] safePlay(${context}) blob.size: ${b.size}`);
      console.log(`[v0] safePlay(${context}) blob URL: "${src.slice(0, 48)}"`);
      setBlobDiag(b.type || "(empty)", b.size);
    } catch (probeErr) {
      console.log(`[v0] safePlay(${context}) blob probe failed:`, probeErr);
      setBlobDiag("probe failed", -1);
    }
    console.log(`[v0] safePlay(${context}) audio.currentSrc: "${(audio.currentSrc || "").slice(0, 48)}"`);
    console.log(`[v0] safePlay(${context}) readyState after load(): ${audio.readyState}`);
    console.log(`[v0] safePlay(${context}) networkState after load(): ${audio.networkState}`);
    console.log(`[v0] safePlay(${context}) audio.error (pre-play):`, audio.error?.code, audio.error?.message);

    // Attach ONE-SHOT lifecycle listeners for THIS load attempt so we can see, on
    // device, exactly how far decoding gets: loadedmetadata -> canplay ->
    // canplaythrough on success, or `error` (with the MediaError code) on failure.
    // Each fires at most once and cleans up the whole group to avoid leaks.
    const lifecycleEvents = ["loadedmetadata", "canplay", "canplaythrough", "error"] as const;
    const onLifecycle = (e: Event) => {
      if (e.type === "error") {
        const code = audio.error?.code ?? "?";
        const msg = audio.error?.message || "(no message)";
        console.log(`[v0] safePlay(${context}) LOAD error — MediaError code ${code}: ${msg}`);
        refreshAudioDiag(`load error code ${code}`, `MediaError ${code}: ${msg}`);
      } else {
        console.log(`[v0] safePlay(${context}) load event: ${e.type} (readyState ${audio.readyState})`);
        refreshAudioDiag(`load: ${e.type}`);
      }
      // canplaythrough or error is terminal for this attempt — tear down.
      if (e.type === "canplaythrough" || e.type === "error") {
        lifecycleEvents.forEach((ev) => audio.removeEventListener(ev, onLifecycle));
      }
    };
    lifecycleEvents.forEach((ev) => audio.addEventListener(ev, onLifecycle));
    // Safety net: remove listeners after 10s even if no terminal event fires.
    setTimeout(() => {
      lifecycleEvents.forEach((ev) => audio.removeEventListener(ev, onLifecycle));
    }, 10000);

    // Requirement: wait for the element to actually be ready to play (metadata
    // decoded) before calling play(), instead of racing play() against a source
    // that has not finished loading. We resolve as soon as readyState reaches
    // HAVE_CURRENT_DATA (>=2) or a canplay/loadedmetadata fires, with a bounded
    // timeout so we never hang if the media stalls. This runs shortly after the
    // user's tap; blob:/file: sources are local so readiness is near-instant.
    if (audio.readyState < 2) {
      await new Promise<void>((resolve) => {
        let settled = false;
        const done = () => {
          if (settled) return;
          settled = true;
          audio.removeEventListener("canplay", done);
          audio.removeEventListener("loadedmetadata", done);
          audio.removeEventListener("error", done);
          resolve();
        };
        audio.addEventListener("canplay", done, { once: true });
        audio.addEventListener("loadedmetadata", done, { once: true });
        audio.addEventListener("error", done, { once: true });
        setTimeout(done, 3000); // fail-safe: attempt play() regardless after 3s
      });
      console.log(`[v0] safePlay(${context}) readyState before play(): ${audio.readyState}`);
    }

    // Build/resume the Web Audio gain graph now, while we are still inside the
    // user's play gesture (iOS only allows AudioContext to start from a gesture).
    // Apply the current level immediately so the very first playback honors the
    // slider instead of defaulting to unity gain for a frame.
    const gain = ensureGainGraph();
    if (gain && audioCtxRef.current) {
      const normalized = Math.max(0, Math.min(1, volume / 100));
      audio.volume = 1;
      gain.gain.setValueAtTime(isMuted ? 0 : normalized, audioCtxRef.current.currentTime);
    }
    // Unlock the shared beep context in the SAME gesture so countdown beeps are
    // audible later (iOS requires the context to start from a user gesture).
    unlockBeepAudio();

    try {
      await audio.play();
    } catch (playErr) {
      // Surface the MediaError that WKWebView attaches to the element — this is
      // the most useful signal (code 4 = MEDIA_ERR_SRC_NOT_SUPPORTED on iOS).
      const code = audio.error?.code ?? "?";
      const msg = audio.error?.message || "(no message)";
      console.log(`[v0] safePlay(${context}) audio.error (post-play): code ${code}: ${msg}`);
      // Requirement 4: when playback fails, dump the exact MIME + first 32 bytes
      // so we can verify the underlying file is a valid, recognizable audio file
      // (e.g. "49 44 33" = "ID3" for MP3, "...66 74 79 70" = "ftyp" for MP4/M4A).
      try {
        const bytesBlob: Blob = probeBlob !== null ? probeBlob : await fetch(src).then((r) => r.blob());
        const hex = await firstBytesHex(bytesBlob, 32);
        console.log(`[v0] safePlay(${context}) FAILED blob.type="${bytesBlob.type}" size=${bytesBlob.size}`);
        console.log(`[v0] safePlay(${context}) FAILED first 32 bytes: ${hex}`);
        refreshAudioDiag(`play failed code ${code}`, `type=${bytesBlob.type} bytes=${hex.slice(0, 23)}…`);
      } catch (dumpErr) {
        console.log(`[v0] safePlay(${context}) byte dump failed:`, dumpErr);
      }
      throw playErr;
    }
  };

  // Start a brand-new "current" track (manual selection, skip, hide-advance, and
  // auto-advance all use this). Starting a different track ALWAYS begins a fresh
  // back-to-back cycle, so we clear the "already repeated" flag here. This is the
  // core fix for back-to-back: the flag can no longer leak across tracks.
  const playTrackFresh = (track: Track, index: number) => {
    if (!track?.url) return;
    // A different track always begins a fresh back-to-back cycle.
    b2bRepeatedTrackIdRef.current = null;
    setBackToBackPlayed(false);
    setCurrentIndex(index);
    setCurrentTrack(track);
    loadAndPlay(track, true);
  };

  // End the session cleanly (used by skip-to-end and auto-advance end-of-playlist).
  const endSession = () => {
    if (audioRef.current) audioRef.current.pause();
    setFinishedTracks(new Set(playlistRef.current.map((t) => t.id)));
    setIsPlaying(false);
    setSessionRunning(false);
    setPlaylistRound(1);
    b2bRepeatedTrackIdRef.current = null;
    setBackToBackPlayed(false);
    setShowSessionFinished(true);
  };

  // Synchronous (no async before play()) so the iOS tap gesture is preserved.
  const togglePlayPause = async (track: Track) => {
    // Native locked-screen session active: route controls to the native engine
    // instead of the JS <audio> element. Same track toggles pause/resume; a
    // different track restarts the native queue from that track's index.
    if (nativeSessionRef.current.activeRef.current) {
      if (currentTrack?.id === track.id) {
        if (isPlaying) await nativeSessionRef.current.pause();
        else await nativeSessionRef.current.play();
      } else {
        const idx = playlistRef.current.findIndex((t) => t.id === track.id);
        await startNativeSessionIfPossible(idx >= 0 ? idx : 0);
      }
      return;
    }

    const audio = audioRef.current;
    if (!audio || !track || !track.url) return;

    const sameTrack = currentTrack?.id === track.id;
    // Verify against the URL we actually loaded (tracked in loadedUrlRef), not the
    // element's `.src` getter: state can drift from the loaded source (e.g. after
    // "Send to Session" sets currentTrack without loading audio), and on the iOS
    // Capacitor WKWebView `audio.src` is normalized so it won't string-match the
    // stored blob URL. loadedUrlRef is the reliable source of truth.
    const srcLoaded = !!audio.src && loadedUrlRef.current === track.url;
    // Real element state — not React `isPlaying`, which can drift on mobile.
    const actuallyPlaying = !audio.paused && !audio.ended;

    // Pause toggle: only when the exact track is loaded AND currently playing.
    if (sameTrack && srcLoaded && actuallyPlaying) {
      audio.pause();
      setIsPlaying(false);
      return;
    }

    // Resume the same, already-loaded track from its current position.
    if (sameTrack && srcLoaded && !actuallyPlaying) {
      try {
        await safePlay("togglePlayPause resume");
        console.log("[v0] audio play promise: success (togglePlayPause resume)");
        setIsPlaying(true);
        refreshAudioDiag("resume ok", "none");
      } catch (error) {
        const detail = `${(error as Error)?.name || "Error"}: ${(error as Error)?.message || String(error)}`;
        console.error("[v0] audio play promise: error (togglePlayPause resume):", detail);
        setIsPlaying(false);
        refreshAudioDiag("resume rejected", detail);
      }
      return;
    }

    // A different track (or one not yet loaded): start it fresh.
    const trackIndex = playlist.findIndex((t) => t.id === track.id);
    playTrackFresh(track, trackIndex >= 0 ? trackIndex : currentIndex);
  };

  // Spacebar to toggle play/pause
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Only trigger if spacebar and not typing in an input/textarea
      if (e.code === 'Space' && 
          !(e.target instanceof HTMLInputElement) && 
          !(e.target instanceof HTMLTextAreaElement)) {
        e.preventDefault();
        if (currentTrack) {
          if (isPlaying && audioRef.current) {
            audioRef.current.pause();
            setIsPlaying(false);
          } else if (audioRef.current && currentTrack.url) {
            safePlay("spacebar").then(() => setIsPlaying(true)).catch(() => setIsPlaying(false));
          }
        }
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentTrack, isPlaying]);


  // TEMPORARY: attach diagnostic listeners to the single persistent <audio>
  // element so the on-device debug panel reflects the element's real lifecycle
  // (loadedmetadata, canplay, play, pause, ended, error, stalled, abort).
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    const events = [
      "loadedmetadata",
      "canplay",
      "play",
      "pause",
      "ended",
      "error",
      "stalled",
      "abort",
    ] as const;
    const handler = (e: Event) => {
      // For error events, also surface the MediaError detail.
      refreshAudioDiag(e.type);
    };
    events.forEach((ev) => audio.addEventListener(ev, handler));
    // Prime the panel with the current state on mount.
    refreshAudioDiag("mount");
    return () => {
      events.forEach((ev) => audio.removeEventListener(ev, handler));
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // NATIVE PRE-WARM: as soon as a track becomes current, byte-sniff its File and
  // build the corrected blob URL in the background so the FIRST play tap can use
  // the cached, decodable source synchronously (inside the iOS tap gesture).
  useEffect(() => {
    if (!isNativePlatform()) return;
    if (!currentTrack?.file || !currentTrack.url) return;
    buildCorrectedPlayableUrl(currentTrack.file, currentTrack.url)
      .then((res) => {
        console.log(`[v0] pre-warm sniff: name="${res.filename}" ext=${res.ext} detected=${res.detectedFormat} orig="${res.originalMime}" corrected="${res.correctedMime}" size=${res.size} first16=${res.first16Hex}`);
        setFormatDiag(res);
      })
      .catch(() => { /* ignore; loadAndPlay will sniff on demand */ });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentTrack?.id]);

  const handleUploadedTrackPlayPause = (track: Track) => {
    if (!audioRef.current || !track?.url) return;

    const audio = audioRef.current;
    const isSameTrack = currentTrack?.id === track.id;
    const actuallyPlaying = !audio.paused && !audio.ended;

    // Same track already playing -> pause.
    if (isSameTrack && actuallyPlaying) {
      audio.pause();
      setIsPlaying(false);
      return;
    }

    // Same track, loaded, paused -> resume from position (element already holds
    // a playable src, so play() works on both web and native).
    if (isSameTrack && loadedUrlRef.current === track.url && !!audio.src) {
      safePlay("uploaded resume")
        .then(() => setIsPlaying(true))
        .catch((error) => {
          console.error("[v0] resume failed:", error);
          setIsPlaying(false);
        });
      return;
    }

    // Different/unloaded track -> load fresh via the native-safe play path.
    setCurrentTrack(track);
    loadAndPlay(track, true);
  };

  const toggleSession = async () => {
    // Native locked-screen session path (iOS/Android shell). Native owns the
    // whole sequence, so Start begins a native session and the button toggles
    // native pause/resume thereafter.
    if (nativeSessionRef.current.available) {
      if (nativeSessionRef.current.activeRef.current) {
        if (isPlaying) {
          // Respect the same pause-warning flow as the JS path.
          setShowStopConfirm(true);
        } else {
          await nativeSessionRef.current.play();
        }
        return;
      }
      if (playlist.length > 0) {
        let firstVisibleIdx = 0;
        while (firstVisibleIdx < playlist.length && hiddenTrackIds.has(playlist[firstVisibleIdx].id)) {
          firstVisibleIdx++;
        }
        if (firstVisibleIdx >= playlist.length) return; // all hidden
        setPlaylistRound(1);
        setFinishedTracks(new Set());
        setIsGapPaused(false);
        setGapCountdown(0);
        setShowSessionFinished(false);
        setSessionRunning(true);
        const started = await startNativeSessionIfPossible(firstVisibleIdx);
        if (started) return;
        // Couldn't materialize any files - fall through to the JS <audio> path.
      }
    }

    if (!audioRef.current) return;

    // Use the real <audio> element as source of truth (React `isPlaying` can
    // drift on mobile WebViews where onPlay/onPause don't fire reliably).
    const actuallyPlaying = !audioRef.current.paused && !audioRef.current.ended;

    // If playing, show confirmation before pausing
    if (actuallyPlaying) {
      setShowStopConfirm(true);
      return;
    }

    // Check if all tracks are finished - need to restart fresh
    const allTracksFinished = finishedTracks.size === playlist.length && playlist.length > 0;

    // If paused with a current track loaded AND not all finished, resume.
    if (currentTrack && currentTrack.url && !allTracksFinished) {
      // Robust "is this track already loaded?" check: the element must have a src
      // AND the URL we actually loaded (tracked in a ref) must match the current
      // track. Using loadedUrlRef instead of `audio.src === url` avoids the iOS
      // WKWebView src-normalization mismatch that broke resume in the app.
      const srcLoaded =
        !!audioRef.current.src && loadedUrlRef.current === currentTrack.url;
      setSessionRunning(true);
      if (srcLoaded) {
        // Same track already loaded - resume from the current position.
        try {
          await safePlay("toggleSession resume");
          console.log("[v0] audio play promise: success (resume)");
          setIsPlaying(true);
          refreshAudioDiag("resume ok", "none");
        } catch (error) {
          const detail = `${(error as Error)?.name || "Error"}: ${(error as Error)?.message || String(error)}`;
          console.error("[v0] audio play promise: error (resume):", detail);
          setIsPlaying(false);
          refreshAudioDiag("resume rejected", detail);
        }
      } else {
        // Track changed while paused (e.g. after "Send to Session") - load it fresh.
        b2bRepeatedTrackIdRef.current = null;
        setBackToBackPlayed(false);
        loadAndPlay(currentTrack, true);
      }
      return;
    }

    // No track loaded yet OR all tracks finished - start from first visible track
    if (playlist.length > 0) {
      // Skip hidden tracks so a hidden track never becomes the starting "Now Playing"
      let firstVisibleIdx = 0;
      while (firstVisibleIdx < playlist.length && hiddenTrackIds.has(playlist[firstVisibleIdx].id)) {
        firstVisibleIdx++;
      }
      if (firstVisibleIdx >= playlist.length) return; // all hidden
      const firstTrack = playlist[firstVisibleIdx];
      if (!firstTrack.url) return;
      // Reset session tracking
      setPlaylistRound(1);
      setFinishedTracks(new Set());
      setIsGapPaused(false);
      setGapCountdown(0);
      setShowSessionFinished(false);
      setSessionRunning(true);
      // playTrackFresh clears the back-to-back flag and starts the track.
      playTrackFresh(firstTrack, firstVisibleIdx);
    }
  };

  const confirmPauseSession = () => {
    if (nativeSessionRef.current.activeRef.current) {
      void nativeSessionRef.current.pause();
      setIsPlaying(false);
      setShowStopConfirm(false);
      return;
    }
    if (audioRef.current) {
      audioRef.current.pause();
      setIsPlaying(false);
    }
    setShowStopConfirm(false);
  };

  const cancelPauseSession = () => {
    setShowStopConfirm(false);
  };

  const stopTrack = () => {
    if (!audioRef.current) return;

    audioRef.current.pause();
    audioRef.current.currentTime = 0;
    setIsPlaying(false);
  };

  const clearPlaylist = async () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      audioRef.current.src = "";
      loadedUrlRef.current = "";
    }

    setPlaylist([]);
    setUploadedTracks([]);
    setCurrentTrack(null);
    setCurrentIndex(0);
    setIsPlaying(false);
    setSessionQueue([]);
    setCurrentQueueIndex(0);
    setSessionRunning(false);
    setFinishedTracks(new Set());
    setPlaylistRound(1);
    setBackToBackPlayed(false);
    setIsGapPaused(false);
    setGapCountdown(0);
    setHiddenTrackIds(new Set());
    setCurrentPlaylistName("Untitled Playlist");

    // Clear IndexedDB cache (playlists only)
    await clearCachedPlaylist();
  };

  const resetPlaylist = () => {
    if (playlist.length === 0) return;
    
    // Use original order if available, otherwise reset current playlist state
    const orderToRestore = originalPlaylistOrder.length > 0 ? originalPlaylistOrder : playlist;
    
    // Stop current playback
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    
    // Reset playlist to original order (or current order if no original stored)
    setPlaylist([...orderToRestore]);
    setHiddenTrackIds(new Set());
    setCurrentIndex(0);
    setCurrentTrack(orderToRestore[0]);
    setIsPlaying(false);
    setSessionRunning(false);
    setFinishedTracks(new Set());
    setPlaylistRound(1);
    setBackToBackPlayed(false);
    setIsGapPaused(false);
    setGapCountdown(0);
    
    // Store as original if not already stored
    if (originalPlaylistOrder.length === 0) {
      setOriginalPlaylistOrder([...orderToRestore]);
    }
  };

  const addTrackToPlaylist = (track: Track) => {
    if (!track) return;
    
    const alreadyExists = playlist.some(
      (playlistTrack) => playlistTrack.id === track.id
    );

    if (alreadyExists) return;

    setPlaylist((current) => [...current, track]);
  };

  const moveTrack = (fromIndex: number, toIndex: number) => {
    setPlaylist((tracks) => {
      const updated = [...tracks];
      const [moved] = updated.splice(fromIndex, 1);
      updated.splice(toIndex, 0, moved);
      return updated;
    });
  };

  // Touch-friendly reorder (used by the mobile/tablet up & down buttons).
  // HTML5 drag-and-drop doesn't fire on touch screens, so mobile reordering
  // moves a track by one slot using the same array-splice logic as the web
  // player's drag handler, and keeps currentIndex pointing at the playing track.
  const moveTrackByOne = (fromIndex: number, toIndex: number) => {
    setPlaylist((prev) => {
      if (
        fromIndex === toIndex ||
        fromIndex < 0 ||
        toIndex < 0 ||
        fromIndex >= prev.length ||
        toIndex >= prev.length
      ) {
        return prev;
      }
      const next = [...prev];
      const [moved] = next.splice(fromIndex, 1);
      next.splice(toIndex, 0, moved);
      return next;
    });
    setCurrentIndex((idx) => {
      if (fromIndex === toIndex) return idx;
      if (fromIndex === idx) return toIndex;
      if (fromIndex < idx && toIndex >= idx) return idx - 1;
      if (fromIndex > idx && toIndex <= idx) return idx + 1;
      return idx;
    });
  };

  // Drag-and-drop reorder used by the shared SortableTrackList on both desktop
  // (mouse) and mobile/tablet (touch). Reorders by track id in the canonical
  // `playlist` array (so numbering + playback stay correct regardless of how the
  // list is displayed), keeps currentIndex on the playing track, and the
  // existing save effect persists the new order to IndexedDB automatically.
  const reorderPlaylistByIds = (activeId: string, overId: string) => {
    setPlaylist((prev) => {
      const fromIndex = prev.findIndex((t) => t.id === activeId);
      const toIndex = prev.findIndex((t) => t.id === overId);
      if (fromIndex === -1 || toIndex === -1 || fromIndex === toIndex) return prev;
      const next = [...prev];
      const [moved] = next.splice(fromIndex, 1);
      next.splice(toIndex, 0, moved);
      setCurrentIndex((idx) => {
        if (fromIndex === idx) return toIndex;
        if (fromIndex < idx && toIndex >= idx) return idx - 1;
        if (fromIndex > idx && toIndex <= idx) return idx + 1;
        return idx;
      });
      return next;
    });
  };

  // Hide track from current session only (does not affect saved playlist or cloud)
  const hideTrackFromSession = (trackId: string) => {
    const track = playlist.find(t => t.id === trackId);
    if (!track) return;
    
    // If this track is currently playing, stop playback. Hiding a track must
    // NOT auto-play the next track — we pause and move the "Now Playing" pointer
    // to the next visible track loaded but PAUSED, so the user decides when to
    // resume (previously this auto-advanced and played the next track).
    if (currentTrack?.id === trackId) {
      if (audioRef.current) {
        audioRef.current.pause();
      }
      setIsPlaying(false);

      // Find next visible track after current index (excluding the one being hidden)
      const currentIdx = playlist.findIndex(t => t.id === trackId);
      let nextVisibleIdx = -1;
      for (let i = currentIdx + 1; i < playlist.length; i++) {
        if (!hiddenTrackIds.has(playlist[i].id) && playlist[i].id !== trackId) {
          nextVisibleIdx = i;
          break;
        }
      }
      // If none after, wrap and look before the current index.
      if (nextVisibleIdx < 0) {
        for (let i = 0; i < currentIdx; i++) {
          if (!hiddenTrackIds.has(playlist[i].id) && playlist[i].id !== trackId) {
            nextVisibleIdx = i;
            break;
          }
        }
      }

      if (nextVisibleIdx >= 0) {
        // Point at the next visible track and pre-load it PAUSED (no autoplay).
        // Keeping audio.src + loadedUrlRef in sync with currentTrack means the
        // play button / spacebar will resume this exact track from its start.
        const nextTrack = playlist[nextVisibleIdx];
        setCurrentIndex(nextVisibleIdx);
        setCurrentTrack(nextTrack);
        b2bRepeatedTrackIdRef.current = null;
        setBackToBackPlayed(false);
        if (audioRef.current && nextTrack.url) {
          isTransitioningRef.current = true;
          preloadPausedSrc(nextTrack.url, nextTrack.file);
          isTransitioningRef.current = false;
        }
      } else {
        // No visible tracks left, stop session
        if (audioRef.current) audioRef.current.pause();
        setCurrentTrack(null);
        setSessionRunning(false);
      }
    }

    // Add to hidden set
    setHiddenTrackIds(prev => new Set([...prev, trackId]));
  };
  
  // Restore all hidden tracks for current session
  const restoreHiddenTracks = () => {
    setHiddenTrackIds(new Set());
  };

  const goToNextTrack = () => {
    if (playlist.length === 0) return;

    // Native session handles skip + gap/repeat logic itself.
    if (nativeSessionRef.current.activeRef.current) {
      void nativeSessionRef.current.next();
      return;
    }

    // Find next non-hidden track. Skipping forward always starts the next track
    // fresh (playTrackFresh clears the back-to-back flag).
    let nextIdx = currentIndex + 1;
    while (nextIdx < playlist.length && hiddenTrackIds.has(playlist[nextIdx].id)) {
      nextIdx++;
    }

    if (nextIdx < playlist.length) {
      playTrackFresh(playlist[nextIdx], nextIdx);
      return;
    }

    // Past the last visible track - repeat another round or end the session.
    if (playlistRound < playlistRepeats) {
      let firstVisibleIdx = 0;
      while (firstVisibleIdx < playlist.length && hiddenTrackIds.has(playlist[firstVisibleIdx].id)) {
        firstVisibleIdx++;
      }
      if (firstVisibleIdx < playlist.length) {
        setPlaylistRound((r) => r + 1);
        playTrackFresh(playlist[firstVisibleIdx], firstVisibleIdx);
      } else {
        endSession();
      }
    } else {
      endSession();
    }
  };

  const goToPreviousTrack = () => {
    if (playlist.length === 0) return;

    // Native session handles previous/restart logic itself.
    if (nativeSessionRef.current.activeRef.current) {
      void nativeSessionRef.current.previous();
      return;
    }

    if (!audioRef.current) return;

    // Preserve the current playback state before changing track.
    // Only auto-play after skip-back if the player was already playing.
    const wasPlaying = isPlaying;

    // Find previous visible (non-hidden) track before the current index
    let prevVisibleIdx = -1;
    for (let i = currentIndex - 1; i >= 0; i--) {
      if (!hiddenTrackIds.has(playlist[i].id)) {
        prevVisibleIdx = i;
        break;
      }
    }

    // If within first 2 seconds and there is a previous visible track, go to it.
    // Moving to a different track starts a fresh back-to-back cycle.
    if (audioRef.current.currentTime < 2 && prevVisibleIdx >= 0) {
      const prevTrack = playlist[prevVisibleIdx];
      if (prevTrack) {
        b2bRepeatedTrackIdRef.current = null;
        setBackToBackPlayed(false);
        setCurrentIndex(prevVisibleIdx);
        setCurrentTrack(prevTrack);
        if (wasPlaying) {
          loadAndPlay(prevTrack, true);
        } else {
          // Load the track but stay paused at the start. preloadPausedSrc keeps
          // the source natively-playable (converting any legacy data: URL first).
          isTransitioningRef.current = true;
          preloadPausedSrc(prevTrack.url, prevTrack.file);
          isTransitioningRef.current = false;
          setIsPlaying(false);
        }
      }
    } else {
      // Otherwise, restart the current track from the beginning.
      try { audioRef.current.currentTime = 0; } catch { /* ignore */ }
      b2bRepeatedTrackIdRef.current = null;
      setBackToBackPlayed(false);
      if (wasPlaying) {
        safePlay("restart current").then(() => {
          setIsPlaying(true);
        }).catch((err) => {
          console.error('Autoplay failed:', err);
          setIsPlaying(false);
        });
      } else {
        setIsPlaying(false);
      }
    }
  };

  // Refs to hold latest values for the audio ended handler (avoids stale closures)
  const backToBackRef = useRef(backToBack);
  backToBackRef.current = backToBack;
  const backToBackPlayedRef = useRef(backToBackPlayed);
  backToBackPlayedRef.current = backToBackPlayed;
  const gapSecondsRef = useRef(gapSeconds);
  gapSecondsRef.current = gapSeconds;
  const playlistRepeatsRef = useRef(playlistRepeats);
  playlistRepeatsRef.current = playlistRepeats;
  const playlistRoundRef = useRef(playlistRound);
  playlistRoundRef.current = playlistRound;
  const currentIndexRef = useRef(currentIndex);
  currentIndexRef.current = currentIndex;
  const playlistRef = useRef(playlist);
  playlistRef.current = playlist;

  // Native locked-screen sequencer (iOS/Android Capacitor shell only). On web and
  // the desktop wrapper `nativeSession.available` is false and this is fully inert,
  // so the existing JS <audio> + setInterval sequencer below stays in control.
  // When active, NATIVE owns sequencing (advancing tracks, gap timing, countdown
  // beeps) and keeps running while the device is LOCKED; these callbacks only
  // mirror native events back into React state so the UI matches what's playing.
  const nativeSession = useNativeSession({
    onTrackChanged: ({ index, duration }) => {
      setCurrentIndex(index);
      const t = playlistRef.current[index];
      if (t) setCurrentTrack(t);
      setTrackDuration(duration || 0);
      setCurrentTime(0);
      setIsGapPaused(false);
      setGapCountdown(0);
      setIsPlaying(true);
    },
    onGapStarted: ({ seconds }) => {
      setIsGapPaused(true);
      setGapCountdown(seconds);
    },
    onGapTick: (remaining) => setGapCountdown(remaining),
    onGapEnded: () => {
      setIsGapPaused(false);
      setGapCountdown(0);
    },
    onPosition: ({ currentTime, duration }) => {
      setCurrentTime(currentTime);
      if (duration) setTrackDuration(duration);
    },
    onPlayStateChanged: (playing) => setIsPlaying(playing),
    onSessionFinished: (reason) => {
      setIsPlaying(false);
      setIsGapPaused(false);
      setGapCountdown(0);
      if (reason === "completed") setShowSessionFinished(true);
    },
    onError: (message) => console.log("[v0] native audio error:", message),
  });
  const nativeSessionRef = useRef(nativeSession);
  nativeSessionRef.current = nativeSession;

  // Start a native locked-screen session from the CURRENT playlist, beginning at
  // `startIndex`. Returns true if native took over (caller then skips the JS path),
  // false on web/desktop or if no track files could be materialized. Reads live
  // values (settings/volume) at call time, so it is intentionally not memoized.
  const startNativeSessionIfPossible = async (startIndex: number): Promise<boolean> => {
    if (!nativeSessionRef.current.available) return false;
    const tracks = playlistRef.current
      .filter((t) => !hiddenTrackIdsRef.current.has(t.id))
      .map((t) => ({ id: t.id, title: t.title, fileName: t.fileName, file: t.file }));
    if (tracks.length === 0) return false;
    return nativeSessionRef.current.start(tracks, startIndex, {
      gapSeconds,
      repeats: playlistRepeats,
      backToBack,
      countdownBeeps: showCountdownRef.current,
      countdownSeconds: countdownSecondsRef.current,
      volume: Math.max(0, Math.min(1, volume / 100)),
    });
  };

  // Seek helper shared by every progress-bar scrub handler. Routes to the native
  // engine when a native session is active, otherwise to the JS <audio> element.
  const seekToSeconds = (seconds: number) => {
    const clamped = Math.max(0, Math.min(seconds, trackDuration || 0));
    if (nativeSessionRef.current.activeRef.current) {
      void nativeSessionRef.current.seek(clamped);
      setCurrentTime(clamped);
      return;
    }
    if (audioRef.current) {
      audioRef.current.currentTime = clamped;
      setCurrentTime(clamped);
    }
  };
  // Tracks an in-progress drag on the shared mobile waveform so pointermove only
  // seeks while the finger/mouse is actually down. Purely additive to the existing
  // tap-to-seek; a plain tap is just pointerdown+pointerup with no movement.
  const waveformScrubbingRef = useRef(false);
  const hiddenTrackIdsRef = useRef(hiddenTrackIds);
  hiddenTrackIdsRef.current = hiddenTrackIds;
  // Keeps the "Autoplay Next Track" setting readable inside the onEnded handler
  // (which reads refs, not closures). When false, playback stops when a track ends
  // instead of auto-advancing to the next routine.
  const autoplayNextRef = useRef(true);
  // Countdown settings read by the gap-ticker effect (defined before `settings`),
  // so they must be refs. showCountdownRef gates the audible countdown beeps;
  // countdownSecondsRef sets how many final gap seconds beep as a "get ready" cue.
  const showCountdownRef = useRef(true);
  const countdownSecondsRef = useRef(3);
  // Selected countdown beep style, read inside playBeep (which runs from refs, not
  // closures). Kept in sync with settings.beepSound below.
  const beepSoundRef = useRef<BeepSoundId>("classic");
  // Authoritative back-to-back tracker: holds the id of the track that has ALREADY
  // played its back-to-back repeat. This is keyed by the actually-playing track id
  // (read at the moment the track ends), so the decision can never desync the way a
  // separate boolean flag could. null = nothing has consumed its repeat yet.
  const b2bRepeatedTrackIdRef = useRef<string | null>(null);

  // Real-time progress / duration tracking. Bound via JSX props on the single
  // shared <audio> element, so every view (main, fullscreen, mobile, coach) reads
  // the same currentTime / trackDuration state.
  // Opportunistically lock in a reliable, finite duration whenever the element
  // exposes one. Uploaded blob audio often reports duration as Infinity/NaN at
  // `loadedmetadata`, but the browser resolves it shortly after via
  // `durationchange` / during playback (`timeupdate`). We capture it from any of
  // those events. IMPORTANT: we must NOT seek the element to force duration here,
  // because seeking a playing element past its end fires a spurious `ended` event
  // that would consume the back-to-back repeat slot.
  const captureDuration = () => {
    const audio = audioRef.current;
    if (!audio) return;
    const d = audio.duration;
    if (Number.isFinite(d) && d > 0) {
      setTrackDuration((prev) => (prev !== d ? d : prev));
    }
  };

  const handleAudioTimeUpdate = () => {
    const audio = audioRef.current;
    if (!audio) return;
    setCurrentTime(audio.currentTime);
    captureDuration();
    // Self-heal `isPlaying` from the real element. On mobile WebViews the
    // onPlay event is unreliable, so timeupdate (which only fires while the
    // audio is actually progressing) is a dependable signal that we ARE playing.
    // This keeps the Pause/Resume button label correct.
    if (!isPlaying && !audio.paused && !isTransitioningRef.current) {
      setIsPlaying(true);
    }
  };

  const handleAudioLoadedMetadata = () => captureDuration();
  const handleAudioDurationChange = () => captureDuration();
  // Keep the shared isPlaying state in lockstep with the element's real state so
  // every view shows the correct play/pause status (and manual pauses stick).
  const handleAudioPlay = () => setIsPlaying(true);
  const handleAudioPause = () => {
    const audio = audioRef.current;
    if (!audio) return;
    // Ignore transient pause events fired while we programmatically swap the source
    // or while the user scrubs the progress bar - these are not real "user paused".
    if (isTransitioningRef.current || audio.seeking) return;
    setIsPlaying(false);
  };

  // Auto-advance engine. Defined in component scope and bound directly to the
  // <audio> element via the onEnded JSX prop, so it is ALWAYS attached to the
  // live audio DOM node (no addEventListener/ref timing or remount fragility).
  // Reads latest values from refs to avoid stale closures.
  const handleTrackEnded = () => {
    // When the native session is driving playback, the JS <audio> element is not
    // the source of truth — native handles end-of-track advance, gaps and repeats.
    if (nativeSessionRef.current.activeRef.current) return;

    const audio = audioRef.current;
    if (!audio) return;

    const _backToBack = backToBackRef.current;
    const _backToBackPlayed = backToBackPlayedRef.current;
    const _gapSeconds = gapSecondsRef.current;
    const _playlistRepeats = playlistRepeatsRef.current;
    const _playlistRound = playlistRoundRef.current;
    const _currentIndex = currentIndexRef.current;
    const _playlist = playlistRef.current;
    const _hiddenTrackIds = hiddenTrackIdsRef.current;

    // Runs `playFn` now, or after the inter-track gap countdown when a gap is set.
    const playAfterGap = (playFn: () => void, upcomingTitle: string, upcomingId: string) => {
      setNextUpTitle(upcomingTitle);
      setNextUpTrackId(upcomingId);
      if (_gapSeconds > 0) {
        setIsPlaying(false);
        setIsGapPaused(true);
        setGapCountdown(_gapSeconds);
        lastBeepedCountdown.current = -1; // Reset beep tracking for new countdown
        gapCallbackRef.current = playFn;
        // Anchor the gap to a real wall-clock instant. The ticker + resume
        // reconciler both derive the remaining time from this, so a suspended
        // timer can never make the next track start late.
        nextTrackStartAtRef.current = Date.now() + _gapSeconds * 1000;
      } else {
        playFn();
      }
    };

    // 1) Back-to-back: replay the SAME track once before advancing. The decision is
    //    keyed by the actually-playing track id, so it can't desync. If this track
    //    hasn't consumed its repeat yet, replay it and mark it consumed; when the
    //    repeat ends we'll fall through to the advance path below.
    const endedTrack = _playlist[_currentIndex];
    if (
      _backToBack &&
      endedTrack?.url &&
      b2bRepeatedTrackIdRef.current !== endedTrack.id
    ) {
      b2bRepeatedTrackIdRef.current = endedTrack.id;
      setBackToBackPlayed(true); // keep UI ("Up Next") state in sync
      playAfterGap(
        () => loadAndPlay(endedTrack, true),
        endedTrack.title || "",
        endedTrack.id || "",
      );
      return;
    }

    // 1b) Autoplay Next Track is OFF: the current routine (including any back-to-back
    //     repeat) has finished, so stop here instead of advancing. The coach can
    //     manually skip forward to continue. Keeps the session "running" (not ended)
    //     so Resume/Skip still work.
    if (!autoplayNextRef.current) {
      setIsPlaying(false);
      setIsGapPaused(false);
      setGapCountdown(0);
      return;
    }

    // 2) Advance to the next visible track. playTrackFresh clears the back-to-back
    //    flag so the next track gets its own full back-to-back cycle.
    let nextIdx = _currentIndex + 1;
    while (nextIdx < _playlist.length && _hiddenTrackIds.has(_playlist[nextIdx].id)) {
      nextIdx++;
    }
    if (nextIdx < _playlist.length) {
      const nextTrack = _playlist[nextIdx];
      playAfterGap(
        () => playTrackFresh(nextTrack, nextIdx),
        nextTrack?.title || "",
        nextTrack?.id || "",
      );
      return;
    }

    // 3) End of playlist - repeat another round or finish the session.
    if (_playlistRound < _playlistRepeats) {
      let firstVisibleIdx = 0;
      while (firstVisibleIdx < _playlist.length && _hiddenTrackIds.has(_playlist[firstVisibleIdx].id)) {
        firstVisibleIdx++;
      }
      if (firstVisibleIdx < _playlist.length) {
        const firstTrack = _playlist[firstVisibleIdx];
        setPlaylistRound((r) => r + 1);
        playAfterGap(
          () => playTrackFresh(firstTrack, firstVisibleIdx),
          firstTrack?.title || "",
          firstTrack?.id || "",
        );
        return;
      }
    }

    // No more rounds (or everything hidden) - end the session.
    endSession();
  };

  // Detect (once) whether writing element.volume actually takes effect. We set a
  // sentinel value and read it back synchronously: platforms that honor it (desktop,
  // Android) report the new value; iOS/iPadOS keep it pinned at 1. Result is cached.
  const isElementVolumeWritable = useCallback(() => {
    if (volumeWritableRef.current !== null) return volumeWritableRef.current;
    const audio = audioRef.current;
    if (!audio) return true; // assume writable until we have an element to test
    let writable = true;
    try {
      const prev = audio.volume;
      audio.volume = 0.123;
      writable = Math.abs(audio.volume - 0.123) < 0.02;
      audio.volume = prev;
    } catch {
      writable = false;
    }
    volumeWritableRef.current = writable;
    console.log(`[v0] element.volume writable: ${writable}`);
    return writable;
  }, []);

  // Lazily build (or reuse) the Web Audio graph: <audio> -> GainNode -> speakers.
  // ONLY used on platforms where element.volume is ineffective (iOS), because
  // routing through createMediaElementSource breaks Bluetooth/AirPlay output.
  // Must be invoked from a user gesture (the play tap) so iOS lets the context run.
  // Safe to call repeatedly; createMediaElementSource is guarded to run only once.
  const ensureGainGraph = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return null;
    // Bluetooth-safe path: if the element honors volume, never touch Web Audio.
    if (isElementVolumeWritable()) return null;
    try {
      if (!audioCtxRef.current) {
        const Ctx =
          window.AudioContext ||
          (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        if (!Ctx) return null;
        audioCtxRef.current = new Ctx();
      }
      const ctx = audioCtxRef.current;
      if (!mediaSourceRef.current) {
        mediaSourceRef.current = ctx.createMediaElementSource(audio);
        gainNodeRef.current = ctx.createGain();
        mediaSourceRef.current.connect(gainNodeRef.current);
        gainNodeRef.current.connect(ctx.destination);
      }
      if (ctx.state === "suspended") void ctx.resume();
      return gainNodeRef.current;
    } catch (err) {
      // If the graph can't be built (e.g. unsupported), fall back to element.volume.
      console.log("[v0] ensureGainGraph failed, falling back to element.volume", err);
      return null;
    }
  }, [isElementVolumeWritable]);

  // Sync volume + mute to the actual output. Runs on volume/mute change and on the
  // lifecycle transitions where the level must be re-asserted (track change, play,
  // fullscreen enter/exit). The GainNode is the reliable cross-platform control
  // (iOS ignores element.volume); when the graph exists we drive gain and pin
  // element.volume to 1 to avoid double attenuation. `muted` still uses the element
  // flag (honored everywhere). Falls back to element.volume if no graph yet.
  useEffect(() => {
    const normalized = Math.max(0, Math.min(1, volume / 100));
    // Native session: drive the native player's volume (its AVAudioPlayer owns
    // output). Still fall through to also set the element so state stays coherent.
    if (nativeSessionRef.current.activeRef.current) {
      void nativeSessionRef.current.setVolume(isMuted ? 0 : normalized);
    }
    const audio = audioRef.current;
    if (!audio) return;
    const gain = gainNodeRef.current;
    if (gain && audioCtxRef.current) {
      audio.volume = 1;
      gain.gain.setTargetAtTime(isMuted ? 0 : normalized, audioCtxRef.current.currentTime, 0.01);
    } else {
      audio.volume = isMuted ? 0 : normalized;
    }
    audio.muted = isMuted || normalized === 0;
  }, [volume, isMuted, currentTrack?.id, isPlaying, isFullscreen, showFullscreenMobilePlayer]);

  // Distinctive beep sound for countdown - loud and noticeable
  const lastBeepedCountdown = useRef<number>(-1);

  // Lazily create (once) and return the single shared beep AudioContext, resuming
  // it if the browser/OS suspended it. Returns null only if Web Audio is missing.
  const getBeepCtx = useCallback((): AudioContext | null => {
    try {
      if (!beepCtxRef.current) {
        const Ctx =
          window.AudioContext ||
          (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        if (!Ctx) return null;
        beepCtxRef.current = new Ctx();
      }
      const ctx = beepCtxRef.current;
      if (ctx.state === "suspended") void ctx.resume();
      return ctx;
    } catch {
      return null;
    }
  }, []);

  // Unlock the beep context from a user gesture (called in safePlay). iOS only
  // lets an AudioContext transition to "running" from within a gesture, so doing
  // this on the play tap guarantees later countdown beeps (which fire without a
  // gesture) are audible.
  const unlockBeepAudio = useCallback(() => {
    getBeepCtx();
  }, [getBeepCtx]);

  // Core Web Audio beep generator, parameterized by style so all three share the
  // same envelope/scheduling code. `frequency` is the base pitch chosen by the
  // countdown (660/880/1100 for 3/2/1); each style reinterprets it with its own
  // timbre. Reuses the single shared beep context (never allocates per beep).
  const emitBeep = useCallback(
    (style: BeepSoundId, frequency: number, duration: number, isFinalBeep: boolean) => {
      try {
        const ctx = getBeepCtx();
        if (!ctx) return;
        const now = ctx.currentTime;

        // Helper: one oscillator + gain envelope, started at `now + offsetMs`.
        const tone = (
          type: OscillatorType,
          freq: number,
          peak: number,
          lenMs: number,
          offsetMs = 0,
        ) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.type = type;
          osc.frequency.value = freq;
          const start = now + offsetMs / 1000;
          const end = start + lenMs / 1000;
          gain.gain.setValueAtTime(0.0001, start);
          gain.gain.exponentialRampToValueAtTime(peak, start + 0.008);
          gain.gain.exponentialRampToValueAtTime(0.0001, end);
          osc.start(start);
          osc.stop(end + 0.02);
        };

        if (style === "chime") {
          // Warm, musical: pure sine fundamental + octave shimmer, longer smooth
          // decay. Final adds a perfect-fifth for a pleasant resolved chord.
          const len = isFinalBeep ? duration * 2.2 : duration * 1.6;
          tone("sine", frequency, isFinalBeep ? 0.5 : 0.38, len);
          tone("sine", frequency * 2, isFinalBeep ? 0.22 : 0.16, len);
          if (isFinalBeep) tone("sine", frequency * 1.5, 0.28, len);
        } else if (style === "tick") {
          // Crisp digital blip: short triangle attack. Final is a quick double-tick
          // with a bright ping so the "go" moment is unmistakable.
          const len = isFinalBeep ? duration * 0.5 : duration * 0.4;
          tone("triangle", frequency * 1.2, isFinalBeep ? 0.6 : 0.45, len);
          if (isFinalBeep) {
            tone("triangle", frequency * 1.2, 0.5, len, 110);
            tone("sine", frequency * 2.5, 0.35, len * 1.4, 110);
          }
        } else {
          // "classic" (default): square fundamental + sine fifth harmonic, loud and
          // bright to cut through music. Final adds an octave ping for emphasis.
          const len = isFinalBeep ? duration * 1.5 : duration;
          tone("square", frequency, isFinalBeep ? 0.7 : 0.5, len);
          tone("sine", frequency * 1.5, isFinalBeep ? 0.4 : 0.25, len);
          if (isFinalBeep) tone("sine", frequency * 2, 0.3, len);
        }
      } catch (e) {
        // Audio context not supported
      }
    },
    [getBeepCtx],
  );

  // Live countdown beep — reads the user's selected style from the ref so the
  // gap ticker doesn't need to depend on settings state.
  const playBeep = useCallback(
    (frequency: number = 880, duration: number = 100, isFinalBeep: boolean = false) => {
      emitBeep(beepSoundRef.current, frequency, duration, isFinalBeep);
    },
    [emitBeep],
  );

  // Settings preview: plays a short representative 3-2-1 of the given style so the
  // user can compare sounds before choosing. Uses the same generator as the live
  // countdown, so what they hear is exactly what plays during a session.
  const previewBeepSound = useCallback(
    (style: BeepSoundId) => {
      emitBeep(style, 660, 200, false);
      window.setTimeout(() => emitBeep(style, 880, 200, false), 320);
      window.setTimeout(() => emitBeep(style, 1100, 200, true), 640);
    },
    [emitBeep],
  );

  // Start the next track exactly once and clear all gap/beep state. Guards against
  // a double fire (ticker + resume listener) by nulling the callback ref first.
  const fireNextTrack = useCallback(() => {
    const cb = gapCallbackRef.current;
    gapCallbackRef.current = null;
    nextTrackStartAtRef.current = null;
    lastBeepedCountdown.current = -1;
    setGapCountdown(0);
    setIsGapPaused(false);
    if (cb) cb();
  }, []);

  // Evaluate the timestamp-anchored gap against the WALL CLOCK (Date.now()):
  //  - if the target start time has passed, start the next track now;
  //  - otherwise update the displayed countdown and play the due beep, skipping
  //    any beep whose real-time moment already elapsed (e.g. while backgrounded)
  //    so a missed beep is never replayed late.
  // Returns true if the next track was started.
  const evaluateGap = useCallback((): boolean => {
    if (!isGapPausedRef.current) return false;
    const startAt = nextTrackStartAtRef.current;
    if (startAt == null) return false;
    const remainingMs = startAt - Date.now();
    if (remainingMs <= 0) {
      fireNextTrack();
      return true;
    }
    const remaining = Math.ceil(remainingMs / 1000);
    setGapCountdown((prev) => (prev !== remaining ? remaining : prev));
    // Audible "get ready" countdown. Honors the "Show Countdown Timer" toggle and
    // the configurable "Countdown Before Routine" length. Because `remaining` is
    // derived from the clock, a beep is only played at its true real-time second;
    // seconds skipped during suspension are never beeped after the fact.
    if (
      showCountdownRef.current &&
      countdownSecondsRef.current > 0 &&
      remaining <= countdownSecondsRef.current &&
      remaining > 0 &&
      lastBeepedCountdown.current !== remaining
    ) {
      lastBeepedCountdown.current = remaining;
      const freq = remaining === 1 ? 1100 : remaining === 2 ? 880 : 660;
      playBeep(freq, 200, remaining === 1);
    }
    return false;
  }, [fireNextTrack, playBeep]);

  // Gap countdown ticker - TIMESTAMP based (not a per-second decrement). It polls
  // the wall clock every ~200ms and self-schedules, so after iOS unthrottles JS
  // timers the countdown immediately snaps to the correct remaining time. Only one
  // timer is ever live (cleaned up when the gap ends or the effect re-runs).
  useEffect(() => {
    if (!isGapPaused) return;
    let timer: ReturnType<typeof setTimeout> | null = null;
    let stopped = false;
    const tick = () => {
      if (stopped) return;
      if (evaluateGap()) return; // next track started - stop ticking
      timer = setTimeout(tick, 200);
    };
    tick();
    return () => {
      stopped = true;
      if (timer) clearTimeout(timer);
    };
  }, [isGapPaused, evaluateGap]);

  // Capacitor app-lifecycle reconciliation. iOS suspends/throttles JS timers while
  // the app is backgrounded or the phone is locked, which would otherwise leave a
  // stale countdown and fire delayed beeps on reopen. On RESUME we immediately
  // reconcile from the wall clock: start the next track now if its time already
  // passed (no late beeps), or resync the displayed countdown. On BACKGROUND we do
  // nothing except preserve the timestamp. A single listener is maintained.
  useEffect(() => {
    if (!isNativePlatform()) return;
    let removeListener: (() => void) | undefined;
    let cancelled = false;
    import("@capacitor/app")
      .then(({ App }) => {
        if (cancelled) return;
        App.addListener("appStateChange", ({ isActive }) => {
          if (isActive && isGapPausedRef.current) {
            evaluateGap();
          }
        }).then((handle) => {
          if (cancelled) handle.remove();
          else removeListener = () => handle.remove();
        });
      })
      .catch(() => {
        /* @capacitor/app not available (e.g. web) - timers alone are fine there */
      });
    return () => {
      cancelled = true;
      removeListener?.();
    };
  }, [evaluateGap]);

  const [toastMessage, setToastMessage] = useState("");

  const showToast = (message: string) => {
    setToastMessage(message);
    setTimeout(() => setToastMessage(""), 2500);
  };

  const createPlaylist = () => {
    if (!newPlaylistName.trim()) return;

    setSavedPlaylists((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        name: newPlaylistName.trim(),
        tracks: [],
      },
    ]);

    setNewPlaylistName("");
    setShowPlaylistModal(false);
  };

  const [settings, setSettings] = useState({
    defaultVolume: 80,
    countdownSeconds: 3,
    gapSeconds: 10,
    playlistRepeats: 1,
    backToBack: false,
    autoplayNext: true,
    showCountdown: true,
    showPauseWarning: true,
    showSkipWarning: true,
    beepSound: "classic" as BeepSoundId,
  });

  // Keep the playback-engine refs in sync with the live settings every render.
  autoplayNextRef.current = settings.autoplayNext;
  showCountdownRef.current = settings.showCountdown;
  countdownSecondsRef.current = settings.countdownSeconds;
  beepSoundRef.current = settings.beepSound;

  // Persist ONLY the beep preference (sound style + on/off) so the user's choice
  // survives refresh, restart and re-login. Scoped to beeps on purpose: gap,
  // repeat, volume and countdown-length are deliberately NOT persisted here (they
  // are owned by other state / cloud-sync). Uses the same `eqho-*` localStorage
  // convention as the rest of the app — not a new settings store.
  const beepPrefsLoadedRef = useRef(false);
  useEffect(() => {
    try {
      const raw = localStorage.getItem("eqho-beep-prefs");
      if (raw) {
        const saved = JSON.parse(raw) as { beepSound?: BeepSoundId; showCountdown?: boolean };
        setSettings((s) => ({
          ...s,
          ...(saved.beepSound && BEEP_SOUNDS.some((b) => b.id === saved.beepSound)
            ? { beepSound: saved.beepSound }
            : {}),
          ...(typeof saved.showCountdown === "boolean" ? { showCountdown: saved.showCountdown } : {}),
        }));
      }
    } catch {
      // ignore malformed/unavailable storage
    } finally {
      beepPrefsLoadedRef.current = true;
    }
  }, []);
  useEffect(() => {
    // Don't overwrite storage until after the initial load has run.
    if (!beepPrefsLoadedRef.current) return;
    try {
      localStorage.setItem(
        "eqho-beep-prefs",
        JSON.stringify({ beepSound: settings.beepSound, showCountdown: settings.showCountdown }),
      );
    } catch {
      // ignore storage write failures (private mode, quota)
    }
  }, [settings.beepSound, settings.showCountdown]);

  const updateSetting = (key: string, value: any) => {
    setSettings((current) => ({
      ...current,
      [key]: value,
    }));
    // Sync settings to player state variables
    if (key === "gapSeconds") setGapSeconds(value);
    if (key === "playlistRepeats") setPlaylistRepeats(value);
    if (key === "backToBack") setBackToBack(value);
    if (key === "defaultVolume") setVolume(value);
  };

  // Handler for pause button with warning check
  const handlePauseClick = () => {
    const audio = audioRef.current;
    // Source of truth is the REAL <audio> element, not React state. On mobile
    // WebViews (notably iOS WKWebView) the onPlay/onPause DOM events don't fire
    // reliably, so `isPlaying` state can drift out of sync with actual playback.
    // Relying on stale `isPlaying` made a tap take the wrong branch (reloading a
    // track instead of pausing it), which looked like "the button does nothing".
    const actuallyPlaying = !!audio && !audio.paused && !audio.ended;
    console.log("[v0] PLAY/PAUSE BUTTON TAPPED", {
      isPlaying,
      actuallyPlaying,
      isGapPaused,
      audioPaused: audio?.paused ?? null,
      readyState: audio?.readyState ?? -1,
      hasCurrentTrack: !!currentTrackRef.current,
    });
    if (isGapPaused) {
      // During an inter-track gap, defer to the session toggle (handles the gap).
      toggleSession();
      return;
    }
    if (actuallyPlaying) {
      if (settings.showPauseWarning) {
        // Warning enabled — ask for confirmation before pausing.
        setShowPauseConfirm(true);
      } else {
        // Warning disabled — pause immediately. We must NOT fall through to
        // toggleSession() here, because toggleSession shows its own
        // showStopConfirm dialog whenever isPlaying, which made the pause
        // warning still appear even when this setting was turned off.
        audio!.pause();
        setIsPlaying(false);
      }
    } else {
      toggleSession();
    }
  };

  // Handler for skip back button with warning check
  const handleSkipBackClick = () => {
    // The warning should reflect what the user PERCEIVES as playing. On mobile
    // WebViews onPlay/onPause can drift in either direction, so treat playback
    // as active if EITHER the React state (drives the play/pause icon) OR the
    // real <audio> element reports playing. This guarantees the warning shows
    // whenever the user sees a track playing.
    const audio = audioRef.current;
    const perceivedPlaying = isPlaying || (!!audio && !audio.paused && !audio.ended);
    if (perceivedPlaying && !isGapPaused && settings.showSkipWarning) {
      setShowSkipBackConfirm(true);
    } else {
      goToPreviousTrack();
    }
  };

  // Handler for skip forward button with warning check
  const handleSkipForwardClick = () => {
    const audio = audioRef.current;
    const perceivedPlaying = isPlaying || (!!audio && !audio.paused && !audio.ended);
    if (perceivedPlaying && !isGapPaused && settings.showSkipWarning) {
      setShowSkipForwardConfirm(true);
    } else {
      goToNextTrack();
    }
  };

  // Wrapper functions to keep settings and player state in sync
  const updateGapSeconds = (newValue: number | ((prev: number) => number)) => {
    setGapSeconds((prev) => {
      const val = typeof newValue === "function" ? newValue(prev) : newValue;
      setSettings((s) => ({ ...s, gapSeconds: val }));
      return val;
    });
  };

  const updatePlaylistRepeats = (newValue: number | ((prev: number) => number)) => {
    setPlaylistRepeats((prev) => {
      const val = typeof newValue === "function" ? newValue(prev) : newValue;
      setSettings((s) => ({ ...s, playlistRepeats: val }));
      return val;
    });
  };

  const updateBackToBack = (newValue: boolean | ((prev: boolean) => boolean)) => {
    // Compute the next value from the live ref (no nested setState, which is impure
    // and can fail to commit). backToBackRef is kept current on every render.
    const val =
      typeof newValue === "function" ? newValue(backToBackRef.current) : newValue;
    setBackToBack(val);
    setSettings((s) => ({ ...s, backToBack: val }));
    // Turning back-to-back ON lets the currently playing track still earn its
    // repeat, so clear the consumed marker (and the UI flag) for it.
    if (val) {
      b2bRepeatedTrackIdRef.current = null;
      setBackToBackPlayed(false);
    }
  };

  const [sessionQueue, setSessionQueue] = useState<QueueItem[]>([]);
  const [currentQueueIndex, setCurrentQueueIndex] = useState(0);
  const [remainingSessionSeconds, setRemainingSessionSeconds] = useState(0);
  const [currentTrackProgress, setCurrentTrackProgress] = useState(0);

  const handleDragStart = (index: number) => {
    setDraggedTrackIndex(index);
  };

  const handleDragOver = (event: React.DragEvent) => {
    event.preventDefault();
  };

  const handleDrop = (dropIndex: number) => {
    if (draggedTrackIndex === null || draggedTrackIndex === dropIndex) return;

    setPlaylist((currentPlaylist) => {
      const updatedPlaylist = [...currentPlaylist];
      const [movedTrack] = updatedPlaylist.splice(draggedTrackIndex, 1);

      updatedPlaylist.splice(dropIndex, 0, movedTrack);

      return updatedPlaylist;
    });

    setDraggedTrackIndex(null);
  };

  // Helper to parse "MM:SS" duration string to seconds
  const parseDuration = (dur: string): number => {
    const parts = dur.split(":");
    if (parts.length === 2) {
      return parseInt(parts[0], 10) * 60 + parseInt(parts[1], 10);
    }
    return 0;
  };

  // Calculate uploaded track total in seconds
  const uploadedTrackTotalSeconds = playlist.reduce((total, track) => {
  return total + track.durationSeconds;
  }, 0);
  
  // Calculate total session time based on VISIBLE tracks only (excludes hidden)
  const visibleTrackTotalSeconds = visiblePlaylist.reduce((total, track) => {
    return total + track.durationSeconds;
  }, 0);
  
  const totalSessionSeconds =
  visibleTrackTotalSeconds * playlistRepeats * (backToBack ? 2 : 1) +
  Math.max(0, visiblePlaylist.length * playlistRepeats * (backToBack ? 2 : 1) - 1) *
  gapSeconds;

  // Determine the title of the track that will actually play next.
  // This mirrors the logic in the audio "ended" handler so the "Up Next"
  // display always matches what will truly play:
  //  1. Back-to-Back on + repeat not played yet  -> SAME current track
  //  2. There is another visible track ahead      -> that next track
  //  3. End of playlist but more rounds remain     -> first visible track
  //  4. End of playlist, no rounds remain          -> "End of Playlist"
  const getNextTrackTitle = () => {
    // During a gap, use the title captured when the gap was scheduled.
    // This is the source of truth for what plays next (handles back-to-back).
    if (isGapPaused && nextUpTitle) {
      return nextUpTitle;
    }

    if (!currentTrack) {
      return visiblePlaylist[0]?.title || "End of Playlist";
    }

    // 1. Back-to-back: the same track plays again next
    if (backToBack && !backToBackPlayed) {
      return currentTrack.title;
    }

    const currentVisibleIdx = visiblePlaylist.findIndex(
      (t) => t.id === currentTrack.id
    );

    // 2. Another track ahead in the current pass
    const nextTrack = visiblePlaylist[currentVisibleIdx + 1];
    if (nextTrack) {
      return nextTrack.title;
    }

    // 3. End of playlist - wrap to first track if more rounds remain
    if (playlistRound < playlistRepeats) {
      return visiblePlaylist[0]?.title || "End of Playlist";
    }

    // 4. End of session
    return "End of Playlist";
  };
  
  const decreaseRepeats = () => {
    setPlaylistRepeats((prev) => Math.max(1, prev - 1));
  };

  const increaseRepeats = () => {
    setPlaylistRepeats((prev) => Math.min(99, prev + 1));
  };

  const goToNextQueueItem = () => {
    setCurrentQueueIndex((prev) => {
      const nextIndex = prev + 1;
      playQueueItem(sessionQueue[nextIndex]);
      return nextIndex;
    });
  };

  const playQueueItem = (item: QueueItem) => {
    if (!item) {
      setSessionRunning(false);
      return;
    }

    if ((item as GapItem).type === "gap") {
      setTimeout(() => {
        goToNextQueueItem();
      }, (item as GapItem).duration * 1000);
      return;
    }

    // For track items, set the audio source and play
    // TODO: Add actual audio URL to Track interface
    if (audioRef.current) {
      // audioRef.current.src = (item as Track).url;
      // audioRef.current.play();
    }
  };

  const handleTrackReorder = (event: any) => {
    const { active, over } = event;

    if (!over || active.id === over.id) return;

    setPlaylist((items) => {
      const oldIndex = items.findIndex((track) => track.id === active.id);
      const newIndex = items.findIndex((track) => track.id === over.id);

      return arrayMove(items, oldIndex, newIndex);
    });
  };

  const startSession = () => {
    const queueTracks = playlist.map((track) => ({
      title: track.title,
      duration: formatDuration(track.durationSeconds),
    }));

    const queue = buildSessionQueue({
      playlist: queueTracks,
      playlistRepeats,
      backToBack,
      gapSeconds,
    });

    setSessionQueue(queue);
    setCurrentQueueIndex(0);
    setSessionRunning(true);

    if (queue.length > 0) {
      playQueueItem(queue[0]);
    }
  };

  const PlayPauseButton = ({ track, onPlay }: { track: Track; onPlay?: (track: Track) => void }) => {
    const active = currentTrack?.id === track.id && isPlaying;
    const handler = onPlay || togglePlayPause;
    return (
      <button
        onClick={() => handler(track)}
        className={`h-8 w-[90px] shrink-0 px-2 rounded-lg border font-semibold transition flex items-center justify-center gap-1.5 whitespace-nowrap text-xs ${
          active
            ? "border-blue-400/60 bg-blue-500/15 text-blue-300"
            : "border-pink-500/50 bg-pink-500/10 text-white"
        }`}
      >
        {active ? (
          <>
            <Pause size={13} />
            Pause
          </>
        ) : (
          <>
            <Play size={13} />
            Play
          </>
        )}
      </button>
    );
  };

  // Access gate: while we verify login + subscription, show a branded loader.
  // This prevents the player (and any cached audio) from rendering for users who
  // are not authenticated/subscribed, including on mobile builds with no middleware.
  if (gate === "checking") {
    return (
      <div className="h-screen w-screen flex flex-col items-center justify-center bg-[#050814] text-white gap-4">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-1/4 -left-1/4 w-1/2 h-1/2 bg-gradient-to-br from-[#ff4fa3]/6 to-transparent rounded-full blur-3xl" />
          <div className="absolute -bottom-1/4 -right-1/4 w-1/2 h-1/2 bg-gradient-to-tl from-[#ff8a00]/6 to-transparent rounded-full blur-3xl" />
        </div>
        <Loader2 size={32} className="animate-spin text-[#ff4fa3] relative z-10" />
        <p className="text-white/50 text-sm relative z-10">Checking your access…</p>
      </div>
    );
  }

  // Offline and outside the grace window (or never verified): cannot confirm a
  // valid subscription, so block access until the device is back online.
  if (gate === "blocked-offline") {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-[#050814] text-white p-6">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-1/4 -left-1/4 w-1/2 h-1/2 bg-gradient-to-br from-[#ff4fa3]/6 to-transparent rounded-full blur-3xl" />
          <div className="absolute -bottom-1/4 -right-1/4 w-1/2 h-1/2 bg-gradient-to-tl from-[#ff8a00]/6 to-transparent rounded-full blur-3xl" />
        </div>
        <div className="relative z-10 max-w-md text-center bg-[#090f1c]/95 backdrop-blur-xl border border-[#ff8a00]/30 rounded-2xl p-8">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#ff4fa3] to-[#ff8a00] flex items-center justify-center mx-auto mb-5">
            <WifiOff size={26} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold mb-2 text-balance">You&apos;re offline</h1>
          <p className="text-white/60 mb-6 text-pretty">
            We couldn&apos;t verify your EQHO Player subscription. Please reconnect to the
            internet to continue. Your downloaded playlists will be available again
            once your subscription is confirmed.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="w-full min-h-[48px] py-3 rounded-xl bg-gradient-to-r from-[#ff4fa3] to-[#ff8a00] text-white font-bold hover:shadow-[0_0_20px_rgba(255,122,0,0.4)] transition"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  // Startup verification failed or timed out (e.g. no connection on launch).
  // Recoverable: never a white screen or an endless spinner. Uses EQHO styling.
  if (gate === "error") {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-[#050814] text-white p-6">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-1/4 -left-1/4 w-1/2 h-1/2 bg-gradient-to-br from-[#ff4fa3]/6 to-transparent rounded-full blur-3xl" />
          <div className="absolute -bottom-1/4 -right-1/4 w-1/2 h-1/2 bg-gradient-to-tl from-[#ff8a00]/6 to-transparent rounded-full blur-3xl" />
        </div>
        <div className="relative z-10 max-w-md text-center bg-[#090f1c]/95 backdrop-blur-xl border border-[#ff8a00]/30 rounded-2xl p-8">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#ff4fa3] to-[#ff8a00] flex items-center justify-center mx-auto mb-5">
            <AlertTriangle size={26} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold mb-2 text-balance">Unable to verify your account</h1>
          <p className="text-white/60 mb-6 text-pretty">
            EQHO Player could not confirm your access. Check your internet
            connection and try again.
          </p>
          <div className="flex flex-col gap-3">
            <button
              onClick={() => {
                // Re-run the bootstrap in place (a full reload can re-hang on
                // iPad Capacitor): reset to the loader and bump the retry token.
                setGate("checking");
                setAuthChecked(false);
                setAccessRetryToken((n) => n + 1);
              }}
              className="w-full min-h-[48px] py-3 rounded-xl bg-gradient-to-r from-[#ff4fa3] to-[#ff8a00] text-white font-bold hover:shadow-[0_0_20px_rgba(255,122,0,0.4)] transition flex items-center justify-center gap-2"
            >
              <RefreshCw size={18} />
              Try Again
            </button>
            <button
              onClick={handleLogout}
              disabled={isSigningOut}
              className="w-full min-h-[48px] py-3 rounded-xl border border-white/15 bg-white/5 text-white/80 font-semibold hover:bg-white/10 transition flex items-center justify-center gap-2 disabled:opacity-60"
            >
              {isSigningOut ? <Loader2 size={18} className="animate-spin" /> : <LogOut size={18} />}
              Sign Out
            </button>
          </div>
        </div>
      </div>
    );
  }

  // A Coach/fullscreen overlay is active (mobile/iPad OR desktop). Used to fully
  // UNMOUNT the normal Playing layouts so they can never render beneath the opaque
  // Coach overlay — the root cause of the iPad Safari "page shows through with
  // duplicated controls" bug. The overlays are `position: fixed`, but a fixed
  // element only maps to the viewport when no ancestor establishes a containing
  // block; forcing the background layouts to `display:none` makes the replace
  // behaviour bulletproof regardless of Safari's fixed-positioning quirks.
  const coachViewActive = isFullscreen || showFullscreenMobilePlayer;

  return (
    <div className="h-[100dvh] w-screen max-w-[100vw] overflow-hidden bg-[#050814] text-white">
      {/* Ambient background glow effects */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute -top-1/4 -left-1/4 w-1/2 h-1/2 bg-gradient-to-br from-[#ff4fa3]/6 to-transparent rounded-full blur-3xl" />
        <div className="absolute -bottom-1/4 -right-1/4 w-1/2 h-1/2 bg-gradient-to-tl from-[#ff8a00]/6 to-transparent rounded-full blur-3xl" />
      </div>
      
      <audio
        ref={audioRef}
        preload="metadata"
        // iOS/iPadOS WKWebView (Capacitor) refuses to start inline media playback
        // unless the element is explicitly marked play-inline. Without this the
        // play() promise rejects with NotAllowedError and the button appears dead.
        playsInline
        onEnded={handleTrackEnded}
        onTimeUpdate={handleAudioTimeUpdate}
        onLoadedMetadata={handleAudioLoadedMetadata}
        onDurationChange={handleAudioDurationChange}
        onCanPlay={handleAudioDurationChange}
        onLoadedData={handleAudioDurationChange}
        onPlay={handleAudioPlay}
        onPause={handleAudioPause}
        onError={() => {
          // A real element error means we are not playing — reflect that so the
          // Play icon is correct (isPlaying is only ever cleared by pause/ended/error).
          setIsPlaying(false);
          // If playback fails while offline and there is no local downloaded copy,
          // tell the user the track is not available on this device.
          const src = audioRef.current?.currentSrc || audioRef.current?.src || "";
          const isLocalBlob = src.startsWith("blob:");
          if (typeof navigator !== "undefined" && navigator.onLine === false && !isLocalBlob) {
            setCloudSaveMessage("This track is not downloaded to this device.");
            setCloudSaveSuccess(false);
            setTimeout(() => setCloudSaveMessage(null), 5000);
          }
          refreshAudioDiag("error");
        }}
      />

      {/* Fullscreen Mode View */}
      <div
        ref={fullscreenRef}
        data-coach-overlay="desktop"
        className={`${isFullscreen ? 'flex' : 'hidden'} fixed inset-0 z-[100] bg-[#090f1c] text-white`}
      >
        {/* Safety Confirmation Dialogs */}
        {showPauseConfirm && (
          <div className="eqho-dialog fixed inset-0 z-[200] flex items-center justify-center bg-black/70">
            <div className="bg-[#090f1c]/90 backdrop-blur-xl border border-white/20 rounded-2xl p-8 max-w-md text-center shadow-[0_0_40px_rgba(0,0,0,0.5)]">
              <AlertTriangle size={48} className="mx-auto mb-4 text-orange-400" />
              <h3 className="text-2xl font-bold text-white mb-2">Pause Playback?</h3>
              <p className="text-white/60 mb-6">Are you sure you want to pause the current session?</p>
              <div className="flex gap-4 justify-center">
                <button
                  onClick={() => setShowPauseConfirm(false)}
                  className="px-6 py-3 rounded-xl border border-white/20 text-white hover:bg-white/10 transition"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowPauseConfirm(false);
                    // Directly pause without triggering another confirmation
                    if (audioRef.current) {
                      audioRef.current.pause();
                      setIsPlaying(false);
                    }
                  }}
                  className="px-6 py-3 rounded-xl bg-orange-500 text-white font-bold hover:bg-orange-600 transition"
                >
                  Yes, Pause
                </button>
              </div>
            </div>
          </div>
        )}

        {showMuteConfirm && (
          <div className="eqho-dialog fixed inset-0 z-[200] flex items-center justify-center bg-black/70">
            <div className="bg-[#090f1c]/90 backdrop-blur-xl border border-white/20 rounded-2xl p-8 max-w-md text-center shadow-[0_0_40px_rgba(0,0,0,0.5)]">
              <VolumeX size={48} className="mx-auto mb-4 text-red-400" />
              <h3 className="text-2xl font-bold text-white mb-2">Mute Audio?</h3>
              <p className="text-white/60 mb-6">Are you sure you want to mute the audio during the session?</p>
              <div className="flex gap-4 justify-center">
                <button
                  onClick={() => setShowMuteConfirm(false)}
                  className="px-6 py-3 rounded-xl border border-white/20 text-white hover:bg-white/10 transition"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowMuteConfirm(false);
                    setIsMuted(true);
                  }}
                  className="px-6 py-3 rounded-xl bg-red-500 text-white font-bold hover:bg-red-600 transition"
                >
                  Yes, Mute
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Skip Forward Confirmation - INSIDE fullscreen container.
            Desktop fullscreen uses the browser Fullscreen API (requestFullscreen on
            fullscreenRef), which renders ONLY this element's subtree. A skip modal
            rendered as a sibling outside this container is invisible while the browser
            is in real fullscreen, so the skip appeared to "do nothing". This copy lives
            inside fullscreenRef so it shows during real fullscreen. */}
        {showSkipForwardConfirm && (
          <div className="eqho-dialog fixed inset-0 z-[200] flex items-center justify-center bg-black/70">
            <div className="bg-[#090f1c]/90 backdrop-blur-xl border border-white/20 rounded-2xl p-8 max-w-md text-center shadow-[0_0_40px_rgba(0,0,0,0.5)]">
              <StepForward size={48} className="mx-auto mb-4 text-pink-400" />
              <h3 className="text-2xl font-bold text-white mb-2">Skip to Next Track?</h3>
              <p className="text-white/60 mb-6">Are you sure you want to skip to the next track?</p>
              <div className="flex gap-4 justify-center">
                <button
                  onClick={() => setShowSkipForwardConfirm(false)}
                  className="px-6 py-3 rounded-xl border border-white/20 text-white hover:bg-white/10 transition"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowSkipForwardConfirm(false);
                    setTimeout(() => goToNextTrack(), 50);
                  }}
                  className="px-6 py-3 rounded-xl bg-gradient-to-r from-[#ff4fa3] to-[#ff8a00] text-white font-bold hover:shadow-[0_0_20px_rgba(255,122,0,0.4)] transition"
                >
                  Yes, Skip
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Skip Back Confirmation - INSIDE fullscreen container (see note above). */}
        {showSkipBackConfirm && (
          <div className="eqho-dialog fixed inset-0 z-[200] flex items-center justify-center bg-black/70">
            <div className="bg-[#090f1c]/90 backdrop-blur-xl border border-white/20 rounded-2xl p-8 max-w-md text-center shadow-[0_0_40px_rgba(0,0,0,0.5)]">
              <StepBack size={48} className="mx-auto mb-4 text-cyan-400" />
              <h3 className="text-2xl font-bold text-white mb-2">Skip to Previous Track?</h3>
              <p className="text-white/60 mb-6">Are you sure you want to go back to the previous track?</p>
              <div className="flex gap-4 justify-center">
                <button
                  onClick={() => setShowSkipBackConfirm(false)}
                  className="px-6 py-3 rounded-xl border border-white/20 text-white hover:bg-white/10 transition"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowSkipBackConfirm(false);
                    setTimeout(() => goToPreviousTrack(), 50);
                  }}
                  className="px-6 py-3 rounded-xl bg-cyan-500 text-white font-bold hover:bg-cyan-600 transition"
                >
                  Yes, Go Back
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Queue Playlist Modal */}
        {showFullscreenQueuePlaylist && (
          <div className="eqho-dialog fixed inset-0 z-[200] flex items-center justify-center bg-black/70">
            <div className="bg-[#090f1c]/90 backdrop-blur-xl border border-white/20 rounded-2xl p-6 w-full max-w-[400px] max-h-[500px] flex flex-col shadow-[0_0_40px_rgba(0,0,0,0.5)]">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-white">Queue Playlist</h3>
                <button
                  onClick={() => setShowFullscreenQueuePlaylist(false)}
                  className="grid h-8 w-8 place-items-center rounded-lg border border-white/20 text-white/60 hover:bg-white/10 transition"
                >
                  <X size={18} />
                </button>
              </div>
              
              <div className="flex-1 overflow-y-auto pr-1 min-h-0">
                {savedPlaylists.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-center py-8">
                    <ListMusic size={48} className="text-white/20 mb-4" />
                    <p className="text-white/40 text-sm">No saved playlists</p>
                    <p className="text-white/30 text-xs mt-1">Upload tracks to create playlists</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {savedPlaylists.map((pl) => (
                      <button
                        key={pl.id}
                        onClick={() => {
                          // Add all tracks from this playlist to current queue
                          setPlaylist((prev) => [...prev, ...pl.tracks]);
                          setShowFullscreenQueuePlaylist(false);
                        }}
                        className="w-full flex items-center gap-3 p-3 rounded-xl bg-white/[0.03] hover:bg-white/[0.08] border border-white/10 hover:border-pink-500/30 transition text-left"
                      >
                        <div className="grid h-10 w-10 place-items-center rounded-lg bg-gradient-to-br from-pink-500/20 to-orange-500/10 border border-pink-500/30">
                          <ListMusic size={20} className="text-pink-400" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-white truncate">{pl.name}</p>
                          <p className="text-xs text-white/50">{pl.tracks.length} tracks</p>
                        </div>
                        <Plus size={18} className="text-white/40" />
                      </button>
                    ))}
                  </div>
                )}
              </div>
              
              <div className="mt-4 pt-4 border-t border-white/10">
                <button
                  onClick={() => setShowFullscreenQueuePlaylist(false)}
                  className="w-full py-3 rounded-xl border border-white/20 text-white hover:bg-white/10 transition"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Clear Playlist Confirmation */}
        {showClearPlaylistConfirm && (
          <div className="eqho-dialog fixed inset-0 z-[200] flex items-center justify-center bg-black/70">
            <div className="bg-[#090f1c]/90 backdrop-blur-xl border border-white/20 rounded-2xl p-8 max-w-md text-center shadow-[0_0_40px_rgba(0,0,0,0.5)]">
              <AlertTriangle size={48} className="mx-auto mb-4 text-[#ff8a00]" />
              <h3 className="text-2xl font-bold text-white mb-2">Clear Playlist?</h3>
              <p className="text-white/60 mb-6">This will remove all tracks from your current session. The session will stop playing.</p>
              <div className="flex gap-4 justify-center">
                <button
                  onClick={() => setShowClearPlaylistConfirm(false)}
                  className="px-6 py-3 rounded-xl border border-white/20 text-white hover:bg-white/10 transition"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    setShowClearPlaylistConfirm(false);
                    clearPlaylist();
                  }}
                  className="px-6 py-3 rounded-xl bg-gradient-to-r from-[#ff4fa3] to-[#ff8a00] text-white font-bold hover:shadow-[0_0_20px_rgba(255,122,0,0.4)] transition"
                >
                  Yes, Clear
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Delete Account Confirmation */}
        {showDeleteAccountConfirm && (
          <div className="eqho-dialog fixed inset-0 z-[200] flex items-center justify-center bg-black/70">
            <div className="bg-[#090f1c]/90 backdrop-blur-xl border border-red-500/30 rounded-2xl p-8 max-w-md text-center shadow-[0_0_40px_rgba(0,0,0,0.5)]">
              <Trash2 size={48} className="mx-auto mb-4 text-red-500" />
              <h3 className="text-2xl font-bold text-white mb-2">Delete Account?</h3>
              <p className="text-white/60 mb-6">This will permanently delete your account and all associated data including playlists, tracks, and subscription. This action cannot be undone.</p>
              <div className="flex gap-4 justify-center">
                <button
                  onClick={() => setShowDeleteAccountConfirm(false)}
                  disabled={deleteAccountLoading}
                  className="px-6 py-3 rounded-xl border border-white/20 text-white hover:bg-white/10 transition disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteAccount}
                  disabled={deleteAccountLoading}
                  className="px-6 py-3 rounded-xl bg-red-600 text-white font-bold hover:bg-red-700 transition flex items-center gap-2 disabled:opacity-50"
                >
                  {deleteAccountLoading ? (
                    <>
                      <Loader2 size={18} className="animate-spin" />
                      Deleting...
                    </>
                  ) : (
                    <>
                      <Trash2 size={18} />
                      Delete Forever
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Send to Session Confirmation */}
        {showSendToSessionConfirm && (
          <div className="eqho-dialog fixed inset-0 z-[200] flex items-center justify-center bg-black/70">
            <div className="bg-[#090f1c]/90 backdrop-blur-xl border border-white/20 rounded-2xl p-8 max-w-md text-center shadow-[0_0_40px_rgba(0,0,0,0.5)]">
              <ListMusic size={48} className="mx-auto mb-4 text-[#ff8a00]" />
              <h3 className="text-2xl font-bold text-white mb-2">Replace Current Playlist?</h3>
              <p className="text-white/60 mb-6">Loading &quot;{showSendToSessionConfirm.name}&quot; will replace your current session playlist. The current session will stop.</p>
              <div className="flex gap-4 justify-center">
                <button
                  onClick={() => setShowSendToSessionConfirm(null)}
                  className="px-6 py-3 rounded-xl border border-white/20 text-white hover:bg-white/10 transition"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    const { name, tracks } = showSendToSessionConfirm;
                    setShowSendToSessionConfirm(null);
                    if (isPlaying && audioRef.current) {
  audioRef.current.pause();
  setIsPlaying(false);
  }
  setPlaylist(tracks);
  setOriginalPlaylistOrder([...tracks]); // Store original order
  setHiddenTrackIds(new Set()); // Clear hidden tracks when loading new playlist
  setCurrentPlaylistName(name);
                    setCurrentIndex(0);
                    setCurrentTrack(tracks[0]);
                    setSessionRunning(false);
                    setFinishedTracks(new Set());
                    // Switch back to the main player so the user sees the Up Next queue.
                    setActivePage("player");
                    setMobileTab("nowplaying");
                  }}
                  className="px-6 py-3 rounded-xl bg-gradient-to-r from-[#ff4fa3] to-[#ff8a00] text-white font-bold hover:shadow-[0_0_20px_rgba(255,122,0,0.4)] transition"
                >
                  Yes, Replace
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Delete Playlist Confirmation.
            z-[400] so it renders ABOVE the fixed mobile player (z-[300]) and the
            mobile bottom nav (z-40). At the old z-[200] this dialog opened BEHIND
            the mobile player, so tapping the trash icon looked like it "did nothing"
            on iPhone/iPad. (Same fix already applied to the track-delete dialog.) */}
        {showDeletePlaylistConfirm && (
          <div className="eqho-dialog fixed inset-0 z-[400] flex items-center justify-center bg-black/70 p-4">
            <div className="bg-[#090f1c]/90 backdrop-blur-xl border border-white/20 rounded-2xl p-8 max-w-md text-center shadow-[0_0_40px_rgba(0,0,0,0.5)]">
              <Trash2 size={48} className="mx-auto mb-4 text-red-500" />
              <h3 className="text-2xl font-bold text-white mb-2">Delete this playlist permanently?</h3>
              <p className="text-white/60 mb-6">
                This will remove &quot;{showDeletePlaylistConfirm.name}&quot; and its saved setup. Tracks used by other playlists will not be deleted.
              </p>
              <div className="flex gap-4 justify-center">
                <button
                  type="button"
                  onClick={() => setShowDeletePlaylistConfirm(null)}
                  className="px-6 py-3 rounded-xl border border-white/20 text-white hover:bg-white/10 transition"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const playlistId = showDeletePlaylistConfirm.id;
                    const playlistName = showDeletePlaylistConfirm.name;
                    console.log("[v0] DELETE PLAYLIST confirmation accepted", { playlistId, playlistName });
                    // Remove from BOTH local and cloud UI state immediately so the card
                    // disappears everywhere it is rendered (savedPlaylists + cloudPlaylists).
                    // The savedPlaylists persist effect writes the change through to
                    // IndexedDB (clearing the store when this was the last playlist).
                    setSavedPlaylists(prev => prev.filter(p => p.id !== playlistId));
                    setCloudPlaylists(prev => prev.filter(p => p.id !== playlistId));
                    // If the deleted playlist is loaded in the session, clear Now Playing.
                    if (currentPlaylistName === playlistName) {
                      const audio = audioRef.current;
                      if (audio) { try { audio.pause(); } catch {} }
                      setIsPlaying(false);
                    }
                    // Best-effort authoritative cloud metadata delete (desktop only; the
                    // handler itself no-ops on the read-only mobile build). Fire and forget
                    // — the local removal above already updated the UI + persistence.
                    if (!isMobileBuild) {
                      void deleteCloudPlaylist(playlistId)
                        .then((ok) => console.log("[v0] DELETE PLAYLIST cloud metadata delete result", { ok }))
                        .catch((err) => console.error("[v0] DELETE PLAYLIST cloud delete failed", (err as Error)?.message || String(err)));
                    }
                    // Always close the dialog (previously the mobile early-return path in
                    // handleDeleteCloudPlaylist left this dialog stuck open).
                    setShowDeletePlaylistConfirm(null);
                  }}
                  className="px-6 py-3 rounded-xl bg-red-600 text-white font-bold hover:bg-red-500 transition"
                >
                  Yes, Delete
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Permanent Track Deletion Confirmation (from the Playlists library).
            z-[400] so it renders ABOVE the fixed mobile player (z-[300]) and the
            mobile bottom nav (z-40); at z-[200] the dialog opened behind the mobile
            player and looked like the Delete button "did nothing". */}
        {confirmDeleteTrack && (
          <div className="eqho-dialog fixed inset-0 z-[400] flex items-center justify-center bg-black/70 p-4">
            <div className="bg-[#090f1c]/90 backdrop-blur-xl border border-white/20 rounded-2xl p-8 max-w-md text-center shadow-[0_0_40px_rgba(0,0,0,0.5)]">
              <Trash2 size={48} className="mx-auto mb-4 text-red-500" />
              <h3 className="text-2xl font-bold text-white mb-2">Delete this track permanently?</h3>
              <p className="text-white/60 mb-2 font-medium">
                &quot;{confirmDeleteTrack.track.title}&quot;
              </p>
              <p className="text-white/40 text-sm mb-6">
                This will remove the track from the playlist, library, cloud storage and offline storage. This cannot be undone.
              </p>
              <div className="flex gap-4 justify-center">
                <button
                  onClick={() => setConfirmDeleteTrack(null)}
                  disabled={deletingTrackId === confirmDeleteTrack.track.id}
                  className="px-6 py-3 rounded-xl border border-white/20 text-white hover:bg-white/10 transition disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleDeleteTrackPermanently(confirmDeleteTrack.playlistId, confirmDeleteTrack.track)}
                  disabled={deletingTrackId === confirmDeleteTrack.track.id}
                  className="px-6 py-3 rounded-xl bg-red-600 text-white font-bold hover:bg-red-500 transition disabled:opacity-60 flex items-center justify-center gap-2"
                >
                  {deletingTrackId === confirmDeleteTrack.track.id ? (
                    <><Loader2 size={16} className="animate-spin" /> Deleting…</>
                  ) : (
                    "Yes, Delete"
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Remove Track Confirmation */}
        {showRemoveTrackConfirm && (
          <div className="eqho-dialog fixed inset-0 z-[200] flex items-center justify-center bg-black/70">
            <div className="bg-[#090f1c]/90 backdrop-blur-xl border border-white/20 rounded-2xl p-8 max-w-md text-center shadow-[0_0_40px_rgba(0,0,0,0.5)]">
              <X size={48} className="mx-auto mb-4 text-[#ff8a00]" />
              <h3 className="text-2xl font-bold text-white mb-2">Remove Track?</h3>
              <p className="text-white/60 mb-2">Remove &quot;{showRemoveTrackConfirm.track.title}&quot; from the playlist?</p>
              <p className="text-white/40 text-sm mb-6">This may affect the currently playing session.</p>
              <div className="flex gap-4 justify-center">
                <button
                  onClick={() => setShowRemoveTrackConfirm(null)}
                  className="px-6 py-3 rounded-xl border border-white/20 text-white hover:bg-white/10 transition"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    const { track, originalIndex } = showRemoveTrackConfirm;
                    setShowRemoveTrackConfirm(null);
                    setPlaylist((prev) => {
                      const newPlaylist = prev.filter((t) => t.id !== track.id);
                      if (originalIndex < currentIndex) {
                        setCurrentIndex((idx) => Math.max(0, idx - 1));
                      } else if (originalIndex === currentIndex && newPlaylist.length > 0) {
                        setCurrentIndex((idx) => Math.min(idx, newPlaylist.length - 1));
                        if (isPlaying && audioRef.current) {
                          audioRef.current.pause();
                          setIsPlaying(false);
                        }
                        setCurrentTrack(newPlaylist[Math.min(originalIndex, newPlaylist.length - 1)] || null);
                      }
                      return newPlaylist;
                    });
                  }}
                  className="px-6 py-3 rounded-xl bg-gradient-to-r from-[#ff4fa3] to-[#ff8a00] text-white font-bold hover:shadow-[0_0_20px_rgba(255,122,0,0.4)] transition"
                >
                  Yes, Remove
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Session Finished Takeover */}
        {showSessionFinished && (
          <div className="absolute inset-0 z-[250] flex flex-col items-center justify-center bg-gradient-to-br from-[#0a0a1a] via-[#120a20] to-[#0a1020]">
            {/* Animated gradient background */}
            <div className="absolute inset-0 overflow-hidden">
              <div className="absolute -top-1/2 -left-1/2 w-full h-full bg-gradient-to-br from-[#ff4fa3]/20 to-transparent rounded-full blur-3xl animate-pulse" />
              <div className="absolute -bottom-1/2 -right-1/2 w-full h-full bg-gradient-to-tl from-[#ff8a00]/20 to-transparent rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
            </div>
            
            {/* Content */}
            <div className="relative z-10 flex flex-col items-center text-center px-8">
              {/* Checkmark Icon */}
              <div className="w-32 h-32 rounded-full bg-gradient-to-r from-[#ff4fa3] to-[#ff8a00] flex items-center justify-center mb-8 shadow-[0_0_80px_rgba(255,79,179,0.5)]">
                <svg className="w-16 h-16 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              
              {/* Title */}
              <h1 className="text-6xl font-black tracking-tight mb-4 bg-gradient-to-r from-[#ff4fa3] to-[#ff8a00] bg-clip-text text-transparent">
                SESSION COMPLETE
              </h1>
              
              {/* Subtitle */}
              <p className="text-2xl text-white/70 mb-8">
                All {playlist.length} tracks finished successfully
              </p>
              
              {/* Stats */}
              <div className="flex gap-12 mb-12">
                <div className="text-center">
                  <p className="text-4xl font-bold text-white">{playlist.length}</p>
                  <p className="text-sm text-white/50 uppercase tracking-wide">Tracks Played</p>
                </div>
                <div className="text-center">
                  <p className="text-4xl font-bold text-white">{playlistRepeats}</p>
                  <p className="text-sm text-white/50 uppercase tracking-wide">Rounds</p>
                </div>
                <div className="text-center">
                  <p className="text-4xl font-bold text-white">{formatSessionTime(totalSessionSeconds)}</p>
                  <p className="text-sm text-white/50 uppercase tracking-wide">Total Time</p>
                </div>
              </div>
              
              {/* Actions */}
              <div className="flex gap-4">
                <button
                  onClick={() => {
                    setShowSessionFinished(false);
                    setFinishedTracks(new Set());
                    setCurrentIndex(0);
                  }}
                  className="px-8 py-4 rounded-xl bg-gradient-to-r from-[#ff4fa3] to-[#ff8a00] text-white font-bold text-lg hover:shadow-[0_0_30px_rgba(255,79,179,0.5)] transition"
                >
                  Start New Session
                </button>
                <button
                  onClick={() => {
                    setShowSessionFinished(false);
                    toggleFullscreen();
                  }}
                  className="px-8 py-4 rounded-xl border border-white/20 text-white font-bold text-lg hover:bg-white/10 transition"
                >
                  Exit Fullscreen
                </button>
              </div>
            </div>
          </div>
        )}

          <div className="flex w-full h-full p-3 md:p-4 gap-3 md:gap-4 max-w-full overflow-hidden">
            {/* Now Playing - Main Section (larger) */}
            <div className="flex-[2] flex flex-col bg-[#090f1c]/80 backdrop-blur-xl rounded-2xl border border-white/10 p-4 md:p-6 min-w-0 overflow-hidden shadow-[0_0_30px_rgba(0,0,0,0.3)]">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-bold tracking-[0.22em] bg-gradient-to-r from-[#ff4fa3] to-[#ff8a00] bg-clip-text text-transparent">
                NOW PLAYING
              </h2>
              <div className="flex items-center gap-2">
                {/* Volume Control */}
                <button
                  onClick={() => {
                    if (isPlaying && !isMuted) {
                      setShowMuteConfirm(true);
                    } else {
                      setIsMuted((m) => !m);
                    }
                  }}
                  className={`grid h-10 w-10 shrink-0 place-items-center rounded-lg border transition ${
                    isMuted
                      ? "border-red-500/60 bg-red-500/15 text-red-400"
                      : "border-pink-500/40 bg-pink-500/10 text-white hover:border-pink-500/70"
                  }`}
                >
                  {isMuted ? <VolumeX size={18} /> : <Volume2 size={16} />}
                </button>
                {iosVolumeControl ? (
                  <span className="text-[11px] leading-tight text-white/60 max-w-[160px]">
                    Use your device volume buttons to adjust playback volume.
                  </span>
                ) : (
                <div
                  className="group relative flex items-center w-[120px] h-10 rounded-lg border border-white/10 bg-[#090f1c] cursor-pointer overflow-hidden touch-none select-none"
                  onMouseDown={(e) => {
                    const bar = e.currentTarget;
                    const apply = (clientX: number) => {
                      const rect = bar.getBoundingClientRect();
                      const pct = Math.round(Math.max(0, Math.min(100, ((clientX - rect.left) / rect.width) * 100)));
                      setVolume(pct);
                      if (pct > 0 && isMuted) setIsMuted(false);
                      if (pct === 0) setIsMuted(true);
                    };
                    apply(e.clientX);
                    const handleMove = (ev: MouseEvent) => apply(ev.clientX);
                    const handleUp = () => {
                      document.removeEventListener("mousemove", handleMove);
                      document.removeEventListener("mouseup", handleUp);
                    };
                    document.addEventListener("mousemove", handleMove);
                    document.addEventListener("mouseup", handleUp);
                  }}
                  onTouchStart={(e) => {
                    const bar = e.currentTarget;
                    const apply = (clientX: number) => {
                      const rect = bar.getBoundingClientRect();
                      const pct = Math.round(Math.max(0, Math.min(100, ((clientX - rect.left) / rect.width) * 100)));
                      setVolume(pct);
                      if (pct > 0 && isMuted) setIsMuted(false);
                      if (pct === 0) setIsMuted(true);
                    };
                    apply(e.touches[0].clientX);
                  }}
                  onTouchMove={(e) => {
                    const rect = e.currentTarget.getBoundingClientRect();
                    const pct = Math.round(Math.max(0, Math.min(100, ((e.touches[0].clientX - rect.left) / rect.width) * 100)));
                    setVolume(pct);
                    if (pct > 0 && isMuted) setIsMuted(false);
                    if (pct === 0) setIsMuted(true);
                  }}
                  role="slider"
                  aria-label="Volume"
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-valuenow={isMuted ? 0 : volume}
                >
                  <div
                    className="absolute left-0 top-0 bottom-0 bg-gradient-to-r from-pink-500/40 to-orange-500/30 pointer-events-none"
                    style={{ width: `${isMuted ? 0 : volume}%` }}
                  />
                  <span className="absolute inset-0 grid place-items-center z-10 text-xs font-bold text-white pointer-events-none">{isMuted ? "Muted" : `${volume}%`}</span>
                </div>
                )}
                {/* Exit Fullscreen */}
                <button
                  onClick={toggleFullscreen}
                  className="grid h-10 w-10 shrink-0 place-items-center rounded-lg border border-[#ff8a00]/40 bg-[#ff8a00]/10 text-white hover:border-[#ff8a00]/70 hover:bg-[#ff8a00]/20 transition"
                  title="Exit fullscreen"
                >
                  <Minimize2 size={18} />
                </button>
              </div>
            </div>

            {/* Track Info & Controls - Centered Vertical Layout */}
            <div className="flex-1 flex flex-col items-center justify-center min-h-0 px-4">
              
              {/* Session Countdown Timer - Large */}
              <div className="flex flex-col items-center mb-6">
                <p className="text-base text-white/40 uppercase tracking-widest mb-3">Session Remaining</p>
                <div className="text-[10rem] font-black tracking-tight tabular-nums leading-none">
                  {isGapPaused ? (
                    <span className="countdown-flash bg-gradient-to-r from-[#ff4fa3] to-[#ff8a00] bg-clip-text text-transparent" key={gapCountdown}>
                      {gapCountdown}
                    </span>
                  ) : (
                    <span className="text-white">
                      {formatSessionTime(remainingSeconds)}
                    </span>
  )}
  </div>
  <p className="text-sm text-white/40 mt-3">
  {isGapPaused ? "Next Track In" : `${visiblePlaylist.length} tracks + ${gapSeconds}s gaps`}
  </p>
              </div>

              {/* Rounds Counter */}
              {playlistRepeats > 1 && (
                <div className="flex items-center justify-center gap-3 mb-6">
                  <div className="flex items-center gap-3 px-6 py-3 rounded-full bg-white/5 border border-white/10">
                    <Repeat size={20} className="text-[#ff8a00]" />
                    <span className="text-xl font-bold text-white">
                      Round {playlistRound} <span className="text-white/50 font-normal">of</span> {playlistRepeats}
                    </span>
                  </div>
                </div>
              )}

              {/* Track Title */}
              <h3 className="text-5xl font-bold text-white text-center mb-3 max-w-[700px] truncate">
                {isGapPaused 
                  ? getNextTrackTitle()
                  : (currentTrack?.title || "No Track Selected")
                }
              </h3>
              
              {/* Track Timer - Larger */}
              <p className="text-3xl text-white/70 tabular-nums mb-3">
                {currentTime > 0 || isPlaying
                  ? `${String(Math.floor(currentTime / 60)).padStart(2, "0")}:${String(Math.floor(currentTime % 60)).padStart(2, "0")}`
                  : "00:00"}
                {trackDuration > 0 && <span className="text-white/40"> / {formatDuration(trackDuration)}</span>}
  </p>
  
  <p className="text-xl text-white/50 mb-6">
  {isGapPaused 
    ? (() => {
        // Use the captured upcoming track ID so the number matches the
        // title shown during the gap (back-to-back keeps the same track).
        const upcomingIdx = nextUpTrackId
          ? visiblePlaylist.findIndex(t => t.id === nextUpTrackId)
          : -1;
        return upcomingIdx >= 0
          ? `Track ${upcomingIdx + 1} of ${visiblePlaylist.length}`
          : `Track ${visiblePlaylist.length} of ${visiblePlaylist.length}`;
      })()
    : (currentTrack ? `Track ${getVisibleIndex(currentTrack.id) + 1} of ${visiblePlaylist.length}` : "Upload tracks to begin")
  }
  </p>

              {/* Playback Controls */}
              <div className="flex items-center justify-center gap-8">
                <button 
                  onClick={handleSkipBackClick}
                  className="grid h-12 w-12 place-items-center rounded-full border border-white/20 bg-white/[0.06] text-white/85 hover:bg-white/15 hover:border-white/30 transition"
                >
                  <StepBack size={24} />
                </button>

                <button
                  onClick={handlePauseClick}
                  disabled={!currentTrack && playlist.length === 0}
                  className="w-16 h-16 rounded-full bg-gradient-to-r from-pink-500 to-orange-500 text-white flex items-center justify-center disabled:opacity-40 shadow-[0_0_40px_rgba(255,79,179,0.4)] hover:shadow-[0_0_60px_rgba(255,79,179,0.6)] transition"
                >
                  {isGapPaused ? (
                    <span className="text-2xl font-black tabular-nums countdown-flash" key={gapCountdown}>{gapCountdown}</span>
                  ) : isPlaying ? <Pause size={28} /> : <Play size={28} />}
                </button>

                <button 
                  onClick={handleSkipForwardClick}
                  className="grid h-12 w-12 place-items-center rounded-full border border-white/20 bg-white/[0.06] text-white/85 hover:bg-white/15 hover:border-white/30 transition"
                >
                  <StepForward size={24} />
                </button>
              </div>

              {/* Start Session / Session Finished Button - Shows when not playing and has tracks */}
              {!isPlaying && !sessionRunning && playlist.length > 0 && (
                <button
                  onClick={() => {
                    setShowSessionFinished(false);
                    setFinishedTracks(new Set());
                    setCurrentIndex(0);
                    toggleSession();
                  }}
                  className={`mt-6 rounded-xl text-white font-bold transition-all transform hover:scale-105 ${
                    (showSessionFinished || finishedTracks.size === playlist.length)
                      ? "px-14 py-5 text-xl bg-gradient-to-r from-[#FF5733] to-[#ff4fa3] hover:shadow-[0_0_50px_rgba(255,107,53,0.6)]" 
                      : "px-10 py-4 text-lg bg-gradient-to-r from-[#ff4fa3] to-[#ff8a00] hover:shadow-[0_0_40px_rgba(255,79,179,0.5)]"
                  }`}
                >
                  {(showSessionFinished || finishedTracks.size === playlist.length) ? "Session Completed" : "Start Session"}
                </button>
              )}
            </div>

            {/* Progress Bar */}
            <div className="mt-auto pt-4">
              <div
                className="relative flex h-12 w-full cursor-pointer items-end gap-[2px] rounded-xl border border-white/5 bg-white/[0.02] px-2 pb-2 pt-2 select-none"
                onClick={(e) => {
                  if (trackDuration === 0) return;
                  const rect = e.currentTarget.getBoundingClientRect();
                  const x = e.clientX - rect.left;
                  const pct = x / rect.width;
                  seekToSeconds(pct * trackDuration);
                }}
              >
                {Array.from({ length: 80 }).map((_, i) => {
                  const barProgress = (i / 80) * 100;
                  const isPlayed = barProgress <= trackProgress;
                  const heights = [40, 60, 80, 55, 70, 45, 85, 50, 65, 75];
                  const h = heights[i % heights.length];
                  return (
                    <div
                      key={i}
                      className={`flex-1 rounded-sm transition-colors ${
                        isPlayed
                          ? "bg-gradient-to-t from-[#ff4fa3] to-[#ff8a00]"
                          : "bg-white/15"
                      }`}
                      style={{ height: `${h}%` }}
                    />
                  );
                })}
                <div className="absolute bottom-1 left-3 text-xs text-white/60">
                  {formatDuration(currentTime)}
                </div>
                <div className="absolute bottom-1 right-3 text-xs text-white/60">
                  {trackDuration > 0 ? formatDuration(trackDuration) : "--:--"}
                </div>
              </div>
            </div>
          </div>

        {/* Up Next - Side Section (smaller) */}
        <div className="flex-1 flex flex-col bg-[#090f1c]/80 backdrop-blur-xl rounded-2xl border border-white/10 p-4 min-w-[240px] max-w-[320px] overflow-hidden shadow-[0_0_30px_rgba(0,0,0,0.3)]">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-xs font-bold tracking-widest text-[#ff8a00]">UP NEXT (IN ORDER)</h2>
              <div className="flex items-center gap-1.5">
                {playlist.length > 0 && (
                  <button
                    onClick={resetPlaylist}
                    className="flex items-center gap-0.5 px-1.5 py-0.5 rounded-md bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 text-[9px] font-bold hover:bg-cyan-500/20 transition"
                  >
                    <RotateCcw size={10} />
                    Reset
                  </button>
                )}
                <button
                  onClick={() => {
                    if (sessionRunning || isPlaying) {
                      setShowClearPlaylistConfirm(true);
                    } else {
                      clearPlaylist();
                    }
                  }}
                  className="flex items-center gap-0.5 px-1.5 py-0.5 rounded-md bg-orange-500/10 border border-orange-500/30 text-orange-400 text-[9px] font-bold hover:bg-orange-500/20 transition"
                >
                  <X size={10} />
                  Clear
                </button>
                {hiddenTrackIds.size > 0 && (
                  <button
                    onClick={() => setHiddenTrackIds(new Set())}
                    className="flex items-center gap-0.5 px-1.5 py-0.5 rounded-md bg-blue-500/10 border border-blue-500/30 text-blue-400 text-[9px] font-bold hover:bg-blue-500/20 transition"
                  >
                    <RotateCcw size={10} />
                    Restore ({hiddenTrackIds.size})
                  </button>
                )}
                <span className="text-[9px] text-white/50">{visiblePlaylist.length} tracks</span>
              </div>
            </div>
            <p className="border-b border-white/10 pb-2 text-[10px] text-white/60 mb-2">Drag to re-order</p>

            <div className="flex-1 overflow-y-auto pr-1 min-h-0">
              {playlist.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center">
                  <Music size={36} className="text-white/20 mb-3" />
                  <p className="text-white/40 text-xs">No tracks queued</p>
                </div>
              ) : (
                (() => {
                  const upcoming = playlist.slice(currentIndex).map((track, i) => ({ track, originalIndex: currentIndex + i }));
                  const completed = playlist.slice(0, currentIndex).map((track, i) => ({ track, originalIndex: i }));
                  const reordered = [...upcoming, ...completed];

                  return (
                    <SortableTrackList
                      ids={reordered.map(({ track }) => track.id)}
                      onReorder={reorderPlaylistByIds}
                    >
                      {reordered.map(({ track, originalIndex }) => {
                    const colours = ["text-[#ff8a00]", "text-blue-500", "text-purple-400", "text-[#ff4fa3]", "text-cyan-400", "text-green-400"];
                    const colour = colours[originalIndex % colours.length];
                    const isActiveTrack = currentTrack?.id === track.id;
                    const isCompleted = originalIndex < currentIndex;
                    const isHidden = hiddenTrackIds.has(track.id);

                    return (
                        <SortableTrackItem
                          key={track.id}
                          id={track.id}
                          className={`flex items-center gap-2 p-2 rounded-lg mb-1.5 transition cursor-grab active:cursor-grabbing ${
                            isHidden
                              ? "opacity-40 bg-white/[0.01] border border-dashed border-white/10"
                              : isActiveTrack
                              ? "bg-gradient-to-r from-pink-500/20 to-orange-500/10 border border-pink-500/30"
                              : isCompleted
                              ? "opacity-50 bg-white/[0.02]"
                              : "bg-white/[0.03] hover:bg-white/[0.06]"
                          }`}
                          onClick={() => {
                            if (isHidden) return; // Don't allow clicking hidden tracks
                            setCurrentIndex(originalIndex);
                            togglePlayPause(track);
                          }}
                        >
                          <TrackDragHandle className="flex items-center justify-center -ml-1 text-white/30 hover:text-white/70 active:text-white shrink-0 bg-transparent border-0 p-0.5">
                            <GripVertical size={16} />
                          </TrackDragHandle>
                          <span className={`text-sm font-black w-6 ${isHidden ? "text-white/20" : colour}`}>{originalIndex + 1}</span>
                          <div className="flex-1 min-w-0">
                            <p className={`text-sm font-semibold truncate ${isHidden ? "text-white/30 line-through" : isActiveTrack ? colour : "text-white"}`}>
                              {track.title}
                            </p>
                            <p className={`text-[10px] ${isHidden ? "text-white/20" : "text-white/50"}`}>{isHidden ? "Hidden" : formatDuration(track.durationSeconds)}</p>
                          </div>
                          {!isHidden && isActiveTrack && isPlaying && (
                            <div className="flex gap-0.5">
                              {[1, 2, 3].map((i) => (
                                <div key={i} className="w-0.5 bg-pink-500 rounded-full animate-pulse" style={{ height: `${8 + i * 3}px`, animationDelay: `${i * 0.1}s` }} />
                              ))}
                            </div>
                          )}
                          {!isHidden && isCompleted && <span className="text-[10px] text-white/40">Played</span>}
                          {isHidden ? (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setHiddenTrackIds(prev => {
                                  const next = new Set(prev);
                                  next.delete(track.id);
                                  return next;
                                });
                              }}
                              className="ml-1 px-2 py-1 rounded-lg text-[9px] font-bold text-cyan-400 bg-cyan-500/10 border border-cyan-500/30 hover:bg-cyan-500/20 transition"
                            >
                              Unhide
                            </button>
                          ) : (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                hideTrackFromSession(track.id);
                              }}
                              aria-label={`Hide ${track.title} from this session`}
                              title="Hide from this session"
                              className="ml-1 flex items-center justify-center w-6 h-6 rounded-md text-white/40 hover:text-white hover:bg-white/10 transition shrink-0"
                            >
                              <X size={14} />
                            </button>
                          )}
                        </SortableTrackItem>
                    );
                  })}
                    </SortableTrackList>
                  );
                })()
              )}
            </div>

            {/* Session Info */}
            <div className="mt-auto pt-3 border-t border-white/10">
              <div className="grid grid-cols-2 gap-2 text-center">
                <div>
                  <p className="text-xl font-bold text-white">{playlist.length}</p>
                  <p className="text-[9px] text-white/50 uppercase tracking-wide">Tracks</p>
                </div>
                <div>
                  <p className="text-xl font-bold text-white">{formatSessionTime(totalSessionSeconds)}</p>
                  <p className="text-[9px] text-white/50 uppercase tracking-wide">Total Time</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Fullscreen Mobile Player - Rendered outside isFullscreen container so it shows on mobile */}
      {showFullscreenMobilePlayer && (
        <div
          data-coach-overlay="mobile"
          className="fixed inset-0 z-[300] flex flex-col bg-gradient-to-b from-[#0a0a1a] via-[#120a20] to-[#0a1020] safe-area-inset"
          // Height tracks the real visual viewport on iPad Safari (see the
          // --coach-viewport-height effect), falling back to 100dvh elsewhere. This
          // keeps the row-3 bottom controls inside the visible area so the queue never
          // has to scroll under an off-screen control row.
          style={{ height: "var(--coach-viewport-height, 100dvh)", maxHeight: "var(--coach-viewport-height, 100dvh)" }}
        >
          {/* Session Finished Mobile Takeover */}
          {showSessionFinished && (
            <div className="absolute inset-0 z-[350] flex flex-col items-center justify-center bg-gradient-to-br from-[#0a0a1a] via-[#120a20] to-[#0a1020] px-6">
              <div className="absolute inset-0 overflow-hidden">
                <div className="absolute -top-1/2 -left-1/2 w-full h-full bg-gradient-to-br from-[#ff4fa3]/20 to-transparent rounded-full blur-3xl animate-pulse" />
                <div className="absolute -bottom-1/2 -right-1/2 w-full h-full bg-gradient-to-tl from-[#ff8a00]/20 to-transparent rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
              </div>
              <div className="relative z-10 flex flex-col items-center text-center">
                <div className="w-20 h-20 rounded-full bg-gradient-to-r from-[#ff4fa3] to-[#ff8a00] flex items-center justify-center mb-6 shadow-[0_0_60px_rgba(255,79,179,0.5)]">
                  <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h1 className="text-3xl font-black tracking-tight mb-2 bg-gradient-to-r from-[#ff4fa3] to-[#ff8a00] bg-clip-text text-transparent">SESSION COMPLETE</h1>
                <p className="text-lg text-white/70 mb-6">All {playlist.length} tracks finished</p>
                <div className="flex gap-6 mb-8">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-white">{playlist.length}</p>
                    <p className="text-[10px] text-white/50 uppercase">Tracks</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-white">{playlistRepeats}</p>
                    <p className="text-[10px] text-white/50 uppercase">Rounds</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-white">{formatSessionTime(totalSessionSeconds)}</p>
                    <p className="text-[10px] text-white/50 uppercase">Time</p>
                  </div>
                </div>
                <div className="flex flex-col gap-3 w-full">
                  <button onClick={() => { setShowSessionFinished(false); setFinishedTracks(new Set()); setCurrentIndex(0); toggleSession(); }} className="w-full py-3 rounded-xl bg-gradient-to-r from-[#ff4fa3] to-[#ff8a00] text-white font-bold">Start New Session</button>
                  <button onClick={() => { setShowSessionFinished(false); setShowFullscreenMobilePlayer(false); }} className="w-full py-3 rounded-xl border border-white/20 text-white font-medium">Exit Fullscreen</button>
                </div>
              </div>
            </div>
          )}

          {/* Gap Countdown Overlay - shows during entire gap */}
          {isGapPaused && (
            <div className="absolute inset-0 z-[320] flex flex-col items-center justify-center bg-black/90 backdrop-blur-md">
              {/* Solid brand PINK (#ff4fa3), NOT gradient bg-clip-text: iPad Safari
                  fails to paint gradient-clipped text at huge font sizes, rendering it
                  fully transparent/invisible. A solid fill + a pink→orange glow keeps
                  both brand colors present while guaranteeing the number is visible. */}
              <div
                key={gapCountdown}
                className={`font-black leading-none text-[#ff4fa3] ${gapCountdown <= 3 ? 'text-[50vh]' : 'text-[30vh]'}`}
                style={{
                  animation: gapCountdown <= 3 ? 'countdownPulse 1s ease-out' : 'none',
                  textShadow: '0 0 60px rgba(255,79,163,0.55), 0 0 120px rgba(255,138,0,0.4)',
                }}
              >
                {gapCountdown}
              </div>
              <div className="mt-4 text-center">
                <p className="text-white/60 text-sm uppercase tracking-widest mb-2">Up Next</p>
                <p className="text-xl font-bold text-white px-4">
                  {getNextTrackTitle()}
                </p>
              </div>
              <style jsx>{`
                @keyframes countdownPulse {
                  0% { transform: scale(0.5); opacity: 0; }
                  30% { transform: scale(1.1); opacity: 1; }
                  100% { transform: scale(1); opacity: 1; }
                }
              `}</style>
            </div>
          )}

          {/* Header */}
          <div className="flex items-center justify-between px-4 py-2 pt-[env(safe-area-inset-top)] shrink-0">
            <button type="button" onClick={() => setShowFullscreenMobilePlayer(false)} className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center relative z-10">
              <X size={18} className="text-white" />
            </button>
            <h2 className="text-xs font-bold tracking-[0.15em] bg-gradient-to-r from-[#ff4fa3] to-[#ff8a00] bg-clip-text text-transparent">
              {currentTrack ? "NOW PLAYING" : "COACH VIEW"}
            </h2>
            <button onClick={() => setIsMuted(!isMuted)} className={`w-9 h-9 rounded-full flex items-center justify-center ${isMuted ? "bg-red-500/20 text-red-400" : "bg-white/10 text-white/70"}`}>
              {isMuted ? <VolumeX size={16} /> : <Volume2 size={16} />}
            </button>
          </div>

          {/* No Session Loaded State */}
          {!currentTrack && playlist.length === 0 && (
            <div className="flex-1 flex flex-col items-center justify-center px-6 text-center">
              <div className="w-20 h-20 rounded-full bg-white/5 border border-white/10 flex items-center justify-center mb-6">
                <ListMusic size={32} className="text-white/30" />
              </div>
              <h2 className="text-2xl font-bold text-white/80 mb-2">No Session Loaded</h2>
              <p className="text-white/50 mb-8 max-w-xs">
                Add tracks to your playlist and start a session to use Coach View
              </p>
              <button
                onClick={() => setShowFullscreenMobilePlayer(false)}
                className="px-8 py-3 rounded-xl bg-gradient-to-r from-[#ff4fa3] to-[#ff8a00] text-white font-bold shadow-lg shadow-pink-500/20"
              >
                Go Back
              </button>
            </div>
          )}

          {/* Main Content (only show when session is loaded).
              iPad Safari fix: a 3-row CSS grid (auto / minmax(0,1fr) / auto) reliably
              bounds the middle row so the queue's own scroll area scrolls instead of
              growing to fit content (the old nested flex `min-h-0` chain did not bound
              height on iOS, so the queue overlapped the bottom controls and clipped the
              last rows). Row 1 = header/now-playing block, row 2 = scrollable queue,
              row 3 = volume/bottom controls — controls are a real grid row, never
              layered over the queue. */}
          {(currentTrack || playlist.length > 0) && (
          <div className="flex-1 min-h-0 grid grid-rows-[auto_minmax(0,1fr)_auto_auto] overflow-hidden px-4">
            {/* ROW 1: Now Playing block (timer, track info, controls, waveform) */}
            <div className="min-h-0">
            {/* Session Remaining Timer - Large */}
            <div className="text-center py-4">
              <p className="text-[10px] text-white/40 uppercase tracking-widest mb-1">Session Remaining</p>
              <div className="text-5xl font-black tracking-tight tabular-nums leading-none">
                {isGapPaused ? (
                  <span className="countdown-flash bg-gradient-to-r from-[#ff4fa3] to-[#ff8a00] bg-clip-text text-transparent" key={gapCountdown}>{gapCountdown}</span>
                ) : (
                  <span className="text-white">{formatSessionTime(remainingSeconds)}</span>
                )}
              </div>
              <p className="text-[10px] text-white/40 mt-1">
                {isGapPaused ? "Next Track In" : `${visiblePlaylist.length} tracks + ${gapSeconds}s gaps`}
              </p>
            </div>

            {/* Rounds Counter */}
            {playlistRepeats > 1 && (
              <div className="flex items-center justify-center gap-3 py-2 mb-2">
                <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10">
                  <Repeat size={14} className="text-[#ff8a00]" />
                  <span className="text-sm font-bold text-white">
                    Round {playlistRound} <span className="text-white/50 font-normal">of</span> {playlistRepeats}
                  </span>
                </div>
              </div>
            )}

            {/* Track Info */}
            <div className="text-center mb-3">
              <h1 className="text-xl font-black text-white truncate px-2">
                {isGapPaused 
                  ? getNextTrackTitle()
                  : (currentTrack?.title || "No Track Selected")
                }
              </h1>
              <p className="text-sm text-white/70 tabular-nums mt-1">
                {currentTime > 0 || isPlaying ? `${String(Math.floor(currentTime / 60)).padStart(2, "0")}:${String(Math.floor(currentTime % 60)).padStart(2, "0")}` : "00:00"}
                {trackDuration > 0 && <span className="text-white/40"> / {formatDuration(trackDuration)}</span>}
              </p>
              <p className="text-xs text-white/50">
                {isGapPaused 
                  ? (() => {
                      const upcomingIdx = nextUpTrackId
                        ? visiblePlaylist.findIndex(t => t.id === nextUpTrackId)
                        : -1;
                      return upcomingIdx >= 0
                        ? `Track ${upcomingIdx + 1} of ${visiblePlaylist.length}`
                        : `Track ${visiblePlaylist.length} of ${visiblePlaylist.length}`;
                    })()
                  : (currentTrack ? `Track ${getVisibleIndex(currentTrack.id) + 1} of ${visiblePlaylist.length}` : "Upload tracks to begin")
                }
              </p>
            </div>

            {/* Playback Controls */}
            <div className="flex items-center justify-center gap-6 mb-3">
              <button onClick={handleSkipBackClick} className="w-12 h-12 rounded-full border border-white/20 bg-white/[0.06] flex items-center justify-center">
                <StepBack size={22} className="text-white" />
              </button>
              <button onClick={handlePauseClick} disabled={!currentTrack && playlist.length === 0} className="w-16 h-16 rounded-full bg-gradient-to-r from-pink-500 to-orange-500 text-white flex items-center justify-center disabled:opacity-40 shadow-[0_0_30px_rgba(255,79,179,0.4)]">
                {isGapPaused ? <span className="text-xl font-black tabular-nums countdown-flash">{gapCountdown}</span> : isPlaying ? <Pause size={28} /> : <Play size={28} className="ml-1" />}
              </button>
              <button onClick={handleSkipForwardClick} className="w-12 h-12 rounded-full border border-white/20 bg-white/[0.06] flex items-center justify-center">
                <StepForward size={22} className="text-white" />
              </button>
            </div>

            {/* Waveform Progress Bar — tap OR drag to seek (Pointer Events, same as
                the main mobile player). touch-none prevents mid-scrub page scroll. */}
            <div
              className="relative flex h-10 w-full cursor-pointer items-end gap-[2px] rounded-xl border border-white/5 bg-white/[0.02] px-2 pb-2 pt-2 mb-3 touch-none select-none"
              onPointerDown={(e) => {
                if (trackDuration === 0) return;
                waveformScrubbingRef.current = true;
                e.currentTarget.setPointerCapture(e.pointerId);
                const rect = e.currentTarget.getBoundingClientRect();
                const pct = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
                seekToSeconds(pct * trackDuration);
              }}
              onPointerMove={(e) => {
                if (!waveformScrubbingRef.current || trackDuration === 0) return;
                const rect = e.currentTarget.getBoundingClientRect();
                const pct = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
                seekToSeconds(pct * trackDuration);
              }}
              onPointerUp={(e) => {
                waveformScrubbingRef.current = false;
                if (e.currentTarget.hasPointerCapture(e.pointerId)) e.currentTarget.releasePointerCapture(e.pointerId);
              }}
              onPointerCancel={() => { waveformScrubbingRef.current = false; }}
            >
              {Array.from({ length: 50 }).map((_, i) => {
                const barProgress = (i / 50) * 100;
                const isPlayed = barProgress <= trackProgress;
                const heights = [40, 60, 80, 55, 70, 45, 85, 50, 65, 75];
                return (
                  <div key={i} className={`flex-1 rounded-sm transition-colors ${isPlayed ? "bg-gradient-to-t from-[#ff4fa3] to-[#ff8a00]" : "bg-white/15"}`} style={{ height: `${heights[i % heights.length]}%` }} />
                );
              })}
              <div className="absolute bottom-0.5 left-2 text-[9px] text-white/60">{formatDuration(currentTime)}</div>
              <div className="absolute bottom-0.5 right-2 text-[9px] text-white/60">{trackDuration > 0 ? formatDuration(trackDuration) : "--:--"}</div>
            </div>

            </div>
            {/* ROW 2: Up Next Queue — the single flexible, independently scrollable
                area. `min-h-0 h-full` lets the grid row (minmax(0,1fr)) bound it so its
                inner list scrolls rather than expanding over the controls below. */}
            <div className="min-h-0 h-full flex flex-col bg-[#090f1c]/60 rounded-xl border border-white/10 overflow-hidden">
              <div className="flex items-center justify-between px-3 py-2 border-b border-white/10 shrink-0">
                <h3 className="text-[10px] font-bold tracking-widest text-[#ff8a00]">UP NEXT</h3>
                <div className="flex items-center gap-2">
                  {playlist.length > 0 && (
                    <button onClick={resetPlaylist} className="px-2 py-1 rounded bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 text-[9px] font-bold flex items-center gap-1">
                      <RotateCcw size={10} />
                      Reset
                    </button>
                  )}
                  <button onClick={() => { if (sessionRunning || isPlaying) { setShowClearPlaylistConfirm(true); } else { clearPlaylist(); } }} className="px-2 py-1 rounded bg-orange-500/10 border border-orange-500/30 text-orange-400 text-[9px] font-bold">Clear</button>
                </div>
              </div>
              <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden overscroll-contain touch-pan-y [-webkit-overflow-scrolling:touch]">
                {visiblePlaylist.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full py-6">
                    <ListMusic size={32} className="text-white/20 mb-2" />
                    <p className="text-white/40 text-xs">No tracks in queue</p>
                  </div>
                ) : (
                  <div className="p-2 pb-3">
                    <SortableTrackList
                      ids={playlist.map((t) => t.id)}
                      onReorder={reorderPlaylistByIds}
                    >
                    {playlist.map((track, idx) => {
                      const isCurrent = currentTrack?.id === track.id;
                      const isFinished = finishedTracks.has(track.id);
                      const isHidden = hiddenTrackIds.has(track.id);
                      return (
                        <SortableTrackItem key={track.id} id={track.id} onClick={() => { if (!isHidden) { setCurrentIndex(idx); togglePlayPause(track); } }} className={`grid grid-cols-[20px_28px_minmax(0,1fr)_auto] items-center gap-2 px-2 py-1.5 mb-1 rounded-lg cursor-pointer transition min-h-[52px] ${isHidden ? "opacity-40 border border-dashed border-white/10" : isCurrent ? "bg-gradient-to-r from-pink-500/20 to-orange-500/10 border border-pink-500/30" : isFinished ? "bg-green-500/10 border border-green-500/20" : "bg-white/[0.02] border border-transparent hover:bg-white/[0.05]"}`}>
                          <TrackDragHandle className="flex items-center justify-center -ml-0.5 text-white/25 hover:text-white/70 active:text-white bg-transparent border-0 p-0.5">
                            <GripVertical size={14} />
                          </TrackDragHandle>
                          <span className={`text-[10px] font-bold text-center ${isHidden ? "text-white/20" : isCurrent ? "text-pink-400" : isFinished ? "text-green-400" : "text-white/40"}`}>{idx + 1}</span>
                          <p className={`text-xs min-w-0 overflow-hidden text-ellipsis whitespace-nowrap ${isHidden ? "text-white/25 line-through" : isCurrent ? "text-white font-semibold" : isFinished ? "text-green-300" : "text-white/70"}`}>{track.title}</p>
                          <div className="flex items-center justify-end gap-1">
                            {isHidden && <span className="text-[8px] text-white/30">Hidden</span>}
                            {!isHidden && isCurrent && isPlaying && <div className="w-2 h-2 rounded-full bg-pink-500 animate-pulse" />}
                            {!isHidden && isFinished && !isCurrent && <Check size={12} className="text-green-400" />}
                            {isHidden && (
                              <button onClick={(e) => { e.stopPropagation(); setHiddenTrackIds(prev => { const next = new Set(prev); next.delete(track.id); return next; }); }} className="px-1.5 py-0.5 rounded text-[8px] font-bold text-cyan-400 bg-cyan-500/10 border border-cyan-500/30">
                                Unhide
                              </button>
                            )}
                          </div>
                        </SortableTrackItem>
                      );
                    })}
                    </SortableTrackList>
                  </div>
                )}
              </div>
            </div>

            {/* ROW 3: Session controls — Gap, Back-to-Back, Total Session Time and
                Repeats, restored into Coach View. This is a real grid row (auto
                height), so the queue (row 2) shrinks to fit and these controls never
                overlap it. Styling, icons and handlers mirror the main player's
                session bar so branding stays consistent. 2-up on narrow/portrait,
                4-up across on wider iPads. */}
            <div className="shrink-0 grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
              {/* Gap Between Routines */}
              <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-[#090f1c]/60 px-2 py-1.5">
                <div className="grid h-8 w-8 shrink-0 place-items-center rounded-full border border-white/50 text-white/80">
                  <Users size={14} />
                </div>
                <div className="min-w-0">
                  <div className="text-[8px] font-semibold tracking-wide text-white/50 uppercase leading-none mb-1">Gap</div>
                  <div className="flex items-center rounded-md border border-white/15 bg-white/5">
                    <button type="button" onClick={() => updateGapSeconds((v) => Math.max(0, v - 5))} className="grid h-7 w-7 place-items-center text-white/70 active:bg-white/10 rounded-l-md"><Minus size={12} /></button>
                    <span className="px-1 text-xs font-bold text-white tabular-nums min-w-[32px] text-center">{gapSeconds}s</span>
                    <button type="button" onClick={() => updateGapSeconds((v) => Math.min(120, v + 5))} className="grid h-7 w-7 place-items-center text-white/70 active:bg-white/10 rounded-r-md"><Plus size={12} /></button>
                  </div>
                </div>
              </div>

              {/* Back to Back */}
              <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-[#090f1c]/60 px-2 py-1.5">
                <div className={`grid h-8 w-8 shrink-0 place-items-center rounded-full border ${backToBack ? "border-pink-500 text-pink-500" : "border-pink-500/50 text-pink-500/50"}`}>
                  <RefreshCw size={14} />
                </div>
                <div className="min-w-0">
                  <div className="text-[8px] font-semibold tracking-wide text-white/50 uppercase leading-none mb-1">B2B</div>
                  <button type="button" onClick={() => updateBackToBack((v) => !v)} className="flex items-center gap-1.5">
                    <span className="text-xs font-bold text-white">{backToBack ? "On" : "Off"}</span>
                    <div className={`h-5 w-9 rounded-full border p-0.5 transition-colors ${backToBack ? "border-pink-500 bg-pink-500/30" : "border-white/25 bg-white/10"}`}>
                      <div className={`h-4 w-4 rounded-full transition-transform ${backToBack ? "translate-x-4 bg-pink-500" : "translate-x-0 bg-white/40"}`} />
                    </div>
                  </button>
                </div>
              </div>

              {/* Total Session Time */}
              <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-[#090f1c]/60 px-2 py-1.5">
                <div className="grid h-8 w-8 shrink-0 place-items-center rounded-full border border-orange-400 text-orange-400">
                  <Clock size={15} />
                </div>
                <div className="min-w-0">
                  <div className="text-[8px] font-semibold tracking-wide text-white/50 uppercase leading-none mb-1">Time</div>
                  <div className="text-sm font-bold text-white tabular-nums leading-none">{formatSessionTime(totalSessionSeconds)}</div>
                </div>
              </div>

              {/* Repeat Playlist */}
              <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-[#090f1c]/60 px-2 py-1.5">
                <div className="grid h-8 w-8 shrink-0 place-items-center rounded-full border border-cyan-400 text-cyan-400">
                  <Repeat size={14} />
                </div>
                <div className="min-w-0">
                  <div className="text-[8px] font-semibold tracking-wide text-white/50 uppercase leading-none mb-1">Reps</div>
                  <div className="flex items-center rounded-md border border-cyan-400/30 bg-cyan-400/5">
                    <button type="button" onClick={() => updatePlaylistRepeats((v) => Math.max(1, v - 1))} className="grid h-7 w-7 place-items-center text-cyan-300 active:bg-cyan-400/10 rounded-l-md"><Minus size={12} /></button>
                    <span className="px-1 text-xs font-bold text-white tabular-nums min-w-[30px] text-center">{playlistRepeats === 1 ? "Off" : `${playlistRepeats}x`}</span>
                    <button type="button" onClick={() => updatePlaylistRepeats((v) => Math.min(99, v + 1))} className="grid h-7 w-7 place-items-center text-cyan-300 active:bg-cyan-400/10 rounded-r-md"><Plus size={12} /></button>
                  </div>
                </div>
              </div>
            </div>

            {/* ROW 4: Volume Slider - matches the desktop on-brand drag-track control:
                orange->pink gradient fill with the % centered inside, no thumb dot. */}
            <div className="flex items-center gap-3 py-2 justify-center shrink-0">
              <button
                type="button"
                onClick={() => setIsMuted((m) => !m)}
                aria-label={isMuted ? "Unmute" : "Mute"}
                className={`grid h-9 w-9 shrink-0 place-items-center rounded-lg border transition ${
                  isMuted
                    ? "border-red-500/60 bg-red-500/15 text-red-400"
                    : "border-pink-500/40 bg-pink-500/10 text-white hover:border-pink-500/70"
                }`}
              >
                {isMuted ? <VolumeX size={16} /> : <Volume2 size={15} />}
              </button>
              {iosVolumeControl ? (
                <span className="text-xs leading-tight text-white/60 max-w-[220px] text-center">
                  Use your device volume buttons to adjust playback volume.
                </span>
              ) : (
              <div
                className="group relative flex items-center w-[160px] h-9 rounded-lg border border-white/10 bg-[#090f1c] cursor-pointer overflow-hidden touch-none select-none"
                onMouseDown={(e) => {
                  const bar = e.currentTarget;
                  const apply = (clientX: number) => {
                    const rect = bar.getBoundingClientRect();
                    const pct = Math.round(Math.max(0, Math.min(100, ((clientX - rect.left) / rect.width) * 100)));
                    setVolume(pct);
                    if (pct > 0 && isMuted) setIsMuted(false);
                    if (pct === 0) setIsMuted(true);
                  };
                  apply(e.clientX);
                  const handleMove = (ev: MouseEvent) => apply(ev.clientX);
                  const handleUp = () => {
                    document.removeEventListener("mousemove", handleMove);
                    document.removeEventListener("mouseup", handleUp);
                  };
                  document.addEventListener("mousemove", handleMove);
                  document.addEventListener("mouseup", handleUp);
                }}
                onTouchStart={(e) => {
                  const rect = e.currentTarget.getBoundingClientRect();
                  const pct = Math.round(Math.max(0, Math.min(100, ((e.touches[0].clientX - rect.left) / rect.width) * 100)));
                  setVolume(pct);
                  if (pct > 0 && isMuted) setIsMuted(false);
                  if (pct === 0) setIsMuted(true);
                }}
                onTouchMove={(e) => {
                  const rect = e.currentTarget.getBoundingClientRect();
                  const pct = Math.round(Math.max(0, Math.min(100, ((e.touches[0].clientX - rect.left) / rect.width) * 100)));
                  setVolume(pct);
                  if (pct > 0 && isMuted) setIsMuted(false);
                  if (pct === 0) setIsMuted(true);
                }}
                role="slider"
                aria-label="Volume"
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={isMuted ? 0 : volume}
              >
                <div
                  className="absolute left-0 top-0 bottom-0 bg-gradient-to-r from-pink-500/40 to-orange-500/30 pointer-events-none"
                  style={{ width: `${isMuted ? 0 : volume}%` }}
                />
                <span className="absolute inset-0 grid place-items-center z-10 text-xs font-bold text-white pointer-events-none">
                  {isMuted ? "Muted" : `${volume}%`}
                </span>
              </div>
              )}
            </div>
          </div>
          )}

          {/* Bottom Safe Area */}
          <div className="h-[env(safe-area-inset-bottom)] shrink-0" />
        </div>
      )}

      {/* Change Password (email-confirmed) — top level so it renders in both the
          desktop and mobile settings views. It was previously nested inside the
          fullscreen-only container (display:none when not fullscreen), so tapping
          "Change Password" from Settings appeared to do nothing. z-[400] keeps it
          above the fixed mobile player (z-[300]) and settings screens. */}
      {showChangePasswordModal && (
        <div className="eqho-dialog fixed inset-0 z-[400] flex items-center justify-center bg-black/70 p-4">
          <div className="bg-[#090f1c]/90 backdrop-blur-xl border border-white/15 rounded-2xl p-8 max-w-md w-full text-center shadow-[0_0_40px_rgba(0,0,0,0.5)]">
            {changePwStep === 'confirm' ? (
              <>
                <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-[#ff4fa3] to-[#ff8a00] flex items-center justify-center">
                  <KeyRound size={26} className="text-white" />
                </div>
                <h3 className="text-2xl font-bold text-white mb-2">Confirm password change</h3>
                <p className="text-white/60 mb-2">
                  For your security, we&apos;ll send a password-change link to:
                </p>
                <p className="text-white font-semibold mb-6 break-all">
                  {changePwEmail ?? 'your account email'}
                </p>
                {changePwError && (
                  <p className="text-red-400 text-sm mb-4">{changePwError}</p>
                )}
                <div className="flex gap-4 justify-center">
                  <button
                    onClick={() => setShowChangePasswordModal(false)}
                    disabled={changePwLoading}
                    className="px-6 py-3 rounded-xl border border-white/20 text-white hover:bg-white/10 transition disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={sendChangePasswordEmail}
                    disabled={changePwLoading || !changePwEmail}
                    className="px-6 py-3 rounded-xl bg-gradient-to-r from-[#ff4fa3] to-[#ff8a00] text-white font-bold hover:scale-[1.02] transition flex items-center gap-2 disabled:opacity-50 disabled:hover:scale-100"
                  >
                    {changePwLoading ? (
                      <>
                        <Loader2 size={18} className="animate-spin" />
                        Sending…
                      </>
                    ) : (
                      <>
                        <Mail size={18} />
                        Send confirmation email
                      </>
                    )}
                  </button>
                </div>
              </>
            ) : (
              <>
                <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-[#ff4fa3] to-[#ff8a00] flex items-center justify-center">
                  <Mail size={26} className="text-white" />
                </div>
                <h3 className="text-2xl font-bold text-white mb-2">Check your email</h3>
                <p className="text-white/60 mb-6">
                  We&apos;ve sent a secure password-change link to{' '}
                  <span className="text-white font-semibold break-all">
                    {changePwEmail ? maskEmail(changePwEmail) : 'your email'}
                  </span>
                  . Open the link to choose a new password.
                </p>
                {changePwError && (
                  <p className="text-red-400 text-sm mb-4">{changePwError}</p>
                )}
                <div className="flex flex-col gap-3">
                  <button
                    onClick={sendChangePasswordEmail}
                    disabled={changePwCooldown > 0 || changePwLoading}
                    className="w-full py-3 rounded-xl border border-white/20 text-white hover:bg-white/10 transition flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {changePwLoading ? (
                      <>
                        <Loader2 size={16} className="animate-spin" />
                        Sending…
                      </>
                    ) : changePwCooldown > 0 ? (
                      `Resend email (${changePwCooldown}s)`
                    ) : (
                      'Resend email'
                    )}
                  </button>
                  <button
                    onClick={() => setShowChangePasswordModal(false)}
                    className="w-full py-3 rounded-xl bg-white/5 border border-white/10 text-white/80 hover:bg-white/10 transition"
                  >
                    Back to Settings
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Cancel Subscription Confirmation — top level so it renders in both the
          desktop and mobile settings views (outside the fullscreen-only container,
          which is display:none when not fullscreen and would hide a nested modal). */}
      {showCancelSubConfirm && (
        <div className="eqho-dialog fixed inset-0 z-[400] flex items-center justify-center bg-black/70 p-4">
          <div className="bg-[#090f1c]/95 backdrop-blur-xl border border-red-500/30 rounded-2xl p-8 max-w-md text-center shadow-[0_0_40px_rgba(0,0,0,0.5)]">
            <AlertTriangle size={48} className="mx-auto mb-4 text-[#ff8a00]" />
            <h3 className="text-2xl font-bold text-white mb-2">Cancel subscription?</h3>
            <p className="text-white/60 mb-6">
              You&apos;ll keep full access to EQHO Player until the end of your current billing period. After that, your account returns to the free plan.
            </p>
            {subActionError && (
              <p className="text-red-400 text-sm mb-4">{subActionError}</p>
            )}
            <div className="flex gap-4 justify-center">
              <button
                onClick={() => setShowCancelSubConfirm(false)}
                disabled={cancelSubLoading}
                className="px-6 py-3 rounded-xl border border-white/20 text-white hover:bg-white/10 transition disabled:opacity-50"
              >
                Keep subscription
              </button>
              <button
                onClick={handleCancelSubscription}
                disabled={cancelSubLoading}
                className="px-6 py-3 rounded-xl bg-red-600 text-white font-bold hover:bg-red-700 transition flex items-center gap-2 disabled:opacity-50"
              >
                {cancelSubLoading ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    Canceling...
                  </>
                ) : (
                  "Yes, cancel"
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Send to Session Confirmation - Mobile (outside isFullscreen container) */}
      {showSendToSessionConfirm && (
        <div className="eqho-dialog fixed inset-0 z-[400] flex items-center justify-center bg-black/70 desktop:hidden">
          <div className="bg-[#090f1c]/95 backdrop-blur-xl border border-white/20 rounded-2xl p-6 mx-4 max-w-sm text-center shadow-[0_0_40px_rgba(0,0,0,0.5)]">
            <ListMusic size={40} className="mx-auto mb-3 text-[#ff8a00]" />
            <h3 className="text-xl font-bold text-white mb-2">Replace Current Playlist?</h3>
            <p className="text-white/60 text-sm mb-5">Loading &quot;{showSendToSessionConfirm.name}&quot; will replace your current session playlist.</p>
            <div className="flex gap-3 justify-center">
              <button
                onClick={() => setShowSendToSessionConfirm(null)}
                className="px-5 py-2.5 rounded-xl border border-white/20 text-white hover:bg-white/10 transition text-sm"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  const { name, tracks } = showSendToSessionConfirm;
                  setShowSendToSessionConfirm(null);
                  if (isPlaying && audioRef.current) {
                    audioRef.current.pause();
                    setIsPlaying(false);
                  }
                  setPlaylist(tracks);
                  setOriginalPlaylistOrder([...tracks]); // Store original order
                  setHiddenTrackIds(new Set());
                  setCurrentPlaylistName(name);
                  setCurrentIndex(0);
                  setCurrentTrack(tracks[0]);
                  setSessionRunning(false);
                  setFinishedTracks(new Set());
                  // Switch back to the main player so the loaded queue is visible.
                  setActivePage("player");
                  setMobileTab("nowplaying");
                }}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#ff4fa3] to-[#ff8a00] text-white font-bold hover:shadow-[0_0_20px_rgba(255,122,0,0.4)] transition text-sm"
              >
                Yes, Replace
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Pause Confirmation - Mobile (outside isFullscreen container) */}
      {showPauseConfirm && (
        <div className="eqho-dialog fixed inset-0 z-[400] flex items-center justify-center bg-black/70 desktop:hidden">
          <div className="bg-[#090f1c]/95 backdrop-blur-xl border border-orange-500/30 rounded-2xl p-6 mx-4 max-w-sm text-center shadow-[0_0_40px_rgba(0,0,0,0.5)]">
            <AlertTriangle size={40} className="mx-auto mb-3 text-orange-400" />
            <h3 className="text-xl font-bold text-white mb-2">Pause Playback?</h3>
            <p className="text-white/60 text-sm mb-5">Are you sure you want to pause the current session?</p>
            <div className="flex gap-3 justify-center">
              <button
                onClick={() => setShowPauseConfirm(false)}
                className="px-5 py-2.5 rounded-xl border border-white/20 text-white hover:bg-white/10 transition text-sm"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setShowPauseConfirm(false);
                  if (audioRef.current) {
                    audioRef.current.pause();
                    setIsPlaying(false);
                  }
                }}
                className="px-5 py-2.5 rounded-xl bg-orange-500 text-white font-bold hover:bg-orange-600 transition text-sm"
              >
                Yes, Pause
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Skip Forward Confirmation - Mobile (outside isFullscreen container) */}
      {showSkipForwardConfirm && (
        <div className="eqho-dialog fixed inset-0 z-[400] flex items-center justify-center bg-black/70 desktop:hidden">
          <div className="bg-[#090f1c]/95 backdrop-blur-xl border border-white/20 rounded-2xl p-6 mx-4 max-w-sm text-center shadow-[0_0_40px_rgba(0,0,0,0.5)]">
            <StepForward size={40} className="mx-auto mb-3 text-pink-400" />
            <h3 className="text-xl font-bold text-white mb-2">Skip to Next Track?</h3>
            <p className="text-white/60 text-sm mb-5">Are you sure you want to skip to the next track?</p>
            <div className="flex gap-3 justify-center">
              <button
                onClick={() => setShowSkipForwardConfirm(false)}
                className="px-5 py-2.5 rounded-xl border border-white/20 text-white hover:bg-white/10 transition text-sm"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setShowSkipForwardConfirm(false);
                  setTimeout(() => goToNextTrack(), 50);
                }}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#ff4fa3] to-[#ff8a00] text-white font-bold hover:shadow-[0_0_20px_rgba(255,122,0,0.4)] transition text-sm"
              >
                Yes, Skip
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Skip Back Confirmation - Mobile (outside isFullscreen container) */}
      {showSkipBackConfirm && (
        <div className="eqho-dialog fixed inset-0 z-[400] flex items-center justify-center bg-black/70 desktop:hidden">
          <div className="bg-[#090f1c]/95 backdrop-blur-xl border border-white/20 rounded-2xl p-6 mx-4 max-w-sm text-center shadow-[0_0_40px_rgba(0,0,0,0.5)]">
            <StepBack size={40} className="mx-auto mb-3 text-cyan-400" />
            <h3 className="text-xl font-bold text-white mb-2">Skip to Previous Track?</h3>
            <p className="text-white/60 text-sm mb-5">Are you sure you want to go back to the previous track?</p>
            <div className="flex gap-3 justify-center">
              <button
                onClick={() => setShowSkipBackConfirm(false)}
                className="px-5 py-2.5 rounded-xl border border-white/20 text-white hover:bg-white/10 transition text-sm"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setShowSkipBackConfirm(false);
                  setTimeout(() => goToPreviousTrack(), 50);
                }}
                className="px-5 py-2.5 rounded-xl bg-cyan-500 text-white font-bold hover:bg-cyan-600 transition text-sm"
              >
                Yes, Go Back
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Skip Forward Confirmation - Desktop (outside isFullscreen container).
          Rendered here (not inside the fullscreen view) so it appears on the normal
          desktop main screen too. Previously the only desktop copy lived inside the
          isFullscreen container, which is `hidden` off-fullscreen — so the confirm
          state was set but never shown and the skip button appeared to do nothing.
          Gated on !isFullscreen: while desktop fullscreen is active the in-container
          copy (inside fullscreenRef) handles it, since the browser Fullscreen API only
          renders that subtree. This avoids a doubled overlay in the CSS-fallback case. */}
      {showSkipForwardConfirm && !isFullscreen && (
        <div className="eqho-dialog fixed inset-0 z-[400] hidden desktop:flex items-center justify-center bg-black/70">
          <div className="bg-[#090f1c]/90 backdrop-blur-xl border border-white/20 rounded-2xl p-8 max-w-md text-center shadow-[0_0_40px_rgba(0,0,0,0.5)]">
            <StepForward size={48} className="mx-auto mb-4 text-pink-400" />
            <h3 className="text-2xl font-bold text-white mb-2">Skip to Next Track?</h3>
            <p className="text-white/60 mb-6">Are you sure you want to skip to the next track?</p>
            <div className="flex gap-4 justify-center">
              <button
                onClick={() => setShowSkipForwardConfirm(false)}
                className="px-6 py-3 rounded-xl border border-white/20 text-white hover:bg-white/10 transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowSkipForwardConfirm(false);
                  setTimeout(() => goToNextTrack(), 50);
                }}
                className="px-6 py-3 rounded-xl bg-gradient-to-r from-[#ff4fa3] to-[#ff8a00] text-white font-bold hover:shadow-[0_0_20px_rgba(255,122,0,0.4)] transition"
              >
                Yes, Skip
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Skip Back Confirmation - Desktop (outside isFullscreen container).
          Gated on !isFullscreen; the in-fullscreen copy handles real browser fullscreen. */}
      {showSkipBackConfirm && !isFullscreen && (
        <div className="eqho-dialog fixed inset-0 z-[400] hidden desktop:flex items-center justify-center bg-black/70">
          <div className="bg-[#090f1c]/90 backdrop-blur-xl border border-white/20 rounded-2xl p-8 max-w-md text-center shadow-[0_0_40px_rgba(0,0,0,0.5)]">
            <StepBack size={48} className="mx-auto mb-4 text-cyan-400" />
            <h3 className="text-2xl font-bold text-white mb-2">Skip to Previous Track?</h3>
            <p className="text-white/60 mb-6">Are you sure you want to go back to the previous track?</p>
            <div className="flex gap-4 justify-center">
              <button
                onClick={() => setShowSkipBackConfirm(false)}
                className="px-6 py-3 rounded-xl border border-white/20 text-white hover:bg-white/10 transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowSkipBackConfirm(false);
                  setTimeout(() => goToPreviousTrack(), 50);
                }}
                className="px-6 py-3 rounded-xl bg-cyan-500 text-white font-bold hover:bg-cyan-600 transition"
              >
                Yes, Go Back
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Clear Playlist Confirmation - Mobile (outside isFullscreen container) */}
      {showClearPlaylistConfirm && (
        <div className="eqho-dialog fixed inset-0 z-[400] flex items-center justify-center bg-black/70 desktop:hidden">
          <div className="bg-[#090f1c]/95 backdrop-blur-xl border border-orange-500/30 rounded-2xl p-6 mx-4 max-w-sm text-center shadow-[0_0_40px_rgba(0,0,0,0.5)]">
            <AlertTriangle size={40} className="mx-auto mb-3 text-[#ff8a00]" />
            <h3 className="text-xl font-bold text-white mb-2">Clear Playlist?</h3>
            <p className="text-white/60 text-sm mb-5">This will remove all tracks from your current session. The session will stop playing.</p>
            <div className="flex gap-3 justify-center">
              <button
                onClick={() => setShowClearPlaylistConfirm(false)}
                className="px-5 py-2.5 rounded-xl border border-white/20 text-white hover:bg-white/10 transition text-sm"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setShowClearPlaylistConfirm(false);
                  clearPlaylist();
                }}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#ff4fa3] to-[#ff8a00] text-white font-bold hover:shadow-[0_0_20px_rgba(255,122,0,0.4)] transition text-sm"
              >
                Yes, Clear
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Clear Library Confirmation - removes all saved playlists */}
      {showClearLibraryConfirm && (
        <div className="eqho-dialog fixed inset-0 z-[400] flex items-center justify-center bg-black/70 px-4">
          <div className="bg-[#090f1c]/95 backdrop-blur-xl border border-orange-500/30 rounded-2xl p-6 sm:p-8 max-w-md w-full text-center shadow-[0_0_40px_rgba(0,0,0,0.5)]">
            <AlertTriangle size={44} className="mx-auto mb-4 text-[#ff8a00]" />
            <h3 className="text-2xl font-bold text-white mb-2">Clear all playlists?</h3>
            <p className="text-white/60 mb-6">This will remove every saved playlist from your library. If a session is playing it will also stop. This cannot be undone.</p>
            <div className="flex gap-4 justify-center">
              <button
                onClick={() => setShowClearLibraryConfirm(false)}
                className="px-6 py-3 rounded-xl border border-white/20 text-white hover:bg-white/10 transition"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setShowClearLibraryConfirm(false);
                  setSavedPlaylists([]);
                  clearPlaylist();
                }}
                className="px-6 py-3 rounded-xl bg-gradient-to-r from-[#ff4fa3] to-[#ff8a00] text-white font-bold hover:shadow-[0_0_20px_rgba(255,122,0,0.4)] transition"
              >
                Yes, Clear All
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Clear Playlist Confirmation - Desktop main screen (outside fullscreen container) */}
      {showClearPlaylistConfirm && (
        <div className="eqho-dialog fixed inset-0 z-[400] hidden desktop:flex items-center justify-center bg-black/70">
          <div className="bg-[#090f1c]/95 backdrop-blur-xl border border-orange-500/30 rounded-2xl p-8 max-w-md text-center shadow-[0_0_40px_rgba(0,0,0,0.5)]">
            <AlertTriangle size={48} className="mx-auto mb-4 text-[#ff8a00]" />
            <h3 className="text-2xl font-bold text-white mb-2">Clear Playlist?</h3>
            <p className="text-white/60 mb-6">This will remove all tracks from your current session. The session will stop playing.</p>
            <div className="flex gap-4 justify-center">
              <button
                onClick={() => setShowClearPlaylistConfirm(false)}
                className="px-6 py-3 rounded-xl border border-white/20 text-white hover:bg-white/10 transition"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setShowClearPlaylistConfirm(false);
                  clearPlaylist();
                }}
                className="px-6 py-3 rounded-xl bg-gradient-to-r from-[#ff4fa3] to-[#ff8a00] text-white font-bold hover:shadow-[0_0_20px_rgba(255,122,0,0.4)] transition"
              >
                Yes, Clear
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Remove Saved Playlist Confirmation - guards accidental "Clear" link clicks */}
      {playlistToRemove && (
        <div
          className="eqho-dialog fixed inset-0 z-[400] flex items-center justify-center bg-black/70 p-4"
          onClick={() => setPlaylistToRemove(null)}
        >
          <div
            className="bg-[#090f1c]/95 backdrop-blur-xl border border-orange-500/30 rounded-2xl p-8 max-w-md text-center shadow-[0_0_40px_rgba(0,0,0,0.5)]"
            onClick={(e) => e.stopPropagation()}
          >
            <AlertTriangle size={48} className="mx-auto mb-4 text-[#ff8a00]" />
            <h3 className="text-2xl font-bold text-white mb-2">Remove Playlist?</h3>
            <p className="text-white/60 mb-6">
              This will remove <strong className="text-white">{playlistToRemove.name}</strong> from your saved playlists. This can&apos;t be undone.
            </p>
            <div className="flex gap-4 justify-center">
              <button
                onClick={() => setPlaylistToRemove(null)}
                className="px-6 py-3 rounded-xl border border-white/20 text-white hover:bg-white/10 transition"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setSavedPlaylists((prev) => prev.filter((p) => p.id !== playlistToRemove.id));
                  setPlaylistToRemove(null);
                }}
                className="px-6 py-3 rounded-xl bg-gradient-to-r from-[#ff4fa3] to-[#ff8a00] text-white font-bold hover:shadow-[0_0_20px_rgba(255,122,0,0.4)] transition"
              >
                Yes, Remove
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Content Area - Desktop: 4-column grid, Mobile: single column.
          Below xl (1280px) the fixed columns are narrowed so landscape iPads and the
          12.9" portrait iPad (1024px) get a comfortable center panel instead of a
          cramped one (old fixed cols consumed ~780px, leaving ~244px at 1024px). The
          xl: overrides restore the exact original widths/gaps/padding, so desktop
          (>=1280px) is byte-for-byte unchanged. Height uses dvh so iPad Safari's
          dynamic toolbars don't clip the bottom row. */}
          <div
            data-normal-layout="desktop"
            className="hidden desktop:grid w-full grid-cols-[56px_200px_minmax(0,1fr)_280px] xl:grid-cols-[72px_268px_minmax(0,1fr)_380px] gap-2 xl:gap-3 overflow-hidden p-2 xl:p-3 pb-0"
          style={{
            // Reserve the MEASURED height of the fixed session-controls bar (same var
            // the mobile layout uses) instead of a hardcoded 100px. The desktop bar is
            // `flex-wrap`, so with a full active-session control set, at narrower widths,
            // or with larger accessibility fonts it wraps to 2+ rows and exceeds 100px —
            // which previously covered the bottom of the grid (e.g. the last playlist's
            // Download/delete buttons). The ResizeObserver keeps this var in sync.
            height: "calc(100dvh - var(--mobile-controls-height, 100px))",
            ...(coachViewActive ? { display: "none" } : {}),
          }}
          >

        {/* ICON RAIL - col-start-1 (desktop only) */}
        <aside className="relative col-start-1 h-full overflow-hidden">
          <nav className="flex h-full flex-col items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-sm py-4">
            {sidebarItems.map(({ icon: Icon, page, color }) => {
              const isActive = activePage === page;
              return (
                <button
                  key={page}
                  onClick={() => setActivePage(page)}
                  className={`p-2.5 rounded-xl transition-all ${
                    isActive
                      ? activeColors[color]
                      : "text-[#cbd5e1] hover:text-white hover:bg-white/[0.03]"
                  }`}
                >
                  <Icon size={20} />
                </button>
              );
            })}
            <a
              href="/downloads/eqho-player-mac.dmg"
              target="_blank"
              rel="noopener noreferrer"
              className="p-2.5 rounded-xl text-[#cbd5e1] hover:text-white hover:bg-gradient-to-r hover:from-[#ff4fa3]/20 hover:to-[#ff8a00]/20 transition mt-auto"
              title="Download EQHO Desktop App"
            >
              <Monitor size={20} />
            </a>
            <Link
              href="/privacy-policy"
              aria-label="Privacy Policy"
              title="Privacy Policy"
              className="p-2.5 rounded-xl text-[#cbd5e1] hover:text-white hover:bg-gradient-to-r hover:from-[#ff4fa3]/20 hover:to-[#ff8a00]/20 transition"
            >
              <Shield size={20} />
            </Link>
            <button
              onClick={handleLogout}
              className="p-2.5 rounded-xl text-red-400 hover:bg-red-500/10 transition"
            >
              <LogOut size={20} />
            </button>
          </nav>
        </aside>

        {activePage === "player" && (
          <>
            {/* UPLOAD/PLAYLISTS - col-start-2 */}
            <aside className="relative col-start-2 h-full overflow-hidden flex flex-col gap-2">
              <div
                onDrop={handleDropUpload}
                onDragOver={handleDragOverUpload}
                onDragEnter={handleDragEnterUpload}
                onDragLeave={handleDragLeaveUpload}
                className={`rounded-2xl border bg-white/[0.03] backdrop-blur-sm p-3 shadow-[0_0_30px_rgba(0,0,0,0.2)] flex-1 overflow-hidden flex flex-col transition ${
                  isDraggingUpload ? "border-cyan-300 bg-cyan-400/10" : "border-white/10"
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <h2 className="text-white uppercase tracking-[0.15em] text-[10px] font-black">Playlists</h2>
                  <label
                    htmlFor="file-upload-input"
                    className="cursor-pointer text-[#ff8a00] font-bold text-xs hover:text-[#ffa733] transition"
                  >
                    + Upload Folder
                  </label>
                </div>
                <input
                  id="file-upload-input"
                  type="file"
                  // @ts-expect-error - non-standard folder selection attributes
                  webkitdirectory=""
                  directory=""
                  multiple
                  onChange={(event) => {
                    const files = Array.from(event.target.files || []).filter((file) =>
                      file.type.startsWith("audio/") || 
                      file.name.endsWith(".mp3") || 
                      file.name.endsWith(".wav") || 
                      file.name.endsWith(".m4a")
                    );
                    if (files.length > 0) {
                      // One playlist per subfolder (handles a parent folder with many subfolders).
                      createPlaylistsFromFolderSelection(files);
                    }
                    event.target.value = "";
                  }}
                  className="hidden"
                />
                {savedPlaylists.length === 0 ? (
                  <label
                    htmlFor="file-upload-input"
                    className={`flex-1 flex flex-col items-center justify-center cursor-pointer rounded-xl border border-dashed p-6 text-center transition ${
                      isDraggingUpload ? "border-cyan-300 bg-cyan-400/10" : "border-[#ff4fa3]/50"
                    }`}
                  >
                    <UploadCloud className={`mx-auto mb-3 ${isDraggingUpload ? "text-cyan-300" : "text-[#ff8a00]"}`} size={32} />
                    <p className="text-white font-bold text-sm">Drag &amp; drop a folder here</p>
                    <p className="text-white/50 text-[11px] mt-1.5 leading-relaxed max-w-[200px]">
                      Drop an entire folder into this area &mdash; each folder becomes its own playlist.
                    </p>
                    <p className="text-white/30 text-[9px] mt-2">MP3, WAV, M4A &bull; or click to choose a folder</p>
                  </label>
                ) : (
                  <div className="space-y-2 flex-1 overflow-y-auto">
                    {savedPlaylists.map((pl) => (
                      <div
                        key={pl.id}
                        onDragOver={(e) => { e.preventDefault(); e.dataTransfer.dropEffect = "move"; }}
                        onDrop={(e) => {
                          e.preventDefault();
                          e.currentTarget.classList.remove("drag-over");
                          const trackJson = e.dataTransfer.getData("trackJson");
                          const trackId = e.dataTransfer.getData("trackId");
                          if (trackJson && trackId) {
                            const track: Track = JSON.parse(trackJson);
                            setSavedPlaylists((prev) => prev.map((p) => p.id === pl.id ? { ...p, tracks: [...p.tracks, track] } : p));
                            setUploadedTracks((prev) => prev.filter((t) => t.id !== trackId));
                          }
                        }}
                        className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-xs transition hover:bg-white/[0.03] border border-dashed border-transparent [&.drag-over]:border-pink-500/50"
                        onDragEnter={(e) => e.currentTarget.classList.add("drag-over")}
                        onDragLeave={(e) => e.currentTarget.classList.remove("drag-over")}
                      >
                        <ListMusic size={14} className="text-[#ff4fa3] shrink-0" />
                        <span className="flex-1 truncate text-white text-[11px]">{pl.name}</span>
                        {(() => {
                          const dState = getDeviceDownloadState(pl);
                          const pct = downloadProgress[pl.id] ?? 0;
                          const tooltip =
                            dState === 'downloading' ? `Downloading... ${pct}%`
                            : dState === 'queued' ? 'Waiting to download'
                            : dState === 'downloaded' ? 'Available offline'
                            : dState === 'update' ? 'Available offline'
                            : dState === 'failed' ? 'Download failed'
                            : 'Download playlist for offline use';
                          const colorClass =
                            dState === 'downloading' ? 'text-cyan-400 animate-pulse'
                            : dState === 'queued' ? 'text-white/40'
                            : dState === 'downloaded' ? 'text-green-400'
                            : dState === 'update' ? 'text-green-400'
                            : dState === 'failed' ? 'text-red-500'
                            : 'text-white';
                          const Icon =
                            dState === 'downloading' ? Loader2
                            : dState === 'failed' ? AlertCircle
                            : dState === 'downloaded' || dState === 'update' ? Check
                            : Download;
                          return (
                            <button
                              type="button"
                              onClick={() => {
                                // Green can be clicked again to refresh/re-download.
                                if (dState === 'downloading' || dState === 'queued') return;
                                enqueueDeviceDownload(pl);
                              }}
                              disabled={pl.tracks.length === 0}
                              className={`shrink-0 transition disabled:opacity-30 ${colorClass}`}
                              title={tooltip}
                              aria-label={tooltip}
                            >
                              <Icon size={14} className={dState === 'downloading' ? 'animate-spin' : ''} />
                            </button>
                          );
                        })()}
                        <button
                          onClick={() => {
                            if (pl.tracks.length === 0) return;
                            // Append this playlist's tracks to the existing queue to build one master playlist
                            setPlaylist((prev) => {
                              const next = [...prev, ...pl.tracks];
                              // If the queue was empty, start it on the first added track
                              if (prev.length === 0) {
                                setCurrentPlaylistName(pl.name);
                                setCurrentIndex(0);
                                setCurrentTrack(next[0]);
                              }
                              return next;
                            });
                          }}
                          disabled={pl.tracks.length === 0}
                          className="rounded border border-cyan-500/50 bg-cyan-500/10 px-1.5 py-0.5 text-[9px] font-semibold text-cyan-400 hover:bg-cyan-500/20 disabled:opacity-30"
                          title="Add to the current Up Next queue"
                        >
                          Add
                        </button>
                        <button
                          onClick={() => {
                            if (pl.tracks.length > 0) {
                              if (sessionRunning || isPlaying) {
                                setShowSendToSessionConfirm({ name: pl.name, tracks: pl.tracks });
                              } else {
                                setPlaylist(pl.tracks);
                                setCurrentPlaylistName(pl.name);
                                setCurrentIndex(0);
                                setCurrentTrack(pl.tracks[0]);
                              }
                            }
                          }}
                          disabled={pl.tracks.length === 0}
                          className="rounded border border-pink-500/50 bg-pink-500/10 px-1.5 py-0.5 text-[9px] font-semibold text-pink-400 hover:bg-pink-500/20 disabled:opacity-30"
                          title="Replace the current queue with this playlist"
                        >
                          Load
                        </button>
                        <button
                          onClick={() => setPlaylistToRemove({ id: pl.id, name: pl.name })}
                          className="text-[9px] font-semibold text-orange-400 hover:text-orange-300 transition"
                          title="Remove this saved playlist"
                        >
                          Clear
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </aside>

            {/* MIDDLE: UP NEXT (IN ORDER) */}
            <main className="relative col-start-3 h-full min-w-0 overflow-hidden flex flex-col gap-2">
              <Card className="relative flex-1 overflow-hidden bg-[#090f1c] p-3 md:p-4 flex flex-col">
                <div className="flex items-center justify-between">
                  <h2 className="text-[10px] md:text-xs font-bold tracking-widest text-[#ff8a00]">UP NEXT (IN ORDER)</h2>
                  <div className="flex items-center gap-2">
                    {playlist.length > 0 && (
                      <button
                        onClick={resetPlaylist}
                        disabled={playlist.length === 0}
                        className="px-2 md:px-3 py-1 md:py-1.5 text-[9px] md:text-[10px] font-bold text-cyan-400 bg-cyan-500/10 border border-cyan-500/30 rounded-md hover:bg-cyan-500/20 transition flex items-center gap-1 disabled:opacity-30 disabled:cursor-not-allowed"
                      >
                        <RotateCcw size={12} />
                        Reset
                      </button>
                    )}
                    <button
                      onClick={() => {
                        console.log("[v0] Clear Playlist clicked, sessionRunning:", sessionRunning, "isPlaying:", isPlaying, "playlist length:", playlist.length);
                        if (sessionRunning || isPlaying) {
                          setShowClearPlaylistConfirm(true);
                        } else {
                          clearPlaylist();
                        }
                      }}
                      disabled={playlist.length === 0}
                      className="px-2 md:px-3 py-1 md:py-1.5 text-[9px] md:text-[10px] font-bold text-white bg-[#ff8a00]/20 border border-[#ff8a00]/50 rounded-md hover:bg-[#ff8a00]/30 hover:border-[#ff8a00]/70 transition disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                      Clear Playlist
                    </button>
                    {hiddenTrackIds.size > 0 && (
                      <button
                        onClick={() => setHiddenTrackIds(new Set())}
                        className="px-2 md:px-3 py-1 md:py-1.5 text-[9px] md:text-[10px] font-bold text-blue-400 bg-blue-500/10 border border-blue-500/30 rounded-md hover:bg-blue-500/20 transition flex items-center gap-1"
                      >
                        <RotateCcw size={12} />
                        Restore ({hiddenTrackIds.size})
                      </button>
                    )}
                  </div>
                </div>
                <div className="mt-1 border-b border-white/10 pb-2">
                  <p className="text-[10px] md:text-xs text-white/80">Drag to re-order your playlist</p>
                </div>

                <div className="mt-1 pr-3 md:pr-6 bg-transparent max-h-[calc(100vh-200px)] overflow-y-auto">
                  {playlist.length === 0 ? (
                    <div className="flex h-full flex-col items-center justify-center text-center py-12">
                      <p className="text-2xl font-semibold text-white/50">No tracks queued</p>
                      <p className="mt-2 text-sm text-white/35">Upload tracks and add them to your playlist</p>
                    </div>
                  ) : (
                    <SortableTrackList
                      ids={playlist.map((t) => t.id)}
                      onReorder={reorderPlaylistByIds}
                    >
                      {playlist.map((track, originalIndex) => {
                        const visibleIndex = getVisibleIndex(track.id);
                        const colours = ["text-[#ff8a00]", "text-blue-500", "text-purple-400", "text-[#ff4fa3]", "text-cyan-400", "text-green-400"];
                        const colour = colours[originalIndex % colours.length];
                        const isActiveTrack = currentTrack?.id === track.id;
                        const isFinished = finishedTracks.has(track.id);
                        const isCompleted = !isFinished && originalIndex < currentIndex;
                        const hasMoreRounds = isCompleted && playlistRound < playlistRepeats;
                        const isHidden = hiddenTrackIds.has(track.id);
                      
                        return (
                          <SortableTrackItem
                            key={track.id}
                            id={track.id}
                            onClick={() => {
                              if (isHidden) return; // Don't allow clicking hidden tracks
                              setCurrentIndex(originalIndex);
                              togglePlayPause(track);
                            }}
                            className={`grid h-[78px] grid-cols-[20px_42px_1fr_64px_44px] items-center border-b cursor-pointer transition hover:bg-white/[0.03] ${
                              isHidden
                                ? "border-white/5 opacity-40 border-dashed"
                                : isActiveTrack 
                                ? "border-[#ff4fa3]/40 bg-[#ff4fa3]/10" 
                                : isFinished
                                  ? "border-white/5 opacity-30"
                                  : "border-white/8"
                            }`}
                          >
                              <TrackDragHandle className="flex items-center justify-center bg-transparent border-0 p-0">
                                <GripVertical size={15} className="text-white/75 hover:text-white" />
                              </TrackDragHandle>
                              <div className={`text-[34px] font-black ${isHidden ? "text-white/15" : isFinished ? "text-white/20" : colour}`}>{originalIndex + 1}</div>
                              <div>
                                <div className={`text-base font-semibold ${isHidden ? "text-white/25 line-through" : isActiveTrack ? "text-[#ff8a00]" : isFinished ? "text-white/40" : "text-white"}`}>{track.title}</div>
                                <div className={`text-xs ${isHidden ? "text-white/20" : "text-white/85"}`}>
                                  {isHidden ? "Hidden from session" : isActiveTrack && isPlaying ? "Now Playing" : isActiveTrack && isGapPaused ? `Gap: ${gapCountdown}s` : isFinished ? "Finished" : hasMoreRounds ? `Round ${playlistRound} of ${playlistRepeats}` : isCompleted ? "Finished" : formatDuration(track.durationSeconds)}
                                </div>
                              </div>
                              <div className="flex flex-col items-end pr-2">
                                <div className="text-[10px]">Duration</div>
                                <div className={`text-base font-bold ${isHidden ? "text-white/15" : isFinished ? "text-white/20" : colour}`}>{formatDuration(track.durationSeconds)}</div>
                              </div>
                              {isHidden ? (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setHiddenTrackIds(prev => {
                                      const next = new Set(prev);
                                      next.delete(track.id);
                                      return next;
                                    });
                                  }}
                                  className="ml-1 px-2 py-1.5 rounded-lg text-[10px] font-bold text-cyan-400 bg-cyan-500/10 border border-cyan-500/30 hover:bg-cyan-500/20 transition"
                                >
                                  Unhide
                                </button>
                              ) : (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    hideTrackFromSession(track.id);
                                  }}
                                  aria-label={`Hide ${track.title} from this session`}
                                  title="Hide from this session"
                                  className="ml-1 flex items-center justify-center w-8 h-8 rounded-lg text-white/40 hover:text-white hover:bg-white/10 transition"
                                >
                                  <X size={16} />
                                </button>
                              )}
                          </SortableTrackItem>
                        );
                      })}
                    </SortableTrackList>
                  )}
                </div>
              </Card>
            </main>

            {/* RIGHT: NOW PLAYING / PLAYLIST PREVIEW */}
            <aside className="relative col-start-4 h-full overflow-hidden flex flex-col gap-2">
              <Card className="shrink-0 overflow-hidden p-3 md:p-4 relative w-full">
                {/* Session Finished Overlay */}
                {showSessionFinished && (
                  <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-gradient-to-br from-[#0a0a1a] via-[#120a20] to-[#0a1020] rounded-xl">
                    {/* Animated gradient background */}
                    <div className="absolute inset-0 overflow-hidden rounded-xl">
                      <div className="absolute -top-1/2 -left-1/2 w-full h-full bg-gradient-to-br from-[#ff4fa3]/20 to-transparent rounded-full blur-3xl animate-pulse" />
                      <div className="absolute -bottom-1/2 -right-1/2 w-full h-full bg-gradient-to-tl from-[#ff8a00]/20 to-transparent rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
                    </div>
                    
                    {/* Content */}
                    <div className="relative z-10 flex flex-col items-center text-center px-4">
                      {/* Checkmark Icon */}
                      <div className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-gradient-to-r from-[#ff4fa3] to-[#ff8a00] flex items-center justify-center mb-4 shadow-[0_0_40px_rgba(255,79,179,0.5)]">
                        <svg className="w-8 h-8 md:w-10 md:h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                      
                      {/* Title */}
                      <h2 className="text-2xl md:text-3xl font-black tracking-tight mb-2 bg-gradient-to-r from-[#ff4fa3] to-[#ff8a00] bg-clip-text text-transparent">
                        SESSION COMPLETE
                      </h2>
                      
                      {/* Stats */}
                      <p className="text-sm text-white/60 mb-4">
                        {playlist.length} tracks completed
                      </p>
                      
                      {/* Action */}
                      <button
                        onClick={() => {
                          setShowSessionFinished(false);
                          setFinishedTracks(new Set());
                          setCurrentIndex(0);
                        }}
                        className="px-6 py-2 rounded-lg bg-gradient-to-r from-[#ff4fa3] to-[#ff8a00] text-white font-bold text-sm hover:shadow-[0_0_20px_rgba(255,79,179,0.5)] transition"
                      >
                        Start New Session
                      </button>
                    </div>
                  </div>
                )}

            <div className="mb-3 md:mb-4 flex flex-wrap items-center justify-between gap-x-2 gap-y-2">
              <h2 className="text-xs md:text-sm font-bold tracking-[0.22em] bg-gradient-to-r from-[#ff4fa3] to-[#ff8a00] bg-clip-text text-transparent whitespace-nowrap">
                NOW PLAYING
              </h2>

              {/* Volume Control & Fullscreen — kept as a single non-wrapping unit so the
                  expand button never drops onto its own row beneath the volume button.
                  When the column is too narrow for label + controls, the whole cluster
                  wraps below the heading together (via the parent's flex-wrap). */}
              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  onClick={() => setIsMuted((m) => !m)}
                  className={`grid h-[32px] w-[32px] shrink-0 place-items-center rounded-lg border transition ${
                    isMuted
                      ? "border-red-500/60 bg-red-500/15 text-red-400 shadow-[0_0_10px_rgba(239,68,68,0.25)]"
                      : "border-pink-500/40 bg-pink-500/10 text-white hover:border-pink-500/70"
                  }`}
                >
                  {isMuted ? <VolumeX size={14} /> : <Volume2 size={14} />}
                </button>

                {iosVolumeControl ? (
                  <span className="text-[11px] leading-tight text-white/60 max-w-[180px]">
                    Use your device volume buttons to adjust playback volume.
                  </span>
                ) : (
                <div
                  className="group relative flex items-center shrink-0 w-[60px] sm:w-[70px] h-[32px] rounded-lg border border-white/10 bg-[#090f1c] cursor-pointer overflow-hidden touch-none select-none"
                  onMouseDown={(e) => {
                    const bar = e.currentTarget;
                    const apply = (clientX: number) => {
                      const rect = bar.getBoundingClientRect();
                      const pct = Math.round(Math.max(0, Math.min(100, ((clientX - rect.left) / rect.width) * 100)));
                      setVolume(pct);
                      if (pct > 0 && isMuted) setIsMuted(false);
                      if (pct === 0) setIsMuted(true);
                    };
                    apply(e.clientX);
                    const handleMove = (ev: MouseEvent) => apply(ev.clientX);
                    const handleUp = () => {
                      document.removeEventListener("mousemove", handleMove);
                      document.removeEventListener("mouseup", handleUp);
                    };
                    document.addEventListener("mousemove", handleMove);
                    document.addEventListener("mouseup", handleUp);
                  }}
                  onTouchStart={(e) => {
                    const rect = e.currentTarget.getBoundingClientRect();
                    const pct = Math.round(Math.max(0, Math.min(100, ((e.touches[0].clientX - rect.left) / rect.width) * 100)));
                    setVolume(pct);
                    if (pct > 0 && isMuted) setIsMuted(false);
                    if (pct === 0) setIsMuted(true);
                  }}
                  onTouchMove={(e) => {
                    const rect = e.currentTarget.getBoundingClientRect();
                    const pct = Math.round(Math.max(0, Math.min(100, ((e.touches[0].clientX - rect.left) / rect.width) * 100)));
                    setVolume(pct);
                    if (pct > 0 && isMuted) setIsMuted(false);
                    if (pct === 0) setIsMuted(true);
                  }}
                  role="slider"
                  aria-label="Volume"
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-valuenow={isMuted ? 0 : volume}
                >
                  <div className="absolute inset-0 rounded-lg overflow-hidden pointer-events-none">
                    <div
                      className="h-full bg-gradient-to-r from-[#ff4fa3]/25 to-[#ff8a00]/25 transition-all duration-150"
                      style={{ width: `${isMuted ? 0 : volume}%` }}
                    />
                  </div>
                  <span className="absolute inset-0 grid place-items-center z-10 text-xs font-bold text-white/80 tabular-nums pointer-events-none">
                    {isMuted ? "0" : volume}%
                  </span>
                </div>
                )}

                <button
                  onClick={() => {
                    // On mobile, use custom fullscreen player
                    if (isMobileBuild || window.innerWidth < 768) {
                      setShowFullscreenMobilePlayer(true);
                    } else {
                      toggleFullscreen();
                    }
                  }}
                  className="grid h-[32px] w-[32px] shrink-0 place-items-center rounded-lg border border-[#ff8a00]/40 bg-[#ff8a00]/10 text-white hover:border-[#ff8a00]/70 hover:bg-[#ff8a00]/20 transition"
                  title="Enter fullscreen mode"
                >
                  <Maximize2 size={14} />
                </button>
              </div>
            </div>

            {/* Track Info Row - Icon + Title/Status/Timer */}
            <div className="flex items-center gap-4">
              {/* Left - Album Icon */}
              <div className="grid h-[72px] w-[72px] shrink-0 place-items-center rounded-xl border border-pink-500/30 bg-gradient-to-br from-pink-500/25 to-cyan-500/15 shadow-[0_0_30px_rgba(236,72,153,0.2)]">
                <Music size={34} className="text-pink-400" />
              </div>

              {/* Centre - Track Info */}
              <div className="flex-1 min-w-0">
                <h3 className="truncate text-xl sm:text-2xl font-bold leading-tight text-white">
                  {currentTrack?.title || "No Track Selected"}
                </h3>
                <p className="mt-1 truncate text-sm text-white/60">
                  {currentTrack ? "Playing" : "Upload tracks to begin"}
                </p>

                {/* Track Elapsed Timer */}
                <div className="mt-2">
                  {isGapPaused ? (
                    <div className="text-3xl sm:text-4xl font-black tracking-wider text-white tabular-nums countdown-flash" key={gapCountdown}>
                      {gapCountdown}
                    </div>
                  ) : (
                    <div className="text-3xl sm:text-4xl font-black tracking-wider text-white tabular-nums">
                      {currentTime > 0 || isPlaying
                        ? `${String(Math.floor(currentTime / 60)).padStart(2, "0")}:${String(Math.floor(currentTime % 60)).padStart(2, "0")}`
                        : "00:00"}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Playback Controls - Centered underneath track info */}
            <div className="mt-5 flex items-center justify-center gap-6">
              <button 
                onClick={handleSkipBackClick}
                className="grid h-[44px] w-[44px] place-items-center rounded-full border border-white/20 bg-white/[0.06] text-white/85 hover:bg-white/15 hover:border-white/30 transition"
              >
                <StepBack size={20} />
              </button>

              <button
                onClick={toggleSession}
                disabled={!currentTrack && playlist.length === 0}
                className="w-16 h-16 rounded-full bg-gradient-to-r from-pink-500 to-orange-500 text-white flex items-center justify-center disabled:opacity-40 shadow-[0_0_30px_rgba(255,79,179,0.35)] hover:shadow-[0_0_40px_rgba(255,79,179,0.5)] transition"
              >
                {isGapPaused ? (
                  <span className="text-xl font-black tabular-nums countdown-flash" key={gapCountdown}>{gapCountdown}</span>
                ) : isPlaying ? (
                  <Pause size={28} />
                ) : (
                  <Play size={28} />
                )}
              </button>

              <button 
                onClick={handleSkipForwardClick}
                className="grid h-[44px] w-[44px] place-items-center rounded-full border border-white/20 bg-white/[0.06] text-white/85 hover:bg-white/15 hover:border-white/30 transition"
              >
                <StepForward size={20} />
              </button>
            </div>

            {/* Waveform Progress Bar */}
            <div
              className="relative mt-4 md:mt-6 flex h-12 md:h-14 w-full cursor-pointer items-end gap-[2px] rounded-xl border border-white/5 bg-white/[0.02] px-2 pb-2 pt-2 select-none"
              onClick={(e) => {
                if (!trackDuration) return;
                const rect = e.currentTarget.getBoundingClientRect();
                const x = e.clientX - rect.left;
                const pct = Math.max(0, Math.min(1, x / rect.width));
                seekToSeconds(pct * trackDuration);
              }}
              onMouseDown={(e) => {
                if (!currentTrack) return;
                const bar = e.currentTarget;
                const handleMove = (ev: MouseEvent) => {
                  if (!trackDuration) return;
                  const rect = bar.getBoundingClientRect();
                  const x = ev.clientX - rect.left;
                  const pct = Math.max(0, Math.min(1, x / rect.width));
                  seekToSeconds(pct * trackDuration);
                };
                const handleUp = () => {
                  document.removeEventListener("mousemove", handleMove);
                  document.removeEventListener("mouseup", handleUp);
                };
                document.addEventListener("mousemove", handleMove);
                document.addEventListener("mouseup", handleUp);
              }}
            >
              {Array.from({ length: 80 }).map((_, i) => {
                const seed = currentTrack
                  ? ((currentTrack.id.charCodeAt(i % currentTrack.id.length) || 0) * 7 + i * 13) % 100
                  : ((i * 17 + 31) % 100);
                const height = currentTrack ? 20 + (seed / 100) * 80 : 15 + (seed / 100) * 40;
                const barPct = (i / 80) * 100;
                const isPlayed = currentTrack && barPct < trackProgress;

                return (
                  <div
                    key={i}
                    className="flex-1 rounded-sm transition-all duration-75"
                    style={{
                      height: `${height}%`,
                      background: isPlayed
                        ? "linear-gradient(to top, #ff4fa3, #ff8a00)"
                        : currentTrack
                          ? "rgba(255,255,255,0.12)"
                          : "rgba(255,255,255,0.06)",
                      boxShadow: isPlayed ? "0 0 4px rgba(255,79,179,0.3)" : "none",
                    }}
                  />
                );
              })}

              {/* Playhead */}
              {currentTrack && (
                <div
                  className="pointer-events-none absolute top-0 bottom-0 w-[2px] bg-white shadow-[0_0_8px_rgba(255,255,255,0.6)]"
                  style={{ left: `${trackProgress}%` }}
                />
              )}
            </div>

            {/* Time labels */}
            <div className="mt-1.5 flex items-center justify-between px-1 text-[10px] font-medium text-white/40 tabular-nums">
              <span>
                {currentTrack
                  ? `${String(Math.floor(currentTime / 60)).padStart(2, "0")}:${String(Math.floor(currentTime % 60)).padStart(2, "0")}`
                  : "00:00"}
              </span>
              <span>
                {currentTrack && trackDuration > 0 ? formatDuration(trackDuration) : "--:--"}
              </span>
            </div>
          </Card>

<Card className="relative flex flex-1 min-h-[400px] flex-col overflow-hidden">

            <div className="p-4 flex-1 flex flex-col">
            <div className="border-b border-white/10 pb-4 mb-2">
              <div className="min-w-0">
                <h2 className="text-xl font-bold truncate mb-1">{currentPlaylistDisplayName}</h2>
                <p className="text-sm text-white/80">{trackCountLabel} • {routineTimeLabel} total{hiddenTrackIds.size > 0 ? ` (${hiddenTrackIds.size} hidden)` : ''}</p>
              </div>
            </div>

            <div className="overflow-hidden">
              <h3 className="mt-2 text-[10px] font-bold uppercase">Session Overview</h3>
              <div className="mt-2 grid grid-cols-2 gap-2">
                {[
                  [Music, visibleTrackCount, "ROUTINES", "in playlist", "text-purple-400"],
                  [Timer, routineTimeLabel, "TOTAL", "ROUTINE TIME", "text-pink-500"],
                  [Clock, `${gapSeconds} sec`, "GAP BETWEEN", "ROUTINES", "text-orange-400"],
                  [Timer, estimatedSessionLabel, "EST. SESSION", "(including gaps)", "text-purple-400"],
                ].map(([Icon, value, a, b, colour]: any, idx) => (
                  <div key={idx} className="flex items-start gap-1.5 px-1.5 md:px-2 md:first:pl-0">
                    <Icon className={`${colour} shrink-0`} size={20} />
                    <div className="min-w-0">
                      <div className="text-base md:text-lg truncate">{value}</div>
                      <div className="text-[8px] md:text-[9px] text-white/70 truncate">{a}</div>
                      <div className="text-[8px] md:text-[9px] text-white/70 truncate">{b}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Session Status */}
            <div className="mt-4 flex-1 flex flex-col justify-end pb-28 md:pb-32">
              <div className="border-t border-white/10 pt-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] uppercase text-white/50">Session Status</span>
                  <span className={`text-[10px] font-bold ${sessionRunning ? 'text-green-400' : 'text-white/40'}`}>
                    {sessionRunning ? 'In Progress' : 'Ready'}
                  </span>
                </div>
                {sessionRunning && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-[10px]">
                      <span className="text-white/50">Current Track</span>
                      <span className="text-pink-400 font-medium truncate max-w-[150px]">{currentTrack?.title || '-'}</span>
                    </div>
                    <div className="flex items-center justify-between text-[10px]">
                      <span className="text-white/50">Progress</span>
                      <span className="text-cyan-400 font-medium">{completedTracks} of {visibleTrackCount} completed</span>
                    </div>
                    <div className="flex items-center justify-between text-[10px]">
                      <span className="text-white/50">Time Remaining</span>
                      <span className="text-orange-400 font-medium">{remainingTimeLabel}</span>
                    </div>
                  </div>
                )}
                {!sessionRunning && playlist.length > 0 && (
                  <p className="text-[10px] text-white/40 mt-1">Press play to start your session</p>
                )}
              </div>
            </div>
          </div>
          </Card>
        </aside>
          </>
        )}

        {activePage === "playlists" && (
          <div className="col-span-3 col-start-2 p-4 md:p-6 h-full overflow-y-auto rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-sm">
            {/* Header with Upload Area */}
            <div className="mb-6">
              <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-6">
                <div>
                  <p className="text-pink-400 uppercase tracking-[0.25em] text-sm font-bold">
                    EQHO Library
                  </p>
                  <h1 className="text-3xl font-black mt-2">Playlists</h1>
                  <p className="text-white/50 mt-1 text-sm">
                    Organise routine music into folders for fast session setup.
                  </p>
                </div>
                
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => document.getElementById("library-folder-upload-input")?.click()}
                    className="px-4 py-2 rounded-lg bg-gradient-to-r from-[#ff4fa3] to-[#ff8a00] text-white text-sm font-bold hover:shadow-[0_0_20px_rgba(255,122,0,0.4)] transition flex items-center gap-2"
                  >
                    <Plus size={16} />
                    New
                  </button>
{/* Cloud Sync Status & Refresh */}
                    {user && isCloudSyncAvailable() && isPro && (
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2 text-sm text-white/60">
                      <Cloud size={16} className="text-cyan-400" />
                      <span>{cloudPlaylists.length} cloud</span>
                    </div>
                    <button
                      onClick={handleSyncAll}
                      disabled={isSyncingAll}
                      className={`px-3 py-1.5 rounded-lg border text-sm font-medium transition flex items-center gap-2 disabled:cursor-not-allowed ${
                        cloudSaveSuccess && !isSyncingAll
                          ? "border-green-500/40 bg-green-500/10 text-green-400"
                          : "border-cyan-500/30 bg-cyan-500/10 text-cyan-400 hover:bg-cyan-500/20"
                      } ${isSyncingAll ? "opacity-80" : ""}`}
                    >
                      <RefreshCw size={14} className={isSyncingAll ? "animate-spin" : ""} />
                      {isSyncingAll && syncAllProgress
                        ? `Syncing ${syncAllProgress.current} of ${syncAllProgress.total}`
                        : "Sync All"}
                    </button>
                  </div>
                )}
                </div>
              </div>

              {/* Compact Upload Drop Zone */}
              <label
                onDrop={async (e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setIsDraggingUpload(false);
                  
                  const items = e.dataTransfer?.items;
                  if (!items) return;
                  
                  const readDirectory = (entry: FileSystemDirectoryEntry): Promise<File[]> => {
                    return new Promise((resolve) => {
                      const reader = entry.createReader();
                      const files: File[] = [];
                      
                      const readEntries = () => {
                        reader.readEntries(async (entries) => {
                          if (entries.length === 0) {
                            resolve(files);
                            return;
                          }
                          
                          for (const ent of entries) {
                            if (ent.isFile) {
                              const fileEntry = ent as FileSystemFileEntry;
                              const file = await new Promise<File>((res) => fileEntry.file(res));
                              if (file.type.startsWith("audio/")) {
                                files.push(file);
                              }
                            } else if (ent.isDirectory) {
                              const subFiles = await readDirectory(ent as FileSystemDirectoryEntry);
                              files.push(...subFiles);
                            }
                          }
                          readEntries();
                        });
                      };
                      readEntries();
                    });
                  };
                  
                  for (let i = 0; i < items.length; i++) {
                    const item = items[i];
                    const entry = item.webkitGetAsEntry?.();
                    
                    if (entry?.isDirectory) {
                      const folderName = entry.name;
                      const audioFiles = await readDirectory(entry as FileSystemDirectoryEntry);
                      
                      if (audioFiles.length > 0) {
                        const newPlaylistId = crypto.randomUUID();
                        const newTracks: Track[] = [];
                        
                        let processed = 0;
                        audioFiles.forEach((file) => {
                          const url = URL.createObjectURL(file);
                          const audio = new Audio(url);
                          audio.onloadedmetadata = async () => {
                            const newTrack: Track = {
                              id: crypto.randomUUID(),
                              title: file.name.replace(/\.[^/.]+$/, ""),
                              fileName: file.name,
                              url,
                              durationSeconds: Math.round(audio.duration),
                              uploadedAt: new Date().toISOString(),
                              file,
                            };
                            newTracks.push(newTrack);
                            
                            processed++;
                            if (processed === audioFiles.length) {
                              setSavedPlaylists((prev) => [
                                ...prev,
                                { id: newPlaylistId, name: folderName, tracks: newTracks },
                              ]);
                            }
                          };
                        });
                      }
                    }
                    // Only folders are accepted as playlists; loose files are ignored.
                  }
                }}
                onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}
                onDragEnter={(e) => { e.preventDefault(); e.stopPropagation(); setIsDraggingUpload(true); }}
                onDragLeave={(e) => { e.preventDefault(); e.stopPropagation(); setIsDraggingUpload(false); }}
                className={`block cursor-pointer rounded-xl border-2 border-dashed p-4 transition ${
                  isDraggingUpload
                    ? "border-cyan-300 bg-cyan-400/10"
                    : "border-pink-500/40 bg-white/[0.02] hover:border-pink-500/60 hover:bg-white/[0.04]"
                }`}
              >
                <input
                  id="library-folder-upload-input"
                  type="file"
                  // @ts-expect-error - non-standard folder selection attributes
                  webkitdirectory=""
                  directory=""
                  multiple
                  onChange={(event) => {
                    const files = Array.from(event.target.files || []).filter((file) =>
                      file.type.startsWith("audio/") || 
                      file.name.endsWith(".mp3") || 
                      file.name.endsWith(".wav") || 
                      file.name.endsWith(".m4a")
                    );
                    if (files.length > 0) {
                      // One playlist per subfolder (handles a parent folder with many subfolders).
                      createPlaylistsFromFolderSelection(files);
                    }
                    event.target.value = "";
                  }}
                  className="hidden"
                />
                <div className="flex items-center justify-center gap-4">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                    isDraggingUpload ? "bg-cyan-500/20" : "bg-pink-500/10"
                  }`}>
                    <UploadCloud size={20} className={isDraggingUpload ? "text-cyan-300" : "text-pink-400"} />
                  </div>
                  <div className="text-left">
                    <p className={`font-semibold ${isDraggingUpload ? "text-cyan-300" : "text-white"}`}>
                      Drop your playlist folder here
                    </p>
                    <p className="text-white/40 text-sm">Folders become playlists, or click “New” to browse</p>
                  </div>
                </div>
              </label>
            </div>

            {/* Playlists Grid - Full Width */}
            {savedPlaylists.length === 0 && cloudPlaylists.length === 0 ? (
              <div className="rounded-xl border border-white/10 bg-white/[0.02] p-8 text-center">
                <Folder size={40} className="mx-auto mb-3 text-white/20" />
                <h3 className="text-base font-bold text-white/60">No playlists yet</h3>
                <p className="text-white/40 mt-1 text-sm">Drop a folder above to create your first playlist</p>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Local Playlists */}
                {savedPlaylists.length > 0 && (
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <h2 className="text-sm font-bold text-white/60 flex items-center gap-2 uppercase tracking-wider">
                        <Folder size={16} />
                        Local Playlists
                        <span className="text-white/30 font-normal lowercase">({savedPlaylists.length})</span>
                      </h2>
                      <button
                        onClick={() => setShowClearLibraryConfirm(true)}
                        className="px-2.5 py-1 text-xs font-semibold text-[#ff8a00] bg-[#ff8a00]/10 border border-[#ff8a00]/30 rounded-lg hover:bg-[#ff8a00]/20 transition"
                      >
                        Clear All
                      </button>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4">
                      {savedPlaylists.map((localPlaylist) => {
                        const cloudStatus = getPlaylistCloudStatus(localPlaylist);
                        const isInCloud = cloudStatus !== 'new';
                        const cardPushStatus = pushStatus[localPlaylist.id];
                        const isSyncing = syncingPlaylistId === localPlaylist.id || cardPushStatus === 'pushing';
                        const totalDuration = localPlaylist.tracks.reduce((sum, t) => sum + (t.durationSeconds || 0), 0);
                        
                        return (
                          <div
                            key={localPlaylist.id}
                            className="rounded-xl border border-white/10 bg-white/[0.03] p-3
                                       hover:border-pink-500/40 hover:bg-pink-500/5
                                       transition group"
                          >
                            <div className="flex items-start gap-3 mb-2">
                              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-pink-500 via-purple-500 to-cyan-400 flex items-center justify-center shadow-lg shadow-pink-500/20 shrink-0">
                                <ListMusic size={18} />
                              </div>
                              <div className="flex-1 min-w-0">
                                <h3 className="text-sm font-bold truncate">{localPlaylist.name}</h3>
                                <div className="flex items-center gap-2 mt-0.5 text-xs text-white/50">
                                  <span>{localPlaylist.tracks.length} tracks</span>
                                  <span className="text-white/20">|</span>
                                  <span>{formatDuration(totalDuration)}</span>
                                </div>
                              </div>
                              {!isMobileBuild && (
                                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition shrink-0">
                                  <button
                                    onClick={(e) => { e.stopPropagation(); handleSyncPlaylistToCloud(localPlaylist.id); }}
                                    disabled={isSyncing}
                                    className="w-7 h-7 rounded-md bg-white/10 hover:bg-cyan-500/30 flex items-center justify-center transition"
                                    title={isInCloud ? "Re-sync" : "Upload"}
                                  >
                                    {isSyncing ? <Loader2 size={12} className="animate-spin text-cyan-400" /> : <Cloud size={12} className={isInCloud ? "text-cyan-400" : "text-white/50"} />}
                                  </button>
                                  <button
                                    onClick={(e) => { e.stopPropagation(); setShowDeletePlaylistConfirm({ id: localPlaylist.id, name: localPlaylist.name }); }}
                                    className="w-7 h-7 rounded-md bg-white/10 hover:bg-red-500/30 flex items-center justify-center transition"
                                    title="Delete"
                                  >
                                    <Trash2 size={12} className="text-white/50" />
                                  </button>
                                </div>
                              )}
                            </div>
                            
                            {/* Show the "Synced" pill only when there is no active push
                                status to display; otherwise the colored push button
                                (pushing / success / failed) takes precedence. */}
                            {cloudStatus === 'synced' && !cardPushStatus ? (
                              <div className="mb-2 flex items-center gap-1 text-[10px] text-cyan-400">
                                <Cloud size={10} />
                                Synced
                              </div>
                            ) : !isMobileBuild && (
                              <button
                                onClick={(e) => { e.stopPropagation(); handleSyncPlaylistToCloud(localPlaylist.id); }}
                                disabled={cardPushStatus === 'pushing'}
                                className={`mb-2 w-full py-1.5 rounded-lg border text-[11px] font-semibold transition flex items-center justify-center gap-1.5 disabled:opacity-60 disabled:cursor-not-allowed ${
                                  cardPushStatus === 'success'
                                    ? "bg-green-500/15 border-green-500/40 text-green-400"
                                    : cardPushStatus === 'failed'
                                      ? "bg-red-500/15 border-red-500/40 text-red-400 hover:bg-red-500/25"
                                      : "bg-cyan-500/15 border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/25"
                                }`}
                              >
                                {cardPushStatus === 'pushing'
                                  ? <Loader2 size={11} className="animate-spin" />
                                  : cardPushStatus === 'success'
                                    ? <Check size={11} />
                                    : cardPushStatus === 'failed'
                                      ? <AlertCircle size={11} />
                                      : <Cloud size={11} />}
                                {cardPushStatus === 'pushing'
                                  ? 'Pushing...'
                                  : cardPushStatus === 'success'
                                    ? 'Push Successful'
                                    : cardPushStatus === 'failed'
                                      ? 'Push Unsuccessful'
                                      : cloudStatus === 'new' ? 'Upload to Cloud' : 'Push Updates'}
                              </button>
                            )}
                            
                            <PlaylistTrackRows
                              tracks={localPlaylist.tracks}
                              expanded={expandedPlaylistIds.has(localPlaylist.id)}
                              onToggleExpand={() => togglePlaylistExpanded(localPlaylist.id)}
                              onRequestDelete={(trackId) => {
                                const t = localPlaylist.tracks.find((tr) => tr.id === trackId);
                                if (t) setConfirmDeleteTrack({ playlistId: localPlaylist.id, track: t });
                              }}
                              deletingTrackId={deletingTrackId}
                              formatDuration={formatDuration}
                            />
                            
                            <button
                              onClick={() => setShowSendToSessionConfirm({ name: localPlaylist.name, tracks: localPlaylist.tracks })}
                              className="w-full py-1.5 rounded-lg bg-gradient-to-r from-pink-500/15 to-orange-500/15 
                                         border border-pink-500/25 text-pink-400 text-xs font-semibold
                                         hover:from-pink-500/25 hover:to-orange-500/25 transition"
                            >
                              Send to Session
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Cloud Available Playlists (in cloud, not yet on this device) */}
                {cloudOnlyPlaylists.length > 0 && (
                  <div>
                    <h2 className="text-sm font-bold text-white/60 mb-4 flex items-center gap-2 uppercase tracking-wider">
                      <Cloud size={16} className="text-cyan-400" />
                      Cloud Available
                      <span className="text-white/30 font-normal lowercase">({cloudOnlyPlaylists.length})</span>
                    </h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4">
                          {cloudOnlyPlaylists
                            .map((cloudPlaylist) => {
                              const isDownloading = downloadingPlaylistId === cloudPlaylist.id;
                              
                              return (
                                <div
                                  key={cloudPlaylist.id}
                                  className="rounded-2xl border border-cyan-500/30 bg-cyan-500/5 p-4
                                             hover:border-cyan-400/50 hover:bg-cyan-500/10
                                             transition group relative"
                                >
                                  <div className="flex items-start gap-3">
                                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-500 via-blue-500 to-purple-400 flex items-center justify-center shadow-lg shadow-cyan-500/20 shrink-0">
                                      <Cloud size={22} />
                                    </div>
                                    
                                    <div className="flex-1 min-w-0">
                                      <h3 className="text-base font-bold truncate">{cloudPlaylist.name}</h3>
                                      <p className="text-sm text-white/50 mt-1">{cloudPlaylist.tracks.length} tracks</p>
                                    </div>
                                  </div>

                                  {/* Download to Device: downloads audio from R2 by storage_path */}
                                  <button
                                    type="button"
                                    onPointerDown={(e) => { e.stopPropagation(); }}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      console.log("[v0] DOWNLOAD BUTTON TAPPED", { playlistId: cloudPlaylist.id, name: cloudPlaylist.name });
                                      handleDownloadCloudPlaylist(cloudPlaylist.id);
                                    }}
                                    disabled={isDownloading}
                                    className="mt-3 w-full py-2 rounded-xl bg-cyan-500/20 border border-cyan-500/30 text-cyan-400 text-sm font-semibold
                                               hover:bg-cyan-500/30 transition flex items-center justify-center gap-2 disabled:opacity-50"
                                  >
                                    {isDownloading ? <Loader2 size={15} className="animate-spin" /> : <Download size={15} />}
                                    {isDownloading ? 'Downloading…' : 'Download to Device'}
                                  </button>
                                  {cloudDownloadResult[cloudPlaylist.id] && !isDownloading && (
                                    <p className={`mt-2 text-xs font-medium flex items-center gap-1.5 ${cloudDownloadResult[cloudPlaylist.id].ok ? 'text-green-400' : 'text-red-400'}`}>
                                      {cloudDownloadResult[cloudPlaylist.id].ok ? <Check size={13} /> : <AlertCircle size={13} />}
                                      {cloudDownloadResult[cloudPlaylist.id].message}
                                    </p>
                                  )}
                                </div>
                              );
                            })}
                    </div>
                  </div>
                )}
                </div>
                )}
                </div>
                )}
                
                {/* EQHO Cloud Page */}
                {activePage === "cloud" && (
                <div className="col-span-3 col-start-2 h-full overflow-y-auto pb-6 rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-sm">
                  {/* Header */}
                  <div className="px-8 pt-6 pb-4 border-b border-white/10">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#ff4fa3] to-[#ff8a00] flex items-center justify-center">
                        <Cloud size={24} />
                      </div>
                      <div>
                        <h1 className="text-2xl font-bold">EQHO Cloud</h1>
                        <p className="text-white/60 text-sm">Sync and backup your playlists</p>
                      </div>
                    </div>
                  </div>
                  
                  {/* Content */}
                  <div className="p-8 space-y-6">
                    {/* Cloud Status Message */}
                    {cloudSaveMessage && (
                      <div className={`px-4 py-3 rounded-xl ${cloudSaveSuccess ? 'bg-[#22c55e]/10 border border-[#22c55e]/30' : 'bg-[#ff4fa3]/10 border border-[#ff4fa3]/30'}`}>
                        <p className={`text-sm font-medium flex items-center gap-2 ${cloudSaveSuccess ? 'text-[#22c55e]' : 'text-[#ff4fa3]'}`}>
                          {(isExporting || isPushingToApps || isUploadingToCloud || isDownloadingFromCloud) && <Loader2 size={16} className="animate-spin" />}
                          {cloudSaveMessage}
                        </p>
                      </div>
                    )}
                    
                    {/* Upload to Cloud Section */}
                    <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-6">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-500 to-emerald-400 flex items-center justify-center">
                          <CloudUpload size={18} />
                        </div>
                        <div>
                          <h2 className="text-lg font-bold">Upload to Cloud</h2>
                          <p className="text-white/50 text-sm">Sync playlists to R2 storage</p>
                        </div>
                      </div>
                      <p className="text-white/70 text-sm mb-4">
                        Upload all your playlists and audio files to secure cloud storage. 
                        Your files are stored in Cloudflare R2 with signed URLs for privacy.
                      </p>
                      <button
                        onClick={handleUploadToCloud}
                        disabled={isUploadingToCloud}
                        className="w-full py-3 rounded-xl bg-gradient-to-r from-green-500 to-emerald-400 text-white font-semibold hover:shadow-[0_0_20px_rgba(16,185,129,0.3)] transition flex items-center justify-center gap-2 disabled:opacity-50"
                      >
                        {isUploadingToCloud ? (
                          <Loader2 size={18} className="animate-spin" />
                        ) : (
                          <CloudUpload size={18} />
                        )}
                        Upload to Cloud
                      </button>
                    </div>
                    
                    {/* Download from Cloud Section */}
                    <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-6">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-400 flex items-center justify-center">
                          <CloudDownload size={18} />
                        </div>
                        <div>
                          <h2 className="text-lg font-bold">Download from Cloud</h2>
                          <p className="text-white/50 text-sm">Restore playlists from R2 storage</p>
                        </div>
                      </div>
                      <p className="text-white/70 text-sm mb-4">
                        Download and restore all your playlists from the cloud. 
                        Use this when setting up a new device or after reinstalling.
                      </p>
                      <button
                        onClick={handleDownloadFromCloud}
                        disabled={isDownloadingFromCloud}
                        className="w-full py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-400 text-white font-semibold hover:shadow-[0_0_20px_rgba(6,182,212,0.3)] transition flex items-center justify-center gap-2 disabled:opacity-50"
                      >
                        {isDownloadingFromCloud ? (
                          <Loader2 size={18} className="animate-spin" />
                        ) : (
                          <CloudDownload size={18} />
                        )}
                        Download from Cloud
                      </button>
                    </div>
                    
                    {/* Download Playlists Section (Local Export) */}
                    <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-6">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#ff4fa3] to-[#ff8a00] flex items-center justify-center">
                          <FileDown size={18} />
                        </div>
                        <div>
                          <h2 className="text-lg font-bold">Download Playlists</h2>
                          <p className="text-white/50 text-sm">Save a local backup</p>
                        </div>
                      </div>
                      <p className="text-white/70 text-sm mb-4">
                        Download your playlist music files as a ZIP folder for local backup or competition preparation.
                      </p>
                      <button
                        onClick={handleDownloadAllPlaylists}
                        disabled={isExporting}
                        className="w-full py-3 rounded-xl bg-gradient-to-r from-[#ff4fa3] to-[#ff8a00] text-white font-semibold hover:shadow-[0_0_20px_rgba(255,79,163,0.3)] transition flex items-center justify-center gap-2 disabled:opacity-50"
                      >
                        {isExporting ? (
                          <Loader2 size={18} className="animate-spin" />
                        ) : (
                          <FileDown size={18} />
                        )}
                        Download Playlists
                      </button>
                    </div>
                    
                    {/* Push to Apps Section - Desktop Only */}
                    {!isMobileBuild && (
                      <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-6">
                        <div className="flex items-center gap-3 mb-4">
                          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center">
                            <Send size={18} />
                          </div>
                          <div>
                            <h2 className="text-lg font-bold">Push to Apps</h2>
                            <p className="text-white/50 text-sm">Sync to mobile and tablet</p>
                          </div>
                        </div>
                        <p className="text-white/70 text-sm mb-4">
                          Send your latest desktop playlists to your EQHO mobile and tablet apps. 
                          Make sure all devices are logged into the same EQHO account.
                        </p>
                        <button
                          onClick={handlePushToApps}
                          disabled={isPushingToApps}
                          className="w-full py-3 rounded-xl bg-white/5 border border-white/20 text-white font-semibold hover:bg-white/10 transition flex items-center justify-center gap-2 disabled:opacity-50"
                        >
                          {isPushingToApps ? (
                            <Loader2 size={18} className="animate-spin" />
                          ) : (
                            <Send size={18} />
                          )}
                          Push to Apps
                        </button>
                      </div>
                    )}
                    
                    {/* Cloud Sync Info */}
                    <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-[#ff4fa3]/5 via-transparent to-[#ff8a00]/5 p-6">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
                          <CloudUpload size={18} className="text-[#ff8a00]" />
                        </div>
                        <h2 className="text-lg font-bold">How Cloud Sync Works</h2>
                      </div>
                      <ul className="space-y-3 text-white/70 text-sm">
                        <li className="flex items-start gap-2">
                          <Check size={16} className="text-green-400 mt-0.5 shrink-0" />
                          <span>Changes are saved automatically when logged in</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <Check size={16} className="text-green-400 mt-0.5 shrink-0" />
                          <span>Pro users can access saved data across web, desktop, mobile, and tablet</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <Check size={16} className="text-green-400 mt-0.5 shrink-0" />
                          <span>Use the same email on all devices and Stripe billing</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <AlertCircle size={16} className="text-yellow-400 mt-0.5 shrink-0" />
                          <span>If playlists do not appear, log out and log back in</span>
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>
                )}

                {activePage === "settings" && (
          <div className="col-span-3 col-start-2 h-full overflow-y-auto pb-6 rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-sm">
            {/* Header */}
            <div className="px-8 pt-6 pb-4 border-b border-white/10">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div>
                    <p className="text-cyan-300 uppercase tracking-[0.25em] text-xs font-bold">
                      EQHO System Settings
                    </p>
                    <h1 className="text-3xl font-black mt-1">Settings</h1>
                  </div>
                  <ProBadge />
                </div>
                <button className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-pink-500 to-orange-500 font-bold shadow-lg shadow-pink-500/20 shrink-0 text-sm">
                  <Save size={16} className="inline mr-2" />
                  Save Settings
                </button>
              </div>
            </div>

            {/* Settings Grid */}
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {/* Subscription Card */}
                <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-5">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center">
                      <Crown size={18} />
                    </div>
                    <h2 className="text-lg font-bold">Subscription</h2>
                  </div>
                  {(() => {
                    // Only a genuine, active Stripe subscription counts as "active".
                    if (hasActiveSubscription(profile)) {
                    const countdownTarget = getCountdownTarget(profile);
                    const daysLeft = getDaysUntil(countdownTarget);
                    const pct = daysLeft !== null
                      ? Math.max(0, Math.min(100, (daysLeft / TRIAL_LENGTH_DAYS) * 100))
                      : 0;
                    return (
                  <div className="space-y-3">
                    {/* Plan Badge */}
                    <div className="flex items-center justify-between">
                      <span className="text-white/70 text-sm">Current Plan</span>
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-gradient-to-r from-emerald-500 to-green-500 text-white shadow-[0_0_12px_rgba(16,185,129,0.4)]">
                        <Crown className="h-3.5 w-3.5" />
                        EQHO Player
                      </span>
                    </div>

                    {/* Green Countdown Card */}
                    <div className="rounded-xl bg-gradient-to-br from-emerald-500/15 to-green-600/10 border border-emerald-500/30 p-4 space-y-3">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                        <span className="text-emerald-300 text-sm font-semibold">
                          {subCancelPending
                            ? "Access until period ends"
                            : "Your subscription is active"}
                        </span>
                      </div>

                      {/* Day-by-day countdown */}
                      {daysLeft !== null && (
                        <div className="flex items-end gap-2">
                          <span className="text-emerald-400 text-5xl font-black leading-none tabular-nums drop-shadow-[0_0_16px_rgba(16,185,129,0.35)]">
                            {daysLeft}
                          </span>
                          <span className="text-emerald-300/80 text-sm font-semibold pb-1">
                            {daysLeft === 1 ? "day left" : "days left"}
                          </span>
                        </div>
                      )}

                      {/* Progress bar */}
                      {daysLeft !== null && (
                        <div className="h-2 bg-emerald-950/40 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-emerald-400 to-green-400 rounded-full transition-all"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      )}

                      {/* Renewal date */}
                      {countdownTarget && (
                        <p className="text-emerald-100/70 text-xs">
                          {subCancelPending ? "Ends on " : "Renews on "}
                          <span className="font-semibold text-emerald-200">{formatTrialEndDate(countdownTarget)}</span>
                        </p>
                      )}

                      {/* Auto-renewal note */}
                      {!subCancelPending && (
                        <p className="text-emerald-100/50 text-[11px] leading-relaxed">
                          Your subscription renews automatically. Cancel anytime.
                        </p>
                      )}
                    </div>

                    {/* Cancel / Resume (Stripe + Supabase) */}
                    <div className="pt-0.5 space-y-2">
                      {subCancelPending ? (
                        <button
                          onClick={handleResumeSubscription}
                          disabled={resumeSubLoading}
                          className="w-full py-2 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-semibold hover:bg-emerald-500/20 transition flex items-center justify-center gap-2 disabled:opacity-60"
                        >
                          {resumeSubLoading ? <Loader2 size={14} className="animate-spin" /> : null}
                          Resume subscription
                        </button>
                      ) : (
                        <div className="text-center">
                          <button
                            onClick={() => { setSubActionError(null); setShowCancelSubConfirm(true); }}
                            className="text-white/40 hover:text-white/70 text-[11px] underline underline-offset-2 transition-colors"
                          >
                            Cancel subscription
                          </button>
                        </div>
                      )}
                      {subActionError && (
                        <p className="text-red-400 text-[11px] text-center">{subActionError}</p>
                      )}
                    </div>
                  </div>
                    );
                    }
                    // No active subscription — pre-launch informational state (no sign-up).
                    return (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-white/70 text-sm">Current Plan</span>
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-white/10 text-white/70 border border-white/15">
                        Free
                      </span>
                    </div>
                    <div className="rounded-xl bg-gradient-to-br from-emerald-500/15 to-green-600/10 border border-emerald-500/30 p-4 space-y-2">
                      <div className="flex items-center gap-2">
                        <Crown size={16} className="text-emerald-400" />
                        <span className="text-emerald-300 text-sm font-semibold">
                          Subscription available from {SUBSCRIPTION_LAUNCH_LABEL}
                        </span>
                      </div>
                      <p className="text-emerald-100/70 text-xs leading-relaxed">
                        Your free version ends on <span className="font-semibold text-emerald-200">{SUBSCRIPTION_LAUNCH_LABEL}</span>.
                      </p>
                    </div>
                  </div>
                    );
                  })()}
                </div>

                {/* Playback Settings */}
                <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-5">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#ff4fa3] to-[#ff8a00] flex items-center justify-center">
                      <Headphones size={18} />
                    </div>
                    <h2 className="text-lg font-bold">Playback</h2>
                  </div>
                  <div className="space-y-4">
                    {iosVolumeControl ? (
                      <p className="text-sm text-white/60 leading-relaxed">Use your device volume buttons to adjust playback volume.</p>
                    ) : (
                      <NumberSetting label="Default Volume" value={settings.defaultVolume} suffix="%" min={0} max={100} step={5} onChange={(v) => updateSetting("defaultVolume", v)} />
                    )}
                    <ToggleSetting label="Autoplay Next Track" value={settings.autoplayNext} onChange={(v) => updateSetting("autoplayNext", v)} />
                  </div>
                </div>

                {/* Session Controls */}
                <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-5">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#ff4fa3] to-[#ff8a00] flex items-center justify-center">
                      <Timer size={18} />
                    </div>
                    <h2 className="text-lg font-bold">Session Controls</h2>
                  </div>
                  <div className="space-y-4">
                    <NumberSetting label="Default Gap Between Routines" value={settings.gapSeconds} suffix="sec" min={0} max={120} step={5} onChange={(v) => updateSetting("gapSeconds", v)} />
                    <NumberSetting label="Default Playlist Repeats" value={settings.playlistRepeats} suffix="times" min={1} max={20} step={1} onChange={(v) => updateSetting("playlistRepeats", v)} />
                    <ToggleSetting label="Back-to-Back Mode Default" value={settings.backToBack} onChange={(v) => updateSetting("backToBack", v)} />
                  </div>
                </div>

                {/* Coach Display */}
                <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-5">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#ff4fa3] to-[#ff8a00] flex items-center justify-center">
                      <SlidersHorizontal size={18} />
                    </div>
                    <h2 className="text-lg font-bold">Coach Display</h2>
                  </div>
                  <div className="space-y-4">
                    <ToggleSetting label="Show Countdown Timer" value={settings.showCountdown} onChange={(v) => updateSetting("showCountdown", v)} />
                    <NumberSetting label="Countdown Before Routine" value={settings.countdownSeconds} suffix="sec" min={0} max={15} step={1} onChange={(v) => updateSetting("countdownSeconds", v)} />

                    {/* Countdown Sound — pick one of three beep styles. The preview
                        button plays a 3-2-1 using the same generator as the live
                        countdown, so it sounds identical in a real session. */}
                    <div className="space-y-2">
                      <span className="text-sm text-white/80">Countdown Sound</span>
                      <div className="grid gap-2">
                        {BEEP_SOUNDS.map((opt) => {
                          const active = settings.beepSound === opt.id;
                          return (
                            <div
                              key={opt.id}
                              className={`flex items-center gap-3 rounded-xl border p-3 transition ${active ? "border-[#ff4fa3] bg-[#ff4fa3]/10" : "border-white/10 bg-white/[0.02]"}`}
                            >
                              <button onClick={() => updateSetting("beepSound", opt.id)} className="flex-1 flex items-center gap-3 text-left">
                                <span className={`grid h-5 w-5 shrink-0 place-items-center rounded-full border ${active ? "border-[#ff4fa3]" : "border-white/30"}`}>
                                  {active && <span className="h-2.5 w-2.5 rounded-full bg-gradient-to-br from-[#ff4fa3] to-[#ff8a00]" />}
                                </span>
                                <span className="min-w-0">
                                  <span className="block text-sm font-semibold text-white">{opt.label}</span>
                                  <span className="block text-xs text-white/50">{opt.description}</span>
                                </span>
                              </button>
                              <button
                                onClick={() => previewBeepSound(opt.id)}
                                className="shrink-0 grid h-8 w-8 place-items-center rounded-lg border border-[#ff8a00]/40 bg-[#ff8a00]/10 text-[#ff8a00] hover:bg-[#ff8a00]/20 transition"
                                title="Preview sound"
                                aria-label={`Preview ${opt.label}`}
                              >
                                <Play size={14} />
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Warning Settings */}
                <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-5">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-yellow-500 to-orange-500 flex items-center justify-center">
                      <AlertTriangle size={18} />
                    </div>
                    <h2 className="text-lg font-bold">Warnings</h2>
                  </div>
                  <div className="space-y-4">
                    <ToggleSetting label="Show Pause Safety Warning" value={settings.showPauseWarning} onChange={(v) => updateSetting("showPauseWarning", v)} />
                    <ToggleSetting label="Show Skip Track Warning" value={settings.showSkipWarning} onChange={(v) => updateSetting("showSkipWarning", v)} />
                  </div>
                </div>

                {/* EQHO Cloud - Sync & Backup */}
                <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-[#ff4fa3]/5 via-transparent to-[#ff8a00]/5 p-5">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#ff4fa3] to-[#ff8a00] flex items-center justify-center">
                      <Cloud size={18} />
                    </div>
                    <h2 className="text-lg font-bold">EQHO Cloud</h2>
                  </div>
                  
                  {/* Cloud Status Message */}
                  {cloudSaveMessage && (
                    <div className={`mb-4 px-3 py-2 rounded-lg ${cloudSaveSuccess ? 'bg-[#22c55e]/10 border border-[#22c55e]/30' : 'bg-[#ff4fa3]/10 border border-[#ff4fa3]/30'}`}>
                      <p className={`text-sm font-medium flex items-center gap-2 ${cloudSaveSuccess ? 'text-[#22c55e]' : 'text-[#ff4fa3]'}`}>
                        {(isExporting || isPushingToApps) && <Loader2 size={14} className="animate-spin" />}
                        {cloudSaveMessage}
                      </p>
                    </div>
                  )}
                  
                  <div className="space-y-4">
                    {/* Download Playlists */}
                    <div>
                      <button
                        onClick={handleDownloadAllPlaylists}
                        disabled={isExporting}
                        className="w-full py-2.5 rounded-xl bg-gradient-to-r from-[#ff4fa3] to-[#ff8a00] text-white text-sm font-semibold hover:shadow-[0_0_20px_rgba(255,79,163,0.3)] transition flex items-center justify-center gap-2 disabled:opacity-50"
                      >
                        {isExporting ? (
                          <Loader2 size={16} className="animate-spin" />
                        ) : (
                          <FileDown size={16} />
                        )}
                        Download Playlists
                      </button>
                      <p className="text-xs text-white/50 mt-2">
                        Save a local backup of your EQHO playlists and routine setup.
                      </p>
                    </div>
                    
                    {/* Push to Apps - Desktop Only */}
                    {!isMobileBuild && (
                      <div>
                        <button
                          onClick={handlePushToApps}
                          disabled={isPushingToApps}
                          className="w-full py-2.5 rounded-xl bg-white/5 border border-white/20 text-white text-sm font-semibold hover:bg-white/10 transition flex items-center justify-center gap-2 disabled:opacity-50"
                        >
                          {isPushingToApps ? (
                            <Loader2 size={16} className="animate-spin" />
                          ) : (
                            <Send size={16} />
                          )}
                          Push to Apps
                        </button>
                        <p className="text-xs text-white/50 mt-2">
                          Send your latest desktop playlists to your logged-in EQHO apps.
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Account - Sign Out */}
                <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-5">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#ff4fa3] to-[#ff8a00] flex items-center justify-center">
                      <LogOut size={18} />
                    </div>
                    <h2 className="text-lg font-bold">Account</h2>
                  </div>
                  <p className="text-white/60 text-sm mb-4">
                    Sign out of EQHO Player on this device and return to the login screen.
                  </p>
                  <button
                    onClick={openChangePassword}
                    className="w-full min-h-[44px] py-3 mb-3 rounded-xl bg-white/5 border border-white/15 text-white text-sm font-semibold hover:bg-white/10 transition flex items-center justify-center gap-2"
                  >
                    <KeyRound size={16} />
                    Change Password
                  </button>
                  <button
                    onClick={handleLogout}
                    disabled={isSigningOut}
                    className="w-full min-h-[44px] py-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm font-semibold hover:bg-red-500/20 transition flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                  >
                    {isSigningOut ? (
                      <>
                        <Loader2 size={16} className="animate-spin" />
                        Signing out…
                      </>
                    ) : (
                      <>
                        <LogOut size={16} />
                        Sign Out
                      </>
                    )}
                  </button>
                  {signOutError && (
                    <p className="text-red-400 text-xs mt-2 text-center">{signOutError}</p>
                  )}
                </div>

                {/* Danger Zone - Delete Account */}
                <div className="rounded-2xl border border-red-500/20 bg-red-500/5 p-5">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-600 to-red-500 flex items-center justify-center">
                      <Trash2 size={18} />
                    </div>
                    <h2 className="text-lg font-bold text-red-400">Danger Zone</h2>
                  </div>
                  <p className="text-white/60 text-sm mb-4">
                    Permanently delete your account and all associated data. This action cannot be undone.
                  </p>
                  <button
                    onClick={() => setShowDeleteAccountConfirm(true)}
                    className="w-full py-2.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm font-semibold hover:bg-red-500/20 transition flex items-center justify-center gap-2"
                  >
                    <Trash2 size={16} />
                    Delete Account
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {activePage === "help" && (
          <div className="col-span-3 col-start-2 h-full overflow-y-auto pb-6 rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-sm">
            {/* Header */}
            <div className="px-8 pt-6 pb-4 border-b border-white/10">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#ff4fa3] to-[#ff8a00] flex items-center justify-center">
                  <BookOpen size={24} />
                </div>
                <div>
                  <h1 className="text-2xl font-bold">Help & User Guide</h1>
                  <p className="text-white/60 text-sm">Learn how to use EQHO Player</p>
                </div>
              </div>
            </div>

            {/* Help Content */}
            <div className="p-8 space-y-8">
              
              {/* Getting Started */}
              <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center">
                    <Play size={18} />
                  </div>
                  <h2 className="text-xl font-bold">Getting Started</h2>
                </div>
                <p className="text-white/70 mb-4">
                  EQHO Player is designed for coaches and athletes to manage training music with precision timing controls. 
                  The player allows you to create playlists, set gaps between routines, and use full-screen coach mode during training sessions.
                </p>
                <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                  <p className="text-sm text-white/60">
                    <strong className="text-white">Quick Start:</strong> Upload one or more folders of music files to create playlists, 
                    then load a playlist (or add several together) into your session and press Start Session.
                  </p>
                </div>
              </div>

              {/* Uploading Playlists */}
              <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#ff4fa3] to-[#ff8a00] flex items-center justify-center">
                    <UploadCloud size={18} />
                  </div>
                  <h2 className="text-xl font-bold">Uploading Playlists</h2>
                </div>
                <div className="space-y-4">
                  <div>
                    <h3 className="font-semibold text-white mb-2 flex items-center gap-2">
                      <Folder size={16} className="text-[#ff8a00]" />
                      Prepare Your Music on Your Computer
                    </h3>
                    <p className="text-white/70 text-sm">
                      Before uploading, organize your music files into folders on your computer. Each folder will become a separate playlist. 
                      Name your folders clearly (e.g., &quot;Training Day 1&quot;, &quot;Warm Up Routines&quot;). 
                      Supported formats: MP3, WAV, M4A.
                    </p>
                  </div>
                  <div>
                    <h3 className="font-semibold text-white mb-2 flex items-center gap-2">
                      <MousePointer size={16} className="text-[#ff8a00]" />
                      Click to Upload
                    </h3>
                    <p className="text-white/70 text-sm">
                      Click the &quot;Upload Files & Playlists&quot; area on the home screen to open a file picker. 
                      Select multiple audio files to create a new playlist.
                    </p>
                  </div>
                  <div>
                    <h3 className="font-semibold text-white mb-2 flex items-center gap-2">
                      <Move size={16} className="text-[#ff8a00]" />
                      Drag & Drop Folders
                    </h3>
                    <p className="text-white/70 text-sm">
                      Drag a folder directly from your computer onto the upload area. The folder name becomes the playlist name, 
                      and all audio files inside are added as tracks. This is the fastest way to create organized playlists.
                    </p>
                  </div>
                </div>
              </div>

              {/* Managing Playlists */}
              <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                    <ListMusic size={18} />
                  </div>
                  <h2 className="text-xl font-bold">Managing Playlists</h2>
                </div>
                <div className="space-y-4">
                  <div>
                    <h3 className="font-semibold text-white mb-2 flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold text-pink-400 bg-pink-500/20 border border-pink-500/30">Load</span>
                      Loading a Playlist
                    </h3>
                    <p className="text-white/70 text-sm">
                      Click the <strong className="text-pink-400">Load</strong> button on any saved playlist to load it into your current session. 
                      This <strong className="text-white">replaces</strong> whatever is currently in the Up Next queue, and the tracks appear in the Session Queue on the right side of the screen.
                    </p>
                  </div>
                  <div>
                    <h3 className="font-semibold text-white mb-2 flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold text-cyan-400 bg-cyan-500/20 border border-cyan-500/30">Add</span>
                      Combining Multiple Playlists
                    </h3>
                    <p className="text-white/70 text-sm">
                      Click the <strong className="text-cyan-400">Add</strong> button on a saved playlist to <strong className="text-white">append</strong> its tracks to the end of your current Up Next queue 
                      instead of replacing it. Use this to stack several playlists together into one master playlist for a single session, all playing back-to-back in order. 
                      If the queue is empty, Add simply starts a new queue with that playlist.
                    </p>
                  </div>
                  <div>
                    <h3 className="font-semibold text-white mb-2 flex items-center gap-2">
                      <RotateCcw size={16} className="text-cyan-400" />
                      Reset Playlist
                    </h3>
                    <p className="text-white/70 text-sm">
                      Click the <strong className="text-cyan-400">Reset</strong> button (with circular arrow icon) to restore the playlist to its original order 
                      and mark all tracks as unplayed. This is useful when starting a new training session.
                    </p>
                  </div>
                  <div>
                    <h3 className="font-semibold text-white mb-2 flex items-center gap-2">
                      <X size={16} className="text-[#ff8a00]" />
                      Clear Playlist
                    </h3>
                    <p className="text-white/70 text-sm">
                      Click the <strong className="text-[#ff8a00]">Clear Playlist</strong> button to remove all tracks from your current session. 
                      If a session is running, you&apos;ll be asked to confirm before clearing.
                    </p>
                  </div>
                  <div>
                    <h3 className="font-semibold text-white mb-2">
                      Deleting Saved Playlists
                    </h3>
                    <p className="text-white/70 text-sm">
                      Click the trash icon on any saved playlist to permanently delete it. This action cannot be undone, 
                      so make sure you have backups of your music files on your computer.
                    </p>
                  </div>
                </div>
              </div>

              {/* Reordering Routines */}
              <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
                    <GripVertical size={18} />
                  </div>
                  <h2 className="text-xl font-bold">Reordering Routines</h2>
                </div>
                <div className="space-y-4">
                  <p className="text-white/70">
                    You can reorder tracks in your session queue using drag and drop:
                  </p>
                  <ol className="list-decimal list-inside space-y-2 text-white/70 text-sm">
                    <li>Click and hold anywhere on the track row you want to move</li>
                    <li>Drag the track up or down to your desired position</li>
                    <li>A <strong className="text-cyan-400">cyan indicator line</strong> shows where the track will be placed</li>
                    <li>Release to drop the track in its new position</li>
                  </ol>
                  <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                    <p className="text-sm text-white/60">
                      <strong className="text-yellow-400">Tip:</strong> Reorder your routines before starting a session 
                      to match your training schedule.
                    </p>
                  </div>
                </div>
              </div>

              {/* Hiding Tracks */}
              <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center">
                    <X size={18} />
                  </div>
                  <h2 className="text-xl font-bold">Hiding & Showing Tracks</h2>
                </div>
                <div className="space-y-4">
                  <p className="text-white/70">
                    Sometimes you may want to skip certain tracks without removing them from your playlist:
                  </p>
                  <div>
                    <h3 className="font-semibold text-white mb-2 flex items-center gap-2">
                      <X size={16} className="text-orange-400" />
                      Hide a Track
                    </h3>
                    <p className="text-white/70 text-sm">
                      Click the <strong className="text-orange-400">X button</strong> on any track to hide it from your session. Hidden tracks will be skipped during playback 
                      but remain in your playlist for future use. The track will appear grayed out with strikethrough text.
                    </p>
                  </div>
                  <div>
                    <h3 className="font-semibold text-white mb-2 flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold text-cyan-400 bg-cyan-500/20 border border-cyan-500/30">Unhide</span>
                      Show a Hidden Track
                    </h3>
                    <p className="text-white/70 text-sm">
                      Click the <strong className="text-cyan-400">Unhide</strong> button on a hidden track to restore it to your session. It will be included in playback again.
                    </p>
                  </div>
                  <div>
                    <h3 className="font-semibold text-white mb-2 flex items-center gap-2">
                      <RotateCcw size={16} className="text-blue-400" />
                      Restore All Hidden Tracks
                    </h3>
                    <p className="text-white/70 text-sm">
                      If you&apos;ve hidden multiple tracks, click the <strong className="text-blue-400">Restore</strong> button in the queue header to unhide all tracks at once.
                    </p>
                  </div>
                </div>
              </div>

              {/* Bottom Bar Controls */}
              <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#ff4fa3] to-[#ff8a00] flex items-center justify-center">
                    <SlidersHorizontal size={18} />
                  </div>
                  <h2 className="text-xl font-bold">Bottom Bar Controls</h2>
                </div>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                      <div className="flex items-center gap-2 mb-2">
                        <Users size={16} className="text-white" />
                        <h3 className="font-semibold text-white">Gap Between Routines</h3>
                      </div>
                      <p className="text-white/60 text-sm">
                        Set the pause time between each routine. Use the +/- buttons to adjust in 5-second increments. 
                        This gives athletes time to reset before the next routine starts.
                      </p>
                    </div>
                    <div className="bg-white/5 rounded-xl p-4 border border-pink-500/20">
                      <div className="flex items-center gap-2 mb-2">
                        <RefreshCw size={16} className="text-pink-500" />
                        <h3 className="font-semibold text-white">Back to Back (B2B)</h3>
                      </div>
                      <p className="text-white/60 text-sm">
                        When enabled, each routine plays twice in a row before moving to the next track. 
                        Perfect for practice runs where athletes repeat their routine immediately.
                      </p>
                    </div>
                    <div className="bg-white/5 rounded-xl p-4 border border-orange-400/20">
                      <div className="flex items-center gap-2 mb-2">
                        <Clock size={16} className="text-orange-400" />
                        <h3 className="font-semibold text-white">Total Session Time</h3>
                      </div>
                      <p className="text-white/60 text-sm">
                        Shows the total estimated duration of your session based on all tracks, gaps, and repeat settings.
                      </p>
                    </div>
                    <div className="bg-white/5 rounded-xl p-4 border border-cyan-400/20">
                      <div className="flex items-center gap-2 mb-2">
                        <Repeat size={16} className="text-cyan-400" />
                        <h3 className="font-semibold text-white">Repeat Playlist</h3>
                      </div>
                      <p className="text-white/60 text-sm">
                        Set how many times the entire playlist should repeat. Useful for endurance training 
                        or when running multiple rounds of training.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Fullscreen Coach Mode */}
              <div className="rounded-2xl border border-cyan-500/20 bg-cyan-500/5 p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-500 flex items-center justify-center">
                    <Maximize2 size={18} />
                  </div>
                  <h2 className="text-xl font-bold">Fullscreen Coach Mode</h2>
                </div>
                <div className="space-y-4">
                  <p className="text-white/70">
                    Fullscreen mode provides a large, easy-to-read display perfect for use during training sessions.
                  </p>
                  <div>
                    <h3 className="font-semibold text-white mb-2">How to Enter Fullscreen</h3>
                    <p className="text-white/70 text-sm">
                      Click the fullscreen icon (expand arrows) in the Now Playing section to enter coach mode. 
                      On mobile, tap the &quot;Coach&quot; button in the navigation tabs.
                    </p>
                  </div>
                  <div>
                    <h3 className="font-semibold text-white mb-2">Best Practices for Training</h3>
                    <ul className="list-disc list-inside space-y-1 text-white/70 text-sm">
                      <li>Connect your device to a large screen or projector for visibility</li>
                      <li>Position the display where both coach and athletes can see it</li>
                      <li>Set appropriate gap times to allow athletes to prepare</li>
                      <li>Use the countdown feature to give athletes a heads-up before their music starts</li>
                      <li>The large timer display helps athletes track their routine timing</li>
                    </ul>
                  </div>
                  <div className="bg-cyan-500/10 rounded-xl p-4 border border-cyan-500/20">
                    <p className="text-sm text-cyan-300">
                      <strong>Pro Tip:</strong> During training, use fullscreen mode on a tablet or laptop 
                      positioned near the training floor. Athletes can see their upcoming routine and countdown in real-time.
                    </p>
                  </div>
                </div>
              </div>

              {/* Cloud Playlists and App Sync */}
              <div className="rounded-2xl border border-[#ff4fa3]/20 bg-gradient-to-br from-[#ff4fa3]/5 via-transparent to-[#ff8a00]/5 p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#ff4fa3] to-[#ff8a00] flex items-center justify-center">
                    <Cloud size={18} />
                  </div>
                  <h2 className="text-xl font-bold">Cloud Playlists and App Sync</h2>
                </div>
                <p className="text-white/70 mb-6">
                  EQHO Player saves your playlists, routines, session presets, and coach settings to your EQHO account 
                  so you can access them across web, desktop, mobile, and tablet.
                </p>
                
                <div className="space-y-6">
                  {/* Saving to EQHO Cloud */}
                  <div>
                    <h3 className="font-semibold text-white mb-2 flex items-center gap-2">
                      <CloudUpload size={16} className="text-[#ff8a00]" />
                      Saving to EQHO Cloud
                    </h3>
                    <ul className="list-disc list-inside space-y-1 text-white/70 text-sm">
                      <li>Changes are saved automatically when logged in</li>
                      <li>Pro users can access saved data across devices</li>
                      <li>Look for the &quot;All changes saved&quot; message to confirm sync</li>
                    </ul>
                  </div>
                  
                  {/* Download Playlists */}
                  <div>
                    <h3 className="font-semibold text-white mb-2 flex items-center gap-2">
                      <FileDown size={16} className="text-[#ff8a00]" />
                      Download Playlists
                    </h3>
                    <ul className="list-disc list-inside space-y-1 text-white/70 text-sm">
                      <li>Use <strong className="text-white">Download Playlists</strong> in Settings to save a local backup</li>
                      <li>The backup includes playlists, routine details, session presets, and coach settings</li>
                      <li>This is useful before competitions or when preparing offline</li>
                    </ul>
                  </div>
                  
                  {/* Push to Apps */}
                  <div>
                    <h3 className="font-semibold text-white mb-2 flex items-center gap-2">
                      <Send size={16} className="text-[#ff8a00]" />
                      Push to Apps
                    </h3>
                    <ul className="list-disc list-inside space-y-1 text-white/70 text-sm">
                      <li>Desktop users can press <strong className="text-white">Push to Apps</strong> to send the latest desktop playlists to the EQHO mobile and tablet apps</li>
                      <li>The apps must be logged into the same EQHO account</li>
                      <li>The apps will update from the cloud when refreshed or reopened</li>
                    </ul>
                  </div>
                  
                  {/* Account Email */}
                  <div>
                    <h3 className="font-semibold text-white mb-2 flex items-center gap-2">
                      <Users size={16} className="text-[#ff8a00]" />
                      Account Email
                    </h3>
                    <ul className="list-disc list-inside space-y-1 text-white/70 text-sm">
                      <li>Your saved playlists and subscription are linked to your EQHO login email</li>
                      <li>Use the same email on web, desktop, mobile, tablet, and Stripe billing</li>
                    </ul>
                  </div>
                  
                  {/* Troubleshooting */}
                  <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                    <h3 className="font-semibold text-white mb-2 flex items-center gap-2">
                      <AlertCircle size={16} className="text-yellow-400" />
                      Troubleshooting
                    </h3>
                    <ul className="list-disc list-inside space-y-1 text-white/60 text-sm">
                      <li>If playlists do not appear, log out and log back in</li>
                      <li>Check your internet connection</li>
                      <li>Press <strong className="text-white">Push to Apps</strong> again from desktop</li>
                      <li>Confirm all devices are using the same EQHO account email</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Keyboard Shortcuts */}
              <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-500 flex items-center justify-center">
                    <Monitor size={18} />
                  </div>
                  <h2 className="text-xl font-bold">Tips & Shortcuts</h2>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center justify-between py-2 border-b border-white/10">
                    <span className="text-white/70">Spacebar</span>
                    <span className="text-white text-sm">Play / Pause</span>
                  </div>
                  <div className="flex items-center justify-between py-2 border-b border-white/10">
                    <span className="text-white/70">Arrow Keys</span>
                    <span className="text-white text-sm">Skip Forward / Back</span>
                  </div>
                  <div className="flex items-center justify-between py-2 border-b border-white/10">
                    <span className="text-white/70">Escape</span>
                    <span className="text-white text-sm">Exit Fullscreen</span>
                  </div>
                  <div className="flex items-center justify-between py-2">
                    <span className="text-white/70">Click on track</span>
                    <span className="text-white text-sm">Jump to that routine</span>
                  </div>
                </div>
              </div>

              {/* Need More Help */}
              <div className="rounded-2xl border border-[#ff4fa3]/20 bg-gradient-to-br from-[#ff4fa3]/5 to-[#ff8a00]/5 p-6 text-center">
                <HelpCircle size={32} className="mx-auto mb-3 text-[#ff4fa3]" />
                <h2 className="text-xl font-bold mb-2">Need More Help?</h2>
                <p className="text-white/60 text-sm mb-4">
                  If you have questions or need assistance, feel free to reach out to our support team.
                </p>
                <a 
                  href="mailto:support@eqho.app" 
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-[#ff4fa3] to-[#ff8a00] text-white font-semibold hover:opacity-90 transition"
                >
                  <ExternalLink size={16} />
                  Contact Support
                </a>
              </div>

            </div>
          </div>
        )}

        {activePage === "contact" && (
          <div className="col-span-3 col-start-2 h-full overflow-y-auto pb-6 rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-sm">
            {/* Header */}
            <div className="px-8 pt-6 pb-4 border-b border-white/10">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#ff4fa3] to-[#ff8a00] flex items-center justify-center">
                  <Mail size={24} />
                </div>
                <div>
                  <h1 className="text-2xl font-bold">Contact & Feedback</h1>
                  <p className="text-white/60 text-sm">Report issues, submit bugs, and share feedback</p>
                </div>
              </div>
            </div>
            <ContactPage userEmail={user?.email} />
          </div>
        )}

      </div>

      {/* Mobile Layout - single column with tabs. The bottom space reserved for
          the fixed control bar depends on whether it's expanded (~230px) or
          collapsed (~91px), so the track list fills the gap instead of leaving
          blank space above a collapsed bar. */}
      <div
        data-normal-layout="mobile"
        className="flex desktop:hidden flex-col w-full md:max-w-3xl md:mx-auto overflow-hidden mt-[env(safe-area-inset-top)] pt-2 landscape:pt-1 px-2 sm:px-3"
        style={{
          // Offset the content below the status bar by EXACTLY the top safe-area
          // inset (applied once, now that the native WKWebView contentInset is
          // 'never'). A small pt-2 gives a tidy breathing gap without a big void.
          // Reserve the measured fixed-controls-bar height plus the top inset so
          // the content region always ends at the bar's top edge. Falls back to
          // 112px before the first measurement.
          height:
            "calc(100dvh - var(--mobile-controls-height, 112px) - env(safe-area-inset-top))",
          // When a Coach overlay is open, fully hide this normal layout so it can
          // never show through beneath the overlay on iPad Safari. Inline display
          // wins over the base `flex`/`desktop:hidden` classes.
          ...(coachViewActive ? { display: "none" } : {}),
        }}
      >
        {activePage === "player" && (
          <div className="flex flex-col h-full gap-1 overflow-hidden">
            {/* Mobile Tab Switcher */}
            <div className="flex gap-0.5 shrink-0 bg-white/[0.04] rounded-xl p-1 border border-white/10">
              <button
                onClick={() => setMobileTab("nowplaying")}
                className={`flex-1 py-1.5 landscape:py-1 px-2 rounded-lg text-[10px] sm:text-xs font-semibold transition-all ${
                  mobileTab === "nowplaying"
                    ? "bg-gradient-to-r from-pink-500/20 to-orange-500/20 text-white border border-pink-500/30"
                    : "text-white/50 hover:text-white/80 hover:bg-white/5"
                }`}
              >
                <Home size={14} className="mx-auto sm:hidden" />
                <span className="hidden sm:inline">Playing</span>
              </button>
              <button
                onClick={() => setMobileTab("playlists")}
                className={`flex-1 py-1.5 landscape:py-1 px-2 rounded-lg text-[10px] sm:text-xs font-semibold transition-all ${
                  mobileTab === "playlists"
                    ? "bg-gradient-to-r from-pink-500/20 to-orange-500/20 text-white border border-pink-500/30"
                    : "text-white/50 hover:text-white/80 hover:bg-white/5"
                }`}
              >
                <ListMusic size={14} className="mx-auto sm:hidden" />
                <span className="hidden sm:inline">Playlists</span>
              </button>
              <button
                onClick={() => setMobileTab("settings")}
                className={`flex-1 py-1.5 landscape:py-1 px-2 rounded-lg text-[10px] sm:text-xs font-semibold transition-all ${
                  mobileTab === "settings"
                    ? "bg-gradient-to-r from-pink-500/20 to-orange-500/20 text-white border border-pink-500/30"
                    : "text-white/50 hover:text-white/80 hover:bg-white/5"
                }`}
              >
                <Settings size={14} className="mx-auto sm:hidden" />
                <span className="hidden sm:inline">Settings</span>
              </button>
              <button
                onClick={() => setShowFullscreenMobilePlayer(true)}
                className="flex-1 py-1.5 landscape:py-1 px-2 rounded-lg text-[10px] sm:text-xs font-semibold text-white/50 hover:text-white/80 hover:bg-white/5 transition-all"
              >
                <ExternalLink size={14} className="mx-auto sm:hidden" />
                <span className="hidden sm:inline">Coach</span>
              </button>
            </div>

            {/* Mobile Content Area */}
            <div className="flex-1 min-h-0 overflow-hidden">
              {mobileTab === "nowplaying" && (
                <div className="h-full flex flex-col overflow-hidden">
                  {/* Now Playing Section - Compact */}
                  <div className="shrink-0 bg-white/[0.02] rounded-lg p-2 mb-1">
                    {currentTrack ? (
                      <div className="flex flex-col gap-3">
                        {/* Volume Control & Fullscreen Row */}
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-[9px] text-pink-400 uppercase tracking-widest font-bold">Now Playing</p>
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => setIsMuted((m) => !m)}
                              className={`grid h-[28px] w-[28px] place-items-center rounded-lg border transition ${
                                isMuted
                                  ? "border-red-500/60 bg-red-500/15 text-red-400"
                                  : "border-pink-500/40 bg-pink-500/10 text-white"
                              }`}
                            >
                              {isMuted ? <VolumeX size={13} /> : <Volume2 size={13} />}
                            </button>
                            {iosVolumeControl ? (
                              <span className="text-[9px] leading-tight text-white/60 max-w-[150px]">
                                Use your device volume buttons to adjust playback volume.
                              </span>
                            ) : (
                            <div
                              className="relative flex items-center w-[64px] h-[28px] rounded-lg border border-white/10 bg-[#090f1c] cursor-pointer overflow-hidden touch-none select-none"
                              onTouchStart={(e) => {
                                const rect = e.currentTarget.getBoundingClientRect();
                                const pct = Math.round(Math.max(0, Math.min(100, ((e.touches[0].clientX - rect.left) / rect.width) * 100)));
                                setVolume(pct);
                                if (pct > 0 && isMuted) setIsMuted(false);
                                if (pct === 0) setIsMuted(true);
                              }}
                              onTouchMove={(e) => {
                                const rect = e.currentTarget.getBoundingClientRect();
                                const pct = Math.round(Math.max(0, Math.min(100, ((e.touches[0].clientX - rect.left) / rect.width) * 100)));
                                setVolume(pct);
                                if (pct > 0 && isMuted) setIsMuted(false);
                                if (pct === 0) setIsMuted(true);
                              }}
                              onClick={(e) => {
                                const rect = e.currentTarget.getBoundingClientRect();
                                const pct = Math.round(Math.max(0, Math.min(100, ((e.clientX - rect.left) / rect.width) * 100)));
                                setVolume(pct);
                                if (pct > 0 && isMuted) setIsMuted(false);
                                if (pct === 0) setIsMuted(true);
                              }}
                              role="slider"
                              aria-label="Volume"
                              aria-valuemin={0}
                              aria-valuemax={100}
                              aria-valuenow={isMuted ? 0 : volume}
                            >
                              <div className="absolute inset-0 rounded-lg overflow-hidden pointer-events-none">
                                <div className="h-full bg-gradient-to-r from-[#ff4fa3]/25 to-[#ff8a00]/25 transition-all duration-150" style={{ width: `${isMuted ? 0 : volume}%` }} />
                              </div>
                              <span className="absolute inset-0 grid place-items-center z-10 text-[10px] font-bold text-white/80 tabular-nums pointer-events-none">
                                {isMuted ? "0" : volume}%
                              </span>
                            </div>
                            )}
                            <button
                              onClick={() => setShowFullscreenMobilePlayer(true)}
                              className="grid h-[28px] w-[28px] place-items-center rounded-lg border border-[#ff8a00]/40 bg-[#ff8a00]/10 text-white transition"
                              title="Enter fullscreen mode"
                            >
                              <Maximize2 size={13} />
                            </button>
                          </div>
                        </div>
                        {/* Track Info & Controls Row */}
                        <div className="flex items-center gap-3">
                          <div className="flex-1 min-w-0">
                            <h3 className="text-sm font-bold text-white truncate">{currentTrack.title || currentTrack.name}</h3>
                            <p className="text-xs text-white/50">{isPlaying ? "Playing" : isGapPaused ? `Gap: ${gapCountdown}s` : "Paused"}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <button onClick={handleSkipBackClick} className="p-2 rounded-full hover:bg-white/10 transition">
                              <StepBack size={18} className="text-white" />
                            </button>
                            <button onClick={handlePauseClick} className="p-3 rounded-full bg-gradient-to-r from-[#ff4fa3] to-[#ff8a00]">
                              {isPlaying ? <Pause size={22} className="text-white" /> : <Play size={22} className="text-white" />}
                            </button>
                            <button onClick={handleSkipForwardClick} className="p-2 rounded-full hover:bg-white/10 transition">
                              <StepForward size={18} className="text-white" />
                            </button>
                          </div>
                        </div>
                        {/* Timer — during the gap, show a prominent countdown number.
                            At 48px the pink→orange gradient text renders reliably on
                            iPad Safari (only the giant 30-50vh Coach number needs a
                            solid fill), so this matches the brand gradient used
                            elsewhere in the player. */}
                        {isGapPaused ? (
                          <div className="text-center">
                            <p className="text-[10px] uppercase tracking-widest text-white/50 mb-0.5">Next in</p>
                            <span className="text-5xl font-black bg-gradient-to-r from-[#ff4fa3] to-[#ff8a00] bg-clip-text text-transparent tabular-nums leading-none">
                              {gapCountdown}
                            </span>
                            <span className="text-white/40 text-sm ml-1">s</span>
                          </div>
                        ) : (
                          <div className="text-center">
                            <span className="text-2xl font-black text-white tabular-nums">
                              {String(Math.floor(currentTime / 60)).padStart(2, "0")}:{String(Math.floor(currentTime % 60)).padStart(2, "0")}
                            </span>
                            <span className="text-white/40 text-sm ml-2">/ {formatDuration(currentTrack.durationSeconds)}</span>
                          </div>
                        )}
                        
                        {/* Waveform Progress Bar — tap OR drag to seek. Uses Pointer
                            Events so a single code path covers touch (iPad/iPhone) and
                            mouse. `touch-none` stops the page from scrolling mid-scrub.
                            Routes through seekToSeconds so it also drives the native
                            engine on the iPad/iPhone app. Tap is unchanged: it's just a
                            pointerdown+up with no move. */}
                        <div
                          className="relative flex h-10 w-full cursor-pointer items-end gap-[2px] rounded-lg border border-white/10 bg-white/[0.02] px-2 pb-1.5 pt-1.5 select-none touch-none"
                          onPointerDown={(e) => {
                            if (trackDuration === 0) return;
                            waveformScrubbingRef.current = true;
                            e.currentTarget.setPointerCapture(e.pointerId);
                            const rect = e.currentTarget.getBoundingClientRect();
                            const pct = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
                            seekToSeconds(pct * trackDuration);
                          }}
                          onPointerMove={(e) => {
                            if (!waveformScrubbingRef.current || trackDuration === 0) return;
                            const rect = e.currentTarget.getBoundingClientRect();
                            const pct = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
                            seekToSeconds(pct * trackDuration);
                          }}
                          onPointerUp={(e) => {
                            waveformScrubbingRef.current = false;
                            if (e.currentTarget.hasPointerCapture(e.pointerId)) e.currentTarget.releasePointerCapture(e.pointerId);
                          }}
                          onPointerCancel={() => { waveformScrubbingRef.current = false; }}
                        >
                          {Array.from({ length: 50 }).map((_, i) => {
                            const barProgress = (i / 50) * 100;
                            const isPlayed = barProgress <= trackProgress;
                            const heights = [40, 60, 80, 55, 70, 45, 85, 50, 65, 75];
                            const h = heights[i % heights.length];
                            return (
                              <div
                                key={i}
                                className={`flex-1 rounded-sm transition-colors ${
                                  isPlayed
                                    ? "bg-gradient-to-t from-[#ff4fa3] to-[#ff8a00]"
                                    : "bg-white/15"
                                }`}
                                style={{ height: `${h}%` }}
                              />
                            );
                          })}
                          {/* Playhead indicator */}
                          <div 
                            className="absolute top-0 bottom-0 w-0.5 bg-white shadow-[0_0_4px_rgba(255,255,255,0.5)]"
                            style={{ left: `${Math.max(8, Math.min(trackProgress, 100) * 0.92 + 8)}%` }}
                          />
                          <div className="absolute bottom-0.5 left-2 text-[9px] text-white/60">
                            {formatDuration(currentTime)}
                          </div>
                          <div className="absolute bottom-0.5 right-2 text-[9px] text-white/60">
                            {trackDuration > 0 ? formatDuration(trackDuration) : "--:--"}
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center gap-2 py-4">
                        <p className="text-white/50 text-sm">No track playing</p>
                        <p className="text-white/30 text-xs">Add tracks from Playlists tab</p>
                      </div>
                    )}
                  </div>

                  {/* Up Next Playlist */}
                  <div className="flex-1 min-h-0 bg-white/[0.02] rounded-lg p-2 flex flex-col overflow-hidden">
                    <div className="flex items-center justify-between mb-2 shrink-0">
                      <h2 className="text-[10px] font-bold tracking-widest text-[#ff8a00] uppercase">Up Next ({visiblePlaylist.length})</h2>
                      <div className="flex items-center gap-2">
                        {hiddenTrackIds.size > 0 && (
                          <button
                            onClick={() => setHiddenTrackIds(new Set())}
                            className="px-2 py-1 text-[9px] font-bold text-blue-400 bg-blue-500/10 border border-blue-500/30 rounded-md hover:bg-blue-500/20 transition flex items-center gap-1"
                          >
                            <RotateCcw size={10} />
                            Restore ({hiddenTrackIds.size})
                          </button>
                        )}
                        {playlist.length > 0 && (
                          <button
                            onClick={resetPlaylist}
                            disabled={playlist.length === 0}
                            className="px-2 py-1 text-[9px] font-bold text-cyan-400 bg-cyan-500/10 border border-cyan-500/30 rounded-md hover:bg-cyan-500/20 transition flex items-center gap-1 disabled:opacity-30"
                          >
                            <RotateCcw size={10} />
                            Reset
                          </button>
                        )}
                        <button
                          onClick={() => {
                            if (sessionRunning || isPlaying) {
                              setShowClearPlaylistConfirm(true);
                            } else {
                              clearPlaylist();
                            }
                          }}
                          disabled={playlist.length === 0}
                          className="px-2 py-1 text-[9px] font-bold text-white bg-[#ff8a00]/20 border border-[#ff8a00]/50 rounded-md hover:bg-[#ff8a00]/30 transition disabled:opacity-30"
                        >
                          Clear
                        </button>
                      </div>
                    </div>

                    {/* Track List - Revolves to show current track at top */}
                    <div className="flex-1 min-h-0 overflow-y-auto">
                      {playlist.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full text-center py-8">
                          <p className="text-white/40 text-sm">No tracks queued</p>
                          <p className="text-white/25 text-xs mt-1">Go to Playlists tab to add music</p>
                        </div>
                      ) : (
                        <div className="space-y-1">
                          {(() => {
                            // Render the playlist in its TRUE order (no pinning of the
                            // now-playing track). This makes every row -- including the
                            // first/top track -- behave identically for drag + up/down
                            // reordering. The active track is still visually highlighted.
                            const reorderedPlaylist = playlist;
                            
                            return (
                              <SortableTrackList
                                ids={reorderedPlaylist.map((t) => t.id)}
                                onReorder={reorderPlaylistByIds}
                              >
                                {reorderedPlaylist.map((track, displayIndex) => {
                              // Get original position for numbering
                              const originalIndex = playlist.findIndex(t => t.id === track.id);
                              const colours = ["text-[#ff8a00]", "text-blue-500", "text-purple-400", "text-[#ff4fa3]", "text-cyan-400", "text-green-400"];
                              const colour = colours[originalIndex % colours.length];
                              const isActiveTrack = currentTrack?.id === track.id;
                              const isFinished = finishedTracks.has(track.id);
                              const isHidden = hiddenTrackIds.has(track.id);

                              // Touch reorder: swap with the neighbour above/below.
                              // Every row is reorderable (including the top/active track);
                              // only the list edges disable the up/down buttons.
                              const upNeighbour = displayIndex > 0 ? reorderedPlaylist[displayIndex - 1] : null;
                              const downNeighbour = displayIndex < reorderedPlaylist.length - 1 ? reorderedPlaylist[displayIndex + 1] : null;
                              const canMoveUp = !!upNeighbour;
                              const canMoveDown = !!downNeighbour;

                              return (
                                <SortableTrackItem
                                  key={track.id}
                                  id={track.id}
                                  className={`flex items-center gap-2 p-2 rounded-lg transition ${
                                    isHidden
                                      ? "opacity-40 border border-dashed border-white/10"
                                      : isActiveTrack 
                                      ? "bg-[#ff4fa3]/15 border border-[#ff4fa3]/30" 
                                      : isFinished
                                        ? "opacity-40"
                                        : "hover:bg-white/5"
                                  }`}
                                >
                                  {/* Drag handle (press & hold to reorder on touch) */}
                                  {!isHidden && (
                                    <TrackDragHandle className="flex items-center justify-center shrink-0 -ml-1 text-white/30 hover:text-white/70 active:text-white bg-transparent border-0 p-0.5">
                                      <GripVertical size={18} />
                                    </TrackDragHandle>
                                  )}

                                  {/* Track Number - shows original playlist position */}
                                  <div className={`text-xl font-black w-6 text-center ${isHidden ? "text-white/15" : isFinished ? "text-white/20" : colour}`}>
                                    {originalIndex + 1}
                                  </div>
                                  
                                  {/* Track Info */}
                                  <div className="flex-1 min-w-0">
                                    <p className={`text-sm font-semibold truncate ${isHidden ? "text-white/25 line-through" : isActiveTrack ? "text-[#ff8a00]" : isFinished ? "text-white/40" : "text-white"}`}>
                                      {track.title}
                                    </p>
                                    <p className={`text-[10px] ${isHidden ? "text-white/20" : "text-white/50"}`}>
                                      {isHidden ? "Hidden" : isActiveTrack && isPlaying ? "Now Playing" : isActiveTrack && isGapPaused ? `Gap: ${gapCountdown}s` : isFinished ? "Finished" : formatDuration(track.durationSeconds)}
                                    </p>
                                  </div>
                                  
                                  {/* Duration */}
                                  <div className="text-right shrink-0">
                                    <p className="text-[9px] text-white/40">Duration</p>
                                    <p className={`text-sm font-bold ${isHidden ? "text-white/15" : isFinished ? "text-white/20" : colour}`}>{formatDuration(track.durationSeconds)}</p>
                                  </div>
                                  
                                  {/* Reorder Buttons (touch-friendly, mobile/tablet) */}
                                  {!isHidden && (canMoveUp || canMoveDown) && (
                                    <div className="flex flex-col shrink-0">
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          if (!canMoveUp || !upNeighbour) return;
                                          const toIndex = playlist.findIndex(t => t.id === upNeighbour.id);
                                          moveTrackByOne(originalIndex, toIndex);
                                        }}
                                        disabled={!canMoveUp}
                                        aria-label="Move track up"
                                        className="p-1 rounded-md text-white/50 hover:text-cyan-400 hover:bg-cyan-500/15 active:bg-cyan-500/25 transition disabled:opacity-20 disabled:pointer-events-none"
                                      >
                                        <ChevronUp size={16} />
                                      </button>
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          if (!canMoveDown || !downNeighbour) return;
                                          const toIndex = playlist.findIndex(t => t.id === downNeighbour.id);
                                          moveTrackByOne(originalIndex, toIndex);
                                        }}
                                        disabled={!canMoveDown}
                                        aria-label="Move track down"
                                        className="p-1 rounded-md text-white/50 hover:text-cyan-400 hover:bg-cyan-500/15 active:bg-cyan-500/25 transition disabled:opacity-20 disabled:pointer-events-none"
                                      >
                                        <ChevronDown size={16} />
                                      </button>
                                    </div>
                                  )}

                                  {/* Unhide Button (shown only for already-hidden tracks) */}
                                  {isHidden ? (
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setHiddenTrackIds(prev => {
                                          const next = new Set(prev);
                                          next.delete(track.id);
                                          return next;
                                        });
                                      }}
                                      className="px-2 py-1 rounded-md text-[9px] font-bold text-cyan-400 bg-cyan-500/10 border border-cyan-500/30 hover:bg-cyan-500/20 transition"
                                    >
                                      Unhide
                                    </button>
                                  ) : (
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        hideTrackFromSession(track.id);
                                      }}
                                      aria-label={`Hide ${track.title} from this session`}
                                      title="Hide from this session"
                                      className="flex items-center justify-center w-8 h-8 rounded-md text-white/40 hover:text-white hover:bg-white/10 active:bg-white/15 transition shrink-0"
                                    >
                                      <X size={18} />
                                    </button>
                                  )}
                                </SortableTrackItem>
                              );
                                })}
                              </SortableTrackList>
                            );
                          })()}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {mobileTab === "playlists" && (
                <div className="flex flex-col h-full">
                  {/* Fixed Header */}
                  <div className="shrink-0 mb-2">
                    <p className="text-pink-400 uppercase tracking-[0.15em] text-[9px] font-bold">EQHO Library</p>
                    <h2 className="text-base font-black">Playlists</h2>
                  </div>

                  {/* Upload Area - Creates playlists like desktop */}
                  <div className="mb-2 shrink-0">
                    <label
                      onDrop={async (e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setIsDraggingUpload(false);
                        
                        const items = e.dataTransfer?.items;
                        if (!items) return;
                        
                        const readDirectory = (entry: FileSystemDirectoryEntry): Promise<File[]> => {
                          return new Promise((resolve) => {
                            const reader = entry.createReader();
                            const files: File[] = [];
                            
                            const readEntries = () => {
                              reader.readEntries(async (entries) => {
                                if (entries.length === 0) {
                                  resolve(files);
                                  return;
                                }
                                
                                for (const ent of entries) {
                                  if (ent.isFile) {
                                    const fileEntry = ent as FileSystemFileEntry;
                                    const file = await new Promise<File>((res) => fileEntry.file(res));
                                    if (file.type.startsWith("audio/")) {
                                      files.push(file);
                                    }
                                  } else if (ent.isDirectory) {
                                    const subFiles = await readDirectory(ent as FileSystemDirectoryEntry);
                                    files.push(...subFiles);
                                  }
                                }
                                readEntries();
                              });
                            };
                            readEntries();
                          });
                        };
                        
                        for (let i = 0; i < items.length; i++) {
                          const item = items[i];
                          const entry = item.webkitGetAsEntry?.();
                          
                          if (entry?.isDirectory) {
                            const folderName = entry.name;
                            const audioFiles = await readDirectory(entry as FileSystemDirectoryEntry);
                            
                            if (audioFiles.length > 0) {
                              const newPlaylistId = crypto.randomUUID();
                              const newTracks: Track[] = [];
                              
                              let processed = 0;
                              audioFiles.forEach((file) => {
                                const url = URL.createObjectURL(file);
                                const audio = new Audio(url);
                                audio.onloadedmetadata = async () => {
                                  const newTrack: Track = {
                                    id: crypto.randomUUID(),
                                    title: file.name.replace(/\.[^/.]+$/, ""),
                                    fileName: file.name,
                                    url,
                                    durationSeconds: Math.round(audio.duration),
                                    uploadedAt: new Date().toISOString(),
                                    file,
                                  };
                                  newTracks.push(newTrack);
                                  
                                  processed++;
                                  if (processed === audioFiles.length) {
                                    setSavedPlaylists((prev) => [
                                      ...prev,
                                      { id: newPlaylistId, name: folderName, tracks: newTracks },
                                    ]);
                                  }
                                };
                              });
                            }
                          } else if (entry?.isFile) {
                            const files = Array.from(e.dataTransfer?.files || []).filter((file) =>
                              file.type.startsWith("audio/")
                            );
                            
                            if (files.length > 0) {
                              const playlistName = `Playlist ${savedPlaylists.length + 1}`;
                              const newPlaylistId = crypto.randomUUID();
                              const newTracks: Track[] = [];
                              
                              let processed = 0;
                              files.forEach((file) => {
                                const url = URL.createObjectURL(file);
                                const audio = new Audio(url);
                                audio.onloadedmetadata = async () => {
                                  const newTrack: Track = {
                                    id: crypto.randomUUID(),
                                    title: file.name.replace(/\.[^/.]+$/, ""),
                                    sub: "Uploaded Track",
                                    duration: formatDuration(Math.round(audio.duration)),
                                    fileName: file.name,
                                    url,
                                    durationSeconds: Math.round(audio.duration),
                                    uploadedAt: new Date().toISOString(),
                                    file,
                                  };
                                  newTracks.push(newTrack);
                                  
                                  processed++;
                                  if (processed === files.length) {
                                    setSavedPlaylists((prev) => [
                                      ...prev,
                                      { id: newPlaylistId, name: playlistName, tracks: newTracks },
                                    ]);
                                  }
                                };
                              });
                            }
                            break;
                          }
                        }
                      }}
                      onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}
                      onDragEnter={(e) => { e.preventDefault(); e.stopPropagation(); setIsDraggingUpload(true); }}
                      onDragLeave={(e) => { e.preventDefault(); e.stopPropagation(); setIsDraggingUpload(false); }}
                      className={`block cursor-pointer rounded-xl border border-dashed p-2 text-center transition ${
                        isDraggingUpload
                          ? "border-cyan-300 bg-cyan-400/10"
                          : "border-[#ff4fa3]/50 bg-white/[0.03]"
                      }`}
                    >
                      <input
                        type="file"
                        // @ts-expect-error - non-standard folder selection attributes
                        webkitdirectory=""
                        directory=""
                        multiple
                        onChange={(event) => {
                          const files = Array.from(event.target.files || []).filter((file) =>
                            file.type.startsWith("audio/") || 
                            file.name.endsWith(".mp3") || 
                            file.name.endsWith(".wav") || 
                            file.name.endsWith(".m4a")
                          );
                          if (files.length > 0) {
                            // One playlist per folder, named after the folder (same as desktop).
                            createPlaylistsFromFolderSelection(files);
                          }
                          event.target.value = "";
                        }}
                        className="hidden"
                      />
                      <div className="flex items-center justify-center gap-2">
                        <UploadCloud className="text-[#ff8a00]" size={18} />
                        <span className="text-white font-bold text-xs">Drop folder to create playlist</span>
                      </div>
                    </label>
                  </div>

{/* Cloud Sync Status */}
                    {user && isCloudSyncAvailable() && isPro && (
                    <div className="shrink-0 flex items-center justify-between mb-2 p-2 rounded-lg bg-white/[0.03] border border-white/10">
                      <div className="flex items-center gap-2 text-[10px] text-white/60">
                        <Cloud size={12} className="text-cyan-400" />
                        <span>{cloudPlaylists.length} cloud</span>
                      </div>
                      <button
                        onClick={async () => {
                          const playlists = await fetchCloudPlaylists();
                          setCloudPlaylists(playlists);
                        }}
                        className="px-2 py-1 rounded border border-cyan-500/30 bg-cyan-500/10 text-cyan-400 text-[9px] font-medium flex items-center gap-1"
                      >
                        <RefreshCw size={10} />
                        Refresh
                      </button>
                    </div>
                  )}

                  {/* Scrollable Playlists List */}
                  <div
                    className="flex-1 min-h-0 overflow-y-auto overscroll-contain scrollbar-thin scrollbar-thumb-white/20 scrollbar-track-transparent"
                    style={{
                      WebkitOverflowScrolling: "touch",
                      touchAction: "pan-y",
                      // Extra clearance so the LAST playlist card (its download +
                      // delete controls) scrolls comfortably clear of the fixed
                      // controls bar / home indicator.
                      paddingBottom: "calc(env(safe-area-inset-bottom) + 24px)",
                    }}
                  >
                    {savedPlaylists.length === 0 && cloudPlaylists.length === 0 ? (
                      <div className="rounded-xl border border-white/10 bg-white/[0.02] p-6 text-center">
                        <Folder size={32} className="mx-auto mb-2 text-white/20" />
                        <h3 className="text-sm font-bold text-white/60">No playlists yet</h3>
                        <p className="text-[10px] text-white/40 mt-1">Drop a folder above to create your first playlist</p>
                      </div>
                    ) : (
                      <div className="space-y-3 pb-2">
                        {/* Local Playlists */}
                        {savedPlaylists.length > 0 && (
                          <div>
                            <div className="flex items-center justify-between mb-2 sticky top-0 bg-[#050816] py-1 z-10">
                              <h3 className="text-[10px] font-bold text-white/60 flex items-center gap-1.5 uppercase tracking-wider">
                                <Folder size={12} />
                                Local Playlists
                                <span className="text-white/30 font-normal lowercase">({savedPlaylists.length})</span>
                              </h3>
                              <button
                                onClick={() => setShowClearLibraryConfirm(true)}
                                className="px-2 py-0.5 text-[9px] font-semibold text-[#ff8a00] bg-[#ff8a00]/10 border border-[#ff8a00]/30 rounded-md"
                              >
                                Clear All
                              </button>
                            </div>
                            <div className="space-y-2">
                              {savedPlaylists.map((localPlaylist) => {
                                const cloudStatus = getPlaylistCloudStatus(localPlaylist);
                                const isInCloud = cloudStatus !== 'new';
                                const isSyncing = syncingPlaylistId === localPlaylist.id;
                                const totalDuration = localPlaylist.tracks.reduce((sum, t) => sum + (t.durationSeconds || 0), 0);
                                
                                return (
                                  <div
                                    key={localPlaylist.id}
                                    className="rounded-xl border border-white/10 bg-white/[0.03] p-3 hover:border-pink-500/40 transition"
                                  >
                                    {/* Header Row */}
                                    <div className="flex items-start gap-2 mb-2">
                                      <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-pink-500 via-purple-500 to-cyan-400 flex items-center justify-center shadow-lg shadow-pink-500/20 shrink-0">
                                        <ListMusic size={16} />
                                      </div>
                                      <div className="flex-1 min-w-0">
                                        <h4 className="text-sm font-bold text-white truncate">{localPlaylist.name}</h4>
                                        <div className="flex items-center gap-1.5 text-[10px] text-white/50">
                                          <span>{localPlaylist.tracks.length} tracks</span>
                                          <span className="text-white/20">|</span>
                                          <span>{formatDuration(totalDuration)}</span>
                                        </div>
                                      </div>
                                      {/* Action Buttons */}
                                      <div className="flex gap-1 shrink-0">
                                        <button
                                          onClick={(e) => { e.stopPropagation(); handleSyncPlaylistToCloud(localPlaylist.id); }}
                                          disabled={isSyncing}
                                          className="w-7 h-7 rounded-md bg-white/10 flex items-center justify-center"
                                        >
                                          {isSyncing ? <Loader2 size={12} className="animate-spin text-cyan-400" /> : <Cloud size={12} className={isInCloud ? "text-cyan-400" : "text-white/40"} />}
                                        </button>
                                        <button
                                          onClick={(e) => { e.stopPropagation(); setShowDeletePlaylistConfirm({ id: localPlaylist.id, name: localPlaylist.name }); }}
                                          className="w-7 h-7 rounded-md bg-white/10 flex items-center justify-center"
                                        >
                                          <Trash2 size={12} className="text-white/40" />
                                        </button>
                                      </div>
                                    </div>
                                    
                                    {/* Cloud Sync Status / Action */}
                                    {cloudStatus === 'synced' ? (
                                      <div className="mb-2 flex items-center gap-1 text-[9px] text-cyan-400">
                                        <Cloud size={9} />
                                        Synced to cloud
                                      </div>
                                    ) : !isMobileBuild && (
                                      <button
                                        onClick={(e) => { e.stopPropagation(); handleSyncPlaylistToCloud(localPlaylist.id); }}
                                        disabled={isSyncing}
                                        className="mb-2 w-full py-1.5 rounded-lg bg-cyan-500/15 border border-cyan-500/30 text-cyan-400 text-[10px] font-semibold hover:bg-cyan-500/25 transition flex items-center justify-center gap-1.5 disabled:opacity-50"
                                      >
                                        {isSyncing ? <Loader2 size={10} className="animate-spin" /> : <Cloud size={10} />}
                                        {cloudStatus === 'new' ? 'Upload to Cloud' : 'Push Updates'}
                                      </button>
                                    )}
                                    
                                    {/* Track list with per-track permanent delete */}
                                    <PlaylistTrackRows
                                      tracks={localPlaylist.tracks}
                                      expanded={expandedPlaylistIds.has(localPlaylist.id)}
                                      onToggleExpand={() => togglePlaylistExpanded(localPlaylist.id)}
                                      onRequestDelete={(trackId) => {
                                        const t = localPlaylist.tracks.find((tr) => tr.id === trackId);
                                        if (t) setConfirmDeleteTrack({ playlistId: localPlaylist.id, track: t });
                                      }}
                                      deletingTrackId={deletingTrackId}
                                      formatDuration={formatDuration}
                                      compact
                                    />
                                    
                                    {/* Send to Session / Add Buttons */}
                                    <div className="flex gap-2">
                                      <button
                                        onClick={() => setShowSendToSessionConfirm({ name: localPlaylist.name, tracks: localPlaylist.tracks })}
                                        disabled={localPlaylist.tracks.length === 0}
                                        className="flex-1 py-2 rounded-lg bg-gradient-to-r from-pink-500/15 to-orange-500/15 
                                                   border border-pink-500/25 text-pink-400 text-[11px] font-semibold
                                                   hover:from-pink-500/25 hover:to-orange-500/25 transition disabled:opacity-30"
                                        title="Replace the current queue with this playlist"
                                      >
                                        Send to Session
                                      </button>
                                      <button
                                        onClick={() => {
                                          if (localPlaylist.tracks.length === 0) return;
                                          // Append this playlist's tracks to the existing queue to build one master playlist
                                          setPlaylist((prev) => {
                                            const next = [...prev, ...localPlaylist.tracks];
                                            if (prev.length === 0) {
                                              setCurrentPlaylistName(localPlaylist.name);
                                              setCurrentIndex(0);
                                              setCurrentTrack(next[0]);
                                            }
                                            return next;
                                          });
                                        }}
                                        disabled={localPlaylist.tracks.length === 0}
                                        className="py-2 px-3 rounded-lg bg-gradient-to-r from-cyan-500/15 to-blue-500/15 
                                                   border border-cyan-500/25 text-cyan-400 text-[11px] font-semibold
                                                   hover:from-cyan-500/25 hover:to-blue-500/25 transition disabled:opacity-30"
                                        title="Add to the current Up Next queue"
                                      >
                                        Add
                                      </button>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}
                        
                        {/* Cloud Available Playlists (in cloud, not yet on this device) */}
                        {cloudOnlyPlaylists.length > 0 && (
                          <div>
                            <h3 className="text-[10px] font-bold text-white/60 mb-2 flex items-center gap-1.5 uppercase tracking-wider sticky top-0 bg-[#050816] py-1 z-10">
                              <Cloud size={12} className="text-cyan-400" />
                              Cloud Available
                              <span className="text-white/30 font-normal normal-case">({cloudOnlyPlaylists.length})</span>
                            </h3>
                            <div className="space-y-2">
                              {cloudOnlyPlaylists
                                .map((cloudPlaylist) => {
                                  const totalDuration = cloudPlaylist.tracks.reduce((sum, t) => sum + (t.durationSeconds || 0), 0);
                                  const isDownloading = downloadingPlaylistId === cloudPlaylist.id;
                                  
                                  return (
                                    <div
                                      key={cloudPlaylist.id}
                                      className="rounded-xl border border-cyan-500/20 bg-cyan-500/5 p-3"
                                    >
                                      {/* Header Row */}
                                      <div className="flex items-start gap-2 mb-2">
                                        <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-500 flex items-center justify-center shadow-lg shadow-cyan-500/20 shrink-0">
                                          <Cloud size={16} />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                          <h4 className="text-sm font-bold text-white truncate">{cloudPlaylist.name}</h4>
                                          <div className="flex items-center gap-1.5 text-[10px] text-white/50">
                                            <span>{cloudPlaylist.tracks.length} tracks</span>
                                            <span className="text-white/20">|</span>
                                            <span>{formatDuration(totalDuration)}</span>
                                          </div>
                                        </div>
                                      </div>
                                      
                                      {/* Track Preview */}
                                      <div className="space-y-0.5 mb-2">
                                        {cloudPlaylist.tracks.slice(0, 2).map((track, idx) => (
                                          <div key={track.id} className="flex items-center gap-1.5 text-[10px] text-white/40">
                                            <span className="w-3 text-white/25">{idx + 1}.</span>
                                            <span className="truncate flex-1">{track.title}</span>
                                            <span className="text-white/25">{formatDuration(track.durationSeconds || 0)}</span>
                                          </div>
                                        ))}
                                        {cloudPlaylist.tracks.length > 2 && (
                                          <p className="text-[9px] text-white/25 pl-4">+{cloudPlaylist.tracks.length - 2} more tracks</p>
                                        )}
                                      </div>
                                      
                                      {/* Download to Device: downloads audio from R2 by storage_path,
                                          then the playlist appears in the local library as Synced. */}
                                      <button
                                        type="button"
                                        onPointerDown={(e) => { e.stopPropagation(); }}
                                        onTouchStart={(e) => { e.stopPropagation(); }}
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          console.log("[v0] DOWNLOAD BUTTON TAPPED", { playlistId: cloudPlaylist.id, name: cloudPlaylist.name });
                                          handleDownloadCloudPlaylist(cloudPlaylist.id);
                                        }}
                                        disabled={isDownloading}
                                        className="w-full py-2 rounded-lg bg-cyan-500/15 
                                                   border border-cyan-500/30 text-cyan-400 text-[11px] font-semibold
                                                   hover:bg-cyan-500/25 transition flex items-center justify-center gap-1.5 disabled:opacity-50"
                                        title="Download this playlist's audio to this device"
                                      >
                                        {isDownloading ? <Loader2 size={12} className="animate-spin" /> : <Download size={12} />}
                                        {isDownloading ? 'Downloading…' : 'Download to Device'}
                                      </button>
                                      {cloudDownloadResult[cloudPlaylist.id] && !isDownloading && (
                                        <p className={`mt-1.5 text-[10px] font-medium flex items-center gap-1 ${cloudDownloadResult[cloudPlaylist.id].ok ? 'text-green-400' : 'text-red-400'}`}>
                                          {cloudDownloadResult[cloudPlaylist.id].ok ? <Check size={11} /> : <AlertCircle size={11} />}
                                          {cloudDownloadResult[cloudPlaylist.id].message}
                                        </p>
                                      )}
                                    </div>
                                  );
                                })}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {mobileTab === "settings" && (
                <div className="h-full flex flex-col">
                  <Card className="flex-1 bg-white/[0.03] border-white/10 backdrop-blur-sm p-3 flex flex-col overflow-hidden">
                    {/* Header */}
                    <div className="shrink-0 mb-3">
                      <h2 className="text-cyan-300 uppercase tracking-[0.15em] text-[10px] font-black">Settings</h2>
                    </div>
                    
                    {/* Scrollable Content */}
                    <div className="flex-1 min-h-0 overflow-y-auto space-y-3 pb-16">
                    
                    {/* Playback Settings */}
                    <div className="rounded-xl border border-white/10 bg-white/[0.02] p-3">
                      <div className="flex items-center gap-2 mb-2">
                        <Headphones size={14} className="text-[#ff8a00]" />
                        <span className="text-[10px] font-bold text-white">Playback</span>
                      </div>
                      <div className="space-y-2">
                        {iosVolumeControl ? (
                          <p className="text-[10px] text-white/60 leading-relaxed">Use your device volume buttons to adjust playback volume.</p>
                        ) : (
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] text-white/70">Default Volume</span>
                          <div className="flex items-center rounded border border-white/20 bg-white/5">
                            <button onClick={() => updateSetting("defaultVolume", Math.max(0, settings.defaultVolume - 5))} className="px-1.5 py-0.5 text-white/70"><Minus size={10} /></button>
                            <span className="px-2 text-[10px] text-white border-x border-white/15">{settings.defaultVolume}%</span>
                            <button onClick={() => updateSetting("defaultVolume", Math.min(100, settings.defaultVolume + 5))} className="px-1.5 py-0.5 text-white/70"><Plus size={10} /></button>
                          </div>
                        </div>
                        )}
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] text-white/70">Autoplay Next Track</span>
                          <button onClick={() => updateSetting("autoplayNext", !settings.autoplayNext)} className="flex items-center">
                            <div className={`h-4 w-8 rounded-full border p-0.5 transition-colors ${settings.autoplayNext ? "border-pink-500 bg-pink-500/30" : "border-white/25 bg-white/15"}`}>
                              <div className={`h-3 w-3 rounded-full transition-transform ${settings.autoplayNext ? "translate-x-4 bg-pink-500" : "translate-x-0 bg-white/50"}`} />
                            </div>
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Session Controls */}
                    <div className="rounded-xl border border-white/10 bg-white/[0.02] p-3">
                      <div className="flex items-center gap-2 mb-2">
                        <Timer size={14} className="text-[#ff8a00]" />
                        <span className="text-[10px] font-bold text-white">Session Controls</span>
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] text-white/70">Default Gap</span>
                          <div className="flex items-center rounded border border-white/20 bg-white/5">
                            <button onClick={() => updateSetting("gapSeconds", Math.max(0, settings.gapSeconds - 5))} className="px-1.5 py-0.5 text-white/70"><Minus size={10} /></button>
                            <span className="px-2 text-[10px] text-white border-x border-white/15">{settings.gapSeconds}s</span>
                            <button onClick={() => updateSetting("gapSeconds", Math.min(120, settings.gapSeconds + 5))} className="px-1.5 py-0.5 text-white/70"><Plus size={10} /></button>
                          </div>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] text-white/70">Default Repeats</span>
                          <div className="flex items-center rounded border border-white/20 bg-white/5">
                            <button onClick={() => updateSetting("playlistRepeats", Math.max(1, settings.playlistRepeats - 1))} className="px-1.5 py-0.5 text-white/70"><Minus size={10} /></button>
                            <span className="px-2 text-[10px] text-white border-x border-white/15">{settings.playlistRepeats}x</span>
                            <button onClick={() => updateSetting("playlistRepeats", Math.min(20, settings.playlistRepeats + 1))} className="px-1.5 py-0.5 text-white/70"><Plus size={10} /></button>
                          </div>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] text-white/70">Back-to-Back Default</span>
                          <button onClick={() => updateSetting("backToBack", !settings.backToBack)} className="flex items-center">
                            <div className={`h-4 w-8 rounded-full border p-0.5 transition-colors ${settings.backToBack ? "border-pink-500 bg-pink-500/30" : "border-white/25 bg-white/15"}`}>
                              <div className={`h-3 w-3 rounded-full transition-transform ${settings.backToBack ? "translate-x-4 bg-pink-500" : "translate-x-0 bg-white/50"}`} />
                            </div>
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Coach Display */}
                    <div className="rounded-xl border border-white/10 bg-white/[0.02] p-3">
                      <div className="flex items-center gap-2 mb-2">
                        <SlidersHorizontal size={14} className="text-[#ff8a00]" />
                        <span className="text-[10px] font-bold text-white">Coach Display</span>
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] text-white/70">Show Countdown</span>
                          <button onClick={() => updateSetting("showCountdown", !settings.showCountdown)} className="flex items-center">
                            <div className={`h-4 w-8 rounded-full border p-0.5 transition-colors ${settings.showCountdown ? "border-pink-500 bg-pink-500/30" : "border-white/25 bg-white/15"}`}>
                              <div className={`h-3 w-3 rounded-full transition-transform ${settings.showCountdown ? "translate-x-4 bg-pink-500" : "translate-x-0 bg-white/50"}`} />
                            </div>
                          </button>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] text-white/70">Countdown Time</span>
                          <div className="flex items-center rounded border border-white/20 bg-white/5">
                            <button onClick={() => updateSetting("countdownSeconds", Math.max(0, settings.countdownSeconds - 1))} className="px-1.5 py-0.5 text-white/70"><Minus size={10} /></button>
                            <span className="px-2 text-[10px] text-white border-x border-white/15">{settings.countdownSeconds}s</span>
                            <button onClick={() => updateSetting("countdownSeconds", Math.min(15, settings.countdownSeconds + 1))} className="px-1.5 py-0.5 text-white/70"><Plus size={10} /></button>
                          </div>
                        </div>

                        {/* Countdown Sound selector (compact). Tap a row to select;
                            tap the play icon to preview the 3-2-1 for that style. */}
                        <div className="pt-1">
                          <span className="text-[10px] text-white/70">Countdown Sound</span>
                          <div className="mt-1 grid gap-1">
                            {BEEP_SOUNDS.map((opt) => {
                              const active = settings.beepSound === opt.id;
                              return (
                                <div
                                  key={opt.id}
                                  className={`flex items-center gap-2 rounded-lg border px-2 py-1.5 ${active ? "border-[#ff4fa3] bg-[#ff4fa3]/10" : "border-white/10 bg-white/[0.02]"}`}
                                >
                                  <button onClick={() => updateSetting("beepSound", opt.id)} className="flex-1 flex items-center gap-2 text-left">
                                    <span className={`grid h-3.5 w-3.5 shrink-0 place-items-center rounded-full border ${active ? "border-[#ff4fa3]" : "border-white/30"}`}>
                                      {active && <span className="h-1.5 w-1.5 rounded-full bg-[#ff4fa3]" />}
                                    </span>
                                    <span className="text-[10px] font-semibold text-white">{opt.label}</span>
                                  </button>
                                  <button
                                    onClick={() => previewBeepSound(opt.id)}
                                    className="shrink-0 grid h-6 w-6 place-items-center rounded-md border border-[#ff8a00]/40 bg-[#ff8a00]/10 text-[#ff8a00]"
                                    aria-label={`Preview ${opt.label}`}
                                  >
                                    <Play size={10} />
                                  </button>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Warnings */}
                    <div className="rounded-xl border border-white/10 bg-white/[0.02] p-3">
                      <div className="flex items-center gap-2 mb-2">
                        <AlertTriangle size={14} className="text-yellow-400" />
                        <span className="text-[10px] font-bold text-white">Warnings</span>
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] text-white/70">Show Pause Warning</span>
                          <button onClick={() => updateSetting("showPauseWarning", !settings.showPauseWarning)} className="flex items-center">
                            <div className={`h-4 w-8 rounded-full border p-0.5 transition-colors ${settings.showPauseWarning ? "border-pink-500 bg-pink-500/30" : "border-white/25 bg-white/15"}`}>
                              <div className={`h-3 w-3 rounded-full transition-transform ${settings.showPauseWarning ? "translate-x-4 bg-pink-500" : "translate-x-0 bg-white/50"}`} />
                            </div>
                          </button>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] text-white/70">Show Skip Warning</span>
                          <button onClick={() => updateSetting("showSkipWarning", !settings.showSkipWarning)} className="flex items-center">
                            <div className={`h-4 w-8 rounded-full border p-0.5 transition-colors ${settings.showSkipWarning ? "border-pink-500 bg-pink-500/30" : "border-white/25 bg-white/15"}`}>
                              <div className={`h-3 w-3 rounded-full transition-transform ${settings.showSkipWarning ? "translate-x-4 bg-pink-500" : "translate-x-0 bg-white/50"}`} />
                            </div>
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* EQHO Cloud - Sync & Backup */}
                    <div className="rounded-xl border border-white/10 bg-gradient-to-br from-[#ff4fa3]/5 via-transparent to-[#ff8a00]/5 p-3">
                      <div className="flex items-center gap-2 mb-2">
                        <Cloud size={14} className="text-[#ff8a00]" />
                        <span className="text-[10px] font-bold text-white">EQHO Cloud</span>
                      </div>
                      
                      {/* Cloud Status Message */}
                      {cloudSaveMessage && (
                        <div className={`mb-2 px-2 py-1.5 rounded-lg ${cloudSaveSuccess ? 'bg-[#22c55e]/10 border border-[#22c55e]/30' : 'bg-[#ff4fa3]/10 border border-[#ff4fa3]/30'}`}>
                          <p className={`text-[10px] font-medium flex items-center gap-1.5 ${cloudSaveSuccess ? 'text-[#22c55e]' : 'text-[#ff4fa3]'}`}>
                            {(isExporting || isPushingToApps) && <Loader2 size={10} className="animate-spin" />}
                            {cloudSaveMessage}
                          </p>
                        </div>
                      )}
                      
                      <div className="space-y-2">
                        {/* Download Playlists */}
                        <button
                          onClick={handleDownloadAllPlaylists}
                          disabled={isExporting}
                          className="w-full py-2 rounded-lg bg-gradient-to-r from-[#ff4fa3] to-[#ff8a00] text-white text-[11px] font-semibold hover:shadow-[0_0_15px_rgba(255,79,163,0.3)] transition flex items-center justify-center gap-2 disabled:opacity-50"
                        >
                          {isExporting ? (
                            <Loader2 size={12} className="animate-spin" />
                          ) : (
                            <FileDown size={12} />
                          )}
                          Download Playlists
                        </button>
                        <p className="text-[9px] text-white/50">
                          Save a local backup of your EQHO playlists and routine setup.
                        </p>
                        
                        {/* Push to Apps - Not shown on mobile build */}
                        {!isMobileBuild && (
                          <>
                            <button
                              onClick={handlePushToApps}
                              disabled={isPushingToApps}
                              className="w-full py-2 rounded-lg bg-white/5 border border-white/20 text-white text-[11px] font-semibold hover:bg-white/10 transition flex items-center justify-center gap-2 disabled:opacity-50"
                            >
                              {isPushingToApps ? (
                                <Loader2 size={12} className="animate-spin" />
                              ) : (
                                <Send size={12} />
                              )}
                              Push to Apps
                            </button>
                            <p className="text-[9px] text-white/50">
                              Send your latest playlists to your logged-in EQHO apps.
                            </p>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Subscription (Stripe + Supabase) */}
                    <div className="rounded-xl border border-emerald-500/25 bg-gradient-to-br from-emerald-500/10 to-green-600/5 p-3">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <Crown size={14} className="text-emerald-400" />
                          <span className="text-[10px] font-bold text-white">INTRODUCTION MODE</span>
                        </div>
                        {hasActiveSubscription(profile) ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-semibold bg-gradient-to-r from-emerald-500 to-green-500 text-white shadow-[0_0_10px_rgba(16,185,129,0.4)]">
                            <Crown className="h-2.5 w-2.5" />
                            EQHO Player
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-semibold bg-white/10 text-white/70 border border-white/15">
                            INTRODUCTION MODE
                          </span>
                        )}
                      </div>
                      {(() => {
                        // Only a genuine, active Stripe subscription counts as "active".
                        if (hasActiveSubscription(profile)) {
                        const countdownTarget = getCountdownTarget(profile);
                        const daysLeft = getDaysUntil(countdownTarget);
                        const pct = daysLeft !== null
                          ? Math.max(0, Math.min(100, (daysLeft / TRIAL_LENGTH_DAYS) * 100))
                          : 0;
                        return (
                          <div className="space-y-2">
                            <div className="flex items-center gap-1.5">
                              <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                              <span className="text-emerald-300 text-[9px] font-semibold">
                                {subCancelPending
                                  ? "Access until period ends"
                                  : "Your subscription is active"}
                              </span>
                            </div>

                            {/* Day-by-day countdown */}
                            {daysLeft !== null && (
                              <div className="flex items-end gap-1.5">
                                <span className="text-emerald-400 text-3xl font-black leading-none tabular-nums drop-shadow-[0_0_12px_rgba(16,185,129,0.35)]">
                                  {daysLeft}
                                </span>
                                <span className="text-emerald-300/80 text-[10px] font-semibold pb-0.5">
                                  {daysLeft === 1 ? "day left" : "days left"}
                                </span>
                              </div>
                            )}

                            {/* Progress bar */}
                            {daysLeft !== null && (
                              <div className="h-1.5 bg-emerald-950/40 rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-gradient-to-r from-emerald-400 to-green-400 rounded-full transition-all"
                                  style={{ width: `${pct}%` }}
                                />
                              </div>
                            )}

                            {/* Renewal date */}
                            {countdownTarget && (
                              <p className="text-emerald-100/70 text-[9px]">
                                {subCancelPending ? "Ends on " : "Renews on "}
                                <span className="font-semibold text-emerald-200">{formatTrialEndDate(countdownTarget)}</span>
                              </p>
                            )}

                            {!subCancelPending && (
                              <p className="text-emerald-100/50 text-[9px] leading-relaxed">
                                Your subscription renews automatically. Cancel anytime.
                              </p>
                            )}

                            {/* Cancel / Resume */}
                            {subCancelPending ? (
                              <button
                                onClick={handleResumeSubscription}
                                disabled={resumeSubLoading}
                                className="w-full min-h-[44px] py-2 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-semibold hover:bg-emerald-500/20 active:bg-emerald-500/30 transition flex items-center justify-center gap-2 disabled:opacity-60"
                              >
                                {resumeSubLoading ? <Loader2 size={14} className="animate-spin" /> : null}
                                Resume Subscription
                              </button>
                            ) : (
                              <div className="text-center pt-0.5">
                                <button
                                  onClick={() => { setSubActionError(null); setShowCancelSubConfirm(true); }}
                                  className="text-white/40 hover:text-white/70 active:text-white/80 text-[10px] underline underline-offset-2 transition-colors py-1"
                                >
                                  Cancel subscription
                                </button>
                              </div>
                            )}
                            {subActionError && (
                              <p className="text-red-400 text-[10px] text-center">{subActionError}</p>
                            )}
                          </div>
                        );
                        }
                        // No active subscription — pre-launch informational state (no sign-up).
                        return (
                          <div className="space-y-1.5">
                            <p className="text-emerald-300 text-[10px] font-semibold leading-relaxed">
                              Paid subscription starts on 1 September 2026.
                            </p>
                            <p className="text-emerald-100/70 text-[9px] leading-relaxed">
                              Introduction Mode remains free until 31 August 2026.
                            </p>
                          </div>
                        );
                      })()}
                    </div>

                    {/* Contact & Feedback */}
                    <button
                      onClick={() => setShowContactMobile(true)}
                      className="flex items-center gap-2 w-full rounded-xl border border-white/10 bg-white/[0.02] p-3 mt-1 hover:bg-white/[0.05] active:bg-white/[0.08] transition"
                    >
                      <Mail size={14} className="text-[#ff8a00]" />
                      <span className="text-[11px] font-semibold text-white flex-1 text-left">Contact & Feedback</span>
                      <ChevronRight size={14} className="text-white/40" />
                    </button>

                    {/* Legal / Privacy Policy */}
                    <Link
                      href="/privacy-policy"
                      className="flex items-center gap-2 w-full rounded-xl border border-white/10 bg-white/[0.02] p-3 mt-1 hover:bg-white/[0.05] active:bg-white/[0.08] transition"
                    >
                      <Shield size={14} className="text-white/60" />
                      <span className="text-[11px] font-semibold text-white flex-1">Privacy Policy</span>
                      <ChevronRight size={14} className="text-white/40" />
                    </Link>

                    {/* Account / Logout */}
                    <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-3 mt-1 mb-2">
                      <div className="flex items-center gap-2 mb-2">
                        <LogOut size={14} className="text-red-400" />
                        <span className="text-[10px] font-bold text-white">Account</span>
                      </div>
                      <div className="flex flex-col gap-2">
                        <button
                          onClick={openChangePassword}
                          className="w-full min-h-[44px] py-2.5 rounded-lg bg-white/5 border border-white/15 text-white text-xs font-semibold hover:bg-white/10 active:bg-white/15 transition flex items-center justify-center gap-2"
                        >
                          <KeyRound size={14} />
                          Change Password
                        </button>
                        <button
                          onClick={handleLogout}
                          disabled={isSigningOut}
                          className="w-full min-h-[44px] py-2.5 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-semibold hover:bg-red-500/20 active:bg-red-500/30 transition flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                        >
                          {isSigningOut ? (
                            <>
                              <Loader2 size={14} className="animate-spin" />
                              Signing out…
                            </>
                          ) : (
                            <>
                              <LogOut size={14} />
                              Sign Out
                            </>
                          )}
                        </button>
                        {signOutError && (
                          <p className="text-red-400 text-[10px] text-center">{signOutError}</p>
                        )}
                        <button
                          onClick={() => setShowDeleteAccountConfirm(true)}
                          className="w-full min-h-[44px] py-2.5 rounded-lg bg-red-600/10 border border-red-600/30 text-red-500 text-xs font-semibold hover:bg-red-600/20 active:bg-red-600/30 transition flex items-center justify-center gap-2"
                        >
                          <Trash2 size={14} />
                          Delete Account
                        </button>
                      </div>
                    </div>
                    
                    </div>
                  </Card>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Mobile Contact & Feedback full-screen overlay */}
      {showContactMobile && (
        <div className="desktop:hidden fixed inset-0 z-[60] bg-[#050816] flex flex-col">
          <div
            className="flex items-center gap-3 px-4 pb-3 border-b border-white/10 shrink-0"
            style={{ paddingTop: "calc(env(safe-area-inset-top) + 12px)" }}
          >
            <button
              onClick={() => setShowContactMobile(false)}
              aria-label="Back"
              className="grid h-9 w-9 place-items-center rounded-lg border border-white/10 bg-white/[0.03] text-white/70 hover:text-white transition"
            >
              <ChevronLeft size={18} />
            </button>
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#ff4fa3] to-[#ff8a00] flex items-center justify-center">
                <Mail size={18} />
              </div>
              <div>
                <h1 className="text-base font-bold leading-tight">Contact & Feedback</h1>
                <p className="text-white/50 text-[11px]">Report issues & share feedback</p>
              </div>
            </div>
          </div>
          {/* Scrollable form area. Bottom padding clears the iOS home indicator and
              gives the Send button room to scroll above the software keyboard. */}
          <div
            className="flex-1 overflow-y-auto"
            style={{ paddingBottom: "calc(env(safe-area-inset-bottom) + 32px)" }}
          >
            <ContactPage userEmail={user?.email} />
          </div>
        </div>
      )}

      {/* Fixed Bottom Control Bar.
          iPad Safari Coach View fix (section 7 — mutually exclusive rendering): this
          global footer (Gap Between Routines, Back to Back, Total Session Time, Repeat
          Playlist, Resume Session) is a top-level element that stays mounted on every
          page. When a Coach View is open its opaque overlay should cover this, but on
          iPad Safari the overlay's viewport height can differ from this viewport-fixed
          bar, leaving it visible OVER the Coach queue — the exact controls users saw
          overlapping the track list. We therefore hide it entirely while Coach is
          active so there is exactly ONE bottom control bar (the Coach overlay's own).
          `display:none` keeps the node mounted so the ResizeObserver ref stays valid;
          the `h > 0` guard in the measuring effect prevents the height var from being
          clobbered to 0. Normal (non-Coach) pages are completely unaffected. */}
      <div
        ref={mobileControlsRef}
        style={coachViewActive ? { display: "none" } : undefined}
        className="fixed bottom-0 left-0 right-0 w-full max-w-[100vw] z-40 bg-[#050816] border-t border-white/10"
      >
        {/* Desktop divider (mobile uses the collapse handle below instead) */}
        <div className="hidden md:block session-bottom-divider" />

        {/* Mobile collapse handle — the orange line doubles as the toggle */}
        <button
          type="button"
          onClick={() => setBottomBarExpanded((v) => !v)}
          aria-expanded={bottomBarExpanded}
          aria-label={bottomBarExpanded ? "Collapse session controls" : "Expand session controls"}
          className="md:hidden group block w-full"
        >
          <div className="session-bottom-divider" />
          <div className="flex items-center justify-center gap-1.5 py-1.5 text-white/50 group-active:text-white/80 transition-colors">
            {bottomBarExpanded ? <ChevronDown size={16} /> : <ChevronUp size={16} />}
            <span className="text-[10px] font-medium tracking-wide uppercase">
              {bottomBarExpanded ? "Hide controls" : "Session controls"}
            </span>
          </div>
        </button>

        {/* Mobile Layout - Compact 2x2 Grid */}
        <div className="flex md:hidden flex-col gap-2.5 px-3 pb-[calc(10px+env(safe-area-inset-bottom))]">
          {bottomBarExpanded && (
          <div className="grid grid-cols-2 gap-x-2 gap-y-2.5">
            {/* Gap Between Routines */}
            <div className="flex flex-col items-center">
              <div className="text-[9px] font-medium tracking-wide text-white/50 uppercase mb-1">Gap</div>
              <div className="flex items-center rounded-lg border border-white/20 bg-white/5">
                <button onClick={() => updateGapSeconds((v) => Math.max(0, v - 5))} className="min-h-[40px] min-w-[40px] grid place-items-center text-white/70 active:bg-white/10 rounded-l-lg"><Minus size={14} /></button>
                <span className="px-2 py-1.5 text-sm font-bold text-white border-x border-white/15 min-w-[40px] text-center">{gapSeconds}s</span>
                <button onClick={() => updateGapSeconds((v) => Math.min(120, v + 5))} className="min-h-[40px] min-w-[40px] grid place-items-center text-white/70 active:bg-white/10 rounded-r-lg"><Plus size={14} /></button>
              </div>
            </div>

            {/* Back to Back */}
            <div className="flex flex-col items-center">
              <div className="text-[9px] font-medium tracking-wide text-white/50 uppercase mb-1">B2B</div>
              <button 
                onClick={() => updateBackToBack((v) => !v)}
                className="flex items-center gap-1.5 min-h-[40px] px-1"
              >
                <div className={`grid h-7 w-7 shrink-0 place-items-center rounded-full border ${backToBack ? "border-pink-500 text-pink-500" : "border-pink-500/50 text-pink-500/50"}`}>
                  <RefreshCw size={13} />
                </div>
                <div className={`h-6 w-10 rounded-full border p-0.5 transition-colors ${
                  backToBack ? "border-pink-500 bg-pink-500/30" : "border-white/25 bg-white/10"
                }`}>
                  <div className={`h-5 w-5 rounded-full transition-transform ${
                    backToBack ? "translate-x-4 bg-pink-500" : "translate-x-0 bg-white/40"
                  }`} />
                </div>
              </button>
            </div>

            {/* Total Session Time */}
            <div className="flex flex-col items-center">
              <div className="text-[9px] font-medium tracking-wide text-white/50 uppercase mb-1">Time</div>
              <div className="flex items-center gap-1.5 min-h-[40px]">
                <div className="grid h-7 w-7 shrink-0 place-items-center rounded-full border border-cyan-400 text-cyan-400">
                  <Clock size={13} />
                </div>
                <div className="text-white text-base font-bold leading-none">{formatSessionTime(totalSessionSeconds)}</div>
              </div>
            </div>

            {/* Repeats */}
            <div className="flex flex-col items-center">
              <div className="text-[9px] font-medium tracking-wide text-white/50 uppercase mb-1">Reps</div>
              <div className="flex items-center rounded-lg border border-white/20 bg-white/5">
                <button onClick={() => updatePlaylistRepeats((v) => Math.max(1, v - 1))} className="min-h-[40px] min-w-[40px] grid place-items-center text-white/70 active:bg-white/10 rounded-l-lg"><Minus size={14} /></button>
                <span className="px-2 py-1.5 text-sm font-bold text-white border-x border-white/15 min-w-[34px] text-center">{playlistRepeats}x</span>
                <button onClick={() => updatePlaylistRepeats((v) => Math.min(20, v + 1))} className="min-h-[40px] min-w-[40px] grid place-items-center text-white/70 active:bg-white/10 rounded-r-lg"><Plus size={14} /></button>
              </div>
            </div>
          </div>
          )}

          {/* Session Button — always visible, even when collapsed */}
          <button
            onClick={handlePauseClick}
            disabled={!currentTrack && playlist.length === 0}
            className={`w-full min-h-[48px] py-3 text-base font-bold rounded-xl transition disabled:opacity-30 ${
              isGapPaused
                ? "bg-gradient-to-r from-cyan-500 to-blue-500 text-white shadow-lg shadow-cyan-500/30"
                : isPlaying
                  ? "bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-lg shadow-orange-500/30"
                  : "bg-gradient-to-r from-[#ff4fa3] to-[#ff8a00] text-white shadow-lg shadow-[#ff4fa3]/30"
            }`}
          >
            {isGapPaused ? `GAP ${gapCountdown}s` : isPlaying ? "Pause Session" : sessionRunning ? "Resume Session" : "Start Session"}
          </button>
        </div>

        {/* Desktop Layout - Original horizontal flex */}
        <div className="hidden md:flex flex-wrap items-center justify-start gap-4 px-4 py-2">
          {/* Gap Between Routines */}
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-white text-white">
              <Users size={18} />
            </div>
            <div>
              <div className="text-[10px] font-medium tracking-wide text-white/80">GAP BETWEEN ROUTINES</div>
              <div className="mt-0.5 flex items-center rounded border border-white/20 bg-white/5">
                <button 
                  onClick={() => updateGapSeconds((v) => Math.max(0, v - 5))}
                  className="px-2.5 py-1 text-white/90 hover:text-white"
                >
                  <Minus size={14} />
                </button>
                <div className="border-x border-white/15 px-4 py-1 text-base font-semibold text-white">{gapSeconds} sec</div>
                <button 
                  onClick={() => updateGapSeconds((v) => Math.min(120, v + 5))}
                  className="px-2.5 py-1 text-white/90 hover:text-white"
                >
                  <Plus size={14} />
                </button>
              </div>
            </div>
          </div>

          {/* Back To Back */}
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-pink-500 text-pink-500">
              <RefreshCw size={18} />
            </div>
            <div>
              <div className="text-[10px] font-medium tracking-wide text-white/80">BACK TO BACK</div>
              <div className="mt-0.5 flex items-center gap-2">
                <button 
                  onClick={() => updateBackToBack((v) => !v)}
                  className="flex items-center gap-1.5"
                >
                  <span className="text-xs font-medium text-white">{backToBack ? "On" : "Off"}</span>
                  <div className={`h-5 w-10 rounded-full border p-0.5 transition-colors duration-200 ${
                    backToBack 
                      ? "border-pink-500 bg-pink-500/30" 
                      : "border-white/25 bg-white/15"
                  }`}>
                    <div className={`h-4 w-4 rounded-full transition-transform duration-200 ${
                      backToBack 
                        ? "translate-x-5 bg-pink-500" 
                        : "translate-x-0 bg-white/50"
                    }`} />
                  </div>
                </button>
              </div>
            </div>
          </div>

          {/* Total Session Time */}
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-orange-400 text-orange-400">
              <Clock size={20} />
            </div>
            <div>
              <div className="text-[10px] font-medium tracking-wide text-white/80">TOTAL SESSION TIME</div>
              <div className="text-white text-xl font-bold leading-tight">{formatSessionTime(totalSessionSeconds)}</div>
            </div>
          </div>

          {/* Repeat Playlist */}
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-cyan-400 text-cyan-400">
              <Repeat size={18} />
            </div>
            <div>
              <div className="text-[10px] font-medium tracking-wide text-white/80">REPEAT PLAYLIST</div>
              <div className="mt-0.5 flex items-center rounded border border-cyan-400/30 bg-cyan-400/5">
                <button
                  onClick={() => updatePlaylistRepeats((v) => Math.max(1, v - 1))}
                  className="px-2.5 py-1 text-cyan-300 hover:text-cyan-100 transition"
                >
                  <Minus size={14} />
                </button>
                <div className="border-x border-cyan-400/20 px-4 py-1 text-base font-semibold text-white">
                  {playlistRepeats === 1 ? "Off" : `${playlistRepeats}x`}
                </div>
                <button
                  onClick={() => updatePlaylistRepeats((v) => Math.min(99, v + 1))}
                  className="px-2.5 py-1 text-cyan-300 hover:text-cyan-100 transition"
                >
                  <Plus size={14} />
                </button>
              </div>
            </div>
          </div>

          {/* Start Session */}
          <button 
            onClick={toggleSession}
            disabled={!currentTrack && playlist.length === 0}
            className={`h-[52px] min-w-[160px] rounded-xl text-sm font-bold transition disabled:opacity-40 disabled:cursor-not-allowed ${
              isGapPaused
                ? "bg-white/10 border border-white/30 text-white animate-pulse"
                : isPlaying
                  ? "bg-[#ff8a00]/15 border border-[#ff8a00]/50 text-[#ff4fa3] hover:bg-[#ff8a00]/25"
                  : sessionRunning && !isPlaying
                    ? "bg-cyan-500/15 border border-cyan-400/50 text-cyan-400 hover:bg-cyan-500/25"
                    : "bg-gradient-to-r from-pink-500 to-orange-500 text-white hover:opacity-90 shadow-[0_0_20px_rgba(255,79,179,0.25)]"
            }`}
          >
            {isGapPaused ? (
              <span className="text-sm font-black tabular-nums countdown-flash" key={gapCountdown}>{gapCountdown}</span>
            ) : isPlaying ? "Pause Session" : sessionRunning ? "Resume Session" : "Start Session"}
          </button>
        </div>
      </div>

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-[140px] left-1/2 -translate-x-1/2 z-[60] px-6 py-3 rounded-xl bg-cyan-500/20 border border-cyan-400/50 text-cyan-300 text-sm font-medium backdrop-blur-md animate-in fade-in slide-in-from-bottom-4 duration-300">
          {toastMessage}
        </div>
      )}

      {/* Stop/Pause Session Confirmation Modal */}
      {showStopConfirm && (
        <div className="eqho-dialog fixed inset-0 z-[400] flex items-center justify-center bg-black/70 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-2xl border border-orange-500/30 bg-[#090f1c] p-6 shadow-2xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-full bg-orange-500/20 flex items-center justify-center">
                <AlertTriangle size={24} className="text-orange-400" />
              </div>
              <h3 className="text-xl font-bold text-white">Pause Session?</h3>
            </div>
            <p className="text-white/60 mb-6">
              Are you sure you want to pause the current session? The routine will stop playing.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={cancelPauseSession}
                className="px-5 py-2.5 rounded-xl border border-white/20 text-white/80 hover:bg-white/10 transition"
              >
                Continue Playing
              </button>
              <button
                onClick={confirmPauseSession}
                className="px-5 py-2.5 rounded-xl bg-orange-500 text-white font-bold hover:bg-orange-600 transition"
              >
                Pause Session
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Playlist Modal */}
      {showPlaylistModal && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-white/15 bg-[#090f1c] p-6 shadow-2xl">
            <h3 className="text-xl font-bold text-white mb-4">Create New Playlist</h3>
            <input
              type="text"
              value={newPlaylistName}
              onChange={(e) => setNewPlaylistName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && createPlaylist()}
              placeholder="Enter playlist name..."
              className="w-full rounded-xl border border-white/20 bg-white/5 px-4 py-3 text-white placeholder:text-white/40 focus:border-pink-500 focus:outline-none"
              autoFocus
            />
            <div className="mt-6 flex gap-3 justify-end">
              <button
                onClick={() => setShowPlaylistModal(false)}
                className="px-5 py-2.5 rounded-xl border border-white/20 text-white/80 hover:bg-white/10 transition"
              >
                Cancel
              </button>
              <button
                onClick={createPlaylist}
                disabled={!newPlaylistName.trim()}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-pink-500 to-orange-500 text-white font-bold hover:opacity-90 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Create Playlist
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
