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
import { clearCachedPlaylist, saveSavedPlaylistsWithTracks, getSavedPlaylistsWithTracks, saveCurrentPlaylistWithFiles, getCurrentPlaylistWithFiles } from "@/lib/eqho-db";
import { createClient } from "@/lib/supabase/client";
import { isV0Preview, mockUser } from "@/lib/utils/preview";
import { 
  fetchCloudPlaylists, 
  fetchPlaylistWithFiles, 
  syncPlaylistToCloud, 
  deleteCloudPlaylist,
  isCloudSyncAvailable,
  checkProStatus,
  type CloudPlaylist,
  type SyncStatus 
} from "@/lib/cloud-sync";
import { useRouter } from "next/navigation";
import type { User } from "@supabase/supabase-js";
import { ProBadge } from "@/components/pro-badge";
import { useSubscription } from "@/lib/subscription-context";
import { getTrialDaysRemaining, formatTrialEndDate } from "@/lib/subscription-types";
import { deleteAccount } from "@/app/actions/account";
import Link from "next/link";
import {
  Home,
  ListMusic,
  Music,
  Music2,
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

export default function Page() {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [activePage, setActivePage] = useState("player");
  const { isPro, isTrialing, profile, isLoading: isSubscriptionLoading } = useSubscription();

  // Sidebar navigation items (desktop only)
  const sidebarItems = [
    { icon: Home, page: "player", color: "pink" },
    { icon: ListMusic, page: "playlists", color: "pink" },
    { icon: Settings, page: "settings", color: "pink" },
  ] as const;

  const activeColors: Record<string, string> = {
    pink: "text-[#ff4fa3] bg-gradient-to-r from-[#ff4fa3]/15 to-[#ff8a00]/10",
  };

  // Mobile tab state
  const [mobileTab, setMobileTab] = useState<"nowplaying" | "playlists" | "settings">("nowplaying");

  const [playlistRepeats, setPlaylistRepeats] = useState(1);
  const [gapSeconds, setGapSeconds] = useState(10);
  const [backToBack, setBackToBack] = useState(false);
  const [backToBackPlayed, setBackToBackPlayed] = useState(false); // true if current track already played its b2b repeat
  const [playlistRound, setPlaylistRound] = useState(1); // which repeat round we're on (1-based)
  const [finishedTracks, setFinishedTracks] = useState<Set<string>>(new Set()); // track IDs fully finished across all repeats
  const [isGapPaused, setIsGapPaused] = useState(false);
  const [gapCountdown, setGapCountdown] = useState(0);
  const gapCallbackRef = useRef<(() => void) | null>(null);
  const [currentPlaylistName, setCurrentPlaylistName] = useState("Untitled Playlist");
  const [dropMessage, setDropMessage] = useState("");
  const [uploadedTracks, setUploadedTracks] = useState<Track[]>([]);
  const [playlist, setPlaylist] = useState<Track[]>([]);
  const [originalPlaylistOrder, setOriginalPlaylistOrder] = useState<Track[]>([]); // Store original order when first loaded
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(80);
  const [isMuted, setIsMuted] = useState(false);
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
  const router = useRouter();
  const supabase = createClient();
  const [currentTrack, setCurrentTrack] = useState<Track | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const fullscreenRef = useRef<HTMLDivElement>(null);
  const [showPauseConfirm, setShowPauseConfirm] = useState(false);
  const [showMuteConfirm, setShowMuteConfirm] = useState(false);
  const [showSkipBackConfirm, setShowSkipBackConfirm] = useState(false);
  const [showSkipForwardConfirm, setShowSkipForwardConfirm] = useState(false);
  const [showSessionFinished, setShowSessionFinished] = useState(false);
  const [showFullscreenQueuePlaylist, setShowFullscreenQueuePlaylist] = useState(false);
  const [showClearPlaylistConfirm, setShowClearPlaylistConfirm] = useState(false);
  const [showDeleteAccountConfirm, setShowDeleteAccountConfirm] = useState(false);
  const [deleteAccountLoading, setDeleteAccountLoading] = useState(false);
  const [showSendToSessionConfirm, setShowSendToSessionConfirm] = useState<{ name: string; tracks: Track[] } | null>(null);
  const [showRemoveTrackConfirm, setShowRemoveTrackConfirm] = useState<{ track: Track; originalIndex: number } | null>(null);

  // Cloud sync state
  const isMobileBuild = process.env.NEXT_PUBLIC_BUILD_TARGET === 'mobile';
  const [cloudPlaylists, setCloudPlaylists] = useState<CloudPlaylist[]>([]);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>('idle');
  const [syncingPlaylistId, setSyncingPlaylistId] = useState<string | null>(null);
  const [showDeletePlaylistConfirm, setShowDeletePlaylistConfirm] = useState<{ id: string; name: string } | null>(null);
  const [downloadingPlaylistId, setDownloadingPlaylistId] = useState<string | null>(null);
  const [showFullscreenMobilePlayer, setShowFullscreenMobilePlayer] = useState(false);

  // Session-only hidden tracks (does not affect saved playlists or cloud)
  const [hiddenTrackIds, setHiddenTrackIds] = useState<Set<string>>(new Set());
  
  // Computed: visible tracks in current session (filters out hidden)
  const visiblePlaylist = playlist.filter(track => !hiddenTrackIds.has(track.id));
  
  // Get the visible index for a track (for display numbering)
  const getVisibleIndex = (trackId: string) => visiblePlaylist.findIndex(t => t.id === trackId);

  // Fetch user on mount
  useEffect(() => {
    // V0 Preview: use mock user, do not call Supabase
    if (isV0Preview) {
      setUser(mockUser as unknown as User);
      return;
    }
    
    if (!supabase) return;
    
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
    };
    getUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, [supabase]);

  // Stripe Payment Link with 30-day free trial
  const STRIPE_PAYMENT_LINK = 'https://buy.stripe.com/bJefZbeVz4nu9s32RT3F602';

  // Check subscription status and redirect to Stripe if needed
  useEffect(() => {
    // Skip in V0 preview mode
    if (isV0Preview) return;
    
    // Wait for user to be loaded
    if (!supabase || !user) return;
    
    const checkSubscription = async () => {
      const { data: profile } = await supabase
        .from('profiles')
        .select('subscription_status')
        .eq('user_id', user.id)
        .single();
      
      console.log('[v0] Main app - Subscription check:', { userId: user.id, profile });
      
      // User needs subscription if subscription_status is not active/trialing/past_due
      const hasActiveSubscription = profile?.subscription_status && 
        ['active', 'trialing', 'past_due'].includes(profile.subscription_status);
      
      if (!hasActiveSubscription) {
        console.log('[v0] Main app - No active subscription, redirecting to Stripe');
        // Redirect to Stripe Payment Link for free trial
        const paymentUrl = new URL(STRIPE_PAYMENT_LINK);
        paymentUrl.searchParams.set('client_reference_id', user.id);
        paymentUrl.searchParams.set('prefilled_email', user.email || '');
        window.location.href = paymentUrl.toString();
      }
    };
    
    checkSubscription();
  }, [supabase, user]);

  const handleLogout = async () => {
    if (!supabase) return;
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
  };

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

  // Keep currentTrack synced with playlist[currentIndex]
  useEffect(() => {
    if (playlist.length > 0 && currentIndex >= 0 && currentIndex < playlist.length) {
      setCurrentTrack(playlist[currentIndex]);
    }
  }, [currentIndex, playlist]);

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

  const trackProgress =
    trackDuration > 0 ? (currentTime / trackDuration) * 100 : 0;

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
  const [draggedTrackIndex, setDraggedTrackIndex] = useState<number | null>(null);
  const [dropTargetIndex, setDropTargetIndex] = useState<number | null>(null);
  const [dropPosition, setDropPosition] = useState<"above" | "below">("below");
  const dropPositionRef = useRef<"above" | "below">("below");

  // Save saved playlists to IndexedDB when they change (with full track data)
  useEffect(() => {
    if (savedPlaylists.length > 0) {
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
    }
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
  const handleSyncPlaylistToCloud = async (playlistId: string) => {
    if (isMobileBuild) return; // Read-only on mobile
    
    const localPlaylist = savedPlaylists.find(p => p.id === playlistId);
    if (!localPlaylist) return;

    setSyncingPlaylistId(playlistId);
    setSyncStatus('syncing');

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

      if (result.success) {
        setSyncStatus('success');
        // Refresh cloud playlists
        const playlists = await fetchCloudPlaylists();
        setCloudPlaylists(playlists);
      } else {
        setSyncStatus('error');
      }
    } catch (error) {
      console.error("Sync failed:", error);
      setSyncStatus('error');
    } finally {
      setTimeout(() => {
        setSyncingPlaylistId(null);
        setSyncStatus('idle');
      }, 2000);
    }
  };

  const handleDeleteCloudPlaylist = async (playlistId: string) => {
    if (isMobileBuild) return; // Read-only on mobile

    const success = await deleteCloudPlaylist(playlistId);
    if (success) {
      setCloudPlaylists(prev => prev.filter(p => p.id !== playlistId));
      // Also remove from local if exists
      setSavedPlaylists(prev => prev.filter(p => p.id !== playlistId));
    }
    setShowDeletePlaylistConfirm(null);
  };

  const handleDownloadCloudPlaylist = async (playlistId: string) => {
    setDownloadingPlaylistId(playlistId);

    try {
      const localPlaylist = await fetchPlaylistWithFiles(playlistId);
      if (localPlaylist) {
        // Convert to the format expected by savedPlaylists
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
      }
    } catch (error) {
      console.error("Download failed:", error);
    } finally {
      setDownloadingPlaylistId(null);
    }
  };

  useEffect(() => {
    const preventBrowserFileOpen = (event: DragEvent) => {
      event.preventDefault();
      event.stopPropagation();
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
    if (!items || items.length === 0) return;

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

    // Process folders as playlists - add to savedPlaylists
    for (const folder of folderEntries) {
      const audioFiles = await getAudioFilesFromDirectory(folder.entry);
      if (audioFiles.length > 0) {
        await createPlaylistFromFiles(folder.name, audioFiles);
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

  const togglePlayPause = async (track: Track) => {
    if (!audioRef.current || !track || !track.url) return;

    const sameTrack = currentTrack?.id === track.id;

    try {
      if (sameTrack && isPlaying) {
        audioRef.current.pause();
        setIsPlaying(false);
        return;
      }

      if (!sameTrack) {
        const trackIndex = playlist.findIndex((t) => t.id === track.id);
        audioRef.current.src = track.url;
        setCurrentTrack(track);
        if (trackIndex >= 0) setCurrentIndex(trackIndex);
      }

      await audioRef.current.play();
      setIsPlaying(true);
    } catch (error) {
      console.error("Playback failed:", error);
      setIsPlaying(false);
    }
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
            audioRef.current.play();
            setIsPlaying(true);
          }
        }
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentTrack, isPlaying]);

  const handleUploadedTrackPlayPause = async (track: Track) => {
    if (!audioRef.current || !track?.url) return;

    const isSameTrack = currentTrack?.id === track.id;

    try {
      if (isSameTrack && isPlaying) {
        audioRef.current.pause();
        setIsPlaying(false);
        return;
      }

      if (!isSameTrack) {
        audioRef.current.src = track.url;
        setCurrentTrack(track);
      }

      await audioRef.current.play();
      setIsPlaying(true);
    } catch (error) {
      console.error("Track play failed:", error);
      setIsPlaying(false);
    }
  };

  const toggleSession = async () => {
    if (!audioRef.current) return;

    // If playing, show confirmation before pausing
    if (isPlaying) {
      setShowStopConfirm(true);
      return;
    }

    // Check if all tracks are finished - need to restart fresh
    const allTracksFinished = finishedTracks.size === playlist.length && playlist.length > 0;
    
    // If paused with a current track loaded AND not all finished, resume
    if (currentTrack && currentTrack.url && !allTracksFinished) {
      // Only re-set the source if it's different (track changed while paused)
      // Otherwise just resume from current position
      if (audioRef.current.src !== currentTrack.url) {
        audioRef.current.src = currentTrack.url;
      }
      try {
        await audioRef.current.play();
        setIsPlaying(true);
        setSessionRunning(true);
      } catch (error) {
        console.error("Playback failed:", error);
      }
      return;
    }

    // No track loaded yet OR all tracks finished - start from first track in playlist
    if (playlist.length > 0) {
      const firstTrack = playlist[0];
      if (!firstTrack.url) return;
      // Reset session tracking
      setPlaylistRound(1);
      setBackToBackPlayed(false);
      setFinishedTracks(new Set());
      setIsGapPaused(false);
      setGapCountdown(0);
      setShowSessionFinished(false);
      audioRef.current.src = firstTrack.url;
      setCurrentTrack(firstTrack);
      setCurrentIndex(0);
      try {
        await audioRef.current.play();
        setIsPlaying(true);
        setSessionRunning(true);
      } catch (error) {
        console.error("Playback failed:", error);
      }
    }
  };

  const confirmPauseSession = () => {
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

  // Hide track from current session only (does not affect saved playlist or cloud)
  const hideTrackFromSession = (trackId: string) => {
    const track = playlist.find(t => t.id === trackId);
    if (!track) return;
    
    // If this track is currently playing, stop and move to next visible track
    if (currentTrack?.id === trackId) {
      if (audioRef.current) {
        audioRef.current.pause();
        setIsPlaying(false);
      }
      
      // Find next visible track after current index (excluding the one being hidden)
      const currentIdx = playlist.findIndex(t => t.id === trackId);
      let nextVisibleIdx = -1;
      for (let i = currentIdx + 1; i < playlist.length; i++) {
        if (!hiddenTrackIds.has(playlist[i].id) && playlist[i].id !== trackId) {
          nextVisibleIdx = i;
          break;
        }
      }
      
      if (nextVisibleIdx >= 0) {
        setCurrentIndex(nextVisibleIdx);
        const nextTrack = playlist[nextVisibleIdx];
        setCurrentTrack(nextTrack);
        // Auto-play the next track
        if (audioRef.current && nextTrack) {
          audioRef.current.src = nextTrack.url;
          audioRef.current.play().then(() => {
            setIsPlaying(true);
          }).catch(() => {
            setIsPlaying(false);
          });
        }
      } else {
        // No more visible tracks after, try from beginning
        let firstVisibleIdx = -1;
        for (let i = 0; i < currentIdx; i++) {
          if (!hiddenTrackIds.has(playlist[i].id) && playlist[i].id !== trackId) {
            firstVisibleIdx = i;
            break;
          }
        }
        
        if (firstVisibleIdx >= 0) {
          setCurrentIndex(firstVisibleIdx);
          const firstTrack = playlist[firstVisibleIdx];
          setCurrentTrack(firstTrack);
          if (audioRef.current && firstTrack) {
            audioRef.current.src = firstTrack.url;
            audioRef.current.play().then(() => {
              setIsPlaying(true);
            }).catch(() => {
              setIsPlaying(false);
            });
          }
        } else {
          // No visible tracks left, stop session
          setCurrentTrack(null);
          setSessionRunning(false);
        }
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
    
    // Find next non-hidden track
    let nextIdx = currentIndex + 1;
    while (nextIdx < playlist.length && hiddenTrackIds.has(playlist[nextIdx].id)) {
      nextIdx++;
    }
    
    if (nextIdx < playlist.length) {
      setCurrentIndex(nextIdx);
      const nextTrack = playlist[nextIdx];
      setCurrentTrack(nextTrack);
      if (audioRef.current && nextTrack) {
        audioRef.current.src = nextTrack.url;
        // Autoplay when skipping forward
        audioRef.current.play().then(() => {
          setIsPlaying(true);
        }).catch((err) => {
          console.error('Autoplay failed:', err);
          setIsPlaying(false);
        });
      }
    } else {
      // On last visible track - check if we need to repeat or end session
      if (playlistRound < playlistRepeats) {
        // More rounds to go - increment round and restart from first visible track
        setPlaylistRound((r) => r + 1);
        
        // Find first non-hidden track
        let firstVisibleIdx = 0;
        while (firstVisibleIdx < playlist.length && hiddenTrackIds.has(playlist[firstVisibleIdx].id)) {
          firstVisibleIdx++;
        }
        
        if (firstVisibleIdx < playlist.length) {
          setCurrentIndex(firstVisibleIdx);
          const firstTrack = playlist[firstVisibleIdx];
          setCurrentTrack(firstTrack);
          if (audioRef.current && firstTrack) {
            audioRef.current.src = firstTrack.url;
            audioRef.current.play().then(() => {
              setIsPlaying(true);
            }).catch((err) => {
              console.error('Autoplay failed:', err);
              setIsPlaying(false);
            });
          }
        } else {
          // All tracks hidden, end session
          setFinishedTracks(new Set(playlist.map((t) => t.id)));
          setIsPlaying(false);
          setSessionRunning(false);
          setPlaylistRound(1);
          setShowSessionFinished(true);
          if (audioRef.current) {
            audioRef.current.pause();
          }
        }
      } else {
        // All rounds complete - end session
        setFinishedTracks(new Set(playlist.map((t) => t.id)));
        setIsPlaying(false);
        setSessionRunning(false);
        setPlaylistRound(1);
        setShowSessionFinished(true);
        if (audioRef.current) {
          audioRef.current.pause();
        }
      }
    }
  };

  const goToPreviousTrack = () => {
    if (playlist.length === 0 || !audioRef.current) return;
    
    // If within first 2 seconds and not on first track, go to previous track
    if (audioRef.current.currentTime < 2 && currentIndex > 0) {
      const prevIdx = currentIndex - 1;
      setCurrentIndex(prevIdx);
      const prevTrack = playlist[prevIdx];
      setCurrentTrack(prevTrack);
      if (prevTrack) {
        audioRef.current.src = prevTrack.url;
        audioRef.current.play().then(() => {
          setIsPlaying(true);
        }).catch((err) => {
          console.error('Autoplay failed:', err);
          setIsPlaying(false);
        });
      }
    } else {
      // Otherwise, reset current track to beginning and autoplay
      audioRef.current.currentTime = 0;
      audioRef.current.play().then(() => {
        setIsPlaying(true);
      }).catch((err) => {
        console.error('Autoplay failed:', err);
        setIsPlaying(false);
      });
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
  const hiddenTrackIdsRef = useRef(hiddenTrackIds);
  hiddenTrackIdsRef.current = hiddenTrackIds;

  // Wire up audio element events for real-time tracking and auto-advance
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
    };

    const handleLoadedMetadata = () => {
      setTrackDuration(audio.duration || 0);
    };

    const handleEnded = () => {
      const _backToBack = backToBackRef.current;
      const _backToBackPlayed = backToBackPlayedRef.current;
      const _gapSeconds = gapSecondsRef.current;
      const _playlistRepeats = playlistRepeatsRef.current;
      const _playlistRound = playlistRoundRef.current;
      const _currentIndex = currentIndexRef.current;
      const _playlist = playlistRef.current;
      const _hiddenTrackIds = hiddenTrackIdsRef.current;

      const playAfterGap = (playFn: () => void) => {
        if (_gapSeconds > 0) {
          setIsPlaying(false);
          setIsGapPaused(true);
          setGapCountdown(_gapSeconds);
          lastBeepedCountdown.current = -1; // Reset beep tracking for new countdown
          gapCallbackRef.current = playFn;
        } else {
          playFn();
        }
      };

      // Back-to-back: repeat the same track once before advancing
      if (_backToBack && !_backToBackPlayed) {
        setBackToBackPlayed(true);
        audio.currentTime = 0;
        playAfterGap(() => {
          audio.play().then(() => {
            setIsPlaying(true);
          }).catch(() => {
            setIsPlaying(false);
          });
        });
        return;
      }
      setBackToBackPlayed(false);

      // Find next non-hidden track
      let nextIdx = _currentIndex + 1;
      while (nextIdx < _playlist.length && _hiddenTrackIds.has(_playlist[nextIdx].id)) {
        nextIdx++;
      }

      // There's a next visible track in the playlist
      if (nextIdx < _playlist.length) {
        playAfterGap(() => {
          const nextTrack = _playlist[nextIdx];
          setCurrentIndex(nextIdx);
          setCurrentTrack(nextTrack);
          if (nextTrack?.url) {
            audio.src = nextTrack.url;
            audio.play().then(() => {
              setIsPlaying(true);
            }).catch(() => {
              setIsPlaying(false);
            });
          }
        });
      } else {
        // End of playlist - check if we need to repeat
        if (_playlistRound < _playlistRepeats) {
          setPlaylistRound((r) => r + 1);

          // Find first non-hidden track for repeat
          let firstVisibleIdx = 0;
          while (firstVisibleIdx < _playlist.length && _hiddenTrackIds.has(_playlist[firstVisibleIdx].id)) {
            firstVisibleIdx++;
          }

          if (firstVisibleIdx < _playlist.length) {
            playAfterGap(() => {
              const firstTrack = _playlist[firstVisibleIdx];
              setCurrentIndex(firstVisibleIdx);
              setCurrentTrack(firstTrack);
              if (firstTrack?.url) {
                audio.src = firstTrack.url;
                audio.play().then(() => {
                  setIsPlaying(true);
                }).catch(() => {
                  setIsPlaying(false);
                });
              }
            });
          } else {
            // All tracks are hidden, end session
            setFinishedTracks(new Set(_playlist.map((t) => t.id)));
            setIsPlaying(false);
            setSessionRunning(false);
            setPlaylistRound(1);
            setShowSessionFinished(true);
          }
        } else {
          // All repeats done - mark all tracks as finished
          setFinishedTracks(new Set(_playlist.map((t) => t.id)));
          setIsPlaying(false);
          setSessionRunning(false);
          setPlaylistRound(1);
          setShowSessionFinished(true);
        }
      }
    };

    audio.addEventListener("timeupdate", handleTimeUpdate);
    audio.addEventListener("loadedmetadata", handleLoadedMetadata);
    audio.addEventListener("ended", handleEnded);

    return () => {
      audio.removeEventListener("timeupdate", handleTimeUpdate);
      audio.removeEventListener("loadedmetadata", handleLoadedMetadata);
      audio.removeEventListener("ended", handleEnded);
    };
  }, []);

  // Sync volume and mute state with audio element
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = isMuted ? 0 : volume / 100;
    }
  }, [volume, isMuted]);

  // Futuristic beep sound for countdown
  const lastBeepedCountdown = useRef<number>(-1);
  const playBeep = useCallback((frequency: number = 880, duration: number = 100) => {
    try {
      const audioContext = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator.frequency.value = frequency;
      oscillator.type = "sine";
      
      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration / 1000);
      
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + duration / 1000);
    } catch (e) {
      // Audio context not supported
    }
  }, []);

  // Gap countdown ticker - ticks every second and auto-plays when reaching 0
  useEffect(() => {
    if (!isGapPaused || gapCountdown <= 0) {
      if (isGapPaused && gapCountdown <= 0 && gapCallbackRef.current) {
        const cb = gapCallbackRef.current;
        gapCallbackRef.current = null;
        setIsGapPaused(false);
        lastBeepedCountdown.current = -1; // Reset beep tracking
        cb();
      }
      return;
    }
    
    // Play beep on final 3 seconds - only if we haven't beeped this second yet
    if (gapCountdown <= 3 && gapCountdown > 0 && lastBeepedCountdown.current !== gapCountdown) {
      lastBeepedCountdown.current = gapCountdown;
      const freq = gapCountdown === 3 ? 660 : gapCountdown === 2 ? 880 : 1100;
      playBeep(freq, 150);
    }
    
    const timer = setTimeout(() => {
      setGapCountdown((prev) => prev - 1);
    }, 1000);
    return () => clearTimeout(timer);
  }, [isGapPaused, gapCountdown, playBeep]);

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
  });

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
    if (isPlaying && !isGapPaused && settings.showPauseWarning) {
      setShowPauseConfirm(true);
    } else {
      toggleSession();
    }
  };

  // Handler for skip back button with warning check
  const handleSkipBackClick = () => {
    if (isPlaying && !isGapPaused && settings.showSkipWarning) {
      setShowSkipBackConfirm(true);
    } else {
      goToPreviousTrack();
    }
  };

  // Handler for skip forward button with warning check
  const handleSkipForwardClick = () => {
    if (isPlaying && !isGapPaused && settings.showSkipWarning) {
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
    setBackToBack((prev) => {
      const val = typeof newValue === "function" ? newValue(prev) : newValue;
      setSettings((s) => ({ ...s, backToBack: val }));
      return val;
    });
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

  return (
    <div className="h-screen w-screen max-w-[100vw] overflow-hidden bg-[#050814] text-white">
      {/* Ambient background glow effects */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute -top-1/4 -left-1/4 w-1/2 h-1/2 bg-gradient-to-br from-[#ff4fa3]/6 to-transparent rounded-full blur-3xl" />
        <div className="absolute -bottom-1/4 -right-1/4 w-1/2 h-1/2 bg-gradient-to-tl from-[#ff8a00]/6 to-transparent rounded-full blur-3xl" />
      </div>
      
      <audio
        ref={audioRef}
      />

      {/* Fullscreen Mode View */}
      <div
        ref={fullscreenRef}
        className={`${isFullscreen ? 'flex' : 'hidden'} fixed inset-0 z-[100] bg-[#090f1c] text-white`}
      >
        {/* Safety Confirmation Dialogs */}
        {showPauseConfirm && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/70">
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
          <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/70">
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

        {showSkipBackConfirm && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/70">
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
                    // Small delay to ensure state update completes
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

        {showSkipForwardConfirm && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/70">
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
                    // Small delay to ensure state update completes
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

        {/* Queue Playlist Modal */}
        {showFullscreenQueuePlaylist && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/70">
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
          <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/70">
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
          <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/70">
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
          <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/70">
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
                  }}
                  className="px-6 py-3 rounded-xl bg-gradient-to-r from-[#ff4fa3] to-[#ff8a00] text-white font-bold hover:shadow-[0_0_20px_rgba(255,122,0,0.4)] transition"
                >
                  Yes, Replace
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Delete Playlist Confirmation */}
        {showDeletePlaylistConfirm && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/70">
            <div className="bg-[#090f1c]/90 backdrop-blur-xl border border-white/20 rounded-2xl p-8 max-w-md text-center shadow-[0_0_40px_rgba(0,0,0,0.5)]">
              <Trash2 size={48} className="mx-auto mb-4 text-red-500" />
              <h3 className="text-2xl font-bold text-white mb-2">Delete Playlist?</h3>
              <p className="text-white/60 mb-6">
                Delete &quot;{showDeletePlaylistConfirm.name}&quot;? This will remove the playlist and all its tracks permanently.
              </p>
              <div className="flex gap-4 justify-center">
                <button
                  onClick={() => setShowDeletePlaylistConfirm(null)}
                  className="px-6 py-3 rounded-xl border border-white/20 text-white hover:bg-white/10 transition"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    const playlistId = showDeletePlaylistConfirm.id;
                    // Delete from local
                    setSavedPlaylists(prev => prev.filter(p => p.id !== playlistId));
                    // Delete from cloud if exists
                    if (cloudPlaylists.some(cp => cp.id === playlistId)) {
                      handleDeleteCloudPlaylist(playlistId);
                    } else {
                      setShowDeletePlaylistConfirm(null);
                    }
                  }}
                  className="px-6 py-3 rounded-xl bg-red-600 text-white font-bold hover:bg-red-500 transition"
                >
                  Yes, Delete
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Remove Track Confirmation */}
        {showRemoveTrackConfirm && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/70">
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
                <div
                  className="relative flex items-center justify-center w-[120px] h-10 rounded-lg border border-white/10 bg-[#090f1c] cursor-pointer overflow-hidden"
                  onClick={(e) => {
                    const rect = e.currentTarget.getBoundingClientRect();
                    const x = e.clientX - rect.left;
                    const pct = Math.round(Math.max(0, Math.min(100, (x / rect.width) * 100)));
                    setVolume(pct);
                    if (pct > 0 && isMuted) setIsMuted(false);
                    if (pct === 0) setIsMuted(true);
                  }}
                >
                  <div
                    className="absolute left-0 top-0 bottom-0 bg-gradient-to-r from-pink-500/40 to-orange-500/30"
                    style={{ width: `${isMuted ? 0 : volume}%` }}
                  />
                  <span className="relative z-10 text-xs font-bold text-white">{isMuted ? "Muted" : `${volume}%`}</span>
                </div>
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
                    <span className="countdown-flash bg-gradient-to-r from-pink-500 to-orange-500 bg-clip-text text-transparent" key={gapCountdown}>
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
                  ? (() => {
                      const currentVisibleIdx = currentTrack ? visiblePlaylist.findIndex(t => t.id === currentTrack.id) : -1;
                      const nextTrack = visiblePlaylist[currentVisibleIdx + 1];
                      return nextTrack?.title || "End of Playlist";
                    })()
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
        const currentVisibleIdx = currentTrack ? visiblePlaylist.findIndex(t => t.id === currentTrack.id) : -1;
        return `Track ${currentVisibleIdx + 2} of ${visiblePlaylist.length}`;
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
                  if (!audioRef.current || trackDuration === 0) return;
                  const rect = e.currentTarget.getBoundingClientRect();
                  const x = e.clientX - rect.left;
                  const pct = x / rect.width;
                  audioRef.current.currentTime = pct * trackDuration;
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
                          ? "bg-gradient-to-t from-pink-500 to-orange-400"
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

                  return reordered.map(({ track, originalIndex }) => {
                    const colours = ["text-[#ff8a00]", "text-blue-500", "text-purple-400", "text-[#ff4fa3]", "text-cyan-400", "text-green-400"];
                    const colour = colours[originalIndex % colours.length];
                    const isActiveTrack = currentTrack?.id === track.id;
                    const isCompleted = originalIndex < currentIndex;
                    const isDropTarget = dropTargetIndex === originalIndex && draggedTrackIndex !== null;

                    return (
                      <div key={track.id} className="relative">
                        {isDropTarget && draggedTrackIndex !== null && dropPosition === "above" && (
                          <div className="absolute -top-[2px] left-0 right-0 h-[4px] bg-cyan-400 rounded-full z-10 shadow-[0_0_10px_rgba(34,211,238,0.6)]" />
                        )}
                        <div
                          draggable
                          onDragStart={(e) => {
                            setDraggedTrackIndex(originalIndex);
                            e.dataTransfer.effectAllowed = "move";
                            e.dataTransfer.setData("text/plain", originalIndex.toString());
                          }}
                          onDragEnd={() => {
                            setDraggedTrackIndex(null);
                            setDropTargetIndex(null);
                            setDropPosition("below");
                            dropPositionRef.current = "below";
                          }}
                          onDragOver={(e) => {
                            e.preventDefault();
                            e.dataTransfer.dropEffect = "move";
                            if (draggedTrackIndex !== null && draggedTrackIndex !== originalIndex) {
                              setDropTargetIndex(originalIndex);
                              const rect = e.currentTarget.getBoundingClientRect();
                              const midpoint = rect.top + rect.height / 2;
                              const position = e.clientY < midpoint ? "above" : "below";
                              setDropPosition(position);
                              dropPositionRef.current = position;
                            }
                          }}
                          onDragLeave={() => {
                            if (dropTargetIndex === originalIndex) {
                              setDropTargetIndex(null);
                            }
                          }}
                          onDrop={(e) => {
                            e.preventDefault();
                            if (draggedTrackIndex === null || draggedTrackIndex === originalIndex) return;
                            
                            const fromIndex = draggedTrackIndex;
                            const toIndex = originalIndex;
                            const position = dropPositionRef.current;
                            
                            setPlaylist((prev) => {
                              const newPlaylist = [...prev];
                              const [draggedItem] = newPlaylist.splice(fromIndex, 1);
                              let finalPosition: number;
                              
                              if (position === "above") {
                                finalPosition = fromIndex < toIndex ? toIndex - 1 : toIndex;
                              } else {
                                finalPosition = fromIndex < toIndex ? toIndex : toIndex + 1;
                              }
                              
                              newPlaylist.splice(finalPosition, 0, draggedItem);
                              return newPlaylist;
                            });
                            
                            setDraggedTrackIndex(null);
                            setDropTargetIndex(null);
                            setDropPosition("below");
                            dropPositionRef.current = "below";
                          }}
                          className={`flex items-center gap-2 p-2 rounded-lg mb-1.5 transition cursor-grab active:cursor-grabbing ${
                            isActiveTrack
                              ? "bg-gradient-to-r from-pink-500/20 to-orange-500/10 border border-pink-500/30"
                              : isCompleted
                              ? "opacity-50 bg-white/[0.02]"
                              : "bg-white/[0.03] hover:bg-white/[0.06]"
                          } ${draggedTrackIndex === originalIndex ? "opacity-50 scale-95" : ""}`}
                          onClick={() => {
                            setCurrentIndex(originalIndex);
                            togglePlayPause(track);
                          }}
                        >
                          <span className={`text-sm font-black w-6 ${colour}`}>{originalIndex + 1}</span>
                          <div className="flex-1 min-w-0">
                            <p className={`text-sm font-semibold truncate ${isActiveTrack ? colour : "text-white"}`}>
                              {track.title}
                            </p>
                            <p className="text-[10px] text-white/50">{formatDuration(track.durationSeconds)}</p>
                          </div>
                          {isActiveTrack && isPlaying && (
                            <div className="flex gap-0.5">
                              {[1, 2, 3].map((i) => (
                                <div key={i} className="w-0.5 bg-pink-500 rounded-full animate-pulse" style={{ height: `${8 + i * 3}px`, animationDelay: `${i * 0.1}s` }} />
                              ))}
                            </div>
                          )}
                          {isCompleted && <span className="text-[10px] text-white/40">Played</span>}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              hideTrackFromSession(track.id);
                            }}
                            className="ml-1 p-1.5 rounded-lg text-white/40 hover:text-orange-400 hover:bg-orange-500/15 active:bg-orange-500/25 transition"
                            title="Hide from this session"
                          >
                            <X size={14} />
                          </button>
                        </div>
                        {isDropTarget && draggedTrackIndex !== null && dropPosition === "below" && (
                          <div className="absolute -bottom-[2px] left-0 right-0 h-[4px] bg-cyan-400 rounded-full z-10 shadow-[0_0_10px_rgba(34,211,238,0.6)]" />
                        )}
                      </div>
                    );
                  });
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
        <div className="fixed inset-0 z-[300] flex flex-col bg-gradient-to-b from-[#0a0a1a] via-[#120a20] to-[#0a1020] safe-area-inset">
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
              <div key={gapCountdown} className={`font-black leading-none bg-gradient-to-br from-[#ff4fa3] via-[#ff6b6b] to-[#ff8a00] bg-clip-text text-transparent ${gapCountdown <= 3 ? 'text-[50vh]' : 'text-[30vh]'}`} style={{ animation: gapCountdown <= 3 ? 'countdownPulse 1s ease-out' : 'none' }}>
                {gapCountdown}
              </div>
              <div className="mt-4 text-center">
                <p className="text-white/60 text-sm uppercase tracking-widest mb-2">Up Next</p>
                <p className="text-xl font-bold text-white px-4">
                  {(() => {
                    const currentVisibleIdx = currentTrack ? visiblePlaylist.findIndex(t => t.id === currentTrack.id) : -1;
                    const nextTrack = visiblePlaylist[currentVisibleIdx + 1];
                    return nextTrack?.title || "End of Playlist";
                  })()}
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
            <button onClick={() => setShowFullscreenMobilePlayer(false)} className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center">
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

          {/* Main Content - Scrollable (only show when session is loaded) */}
          {(currentTrack || playlist.length > 0) && (
          <div className="flex-1 flex flex-col overflow-hidden px-4">
            {/* Session Remaining Timer - Large */}
            <div className="text-center py-4">
              <p className="text-[10px] text-white/40 uppercase tracking-widest mb-1">Session Remaining</p>
              <div className="text-5xl font-black tracking-tight tabular-nums leading-none">
                {isGapPaused ? (
                  <span className="countdown-flash bg-gradient-to-r from-pink-500 to-orange-500 bg-clip-text text-transparent" key={gapCountdown}>{gapCountdown}</span>
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
                  ? (() => {
                      const currentVisibleIdx = currentTrack ? visiblePlaylist.findIndex(t => t.id === currentTrack.id) : -1;
                      const nextTrack = visiblePlaylist[currentVisibleIdx + 1];
                      return nextTrack?.title || "End of Playlist";
                    })()
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
                      const currentVisibleIdx = currentTrack ? visiblePlaylist.findIndex(t => t.id === currentTrack.id) : -1;
                      return `Track ${currentVisibleIdx + 2} of ${visiblePlaylist.length}`;
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

            {/* Waveform Progress Bar */}
            <div
              className="relative flex h-10 w-full cursor-pointer items-end gap-[2px] rounded-xl border border-white/5 bg-white/[0.02] px-2 pb-2 pt-2 mb-3"
              onClick={(e) => {
                if (!audioRef.current || trackDuration === 0) return;
                const rect = e.currentTarget.getBoundingClientRect();
                const pct = (e.clientX - rect.left) / rect.width;
                audioRef.current.currentTime = pct * trackDuration;
              }}
            >
              {Array.from({ length: 50 }).map((_, i) => {
                const barProgress = (i / 50) * 100;
                const isPlayed = barProgress <= trackProgress;
                const heights = [40, 60, 80, 55, 70, 45, 85, 50, 65, 75];
                return (
                  <div key={i} className={`flex-1 rounded-sm transition-colors ${isPlayed ? "bg-gradient-to-t from-pink-500 to-orange-400" : "bg-white/15"}`} style={{ height: `${heights[i % heights.length]}%` }} />
                );
              })}
              <div className="absolute bottom-0.5 left-2 text-[9px] text-white/60">{formatDuration(currentTime)}</div>
              <div className="absolute bottom-0.5 right-2 text-[9px] text-white/60">{trackDuration > 0 ? formatDuration(trackDuration) : "--:--"}</div>
            </div>

            {/* Up Next Queue */}
            <div className="flex-1 min-h-0 flex flex-col bg-[#090f1c]/60 rounded-xl border border-white/10 overflow-hidden">
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
              <div className="flex-1 overflow-y-auto">
                {visiblePlaylist.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full py-6">
                    <ListMusic size={32} className="text-white/20 mb-2" />
                    <p className="text-white/40 text-xs">No tracks in queue</p>
                  </div>
                ) : (
                  <div className="space-y-1 p-2">
                    {visiblePlaylist.map((track, idx) => {
                      const isCurrent = currentTrack?.id === track.id;
                      const isFinished = finishedTracks.has(track.id);
                      return (
                        <div key={track.id} onClick={() => handleTrackSelect(track)} className={`flex items-center gap-2 px-2 py-1.5 rounded-lg cursor-pointer transition ${isCurrent ? "bg-gradient-to-r from-pink-500/20 to-orange-500/10 border border-pink-500/30" : isFinished ? "bg-green-500/10 border border-green-500/20" : "bg-white/[0.02] border border-transparent hover:bg-white/[0.05]"}`}>
                          <span className={`text-[10px] font-bold w-5 text-center ${isCurrent ? "text-pink-400" : isFinished ? "text-green-400" : "text-white/40"}`}>{idx + 1}</span>
                          <p className={`text-xs truncate flex-1 ${isCurrent ? "text-white font-semibold" : isFinished ? "text-green-300" : "text-white/70"}`}>{track.title}</p>
                          {isCurrent && isPlaying && <div className="w-2 h-2 rounded-full bg-pink-500 animate-pulse" />}
                          {isFinished && !isCurrent && <Check size={12} className="text-green-400" />}
                          <button onClick={(e) => { e.stopPropagation(); if (sessionRunning || isPlaying) { setShowRemoveTrackConfirm({ track, originalIndex: idx }); } else { setPlaylist(prev => prev.filter(t => t.id !== track.id)); } }} className="p-1 rounded hover:bg-white/10">
                            <X size={12} className="text-white/40" />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Volume Slider */}
            <div className="flex items-center gap-3 py-3 justify-center shrink-0">
              <Volume2 size={14} className="text-white/40" />
              <input type="range" min={0} max={100} value={isMuted ? 0 : volume} onChange={(e) => { setVolume(Number(e.target.value)); if (Number(e.target.value) > 0) setIsMuted(false); }} className="w-32 h-1 rounded-full appearance-none bg-white/20 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:rounded-full" />
              <span className="text-[10px] text-white/40 w-8">{isMuted ? "0" : volume}%</span>
            </div>
          </div>
          )}

          {/* Bottom Safe Area */}
          <div className="h-[env(safe-area-inset-bottom)] shrink-0" />
        </div>
      )}

      {/* Send to Session Confirmation - Mobile (outside isFullscreen container) */}
      {showSendToSessionConfirm && (
        <div className="fixed inset-0 z-[400] flex items-center justify-center bg-black/70 lg:hidden">
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
        <div className="fixed inset-0 z-[400] flex items-center justify-center bg-black/70 lg:hidden">
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

      {/* Clear Playlist Confirmation - Mobile (outside isFullscreen container) */}
      {showClearPlaylistConfirm && (
        <div className="fixed inset-0 z-[400] flex items-center justify-center bg-black/70 lg:hidden">
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

      {/* Main Content Area - Desktop: 4-column grid, Mobile: single column */}
      <div className="hidden lg:grid h-[calc(100vh-100px)] w-full grid-cols-[72px_240px_minmax(0,1fr)_380px] gap-3 overflow-hidden p-3 pb-0">

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
              <div className="rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-sm p-3 shadow-[0_0_30px_rgba(0,0,0,0.2)]">
                <h2 className="text-[#ff8a00] uppercase tracking-[0.15em] text-[10px] font-black mb-2">
                  Upload Files & Playlists
                </h2>
                <label
                  onDrop={handleDropUpload}
                  onDragOver={handleDragOverUpload}
                  onDragEnter={handleDragEnterUpload}
                  onDragLeave={handleDragLeaveUpload}
                  className={`block cursor-pointer rounded-xl border border-dashed p-4 text-center transition ${
                    isDraggingUpload
                      ? "border-cyan-300 bg-cyan-400/10"
                      : "border-[#ff4fa3]/50 bg-white/[0.03]"
                  }`}
                >
                  <input
                    type="file"
                    accept="audio/mpeg,audio/mp3,audio/wav,audio/x-wav,audio/x-m4a,audio/mp4,audio/*,.mp3,.wav,.m4a"
                    multiple
                    onChange={(event) => {
                      handleFiles(event.target.files);
                      event.target.value = "";
                    }}
                    className="hidden"
                  />
                  <UploadCloud className="mx-auto mb-2 text-[#ff8a00]" size={28} />
                  <p className="text-white font-bold text-xs">Drop files and playlists</p>
                  <p className="text-white/50 text-[10px] mt-1">MP3, WAV, M4A</p>
                  <p className="text-white/40 text-[9px] mt-1">Folders become playlists</p>
                </label>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-sm p-3 shadow-[0_0_30px_rgba(0,0,0,0.2)] flex-1 overflow-hidden">
                <div className="flex items-center justify-between mb-2">
                  <h2 className="text-white uppercase tracking-[0.15em] text-[10px] font-black">Playlists</h2>
                  <button onClick={() => setShowPlaylistModal(true)} className="text-[#ff4fa3] font-bold text-xs">+ New</button>
                </div>
                {savedPlaylists.length === 0 ? (
                  <p className="text-white/40 text-center py-4 text-xs">No playlists yet</p>
                ) : (
                  <div className="space-y-2 max-h-[200px] overflow-y-auto">
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
                        >
                          Load
                        </button>
                        <button
                          onClick={() => setSavedPlaylists((prev) => prev.filter((p) => p.id !== pl.id))}
                          className="text-[9px] font-semibold text-orange-400 hover:text-orange-300 transition"
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
                  {visiblePlaylist.length === 0 ? (
                    <div className="flex h-full flex-col items-center justify-center text-center py-12">
                      <p className="text-2xl font-semibold text-white/50">No tracks queued</p>
                      <p className="mt-2 text-sm text-white/35">Upload tracks and add them to your playlist</p>
                    </div>
                  ) : (
                    (() => {
                      return visiblePlaylist.map((track, visibleIndex) => {
                        const originalIndex = playlist.findIndex(t => t.id === track.id);
                        const colours = ["text-[#ff8a00]", "text-blue-500", "text-purple-400", "text-[#ff4fa3]", "text-cyan-400", "text-green-400"];
                        const colour = colours[visibleIndex % colours.length];
                        const isActiveTrack = currentTrack?.id === track.id;
                        const isFinished = finishedTracks.has(track.id);
                        const isCompleted = !isFinished && originalIndex < currentIndex;
                        const hasMoreRounds = isCompleted && playlistRound < playlistRepeats;
                        const isDragging = draggedTrackIndex === originalIndex;
                        const isDropTarget = dropTargetIndex === originalIndex;
                      
                        return (
                          <div key={track.id} className="relative">
                            {isDropTarget && draggedTrackIndex !== null && dropPosition === "above" && (
                              <div className="absolute -top-[2px] left-0 right-0 h-[4px] bg-cyan-400 rounded-full z-10 shadow-[0_0_10px_rgba(34,211,238,0.6)]" />
                            )}
                            <div 
                              draggable
                              onDragStart={(e) => {
                                setDraggedTrackIndex(originalIndex);
                                e.dataTransfer.effectAllowed = "move";
                                e.dataTransfer.setData("text/plain", originalIndex.toString());
                              }}
                              onDragEnd={() => {
                                setDraggedTrackIndex(null);
                                setDropTargetIndex(null);
                                setDropPosition("below");
                                dropPositionRef.current = "below";
                              }}
                              onDragOver={(e) => {
                                e.preventDefault();
                                e.dataTransfer.dropEffect = "move";
                                if (draggedTrackIndex !== null && draggedTrackIndex !== originalIndex) {
                                  setDropTargetIndex(originalIndex);
                                  const rect = e.currentTarget.getBoundingClientRect();
                                  const midpoint = rect.top + rect.height / 2;
                                  const position = e.clientY < midpoint ? "above" : "below";
                                  setDropPosition(position);
                                  dropPositionRef.current = position;
                                }
                              }}
                              onDragLeave={() => {
                                if (dropTargetIndex === originalIndex) {
                                  setDropTargetIndex(null);
                                }
                              }}
                              onDrop={(e) => {
                                e.preventDefault();
                                if (draggedTrackIndex === null || draggedTrackIndex === originalIndex) return;
                                
                                const fromIndex = draggedTrackIndex;
                                const toIndex = originalIndex;
                                const position = dropPositionRef.current;
                                
                                setPlaylist((prev) => {
                                  const newPlaylist = [...prev];
                                  const [draggedItem] = newPlaylist.splice(fromIndex, 1);
                                  let finalPosition: number;
                                  
                                  if (position === "above") {
                                    finalPosition = fromIndex < toIndex ? toIndex - 1 : toIndex;
                                  } else {
                                    finalPosition = fromIndex < toIndex ? toIndex : toIndex + 1;
                                  }
                                  
                                  finalPosition = Math.max(0, Math.min(finalPosition, newPlaylist.length));
                                  newPlaylist.splice(finalPosition, 0, draggedItem);
                                  
                                  if (fromIndex === currentIndex) {
                                    setCurrentIndex(finalPosition);
                                  } else if (fromIndex < currentIndex && finalPosition >= currentIndex) {
                                    setCurrentIndex((idx) => idx - 1);
                                  } else if (fromIndex > currentIndex && finalPosition <= currentIndex) {
                                    setCurrentIndex((idx) => idx + 1);
                                  }
                                  
                                  return newPlaylist;
                                });
                                setDraggedTrackIndex(null);
                                setDropTargetIndex(null);
                                setDropPosition("below");
                                dropPositionRef.current = "below";
                              }}
                              onClick={() => {
                                setCurrentIndex(originalIndex);
                                togglePlayPause(track);
                              }}
                              className={`grid h-[78px] grid-cols-[20px_42px_1fr_64px_44px] items-center border-b cursor-pointer transition hover:bg-white/[0.03] ${
                                isDragging ? "opacity-40 bg-cyan-500/10" : ""
                              } ${
                                isActiveTrack 
                                  ? "border-[#ff4fa3]/40 bg-[#ff4fa3]/10" 
                                  : isFinished
                                    ? "border-white/5 opacity-30"
                                    : "border-white/8"
                              }`}
                            >
                              <div className="cursor-grab active:cursor-grabbing">
                                <GripVertical size={15} className="text-white/75 hover:text-white" />
                              </div>
                              <div className={`text-[34px] font-black ${isFinished ? "text-white/20" : colour}`}>{visibleIndex + 1}</div>
                              <div>
                                <div className={`text-base font-semibold ${isActiveTrack ? "text-[#ff8a00]" : isFinished ? "text-white/40" : "text-white"}`}>{track.title}</div>
                                <div className="text-xs text-white/85">
                                  {isActiveTrack && isPlaying ? "Now Playing" : isActiveTrack && isGapPaused ? `Gap: ${gapCountdown}s` : isFinished ? "Finished" : hasMoreRounds ? `Round ${playlistRound} of ${playlistRepeats}` : isCompleted ? "Finished" : formatDuration(track.durationSeconds)}
                                </div>
                              </div>
                              <div className="flex flex-col items-end pr-2">
                                <div className="text-[10px]">Duration</div>
                                <div className={`text-base font-bold ${isFinished ? "text-white/20" : colour}`}>{formatDuration(track.durationSeconds)}</div>
                              </div>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  hideTrackFromSession(track.id);
                                }}
                                className="ml-1 p-2.5 md:p-2 rounded-lg text-white/40 hover:text-orange-400 hover:bg-orange-500/15 active:bg-orange-500/25 transition touch-manipulation"
                                title="Hide from this session (does not delete from playlist)"
                              >
                                <X size={18} className="md:w-4 md:h-4" />
                              </button>
                            </div>
                            {isDropTarget && draggedTrackIndex !== null && dropPosition === "below" && (
                              <div className="absolute -bottom-[2px] left-0 right-0 h-[4px] bg-cyan-400 rounded-full z-10 shadow-[0_0_10px_rgba(34,211,238,0.6)]" />
                            )}
                          </div>
                        );
                      });
                    })()
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

            <div className="mb-3 md:mb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <h2 className="text-xs md:text-sm font-bold tracking-[0.22em] bg-gradient-to-r from-[#ff4fa3] to-[#ff8a00] bg-clip-text text-transparent">
                NOW PLAYING
              </h2>

              {/* Volume Control & Fullscreen */}
              <div className="flex items-center gap-1 flex-wrap">
                <button
                  onClick={() => setIsMuted((m) => !m)}
                  className={`grid h-[32px] w-[32px] place-items-center rounded-lg border transition ${
                    isMuted
                      ? "border-red-500/60 bg-red-500/15 text-red-400 shadow-[0_0_10px_rgba(239,68,68,0.25)]"
                      : "border-pink-500/40 bg-pink-500/10 text-white hover:border-pink-500/70"
                  }`}
                >
                  {isMuted ? <VolumeX size={14} /> : <Volume2 size={14} />}
                </button>

                <div
                  className="relative flex items-center justify-center w-[60px] sm:w-[70px] h-[32px] rounded-lg border border-white/10 bg-[#090f1c] cursor-pointer overflow-hidden"
                  onClick={(e) => {
                    const rect = e.currentTarget.getBoundingClientRect();
                    const x = e.clientX - rect.left;
                    const pct = Math.round(Math.max(0, Math.min(100, (x / rect.width) * 100)));
                    setVolume(pct);
                    if (pct > 0 && isMuted) setIsMuted(false);
                    if (pct === 0) setIsMuted(true);
                  }}
                  onMouseDown={(e) => {
                    const bar = e.currentTarget;
                    const handleMove = (ev: MouseEvent) => {
                      const rect = bar.getBoundingClientRect();
                      const x = ev.clientX - rect.left;
                      const pct = Math.round(Math.max(0, Math.min(100, (x / rect.width) * 100)));
                      setVolume(pct);
                      if (pct > 0 && isMuted) setIsMuted(false);
                      if (pct === 0) setIsMuted(true);
                    };
                    const handleUp = () => {
                      document.removeEventListener("mousemove", handleMove);
                      document.removeEventListener("mouseup", handleUp);
                    };
                    document.addEventListener("mousemove", handleMove);
                    document.addEventListener("mouseup", handleUp);
                  }}
                >
                  <div className="absolute inset-0 rounded-lg overflow-hidden pointer-events-none">
                    <div
                      className="h-full bg-gradient-to-r from-[#ff4fa3]/25 to-[#ff8a00]/25 transition-all duration-150"
                      style={{ width: `${isMuted ? 0 : volume}%` }}
                    />
                  </div>
                  <span className="relative z-10 text-xs font-bold text-white/80 tabular-nums pointer-events-none">
                    {isMuted ? "0" : volume}%
                  </span>
                </div>

                <button
                  onClick={() => {
                    // On mobile, use custom fullscreen player
                    if (isMobileBuild || window.innerWidth < 768) {
                      setShowFullscreenMobilePlayer(true);
                    } else {
                      toggleFullscreen();
                    }
                  }}
                  className="grid h-[32px] w-[32px] place-items-center rounded-lg border border-[#ff8a00]/40 bg-[#ff8a00]/10 text-white hover:border-[#ff8a00]/70 hover:bg-[#ff8a00]/20 transition"
                  title="Enter fullscreen mode"
                >
                  <Maximize2 size={14} />
                </button>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-3">
              {/* Left - Album Icon */}
              <div className="grid h-[60px] w-[60px] shrink-0 place-items-center rounded-xl border border-pink-500/30 bg-gradient-to-br from-pink-500/25 to-cyan-500/15 shadow-[0_0_30px_rgba(236,72,153,0.2)]">
                <Music size={28} className="text-pink-400" />
              </div>

              {/* Centre - Track Info & Progress */}
              <div className="flex-1 min-w-0 text-center sm:text-left w-full">
                <h3 className="truncate text-lg sm:text-xl font-bold leading-tight text-white">
                  {currentTrack?.title || "No Track Selected"}
                </h3>
                <p className="mt-1 truncate text-sm text-white/60">
                  {currentTrack ? "Playing" : "Upload tracks to begin"}
                </p>

                {/* Track Elapsed Timer */}
                <div className="mt-3 text-center">
                  {isGapPaused ? (
                    <div className="text-3xl font-black tracking-wider text-white tabular-nums countdown-flash" key={gapCountdown}>
                      {gapCountdown}
                    </div>
                  ) : (
                    <div className="text-2xl font-black tracking-wider text-white tabular-nums">
                      {currentTime > 0 || isPlaying
                        ? `${String(Math.floor(currentTime / 60)).padStart(2, "0")}:${String(Math.floor(currentTime % 60)).padStart(2, "0")}`
                        : "00:00"}
                    </div>
                  )}
                </div>
              </div>

              {/* Right - Playback Controls */}
              <div className="flex items-center justify-center gap-2 shrink-0">
                <button 
                  onClick={goToPreviousTrack}
                  className="grid h-[36px] w-[36px] place-items-center rounded-full border border-white/20 bg-white/[0.06] text-white/85 hover:bg-white/15 hover:border-white/30 transition"
                >
                  <StepBack size={18} />
                </button>

                <button
                  onClick={toggleSession}
                  disabled={!currentTrack && playlist.length === 0}
                  className="w-14 h-14 rounded-full bg-gradient-to-r from-pink-500 to-orange-500 text-white flex items-center justify-center disabled:opacity-40 shadow-[0_0_30px_rgba(255,79,179,0.35)] hover:shadow-[0_0_40px_rgba(255,79,179,0.5)] transition"
                >
                  {isGapPaused ? (
                    <span className="text-lg font-black tabular-nums countdown-flash" key={gapCountdown}>{gapCountdown}</span>
                  ) : isPlaying ? (
                    <Pause size={24} />
                  ) : (
                    <Play size={24} />
                  )}
                </button>

                <button 
                  onClick={goToNextTrack}
                  className="grid h-[36px] w-[36px] place-items-center rounded-full border border-white/20 bg-white/[0.06] text-white/85 hover:bg-white/15 hover:border-white/30 transition"
                >
                  <StepForward size={18} />
                </button>
              </div>
            </div>

            {/* Waveform Progress Bar */}
            <div
              className="relative mt-4 md:mt-6 flex h-12 md:h-14 w-full cursor-pointer items-end gap-[2px] rounded-xl border border-white/5 bg-white/[0.02] px-2 pb-2 pt-2 select-none"
              onClick={(e) => {
                if (!audioRef.current || !trackDuration) return;
                const rect = e.currentTarget.getBoundingClientRect();
                const x = e.clientX - rect.left;
                const pct = Math.max(0, Math.min(1, x / rect.width));
                audioRef.current.currentTime = pct * trackDuration;
                setCurrentTime(pct * trackDuration);
              }}
              onMouseDown={(e) => {
                if (!currentTrack) return;
                const bar = e.currentTarget;
                const handleMove = (ev: MouseEvent) => {
                  if (!audioRef.current || !trackDuration) return;
                  const rect = bar.getBoundingClientRect();
                  const x = ev.clientX - rect.left;
                  const pct = Math.max(0, Math.min(1, x / rect.width));
                  audioRef.current.currentTime = pct * trackDuration;
                  setCurrentTime(pct * trackDuration);
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
            <div className="mt-4 flex-1 flex flex-col justify-end">
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
                
{/* Cloud Sync Status & Refresh */}
                    {user && isCloudSyncAvailable() && isPro && (
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2 text-sm text-white/60">
                      <Cloud size={16} className="text-cyan-400" />
                      <span>{cloudPlaylists.length} cloud</span>
                    </div>
                    <button
                      onClick={async () => {
                        const playlists = await fetchCloudPlaylists();
                        setCloudPlaylists(playlists);
                      }}
                      className="px-3 py-1.5 rounded-lg border border-cyan-500/30 bg-cyan-500/10 text-cyan-400 text-sm font-medium hover:bg-cyan-500/20 transition flex items-center gap-2"
                    >
                      <RefreshCw size={14} />
                      Sync
                    </button>
                  </div>
                )}
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
                    } else if (entry?.isFile) {
                      const files = Array.from(e.dataTransfer?.files || []).filter((file) =>
                        file.type.startsWith("audio/")
                      );
                      
                      if (files.length > 0) {
                        const firstFile = files[0];
                        const pathParts = (firstFile as File & { webkitRelativePath?: string }).webkitRelativePath?.split("/");
                        const playlistName = pathParts && pathParts.length > 1 
                          ? pathParts[0] 
                          : `Playlist ${savedPlaylists.length + 1}`;
                        
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
                className={`block cursor-pointer rounded-xl border-2 border-dashed p-4 transition ${
                  isDraggingUpload
                    ? "border-cyan-300 bg-cyan-400/10"
                    : "border-pink-500/40 bg-white/[0.02] hover:border-pink-500/60 hover:bg-white/[0.04]"
                }`}
              >
                <input
                  type="file"
                  accept="audio/mpeg,audio/mp3,audio/wav,audio/x-wav,audio/x-m4a,audio/mp4,audio/*,.mp3,.wav,.m4a"
                  multiple
                  onChange={(event) => {
                    const files = Array.from(event.target.files || []).filter((file) =>
                      file.type.startsWith("audio/") || 
                      file.name.endsWith(".mp3") || 
                      file.name.endsWith(".wav") || 
                      file.name.endsWith(".m4a")
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
                    <p className="text-white/40 text-sm">or click to browse audio files</p>
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
                        onClick={() => {
                          if (sessionRunning || isPlaying) {
                            setShowClearPlaylistConfirm(true);
                          } else {
                            setSavedPlaylists([]);
                            clearPlaylist();
                          }
                        }}
                        className="px-2.5 py-1 text-xs font-semibold text-[#ff8a00] bg-[#ff8a00]/10 border border-[#ff8a00]/30 rounded-lg hover:bg-[#ff8a00]/20 transition"
                      >
                        Clear All
                      </button>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4">
                      {savedPlaylists.map((localPlaylist) => {
                        const isInCloud = cloudPlaylists.some(cp => cp.id === localPlaylist.id);
                        const isSyncing = syncingPlaylistId === localPlaylist.id;
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
                            
                            {isInCloud && (
                              <div className="mb-2 flex items-center gap-1 text-[10px] text-cyan-400">
                                <Cloud size={10} />
                                Synced
                              </div>
                            )}
                            
                            <div className="space-y-0.5 mb-2">
                              {localPlaylist.tracks.slice(0, 2).map((track, idx) => (
                                <div key={track.id} className="flex items-center gap-1.5 text-[11px] text-white/40">
                                  <span className="w-3 text-white/25">{idx + 1}.</span>
                                  <span className="truncate flex-1">{track.title}</span>
                                  <span className="text-white/25">{formatDuration(track.durationSeconds || 0)}</span>
                                </div>
                              ))}
                              {localPlaylist.tracks.length > 2 && (
                                <p className="text-[10px] text-white/25 pl-4">+{localPlaylist.tracks.length - 2} more</p>
                              )}
                            </div>
                            
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

                {/* Cloud Playlists */}
                {cloudPlaylists.filter(cp => !savedPlaylists.some(sp => sp.id === cp.id)).length > 0 && (
                  <div>
                    <h2 className="text-sm font-bold text-white/60 mb-4 flex items-center gap-2 uppercase tracking-wider">
                      <Cloud size={16} className="text-cyan-400" />
                      Cloud Playlists
                    </h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4">
                          {cloudPlaylists
                            .filter(cp => !savedPlaylists.some(sp => sp.id === cp.id))
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
                                    
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleDownloadCloudPlaylist(cloudPlaylist.id);
                                      }}
                                      disabled={isDownloading}
                                      className="w-8 h-8 rounded-lg bg-white/10 hover:bg-cyan-500/30 flex items-center justify-center transition opacity-0 group-hover:opacity-100 shrink-0"
                                      title="Download to device"
                                    >
                                      {isDownloading ? (
                                        <Loader2 size={14} className="animate-spin text-cyan-400" />
                                      ) : (
                                        <Download size={14} className="text-cyan-400" />
                                      )}
                                    </button>
                                  </div>
                                  
                                  <button
                                    onClick={() => setShowSendToSessionConfirm({ name: cloudPlaylist.name, tracks: cloudPlaylist.tracks })}
                                    className="mt-3 w-full py-2 rounded-xl bg-gradient-to-r from-cyan-500/20 to-blue-500/20 
                                               border border-cyan-500/30 text-cyan-400 text-sm font-medium
                                               hover:from-cyan-500/30 hover:to-blue-500/30 transition"
                                  >
                                    Send to Session
                                  </button>
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

        {activePage === "settings" && (
          <div className="col-span-3 col-start-2 h-full overflow-y-auto rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-sm">
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
                  <div className="space-y-3">
                    {/* Free Trial Badge */}
                    <div className="flex items-center justify-between">
                      <span className="text-white/70 text-sm">Current Plan</span>
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-gradient-to-r from-emerald-500 to-green-500 text-white shadow-[0_0_12px_rgba(16,185,129,0.4)]">
                        <Crown className="h-3.5 w-3.5" />
                        Free 30-Day Trial
                      </span>
                    </div>
                    
                    {/* Green Trial Status Bar */}
                    <div className="rounded-xl bg-gradient-to-r from-emerald-500/10 to-green-500/10 border border-emerald-500/20 p-4 space-y-3">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                        <span className="text-emerald-300 text-sm font-semibold">Your free trial is active</span>
                      </div>
                      
                      {/* Days Remaining */}
                      {profile?.trial_end && getTrialDaysRemaining(profile.trial_end) !== null && (
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-2 bg-white/10 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-gradient-to-r from-emerald-400 to-green-400 rounded-full transition-all"
                              style={{ width: `${Math.max(0, Math.min(100, ((getTrialDaysRemaining(profile.trial_end) || 0) / 30) * 100))}%` }}
                            />
                          </div>
                          <span className="text-emerald-300 text-sm font-bold whitespace-nowrap">
                            {getTrialDaysRemaining(profile.trial_end)} days remaining
                          </span>
                        </div>
                      )}
                      
                      {/* Renews On Date */}
                      {profile?.trial_end && (
                        <p className="text-white/60 text-xs">
                          Renews on {formatTrialEndDate(profile.trial_end)}
                        </p>
                      )}
                      
                      {/* Auto-renewal message */}
                      <p className="text-white/50 text-[11px] leading-relaxed">
                        Your subscription will automatically renew at £7.99 per month when your 30-day trial ends.
                      </p>
                    </div>
                    
                    {/* Cancel Subscription Link */}
                    <div className="text-center pt-1">
                      <Link href="/billing" className="text-white/40 hover:text-white/60 text-xs underline underline-offset-2 transition-colors">
                        Cancel subscription
                      </Link>
                    </div>
                  </div>
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
                    <NumberSetting label="Default Volume" value={settings.defaultVolume} suffix="%" min={0} max={100} step={5} onChange={(v) => updateSetting("defaultVolume", v)} />
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

      </div>

      {/* Mobile Layout - single column with tabs */}
      <div className="flex lg:hidden flex-col h-[calc(100dvh-130px-env(safe-area-inset-top)-env(safe-area-inset-bottom))] landscape:h-[calc(100dvh-70px)] w-full overflow-hidden mt-[calc(env(safe-area-inset-top)+8px)] pt-3 landscape:pt-1 px-2 sm:px-3">
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
            <div className="flex-1 min-h-0 overflow-y-auto">
              {mobileTab === "nowplaying" && (
                <div className="h-full flex flex-col overflow-hidden">
                  {/* Now Playing Section - Compact */}
                  <div className="shrink-0 bg-white/[0.02] rounded-lg p-2 mb-1">
                    {currentTrack ? (
                      <div className="flex flex-col gap-3">
                        {/* Track Info & Controls Row */}
                        <div className="flex items-center gap-3">
                          <div className="flex-1 min-w-0">
                            <p className="text-[9px] text-pink-400 uppercase tracking-widest font-bold">Now Playing</p>
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
                        {/* Timer */}
                        <div className="text-center">
                          <span className="text-2xl font-black text-white tabular-nums">
                            {String(Math.floor(currentTime / 60)).padStart(2, "0")}:{String(Math.floor(currentTime % 60)).padStart(2, "0")}
                          </span>
                          <span className="text-white/40 text-sm ml-2">/ {formatDuration(currentTrack.durationSeconds)}</span>
                        </div>
                        
                        {/* Waveform Progress Bar */}
                        <div
                          className="relative flex h-10 w-full cursor-pointer items-end gap-[2px] rounded-lg border border-white/10 bg-white/[0.02] px-2 pb-1.5 pt-1.5 select-none"
                          onClick={(e) => {
                            if (!audioRef.current || trackDuration === 0) return;
                            const rect = e.currentTarget.getBoundingClientRect();
                            const x = e.clientX - rect.left;
                            const pct = x / rect.width;
                            audioRef.current.currentTime = pct * trackDuration;
                          }}
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
                                    ? "bg-gradient-to-t from-pink-500 to-orange-400"
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
                      {visiblePlaylist.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full text-center py-8">
                          <p className="text-white/40 text-sm">No tracks queued</p>
                          <p className="text-white/25 text-xs mt-1">Go to Playlists tab to add music</p>
                        </div>
                      ) : (
                        <div className="space-y-1">
                          {(() => {
                            // Find current track index in visible playlist
                            const currentVisibleIndex = visiblePlaylist.findIndex(t => t.id === currentTrack?.id);
                            // Reorder: current track first, then remaining tracks after it, then tracks before it
                            const reorderedPlaylist = currentVisibleIndex >= 0
                              ? [
                                  ...visiblePlaylist.slice(currentVisibleIndex),
                                  ...visiblePlaylist.slice(0, currentVisibleIndex)
                                ]
                              : visiblePlaylist;
                            
                            return reorderedPlaylist.map((track, displayIndex) => {
                              // Get original position for numbering
                              const originalVisibleIndex = visiblePlaylist.findIndex(t => t.id === track.id);
                              const originalIndex = playlist.findIndex(t => t.id === track.id);
                              const colours = ["text-[#ff8a00]", "text-blue-500", "text-purple-400", "text-[#ff4fa3]", "text-cyan-400", "text-green-400"];
                              const colour = colours[originalVisibleIndex % colours.length];
                              const isActiveTrack = currentTrack?.id === track.id;
                              const isFinished = finishedTracks.has(track.id);
                              
                              return (
                                <div
                                  key={track.id}
                                  onClick={() => {
                                    setCurrentIndex(originalIndex);
                                    togglePlayPause(track);
                                  }}
                                  className={`flex items-center gap-2 p-2 rounded-lg cursor-pointer transition ${
                                    isActiveTrack 
                                      ? "bg-[#ff4fa3]/15 border border-[#ff4fa3]/30" 
                                      : isFinished
                                        ? "opacity-40"
                                        : "hover:bg-white/5"
                                  }`}
                                >
                                  {/* Track Number - shows original playlist position */}
                                  <div className={`text-xl font-black w-6 text-center ${isFinished ? "text-white/20" : colour}`}>
                                    {originalVisibleIndex + 1}
                                  </div>
                                  
                                  {/* Track Info */}
                                  <div className="flex-1 min-w-0">
                                    <p className={`text-sm font-semibold truncate ${isActiveTrack ? "text-[#ff8a00]" : isFinished ? "text-white/40" : "text-white"}`}>
                                      {track.title}
                                    </p>
                                    <p className="text-[10px] text-white/50">
                                      {isActiveTrack && isPlaying ? "Now Playing" : isActiveTrack && isGapPaused ? `Gap: ${gapCountdown}s` : isFinished ? "Finished" : formatDuration(track.durationSeconds)}
                                    </p>
                                  </div>
                                  
                                  {/* Duration */}
                                  <div className="text-right shrink-0">
                                    <p className="text-[9px] text-white/40">Duration</p>
                                    <p className={`text-sm font-bold ${isFinished ? "text-white/20" : colour}`}>{formatDuration(track.durationSeconds)}</p>
                                  </div>
                                  
                                  {/* Remove Button */}
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      hideTrackFromSession(track.id);
                                    }}
                                    className="p-1.5 rounded-md text-white/30 hover:text-orange-400 hover:bg-orange-500/15 transition"
                                  >
                                    <X size={14} />
                                  </button>
                                </div>
                              );
                            });
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
                        accept="audio/mpeg,audio/mp3,audio/wav,audio/x-wav,audio/x-m4a,audio/mp4,audio/*,.mp3,.wav,.m4a"
                        multiple
                        onChange={(event) => {
                          const files = Array.from(event.target.files || []).filter((file) =>
                            file.type.startsWith("audio/") || 
                            file.name.endsWith(".mp3") || 
                            file.name.endsWith(".wav") || 
                            file.name.endsWith(".m4a")
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
                  <div className="flex-1 min-h-0 overflow-y-auto scrollbar-thin scrollbar-thumb-white/20 scrollbar-track-transparent">
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
                                onClick={() => {
                                  if (sessionRunning || isPlaying) {
                                    setShowClearPlaylistConfirm(true);
                                  } else {
                                    setSavedPlaylists([]);
                                    clearPlaylist();
                                  }
                                }}
                                className="px-2 py-0.5 text-[9px] font-semibold text-[#ff8a00] bg-[#ff8a00]/10 border border-[#ff8a00]/30 rounded-md"
                              >
                                Clear All
                              </button>
                            </div>
                            <div className="space-y-2">
                              {savedPlaylists.map((localPlaylist) => {
                                const isInCloud = cloudPlaylists.some(cp => cp.id === localPlaylist.id);
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
                                    
                                    {/* Cloud Sync Badge */}
                                    {isInCloud && (
                                      <div className="mb-2 flex items-center gap-1 text-[9px] text-cyan-400">
                                        <Cloud size={9} />
                                        Synced to cloud
                                      </div>
                                    )}
                                    
                                    {/* Track Preview */}
                                    <div className="space-y-0.5 mb-2">
                                      {localPlaylist.tracks.slice(0, 2).map((track, idx) => (
                                        <div key={track.id} className="flex items-center gap-1.5 text-[10px] text-white/40">
                                          <span className="w-3 text-white/25">{idx + 1}.</span>
                                          <span className="truncate flex-1">{track.title}</span>
                                          <span className="text-white/25">{formatDuration(track.durationSeconds || 0)}</span>
                                        </div>
                                      ))}
                                      {localPlaylist.tracks.length > 2 && (
                                        <p className="text-[9px] text-white/25 pl-4">+{localPlaylist.tracks.length - 2} more tracks</p>
                                      )}
                                    </div>
                                    
                                    {/* Send to Session Button */}
                                    <button
                                      onClick={() => setShowSendToSessionConfirm({ name: localPlaylist.name, tracks: localPlaylist.tracks })}
                                      disabled={localPlaylist.tracks.length === 0}
                                      className="w-full py-2 rounded-lg bg-gradient-to-r from-pink-500/15 to-orange-500/15 
                                                 border border-pink-500/25 text-pink-400 text-[11px] font-semibold
                                                 hover:from-pink-500/25 hover:to-orange-500/25 transition disabled:opacity-30"
                                    >
                                      Send to Session
                                    </button>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}
                        
                        {/* Cloud Playlists */}
                        {cloudPlaylists.filter(cp => !savedPlaylists.some(sp => sp.id === cp.id)).length > 0 && (
                          <div>
                            <h3 className="text-[10px] font-bold text-white/60 mb-2 flex items-center gap-1.5 uppercase tracking-wider sticky top-0 bg-[#050816] py-1 z-10">
                              <Cloud size={12} className="text-cyan-400" />
                              Cloud Playlists
                            </h3>
                            <div className="space-y-2">
                              {cloudPlaylists
                                .filter(cp => !savedPlaylists.some(sp => sp.id === cp.id))
                                .map((cloudPlaylist) => {
                                  const totalDuration = cloudPlaylist.tracks.reduce((sum, t) => sum + (t.durationSeconds || 0), 0);
                                  
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
                                      
                                      {/* Action Buttons */}
                                      <div className="flex gap-2">
                                        <button
                                          onClick={() => setShowSendToSessionConfirm({ name: cloudPlaylist.name, tracks: cloudPlaylist.tracks })}
                                          className="flex-1 py-2 rounded-lg bg-gradient-to-r from-pink-500/15 to-orange-500/15 
                                                     border border-pink-500/25 text-pink-400 text-[11px] font-semibold
                                                     hover:from-pink-500/25 hover:to-orange-500/25 transition"
                                        >
                                          Send to Session
                                        </button>
                                        <button
                                          onClick={() => {
                                            setSavedPlaylists(prev => [...prev, cloudPlaylist]);
                                          }}
                                          className="py-2 px-3 rounded-lg bg-gradient-to-r from-cyan-500/15 to-blue-500/15 
                                                     border border-cyan-500/25 text-cyan-400 text-[11px] font-semibold
                                                     hover:from-cyan-500/25 hover:to-blue-500/25 transition"
                                        >
                                          <Download size={12} />
                                        </button>
                                      </div>
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
                    <div className="flex-1 min-h-0 overflow-y-auto space-y-3">
                    
                    {/* Playback Settings */}
                    <div className="rounded-xl border border-white/10 bg-white/[0.02] p-3">
                      <div className="flex items-center gap-2 mb-2">
                        <Headphones size={14} className="text-[#ff8a00]" />
                        <span className="text-[10px] font-bold text-white">Playback</span>
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] text-white/70">Default Volume</span>
                          <div className="flex items-center rounded border border-white/20 bg-white/5">
                            <button onClick={() => updateSetting("defaultVolume", Math.max(0, settings.defaultVolume - 5))} className="px-1.5 py-0.5 text-white/70"><Minus size={10} /></button>
                            <span className="px-2 text-[10px] text-white border-x border-white/15">{settings.defaultVolume}%</span>
                            <button onClick={() => updateSetting("defaultVolume", Math.min(100, settings.defaultVolume + 5))} className="px-1.5 py-0.5 text-white/70"><Plus size={10} /></button>
                          </div>
                        </div>
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

                    {/* Desktop App */}
                    <div className="rounded-xl border border-white/10 bg-gradient-to-br from-[#ff4fa3]/10 via-transparent to-[#ff8a00]/10 p-3 sm:p-4">
                      <div className="flex items-center gap-2 mb-3">
                        <div className="grid h-6 w-6 place-items-center rounded-lg bg-gradient-to-r from-[#ff4fa3] to-[#ff8a00]">
                          <Download size={12} className="text-white" />
                        </div>
                        <span className="text-[11px] sm:text-xs font-bold text-white">Desktop App</span>
                      </div>
                      <p className="text-[10px] sm:text-[11px] text-white/60 mb-3 leading-relaxed">
                        Run EQHO Player as a dedicated desktop application for Mac with improved performance and fullscreen support.
                      </p>
                      <a
                        href="/downloads/eqho-player-mac.dmg"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-center gap-2 w-full py-2.5 rounded-lg bg-gradient-to-r from-[#ff4fa3] to-[#ff8a00] text-white text-[11px] sm:text-xs font-bold hover:shadow-[0_0_20px_rgba(255,79,163,0.4)] transition-all"
                      >
                        <Download size={14} />
                        Download for Mac
                      </a>
                    </div>

                    {/* Account / Logout */}
                    <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-3">
                      <div className="flex items-center gap-2 mb-2">
                        <LogOut size={14} className="text-red-400" />
                        <span className="text-[10px] font-bold text-white">Account</span>
                      </div>
                      <div className="space-y-2">
                        <button
                          onClick={handleLogout}
                          className="w-full py-2 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-[11px] font-semibold hover:bg-red-500/20 transition flex items-center justify-center gap-2"
                        >
                          <LogOut size={12} />
                          Sign Out
                        </button>
                        <button
                          onClick={() => setShowDeleteAccountConfirm(true)}
                          className="w-full py-2 rounded-lg bg-red-600/10 border border-red-600/30 text-red-500 text-[11px] font-semibold hover:bg-red-600/20 transition flex items-center justify-center gap-2"
                        >
                          <Trash2 size={12} />
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

      {/* Fixed Bottom Control Bar */}
      <div className="fixed bottom-0 left-0 right-0 h-[calc(110px+env(safe-area-inset-bottom))] landscape:h-[70px] md:h-[80px] lg:h-[calc(80px+env(safe-area-inset-bottom))] w-full max-w-[100vw] overflow-hidden z-40 bg-[#050816]">
        <div className="session-bottom-divider" />

        <div className="w-full max-w-full px-3 sm:px-4 md:px-4 py-1 landscape:py-1 md:py-2 overflow-hidden">
          {/* Mobile Layout - Compact Grid + Button */}
          <div className="flex md:hidden flex-col gap-1 landscape:gap-1">
            {/* Controls Grid - 2 columns in portrait, 4 columns in landscape */}
            <div className="grid grid-cols-4 gap-x-2 gap-y-0.5">
              {/* Gap Between Routines */}
              <div className="flex flex-col items-center">
                <div className="text-[8px] font-medium tracking-wide text-white/50 uppercase mb-0.5">Gap</div>
                <div className="flex items-center rounded border border-white/20 bg-white/5">
                  <button onClick={() => updateGapSeconds((v) => Math.max(0, v - 5))} className="px-1.5 py-1 text-white/70"><Minus size={10} /></button>
                  <span className="px-2 text-[11px] font-bold text-white border-x border-white/15 min-w-[28px] text-center">{gapSeconds}s</span>
                  <button onClick={() => updateGapSeconds((v) => Math.min(120, v + 5))} className="px-1.5 py-1 text-white/70"><Plus size={10} /></button>
                </div>
              </div>

              {/* Back to Back */}
              <div className="flex flex-col items-center">
                <div className="text-[8px] font-medium tracking-wide text-white/50 uppercase mb-0.5">B2B</div>
                <button 
                  onClick={() => updateBackToBack((v) => !v)}
                  className="flex items-center gap-1.5"
                >
                  <div className={`grid h-5 w-5 shrink-0 place-items-center rounded-full border ${backToBack ? "border-pink-500 text-pink-500" : "border-pink-500/50 text-pink-500/50"}`}>
                    <RefreshCw size={10} />
                  </div>
                  <div className={`h-4 w-8 rounded-full border p-0.5 transition-colors ${
                    backToBack ? "border-pink-500 bg-pink-500/30" : "border-white/25 bg-white/10"
                  }`}>
                    <div className={`h-3 w-3 rounded-full transition-transform ${
                      backToBack ? "translate-x-4 bg-pink-500" : "translate-x-0 bg-white/40"
                    }`} />
                  </div>
                </button>
              </div>

              {/* Total Session Time */}
              <div className="flex flex-col items-center">
                <div className="text-[8px] font-medium tracking-wide text-white/50 uppercase mb-0.5">Time</div>
                <div className="flex items-center gap-1.5">
                  <div className="grid h-5 w-5 shrink-0 place-items-center rounded-full border border-cyan-400 text-cyan-400">
                    <Clock size={10} />
                  </div>
                  <div className="text-white text-base font-bold leading-none">{formatSessionTime(totalSessionSeconds)}</div>
                </div>
              </div>

              {/* Repeats */}
              <div className="flex flex-col items-center">
                <div className="text-[8px] font-medium tracking-wide text-white/50 uppercase mb-0.5">Reps</div>
                <div className="flex items-center rounded border border-white/20 bg-white/5">
                  <button onClick={() => updatePlaylistRepeats((v) => Math.max(1, v - 1))} className="px-1.5 py-1 text-white/70"><Minus size={10} /></button>
                  <span className="px-2 text-[11px] font-bold text-white border-x border-white/15 min-w-[24px] text-center">{playlistRepeats}x</span>
                  <button onClick={() => updatePlaylistRepeats((v) => Math.min(20, v + 1))} className="px-1.5 py-1 text-white/70"><Plus size={10} /></button>
                </div>
              </div>
            </div>

            {/* Session Button */}
            <button
              onClick={handlePauseClick}
              disabled={!currentTrack && playlist.length === 0}
              className={`w-full py-3 pb-[calc(12px+env(safe-area-inset-bottom))] landscape:py-1.5 landscape:pb-1.5 md:py-2 md:pb-2 text-sm font-bold rounded-lg rounded-b-none transition disabled:opacity-30 ${
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

          {/* Desktop Layout */}
          <div className="hidden md:flex flex-wrap items-center justify-start gap-4">
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
      </div>

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-[140px] left-1/2 -translate-x-1/2 z-[60] px-6 py-3 rounded-xl bg-cyan-500/20 border border-cyan-400/50 text-cyan-300 text-sm font-medium backdrop-blur-md animate-in fade-in slide-in-from-bottom-4 duration-300">
          {toastMessage}
        </div>
      )}

      {/* Stop/Pause Session Confirmation Modal */}
      {showStopConfirm && (
        <div className="fixed inset-0 z-[400] flex items-center justify-center bg-black/70 backdrop-blur-sm">
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
