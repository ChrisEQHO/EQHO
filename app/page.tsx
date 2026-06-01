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
  type CloudPlaylist,
  type SyncStatus 
} from "@/lib/cloud-sync";
import { useRouter } from "next/navigation";
import type { User } from "@supabase/supabase-js";
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
  Headphones,
  Save,
  Repeat,
  Maximize2,
  Minimize2,
  LogOut,
  Cloud,
  CloudOff,
  Trash2,
  Download,
  Check,
  Loader2,
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






/* 
 * EQHO Brand Logo - Colourway 3 SUNSET
 * Uses the uploaded logo image exactly as provided
 * Logo image: /public/eqho-player-logo.png
 */

function EqhoBrand({ className = "" }: { className?: string }) {
  return (
    <div className={`relative shrink-0 ${className}`}>
      <Image
        src="/eqho-player-logo.png"
        alt="EQHO Player"
        fill
        priority
        className="object-contain mix-blend-lighten"
      />
    </div>
  );
}

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

  const handleLogout = async () => {
    if (!supabase) return;
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
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

  // Calculate full session time including repeats and back-to-back
  const totalTracksWithRepeats = trackCount * playlistRepeats * (backToBack ? 2 : 1);
  const fullSessionSeconds = 
    totalRoutineSeconds * playlistRepeats * (backToBack ? 2 : 1) +
    Math.max(0, totalTracksWithRepeats - 1) * gapSeconds;

  // Calculate completed tracks across all rounds
  const currentRoundIndex = playlistRound - 1;
  const tracksCompletedInPreviousRounds = currentRoundIndex * trackCount * (backToBack ? 2 : 1);
  const totalTracksCompleted = tracksCompletedInPreviousRounds + currentIndex;

  // Real-time progress: sum of completed tracks' durations + current track elapsed time
  const completedSeconds = playlist
    .slice(0, currentIndex)
    .reduce((sum, t) => sum + t.durationSeconds, 0);
  const previousRoundsSeconds = currentRoundIndex * totalRoutineSeconds * (backToBack ? 2 : 1);
  const completedGapSeconds = totalTracksCompleted > 0 ? totalTracksCompleted * gapSeconds : 0;
  const elapsedSeconds = previousRoundsSeconds + completedSeconds + completedGapSeconds + currentTime;

  const progressPercent = fullSessionSeconds > 0
    ? Math.min(100, Math.round((elapsedSeconds / fullSessionSeconds) * 100))
    : 0;

  const remainingSeconds = Math.max(0, fullSessionSeconds - elapsedSeconds);
  
  // Track completion count for display
  const completedTracks = currentIndex;

  // Display labels
  const currentPlaylistDisplayName =
    playlist.length > 0 ? currentPlaylistName : "No playlist selected";

  const trackCountLabel =
    `${trackCount} ${trackCount === 1 ? "track" : "tracks"}`;

  const routineTimeLabel = formatSessionTime(totalRoutineSeconds);

  const estimatedSessionLabel = formatSessionTime(estimatedSessionSeconds);

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
      // Re-set the source to ensure it's valid
      audioRef.current.src = currentTrack.url;
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

    // Clear IndexedDB cache (playlists only)
    await clearCachedPlaylist();
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
      
      // Find next visible track after current index
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
        setCurrentTrack(playlist[nextVisibleIdx]);
      } else {
        // No more visible tracks, stop session
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
    
    const nextIdx = currentIndex + 1;
    
    if (nextIdx < playlist.length) {
      setCurrentIndex(nextIdx);
      const nextTrack = playlist[nextIdx];
      setCurrentTrack(nextTrack);
      if (audioRef.current && nextTrack) {
        audioRef.current.src = nextTrack.url;
        audioRef.current.play();
        setIsPlaying(true);
      }
    }
  };

  const goToPreviousTrack = () => {
    if (playlist.length === 0) return;
    
    const prevIdx = currentIndex - 1;
    
    if (prevIdx >= 0) {
      setCurrentIndex(prevIdx);
      const prevTrack = playlist[prevIdx];
      setCurrentTrack(prevTrack);
      if (audioRef.current && prevTrack) {
        audioRef.current.src = prevTrack.url;
        audioRef.current.play();
        setIsPlaying(true);
      }
    } else if (audioRef.current) {
      // If at first track, restart it
      audioRef.current.currentTime = 0;
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

      const playAfterGap = (playFn: () => void) => {
        if (_gapSeconds > 0) {
          setIsPlaying(false);
          setIsGapPaused(true);
          setGapCountdown(_gapSeconds);
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

      const nextIdx = _currentIndex + 1;

      // There's a next track in the playlist
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

          playAfterGap(() => {
            const firstTrack = _playlist[0];
            setCurrentIndex(0);
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
        cb();
      }
      return;
    }
    
    // Play beep on final 3 seconds
    if (gapCountdown <= 3 && gapCountdown > 0) {
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
  });

  const updateSetting = (key: string, value: any) => {
    setSettings((current) => ({
      ...current,
      [key]: value,
    }));
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
    <div className="h-screen w-full min-w-0 max-w-full overflow-hidden bg-[#020617] text-white">
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

        {/* Fullscreen Mobile Player */}
        {showFullscreenMobilePlayer && (
          <div className="fixed inset-0 z-[300] flex flex-col bg-gradient-to-b from-[#0a0a1a] via-[#120a20] to-[#0a1020] safe-area-inset">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 pt-[env(safe-area-inset-top)]">
              <button
                onClick={() => setShowFullscreenMobilePlayer(false)}
                className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center"
              >
                <X size={20} className="text-white" />
              </button>
              <h2 className="text-white/80 font-medium">Now Playing</h2>
              <div className="w-10" /> {/* Spacer for centering */}
            </div>

            {/* Album Art / Track Visual */}
            <div className="flex-1 flex flex-col items-center justify-center px-8">
              <div className="w-[min(70vw,280px)] h-[min(70vw,280px)] rounded-3xl bg-gradient-to-br from-pink-500/30 via-purple-500/20 to-cyan-400/30 border border-white/10 flex items-center justify-center shadow-[0_0_60px_rgba(236,72,153,0.3)]">
                <Music size={80} className="text-pink-400/60" />
              </div>

              {/* Track Info */}
              <div className="mt-8 text-center w-full">
                <h1 className="text-2xl font-bold text-white truncate px-4">
                  {currentTrack?.title || "No Track Selected"}
  </h1>
  <p className="text-white/50 mt-1">
  {currentTrack ? `Track ${getVisibleIndex(currentTrack.id) + 1} of ${visiblePlaylist.length}` : "Upload tracks to begin"}
  </p>
  </div>

              {/* Timer */}
              <div className="mt-6">
                {isGapPaused ? (
                  <div className="text-6xl font-black tracking-wider text-white tabular-nums countdown-flash" key={gapCountdown}>
                    {gapCountdown}
                  </div>
                ) : (
                  <div className="text-5xl font-black tracking-wider text-white tabular-nums">
                    {currentTime > 0 || isPlaying
                      ? `${String(Math.floor(currentTime / 60)).padStart(2, "0")}:${String(Math.floor(currentTime % 60)).padStart(2, "0")}`
                      : "00:00"}
                  </div>
                )}
              </div>

              {/* Progress Bar */}
              <div className="w-full mt-8 px-4">
                <div 
                  className="h-2 bg-white/10 rounded-full overflow-hidden cursor-pointer"
                  onClick={(e) => {
                    if (!audioRef.current || !trackDuration) return;
                    const rect = e.currentTarget.getBoundingClientRect();
                    const percent = (e.clientX - rect.left) / rect.width;
                    audioRef.current.currentTime = percent * trackDuration;
                  }}
                >
                  <div 
                    className="h-full bg-gradient-to-r from-pink-500 to-orange-500 transition-all"
                    style={{ width: `${trackDuration ? (currentTime / trackDuration) * 100 : 0}%` }}
                  />
                </div>
                <div className="flex justify-between text-xs text-white/40 mt-2">
                  <span>{formatDuration(Math.floor(currentTime))}</span>
                  <span>{formatDuration(Math.floor(trackDuration))}</span>
                </div>
              </div>
            </div>

            {/* Controls */}
            <div className="px-8 pb-8 pb-[calc(env(safe-area-inset-bottom)+2rem)]">
              <div className="flex items-center justify-center gap-8">
                {/* Previous */}
                <button 
                  onClick={goToPreviousTrack}
                  className="w-14 h-14 rounded-full bg-white/10 flex items-center justify-center"
                >
                  <StepBack size={28} className="text-white" />
                </button>

                {/* Play/Pause */}
                <button
                  onClick={toggleSession}
                  disabled={!currentTrack && playlist.length === 0}
                  className="w-20 h-20 rounded-full bg-gradient-to-r from-pink-500 to-orange-500 text-white flex items-center justify-center disabled:opacity-40 shadow-[0_0_40px_rgba(255,79,179,0.4)]"
                >
                  {isGapPaused ? (
                    <span className="text-2xl font-black tabular-nums countdown-flash">{gapCountdown}</span>
                  ) : isPlaying ? (
                    <Pause size={36} />
                  ) : (
                    <Play size={36} className="ml-1" />
                  )}
                </button>

                {/* Next */}
                <button 
                  onClick={goToNextTrack}
                  className="w-14 h-14 rounded-full bg-white/10 flex items-center justify-center"
                >
                  <StepForward size={28} className="text-white" />
                </button>
              </div>

              {/* Volume */}
              <div className="flex items-center gap-3 mt-8 justify-center">
                <button onClick={() => setIsMuted(!isMuted)}>
                  {isMuted ? (
                    <VolumeX size={20} className="text-white/50" />
                  ) : (
                    <Volume2 size={20} className="text-white/50" />
                  )}
                </button>
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={isMuted ? 0 : volume}
                  onChange={(e) => setVolume(Number(e.target.value))}
                  className="w-32 h-1 rounded-full appearance-none bg-white/20 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:rounded-full"
                />
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
                <p className="text-sm text-white/40 uppercase tracking-widest mb-2">Session Remaining</p>
                <div className="text-8xl font-black tracking-tight tabular-nums leading-none">
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
  <p className="text-xs text-white/40 mt-2">
  {isGapPaused ? "Next Track In" : `${visiblePlaylist.length} tracks + ${gapSeconds}s gaps`}
  </p>
              </div>

              {/* Track Title */}
              <h3 className="text-3xl font-bold text-white text-center mb-2 max-w-[500px] truncate">
                {currentTrack?.title || "No Track Selected"}
              </h3>
              
              {/* Track Timer - Larger */}
              <p className="text-2xl text-white/70 tabular-nums mb-2">
                {currentTime > 0 || isPlaying
                  ? `${String(Math.floor(currentTime / 60)).padStart(2, "0")}:${String(Math.floor(currentTime % 60)).padStart(2, "0")}`
                  : "00:00"}
                {trackDuration > 0 && <span className="text-white/40"> / {formatDuration(trackDuration)}</span>}
  </p>
  
  <p className="text-base text-white/50 mb-6">
  {currentTrack ? `Track ${getVisibleIndex(currentTrack.id) + 1} of ${visiblePlaylist.length}` : "Upload tracks to begin"}
  </p>

              {/* Playback Controls */}
              <div className="flex items-center justify-center gap-8">
                <button 
                  onClick={() => {
                    if (isPlaying && !isGapPaused) {
                      setShowSkipBackConfirm(true);
                    } else {
                      goToPreviousTrack();
                    }
                  }}
                  className="grid h-12 w-12 place-items-center rounded-full border border-white/20 bg-white/[0.06] text-white/85 hover:bg-white/15 hover:border-white/30 transition"
                >
                  <StepBack size={24} />
                </button>

                <button
                  onClick={() => {
                    if (isPlaying && !isGapPaused) {
                      setShowPauseConfirm(true);
                    } else {
                      toggleSession();
                    }
                  }}
                  disabled={!currentTrack && playlist.length === 0}
                  className="w-16 h-16 rounded-full bg-gradient-to-r from-pink-500 to-orange-500 text-white flex items-center justify-center disabled:opacity-40 shadow-[0_0_40px_rgba(255,79,179,0.4)] hover:shadow-[0_0_60px_rgba(255,79,179,0.6)] transition"
                >
                  {isGapPaused ? (
                    <span className="text-2xl font-black tabular-nums countdown-flash" key={gapCountdown}>{gapCountdown}</span>
                  ) : isPlaying ? <Pause size={28} /> : <Play size={28} />}
                </button>

                <button 
                  onClick={() => {
                    if (isPlaying && !isGapPaused) {
                      setShowSkipForwardConfirm(true);
                    } else {
                      goToNextTrack();
                    }
                  }}
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
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowFullscreenQueuePlaylist(true)}
                  className="flex items-center gap-1 px-2 py-1 rounded-lg bg-pink-500/10 border border-pink-500/30 text-pink-400 text-[10px] font-bold hover:bg-pink-500/20 transition"
                >
  <Plus size={12} />
  Queue
  </button>
  <span className="text-[10px] text-white/50">{visiblePlaylist.length} tracks{hiddenTrackIds.size > 0 ? ` (${hiddenTrackIds.size} hidden)` : ''}</span>
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

                    return (
                      <div
                        key={track.id}
                        className={`flex items-center gap-2 p-2 rounded-lg mb-1.5 transition cursor-pointer ${
                          isActiveTrack
                            ? "bg-gradient-to-r from-pink-500/20 to-orange-500/10 border border-pink-500/30"
                            : isCompleted
                            ? "opacity-50 bg-white/[0.02]"
                            : "bg-white/[0.03] hover:bg-white/[0.06]"
                        }`}
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

      {/* Sidebar */}
      <aside
        onMouseEnter={() => setSidebarOpen(true)}
        onMouseLeave={() => setSidebarOpen(false)}
        className={`fixed left-0 top-0 z-50 hidden md:flex h-screen flex-col bg-[#050816] border-r border-white/10 transition-all duration-300 overflow-hidden ${
          sidebarOpen ? "w-[300px]" : "w-[76px]"
        }`}
      >
        <nav className="flex flex-col gap-2 px-3 pt-6">
          {[
            [Home, "Home", "player", "pink"],
            [ListMusic, "Playlists", "playlists", "pink"],
            [Settings, "Settings", "settings", "pink"],
          ].map(([Icon, label, page, color]: any) => {
            const activeStyles: Record<string, string> = {
              pink: "bg-gradient-to-r from-[#ff4fa3]/18 to-[#ff8a00]/10 text-white border border-[#ff4fa3]/45 shadow-[0_0_15px_rgba(255,79,163,0.15)]",
              sunset: "bg-gradient-to-r from-[#ff4fa3]/15 to-[#ff8a00]/15 text-[#ff8a00] border border-[#ff8a00]/40 shadow-[0_0_15px_rgba(255,138,0,0.2)]",
            };
            return (
              <button
                key={label}
                onClick={() => setActivePage(page)}
                className={`flex w-full items-center gap-3 rounded-2xl px-4 py-4 transition-all duration-200 ${
                  activePage === page
                    ? activeStyles[color]
                    : "text-[#cbd5e1] hover:text-white hover:bg-white/[0.03] border border-transparent"
                }`}
              >
                <Icon size={22} className="shrink-0" />
                <span className={`whitespace-nowrap overflow-hidden transition-all duration-300 ${
                  sidebarOpen ? "w-auto opacity-100" : "w-0 opacity-0"
                }`}>{label}</span>
              </button>
            );
          })}
        </nav>

        {/* Pro Coming Soon Badge */}
        <div className={`mx-3 mt-4 flex items-center gap-3 rounded-2xl px-4 py-3 bg-gradient-to-r from-[#ff4fa3]/12 to-[#ff8a00]/8 border border-[#ff4fa3]/25 cursor-default`}>
          <div className="shrink-0 h-6 w-6 rounded-full bg-gradient-to-br from-[#ff4fa3] to-[#ff8a00] flex items-center justify-center">
            <span className="text-[10px] font-bold text-white">PRO</span>
          </div>
          <div className={`whitespace-nowrap overflow-hidden transition-all duration-300 ${
            sidebarOpen ? "w-auto opacity-100" : "w-0 opacity-0"
          }`}>
            <div className="text-xs font-semibold text-[#ff4fa3]">EQHO Player Pro</div>
            <div className="text-[10px] text-[#7c8596]">Coming September</div>
          </div>
        </div>

        <div className={`mt-auto mb-6 mx-3 flex flex-col gap-2 overflow-hidden`}>
          <div className="flex items-center gap-3 px-4 py-3">
            <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-gradient-to-br from-[#ff4fa3] to-[#ff8a00] text-sm font-bold uppercase">
              {user?.email?.charAt(0) || 'U'}
            </div>
            <div className={`whitespace-nowrap transition-all duration-300 min-w-0 ${
              sidebarOpen ? "w-auto opacity-100" : "w-0 opacity-0"
            }`}>
              <div className="text-sm text-white truncate max-w-[180px]">{user?.user_metadata?.full_name || 'User'}</div>
              <div className="text-xs text-white/65 truncate max-w-[180px]">{user?.email || ''}</div>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className={`flex items-center gap-3 mx-1 px-3 py-2 rounded-xl text-red-400 hover:bg-red-500/10 transition ${
              sidebarOpen ? "" : "justify-center"
            }`}
          >
            <LogOut size={18} className="shrink-0" />
            <span className={`whitespace-nowrap overflow-hidden transition-all duration-300 text-sm ${
              sidebarOpen ? "w-auto opacity-100" : "w-0 opacity-0"
            }`}>Logout</span>
          </button>
        </div>
      </aside>

      {/* Mobile Navigation Bar */}
      <nav className="fixed top-0 left-0 right-0 z-50 flex md:hidden items-center justify-between px-3 py-2 bg-[#050816] border-b border-white/10">
        <EqhoBrand className="h-[28px] w-[100px]" />
        <div className="flex items-center gap-1">
          {[
            [Home, "player", "pink"],
            [ListMusic, "playlists", "pink"],
            [Settings, "settings", "pink"],
          ].map(([Icon, page, color]: any) => {
            const activeColors: Record<string, string> = {
              pink: "text-[#ff4fa3] bg-gradient-to-r from-[#ff4fa3]/15 to-[#ff8a00]/10",
            };
            return (
              <button
                key={page}
                onClick={() => setActivePage(page)}
                className={`p-2.5 rounded-xl transition-all duration-200 ${
                  activePage === page
                    ? activeColors[color]
                    : "text-[#cbd5e1] hover:text-white hover:bg-white/[0.03]"
                }`}
              >
                <Icon size={20} />
              </button>
            );
          })}
          <button
            onClick={handleLogout}
            className="p-2.5 rounded-xl text-red-400 hover:bg-red-500/10 transition"
          >
            <LogOut size={20} />
          </button>
        </div>
      </nav>

      {/* Main Content Area */}
      <main className="md:ml-[76px] h-[calc(100vh-104px)] overflow-y-auto overflow-x-auto px-4 md:px-6 pt-14 md:pt-3 w-full box-border">

        {activePage === "player" && (
          <div className="grid grid-cols-1 md:grid-cols-[160px_minmax(150px,0.4fr)_minmax(400px,1fr)] gap-3 w-full pr-4">
            {/* LEFT: UPLOAD / TRACKS / PLAYLISTS */}
            <div className="hidden md:flex flex-col gap-3 min-w-0 overflow-hidden">
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
                  <p className="text-white font-bold text-xs">Drop files or folders</p>
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
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-sm p-3 shadow-[0_0_30px_rgba(0,0,0,0.2)] overflow-hidden">
                <h2 className="text-[#ff8a00] uppercase tracking-[0.15em] text-[10px] font-black mb-2">Uploaded Tracks</h2>
                {uploadedTracks.length === 0 ? (
                  <p className="text-white/40 text-center py-4 text-xs">No tracks uploaded</p>
                ) : (
                  <div className="space-y-2 max-h-[150px] overflow-y-auto">
                    {uploadedTracks.map((track) => (
                      <div
                        key={track.id}
                        draggable
                        onDragStart={(e) => {
                          e.dataTransfer.setData("trackId", track.id);
                          e.dataTransfer.setData("trackJson", JSON.stringify(track));
                          e.dataTransfer.effectAllowed = "move";
                        }}
                        className="flex items-center gap-2 cursor-grab active:cursor-grabbing"
                      >
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setUploadedTracks((prev) => prev.filter((t) => t.id !== track.id));
                          }}
                          className="grid h-5 w-5 place-items-center rounded-full border border-white/20 bg-white/5 text-white/60 hover:border-red-500/60 hover:text-red-400"
                        >
                          <X size={10} />
                        </button>
                        <p className="truncate text-white text-[11px] flex-1">{track.title}</p>
                        <PlayPauseButton track={track} onPlay={handleUploadedTrackPlayPause} />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* MIDDLE: UP NEXT (IN ORDER) */}
            <div className="flex flex-col gap-3 order-first md:order-none min-w-0 overflow-hidden">
              <Card className="relative flex-1 overflow-hidden bg-[#090f1c] p-3 md:p-4 max-h-[45vh] md:max-h-[50vh] xl:max-h-none">
                <div className="flex items-center justify-between">
                  <h2 className="text-[10px] md:text-xs font-bold tracking-widest text-[#ff8a00]">UP NEXT (IN ORDER)</h2>
                  <button
                    onClick={() => {
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
                </div>
                <div className="mt-1 border-b border-white/10 pb-2 flex items-center justify-between">
                  <p className="text-[10px] md:text-xs text-white/80">Drag to re-order your playlist</p>
                  {hiddenTrackIds.size > 0 && (
                    <button
                      onClick={restoreHiddenTracks}
                      className="px-2 py-1 text-[9px] md:text-[10px] font-medium text-cyan-400 bg-cyan-500/10 border border-cyan-500/30 rounded-md hover:bg-cyan-500/20 transition"
                    >
                      Restore {hiddenTrackIds.size} hidden
                    </button>
                  )}
                </div>

                <div className="mt-1 pr-3 md:pr-6 bg-transparent max-h-[300px] md:max-h-[400px] overflow-y-auto">
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
            </div>

            {/* RIGHT: NOW PLAYING / PLAYLIST PREVIEW */}
            <div className="flex flex-col gap-3 w-full overflow-visible">
              <Card className="shrink-0 overflow-hidden px-4 py-4 relative w-full">
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

            <div className="mb-3 md:mb-5 flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-xs md:text-sm font-bold tracking-[0.22em] bg-gradient-to-r from-[#ff4fa3] to-[#ff8a00] bg-clip-text text-transparent shrink-0">
                NOW PLAYING
              </h2>

              {/* Volume Control & Fullscreen */}
              <div className="flex items-center gap-1 shrink-0">
                <button
                  onClick={() => setIsMuted((m) => !m)}
                  className={`grid h-[32px] w-[32px] md:h-[38px] md:w-[38px] shrink-0 place-items-center rounded-lg border transition ${
                    isMuted
                      ? "border-red-500/60 bg-red-500/15 text-red-400 shadow-[0_0_10px_rgba(239,68,68,0.25)]"
                      : "border-pink-500/40 bg-pink-500/10 text-white hover:border-pink-500/70"
                  }`}
                >
                  {isMuted ? <VolumeX size={14} /> : <Volume2 size={14} />}
                </button>

                <div
                  className="relative flex items-center justify-center w-[70px] md:w-[90px] h-[34px] md:h-[40px] rounded-lg border border-white/10 bg-[#090f1c] cursor-pointer overflow-hidden shrink-0"
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
                  className="grid h-[32px] w-[32px] md:h-[38px] md:w-[38px] shrink-0 place-items-center rounded-lg border border-[#ff8a00]/40 bg-[#ff8a00]/10 text-white hover:border-[#ff8a00]/70 hover:bg-[#ff8a00]/20 transition"
                  title="Enter fullscreen mode"
                >
                  <Maximize2 size={14} />
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between gap-2 md:gap-3">
              {/* Left - Album Icon */}
              <div className="grid h-[60px] w-[60px] md:h-[80px] md:w-[80px] shrink-0 place-items-center rounded-xl md:rounded-2xl border border-pink-500/30 bg-gradient-to-br from-pink-500/25 to-cyan-500/15 shadow-[0_0_30px_rgba(236,72,153,0.2)]">
                <Music size={28} className="md:hidden text-pink-400" />
                <Music size={40} className="hidden md:block text-pink-400" />
              </div>

              {/* Centre - Track Info & Progress */}
              <div className="flex-1 min-w-0">
                <h3 className="truncate text-xl md:text-3xl font-bold leading-tight text-white">
                  {currentTrack?.title || "No Track Selected"}
                </h3>
                <p className="mt-1 md:mt-1.5 truncate text-sm md:text-lg text-white/60">
                  {currentTrack ? "Playing" : "Upload tracks to begin"}
                </p>

                {/* Track Elapsed Timer */}
                <div className="mt-3 md:mt-5 text-center">
                  {isGapPaused ? (
                    <div className="text-3xl md:text-5xl font-black tracking-wider text-white tabular-nums countdown-flash" key={gapCountdown}>
                      {gapCountdown}
                    </div>
                  ) : (
                    <div className="text-2xl md:text-4xl font-black tracking-wider text-white tabular-nums">
                      {currentTime > 0 || isPlaying
                        ? `${String(Math.floor(currentTime / 60)).padStart(2, "0")}:${String(Math.floor(currentTime % 60)).padStart(2, "0")}`
                        : "00:00"}
                    </div>
                  )}
                </div>
              </div>

              {/* Right - Playback Controls */}
              <div className="flex items-center justify-center gap-2 md:gap-3 shrink-0">
                <button 
                  onClick={goToPreviousTrack}
                  className="grid h-[36px] w-[36px] md:h-[42px] md:w-[42px] place-items-center rounded-full border border-white/20 bg-white/[0.06] text-white/85 hover:bg-white/15 hover:border-white/30 transition"
                >
                  <StepBack size={18} className="md:hidden" />
                  <StepBack size={22} className="hidden md:block" />
                </button>

                <button
                  onClick={toggleSession}
                  disabled={!currentTrack && playlist.length === 0}
                  className="w-14 h-14 md:w-16 md:h-16 rounded-full bg-gradient-to-r from-pink-500 to-orange-500 text-white flex items-center justify-center disabled:opacity-40 shadow-[0_0_30px_rgba(255,79,179,0.35)] hover:shadow-[0_0_40px_rgba(255,79,179,0.5)] transition"
                >
                  {isGapPaused ? (
                    <span className="text-lg md:text-xl font-black tabular-nums countdown-flash" key={gapCountdown}>{gapCountdown}</span>
                  ) : isPlaying ? (
                    <>
                      <Pause size={24} className="md:hidden" />
                      <Pause size={28} className="hidden md:block" />
                    </>
                  ) : (
                    <>
                      <Play size={24} className="md:hidden" />
                      <Play size={28} className="hidden md:block" />
                    </>
                  )}
                </button>

                <button 
                  onClick={goToNextTrack}
                  className="grid h-[36px] w-[36px] md:h-[42px] md:w-[42px] place-items-center rounded-full border border-white/20 bg-white/[0.06] text-white/85 hover:bg-white/15 hover:border-white/30 transition"
                >
                  <StepForward size={18} className="md:hidden" />
                  <StepForward size={22} className="hidden md:block" />
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

<Card className="relative flex flex-1 min-h-[560px] flex-col overflow-hidden">

            <div className="p-5">
            <div className="flex items-start justify-between border-b border-white/10 pb-2">
              <div>
                <h2 className="text-xl font-bold">{currentPlaylistDisplayName}</h2>
                <p className="text-xs text-white/80">{trackCountLabel} • {routineTimeLabel} total</p>
  </div>
  <div className="mt-2 flex gap-2 flex-wrap">
  <button className="rounded border border-white/20 px-2 py-1 text-[10px]">Edit Playlist</button>
                <button onClick={() => {
      if (sessionRunning || isPlaying) {
        setShowClearPlaylistConfirm(true);
      } else {
        clearPlaylist();
      }
    }} className="rounded border border-pink-500 px-2 py-1 text-[10px] text-pink-500 hover:bg-pink-500/10 transition">Clear Playlist</button>
              </div>
            </div>

            <div className="overflow-hidden">
              <h3 className="mt-2 text-[10px] font-bold uppercase">Session Overview</h3>
              <div className="mt-2 grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-0 md:divide-x md:divide-white/10">
                {[
                  [Music, trackCount, "ROUTINES", "in playlist", "text-purple-400"],
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

              <div className="mt-3 border-y border-white/10 py-2">
                <div className="mb-1.5 flex justify-between text-[10px] uppercase">
                  <span>Session Progress</span>
                  <span className="text-cyan-400">{completedTracks} of {trackCount} completed</span>
                </div>
                <div className="h-[4px] rounded-full bg-white/15">
                  <div 
                    className="h-full rounded-full bg-gradient-to-r from-pink-500 to-cyan-400 transition-all" 
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
                <div className="mt-1.5 flex justify-between text-[10px]">
                  <span className="text-pink-500">{progressPercent}%</span>
                  <span className="text-cyan-400">{remainingTimeLabel} remaining</span>
                </div>
              </div>
            </div>
          </div>
          </Card>
        </div>
          </div>
        )}

        {activePage === "playlists" && (
          <div className="p-4">
            <div className="mb-8 flex flex-col md:flex-row md:items-end md:justify-between gap-4">
              <div>
                <p className="text-pink-400 uppercase tracking-[0.25em] text-sm font-bold">
                  EQHO Library
                </p>
                <h1 className="text-4xl font-black mt-2">Playlists</h1>
                <p className="text-white/50 mt-2">
                  Organise routine music into folders for fast session setup.
                </p>
              </div>
              
              {/* Cloud Sync Status & Refresh */}
              {user && isCloudSyncAvailable() && (
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2 text-sm text-white/60">
                    <Cloud size={16} className="text-cyan-400" />
                    <span>{cloudPlaylists.length} cloud playlist{cloudPlaylists.length !== 1 ? 's' : ''}</span>
                  </div>
                  <button
                    onClick={async () => {
                      const playlists = await fetchCloudPlaylists();
                      setCloudPlaylists(playlists);
                    }}
                    className="px-4 py-2 rounded-xl border border-cyan-500/30 bg-cyan-500/10 text-cyan-400 text-sm font-medium hover:bg-cyan-500/20 transition flex items-center gap-2"
                  >
                    <RefreshCw size={14} />
                    Refresh
                  </button>
                </div>
              )}
            </div>

            {/* Drag and Drop Upload Area */}
            <div className="mb-8">
              <label
                onDrop={async (e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setIsDraggingUpload(false);
                  
                  const items = e.dataTransfer?.items;
                  if (!items) return;
                  
                  // Helper to recursively read folder contents
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
                  
                  // Process each dropped item
                  for (let i = 0; i < items.length; i++) {
                    const item = items[i];
                    const entry = item.webkitGetAsEntry?.();
                    
                    if (entry?.isDirectory) {
                      // Folder dropped - use folder name as playlist name
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
                      // Single file dropped - collect all files for a generic playlist
                      const files = Array.from(e.dataTransfer?.files || []).filter((file) =>
                        file.type.startsWith("audio/")
                      );
                      
                      if (files.length > 0) {
                        // Try to extract folder name from file path if available
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
                      break; // Only process files once
                    }
                  }
                }}
                onDragOver={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                }}
                onDragEnter={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setIsDraggingUpload(true);
                }}
                onDragLeave={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setIsDraggingUpload(false);
                }}
                className={`block cursor-pointer rounded-2xl border border-dashed p-10 text-center transition ${
                  isDraggingUpload
                    ? "border-cyan-300 bg-cyan-400/10 shadow-[0_0_30px_rgba(34,211,238,0.25)]"
                    : "border-pink-500/50 bg-white/[0.03] hover:border-pink-500/80 hover:bg-white/[0.05]"
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
                <UploadCloud size={40} className={`mx-auto mb-3 ${isDraggingUpload ? "text-cyan-300" : "text-pink-400"}`} />
                <p className={`font-bold ${isDraggingUpload ? "text-cyan-300" : "text-white"}`}>
                  Drop your playlist folder here to create a new playlist
                </p>
                <p className="text-white/40 text-sm mt-1">or click to browse</p>
              </label>
            </div>

            {savedPlaylists.length === 0 && cloudPlaylists.length === 0 ? (
              <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-16 text-center">
                <Folder size={64} className="mx-auto mb-4 text-white/20" />
                <h3 className="text-xl font-bold text-white/60">No playlists yet</h3>
                <p className="text-white/40 mt-2">Drag and drop audio files above to create your first playlist</p>
              </div>
            ) : (
              <>
                {/* Local Playlists */}
                {savedPlaylists.length > 0 && (
                  <div className="mb-8">
                    <h2 className="text-lg font-bold text-white/70 mb-4 flex items-center gap-2">
                      <Folder size={20} />
                      Local Playlists
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 md:gap-6">
                      {savedPlaylists.map((localPlaylist) => {
                        const isInCloud = cloudPlaylists.some(cp => cp.id === localPlaylist.id);
                        const isSyncing = syncingPlaylistId === localPlaylist.id;
                        
                        return (
                          <div
                            key={localPlaylist.id}
                            className="rounded-3xl border border-white/10 bg-white/[0.04] p-6
                                       hover:border-pink-500/60 hover:bg-pink-500/10
                                       transition group relative"
                          >
                            <div className="flex items-start justify-between mb-4">
                              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-pink-500 via-purple-500 to-cyan-400 flex items-center justify-center shadow-lg shadow-pink-500/20">
                                <Folder size={28} />
                              </div>
                              
                              {/* Action buttons - web only */}
                              {!isMobileBuild && (
                                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition">
                                  {/* Sync to cloud */}
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleSyncPlaylistToCloud(localPlaylist.id);
                                    }}
                                    disabled={isSyncing}
                                    className="w-9 h-9 rounded-xl bg-white/10 hover:bg-cyan-500/30 flex items-center justify-center transition"
                                    title={isInCloud ? "Re-sync to cloud" : "Upload to cloud"}
                                  >
                                    {isSyncing ? (
                                      <Loader2 size={16} className="animate-spin text-cyan-400" />
                                    ) : syncStatus === 'success' && syncingPlaylistId === localPlaylist.id ? (
                                      <Check size={16} className="text-green-400" />
                                    ) : (
                                      <Cloud size={16} className={isInCloud ? "text-cyan-400" : "text-white/60"} />
                                    )}
                                  </button>
                                  
                                  {/* Delete */}
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setShowDeletePlaylistConfirm({ id: localPlaylist.id, name: localPlaylist.name });
                                    }}
                                    className="w-9 h-9 rounded-xl bg-white/10 hover:bg-red-500/30 flex items-center justify-center transition"
                                    title="Delete playlist"
                                  >
                                    <Trash2 size={16} className="text-white/60" />
                                  </button>
                                </div>
                              )}
                            </div>

                            <h3 className="text-xl font-bold">{localPlaylist.name}</h3>
                            <p className="text-white/45 mt-1">{localPlaylist.tracks.length} tracks</p>
                            
                            {isInCloud && (
                              <div className="mt-3 flex items-center gap-1 text-xs text-cyan-400">
                                <Cloud size={12} />
                                Synced to cloud
                              </div>
                            )}
                            
                            {/* Send to session button */}
                            <button
                              onClick={() => setShowSendToSessionConfirm({ name: localPlaylist.name, tracks: localPlaylist.tracks })}
                              className="mt-4 w-full py-2 rounded-xl bg-gradient-to-r from-pink-500/20 to-orange-500/20 
                                         border border-pink-500/30 text-pink-400 font-medium
                                         hover:from-pink-500/30 hover:to-orange-500/30 transition"
                            >
                              Send to Session
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Cloud Playlists (not downloaded locally) */}
                {cloudPlaylists.filter(cp => !savedPlaylists.some(sp => sp.id === cp.id)).length > 0 && (
                  <div>
                    <h2 className="text-lg font-bold text-white/70 mb-4 flex items-center gap-2">
                      <Cloud size={20} className="text-cyan-400" />
                      Cloud Playlists
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 md:gap-6">
                      {cloudPlaylists
                        .filter(cp => !savedPlaylists.some(sp => sp.id === cp.id))
                        .map((cloudPlaylist) => {
                          const isDownloading = downloadingPlaylistId === cloudPlaylist.id;
                          
                          return (
                            <div
                              key={cloudPlaylist.id}
                              className="rounded-3xl border border-cyan-500/30 bg-cyan-500/5 p-6
                                         hover:border-cyan-400/60 hover:bg-cyan-500/10
                                         transition group relative"
                            >
                              <div className="flex items-start justify-between mb-4">
                                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-cyan-500 via-blue-500 to-purple-400 flex items-center justify-center shadow-lg shadow-cyan-500/20">
                                  <Cloud size={28} />
                                </div>
                                
                                {/* Action buttons */}
                                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition">
                                  {/* Download */}
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleDownloadCloudPlaylist(cloudPlaylist.id);
                                    }}
                                    disabled={isDownloading}
                                    className="w-9 h-9 rounded-xl bg-white/10 hover:bg-cyan-500/30 flex items-center justify-center transition"
                                    title="Download to device"
                                  >
                                    {isDownloading ? (
                                      <Loader2 size={16} className="animate-spin text-cyan-400" />
                                    ) : (
                                      <Download size={16} className="text-cyan-400" />
                                    )}
                                  </button>
                                  
                                  {/* Delete - web only */}
                                  {!isMobileBuild && (
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setShowDeletePlaylistConfirm({ id: cloudPlaylist.id, name: cloudPlaylist.name });
                                      }}
                                      className="w-9 h-9 rounded-xl bg-white/10 hover:bg-red-500/30 flex items-center justify-center transition"
                                      title="Delete from cloud"
                                    >
                                      <Trash2 size={16} className="text-white/60" />
                                    </button>
                                  )}
                                </div>
                              </div>

                              <h3 className="text-xl font-bold">{cloudPlaylist.name}</h3>
                              <p className="text-white/45 mt-1">
                                {cloudPlaylist.track_order?.length || 0} tracks
                              </p>
                              <p className="text-cyan-400/60 text-xs mt-1">
                                Tap download to use offline
                              </p>
                            </div>
                          );
                        })}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {activePage === "settings" && (
          <div className="p-8">
            <div className="flex items-center justify-between mb-8">
              <div>
                <p className="text-cyan-300 uppercase tracking-[0.25em] text-sm font-bold">
                  EQHO System Settings
                </p>
                <h1 className="text-4xl font-black mt-2">Settings</h1>
                <p className="text-white/50 mt-2">
                  Control playback, sessions, uploads, display and coach workflow.
                </p>
              </div>

              <button className="px-5 py-3 rounded-2xl bg-gradient-to-r from-pink-500 to-orange-500 font-bold shadow-lg shadow-pink-500/20">
                <Save size={20} className="inline mr-2" />
                Save Settings
              </button>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <SettingsSection icon={<Headphones size={22} />} title="Playback">
                <NumberSetting label="Default Volume" value={settings.defaultVolume} suffix="%" min={0} max={100} step={5} onChange={(v) => updateSetting("defaultVolume", v)} />
                <ToggleSetting label="Autoplay Next Track" value={settings.autoplayNext} onChange={(v) => updateSetting("autoplayNext", v)} />
              </SettingsSection>

              <SettingsSection icon={<Timer size={22} />} title="Session Controls">
                <NumberSetting label="Default Gap Between Routines" value={settings.gapSeconds} suffix="sec" min={0} max={120} step={5} onChange={(v) => updateSetting("gapSeconds", v)} />
                <NumberSetting label="Default Playlist Repeats" value={settings.playlistRepeats} suffix="times" min={1} max={20} step={1} onChange={(v) => updateSetting("playlistRepeats", v)} />
                <ToggleSetting label="Back-to-Back Mode Default" value={settings.backToBack} onChange={(v) => updateSetting("backToBack", v)} />
              </SettingsSection>

              <SettingsSection icon={<SlidersHorizontal size={22} />} title="Coach Display">
                <ToggleSetting label="Show Countdown Timer" value={settings.showCountdown} onChange={(v) => updateSetting("showCountdown", v)} />
                <NumberSetting label="Countdown Before Routine" value={settings.countdownSeconds} suffix="sec" min={0} max={15} step={1} onChange={(v) => updateSetting("countdownSeconds", v)} />
              </SettingsSection>
            </div>
          </div>
        )}

      </main>

      {/* Fixed Bottom Control Bar */}
      <div className="fixed bottom-0 left-0 md:left-[76px] right-0 z-40 h-[104px] w-full min-w-0 max-w-full overflow-hidden bg-[#050816] pb-[env(safe-area-inset-bottom)]">
        <div className="session-bottom-divider" />

        <div className="w-full px-2 md:px-4 py-2 md:py-3 overflow-hidden">
          <div className="flex flex-wrap items-center justify-center md:justify-start gap-2 md:gap-4">
            {/* Gap Between Routines */}
            <div className="flex items-center gap-2 md:gap-3">
              <div className="grid h-9 w-9 md:h-11 md:w-11 shrink-0 place-items-center rounded-full border border-white text-white">
                <Users size={18} className="md:hidden" />
                <Users size={20} className="hidden md:block" />
              </div>
              <div>
                <div className="text-[9px] md:text-[10px] font-medium tracking-wide text-white/80">GAP BETWEEN ROUTINES</div>
                <div className="mt-1 flex items-center rounded border border-white/20 bg-white/5">
                  <button 
                    onClick={() => setGapSeconds((v) => Math.max(0, v - 5))}
                    className="px-2 md:px-2.5 py-1 md:py-1.5 text-white/90 hover:text-white"
                  >
                    <Minus size={12} className="md:hidden" />
                    <Minus size={14} className="hidden md:block" />
                  </button>
                  <div className="border-x border-white/15 px-3 md:px-4 py-1 md:py-1.5 text-sm md:text-base font-semibold text-white">{gapSeconds} sec</div>
                  <button 
                    onClick={() => setGapSeconds((v) => Math.min(120, v + 5))}
                    className="px-2 md:px-2.5 py-1 md:py-1.5 text-white/90 hover:text-white"
                  >
                    <Plus size={12} className="md:hidden" />
                    <Plus size={14} className="hidden md:block" />
                  </button>
                </div>
              </div>
            </div>

            {/* Back To Back */}
            <div className="flex items-center gap-2 md:gap-3">
              <div className="grid h-9 w-9 md:h-11 md:w-11 shrink-0 place-items-center rounded-full border border-pink-500 text-pink-500">
                <RefreshCw size={18} className="md:hidden" />
                <RefreshCw size={20} className="hidden md:block" />
              </div>
              <div>
                <div className="text-[9px] md:text-[10px] font-medium tracking-wide text-white/80">BACK TO BACK</div>
                <div className="mt-1 flex items-center gap-3">
                  <button 
                    onClick={() => setBackToBack((v) => !v)}
                    className="flex items-center gap-2"
                  >
                    <span className="text-sm font-medium text-white">{backToBack ? "On" : "Off"}</span>
                    <div className={`h-6 w-12 rounded-full border p-0.5 transition-colors duration-200 ${
                      backToBack 
                        ? "border-pink-500 bg-pink-500/30" 
                        : "border-white/25 bg-white/15"
                    }`}>
                      <div className={`h-5 w-5 rounded-full transition-transform duration-200 ${
                        backToBack 
                          ? "translate-x-6 bg-pink-500" 
                          : "translate-x-0 bg-white/50"
                      }`} />
                    </div>
                  </button>
                </div>
              </div>
            </div>

            {/* Total Session Time */}
            <div className="flex items-center gap-2 md:gap-3">
              <div className="grid h-9 w-9 md:h-11 md:w-11 shrink-0 place-items-center rounded-full border border-orange-400 text-orange-400">
                <Clock size={20} className="md:hidden" />
                <Clock size={22} className="hidden md:block" />
              </div>
              <div>
                <div className="text-[9px] md:text-[10px] font-medium tracking-wide text-white/80">TOTAL SESSION TIME</div>
                <div className="text-white text-xl md:text-2xl font-bold">{formatSessionTime(totalSessionSeconds)}</div>
                <div className="text-[9px] md:text-[10px] text-white/60">(including gaps)</div>
              </div>
            </div>

            {/* Repeat Playlist */}
            <div className="flex items-center gap-2 md:gap-3">
              <div className="grid h-9 w-9 md:h-11 md:w-11 shrink-0 place-items-center rounded-full border border-cyan-400 text-cyan-400">
                <Repeat size={18} className="md:hidden" />
                <Repeat size={20} className="hidden md:block" />
              </div>
              <div>
                <div className="text-[9px] md:text-[10px] font-medium tracking-wide text-white/80">REPEAT PLAYLIST</div>
                <div className="mt-1 flex items-center rounded border border-cyan-400/30 bg-cyan-400/5">
                  <button
                    onClick={() => setPlaylistRepeats((v) => Math.max(1, v - 1))}
                    className="px-2 md:px-2.5 py-1 md:py-1.5 text-cyan-300 hover:text-cyan-100 transition"
                  >
                    <Minus size={12} className="md:hidden" />
                    <Minus size={14} className="hidden md:block" />
                  </button>
                  <div className="border-x border-cyan-400/20 px-3 md:px-4 py-1 md:py-1.5 text-sm md:text-base font-semibold text-white">
                    {playlistRepeats === 1 ? "Off" : `${playlistRepeats}x`}
                  </div>
                  <button
                    onClick={() => setPlaylistRepeats((v) => Math.min(99, v + 1))}
                    className="px-2 md:px-2.5 py-1 md:py-1.5 text-cyan-300 hover:text-cyan-100 transition"
                  >
                    <Plus size={12} className="md:hidden" />
                    <Plus size={14} className="hidden md:block" />
                  </button>
                </div>
              </div>
            </div>

            {/* Start Session */}
            <button 
              onClick={toggleSession}
              disabled={!currentTrack && playlist.length === 0}
              className={`h-11 md:h-[52px] min-w-[140px] md:min-w-[160px] rounded-xl text-xs md:text-sm font-bold transition disabled:opacity-40 disabled:cursor-not-allowed ${
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
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/70 backdrop-blur-sm">
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
