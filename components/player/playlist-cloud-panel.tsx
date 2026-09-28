"use client";

import type { DragEvent, ReactNode } from "react";
import {
  AlertCircle,
  Check,
  Cloud,
  CloudOff,
  CloudUpload,
  Download,
  HardDrive,
  ListMusic,
  Loader2,
  MoreHorizontal,
  RefreshCw,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  formatBytes,
  type CloudConflictKind,
  type CloudDeviceStatus,
  type LocalCloudStatus,
} from "@/lib/playlist-cloud-links";

export type PlaylistPanelTab = "device" | "cloud";

export interface LocalPlaylistRow {
  id: string;
  name: string;
  trackCount: number;
  status: LocalCloudStatus;
  uploadProgress: number | null;
}

export interface CloudPlaylistRow {
  id: string;
  name: string;
  trackCount: number;
  updatedAt: string;
  sizeBytes?: number;
  status: CloudDeviceStatus;
  downloadProgress: number | null;
  conflict: CloudConflictKind | null;
}

export interface PanelNotice {
  tone: "success" | "error";
  text: string;
}

interface PlaylistCloudPanelProps {
  variant: "sidebar" | "mobile";
  tab: PlaylistPanelTab;
  onTabChange: (tab: PlaylistPanelTab) => void;
  localRows: LocalPlaylistRow[];
  cloudRows: CloudPlaylistRow[];
  cloudAvailable: boolean;
  uploadSupported: boolean;
  isOnline: boolean;
  cloudLoading: boolean;
  uploadInputId: string;
  notice: PanelNotice | null;
  onUpload: (id: string) => void;
  onAddToQueue: (id: string) => void;
  onOpenPlaylist: (id: string) => void;
  onClear: (id: string) => void;
  onDownload: (cloudId: string) => void;
  onReviewUpdate: (cloudId: string) => void;
  onRefreshCloud: () => void;
  onRowDrop?: (id: string, e: DragEvent<HTMLDivElement>) => void;
  renderLocalExtra?: (id: string) => ReactNode;
}

const LOCAL_STATUS_META: Record<LocalCloudStatus, { label: string; className: string }> = {
  "not-uploaded": { label: "Not uploaded", className: "text-white/50" },
  uploading: { label: "Uploading…", className: "text-[#ff8a00]" },
  synced: { label: "Synced", className: "text-green-400" },
  "updates-available": { label: "Updates available", className: "text-[#ff8a00]" },
  "upload-failed": { label: "Upload failed", className: "text-red-400" },
};

function formatUpdated(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });
}

export function PlaylistCloudPanel(props: PlaylistCloudPanelProps) {
  const { variant, tab, onTabChange } = props;
  const compact = variant === "sidebar";

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-2">
      <div role="tablist" aria-label="Playlist location" className="grid shrink-0 grid-cols-2 gap-1 rounded-lg border border-white/10 bg-white/[0.03] p-1">
        {([
          { value: "device", label: "On this device", Icon: HardDrive },
          { value: "cloud", label: "EQHO Cloud", Icon: Cloud },
        ] as const).map(({ value, label, Icon }) => {
          const active = tab === value;
          return (
            <button
              key={value}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => onTabChange(value)}
              className={`flex items-center justify-center gap-1.5 rounded-md px-2 font-semibold transition ${
                compact ? "py-1 text-[10px]" : "py-1.5 text-xs"
              } ${
                active
                  ? value === "device"
                    ? "bg-cyan-500/15 text-cyan-300"
                    : "bg-[#ff4fa3]/15 text-[#ff8fc4]"
                  : "text-white/50 hover:text-white/80"
              }`}
            >
              <Icon size={compact ? 12 : 14} aria-hidden="true" />
              {label}
            </button>
          );
        })}
      </div>

      {!props.isOnline && (
        <p role="status" className="flex shrink-0 items-start gap-1.5 rounded-lg border border-white/10 bg-white/[0.03] px-2 py-1.5 text-[10px] leading-relaxed text-white/60">
          <CloudOff size={12} className="mt-0.5 shrink-0" aria-hidden="true" />
          {"You're offline. Downloaded playlists are still available, but EQHO Cloud cannot be refreshed."}
        </p>
      )}

      {props.notice && (
        <p
          role={props.notice.tone === "error" ? "alert" : "status"}
          className={`flex shrink-0 items-start gap-1.5 rounded-lg border px-2 py-1.5 text-[10px] font-medium leading-relaxed ${
            props.notice.tone === "success"
              ? "border-green-500/30 bg-green-500/10 text-green-400"
              : "border-red-500/30 bg-red-500/10 text-red-400"
          }`}
        >
          {props.notice.tone === "success" ? (
            <Check size={12} className="mt-0.5 shrink-0" aria-hidden="true" />
          ) : (
            <AlertCircle size={12} className="mt-0.5 shrink-0" aria-hidden="true" />
          )}
          {props.notice.text}
        </p>
      )}

      <div role="tabpanel" className="min-h-0 flex-1 overflow-y-auto">
        {tab === "device" ? <DeviceTab {...props} compact={compact} /> : <CloudTab {...props} compact={compact} />}
      </div>
    </div>
  );
}

type TabProps = PlaylistCloudPanelProps & { compact: boolean };

function DeviceTab(props: TabProps) {
  const { localRows, compact } = props;

  if (localRows.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-white/15 p-4 text-center">
        <ListMusic size={24} className="text-white/30" aria-hidden="true" />
        <p className="text-[11px] leading-relaxed text-white/60 text-pretty">
          No playlists on this device yet. Upload a music folder or download a playlist from EQHO Cloud.
        </p>
        <div className="flex flex-wrap justify-center gap-2">
          <label
            htmlFor={props.uploadInputId}
            className="cursor-pointer rounded-md border border-cyan-500/40 bg-cyan-500/10 px-2.5 py-1 text-[10px] font-semibold text-cyan-300 hover:bg-cyan-500/20"
          >
            Upload folder
          </label>
          <button
            type="button"
            onClick={() => props.onTabChange("cloud")}
            className="rounded-md border border-[#ff4fa3]/40 bg-[#ff4fa3]/10 px-2.5 py-1 text-[10px] font-semibold text-[#ff8fc4] hover:bg-[#ff4fa3]/20"
          >
            View EQHO Cloud
          </button>
        </div>
      </div>
    );
  }

  return (
    <ul className="flex flex-col gap-1.5">
      {localRows.map((row) => (
        <li key={row.id}>
          <div
            onDragOver={props.onRowDrop ? (e) => { e.preventDefault(); e.dataTransfer.dropEffect = "move"; } : undefined}
            onDrop={props.onRowDrop ? (e) => props.onRowDrop!(row.id, e) : undefined}
            className="flex flex-col gap-1.5 rounded-lg border border-white/10 bg-white/[0.02] p-2"
          >
            <div className="flex items-start gap-2">
              <ListMusic size={14} className="mt-0.5 shrink-0 text-[#ff4fa3]" aria-hidden="true" />
              <div className="min-w-0 flex-1">
                <p className={`truncate font-semibold text-white ${compact ? "text-[11px]" : "text-sm"}`}>{row.name}</p>
                <p className="flex items-center gap-1.5 text-[10px] text-white/50">
                  <span>{row.trackCount} {row.trackCount === 1 ? "track" : "tracks"}</span>
                  <span aria-hidden="true" className="text-white/20">•</span>
                  <LocalStatusBadge row={row} />
                </p>
              </div>
              <RowMenu row={row} {...props} />
            </div>
            <div className="flex flex-wrap items-center gap-1.5">
              <LocalPrimaryAction row={row} {...props} />
              <button
                type="button"
                onClick={() => props.onAddToQueue(row.id)}
                disabled={row.trackCount === 0}
                className="rounded border border-cyan-500/50 bg-cyan-500/10 px-2 py-1 text-[10px] font-semibold text-cyan-400 hover:bg-cyan-500/20 disabled:opacity-30"
              >
                Add to queue
              </button>
              <button
                type="button"
                onClick={() => props.onOpenPlaylist(row.id)}
                disabled={row.trackCount === 0}
                className="rounded border border-cyan-500/50 bg-cyan-500/10 px-2 py-1 text-[10px] font-semibold text-cyan-400 hover:bg-cyan-500/20 disabled:opacity-30"
              >
                Open playlist
              </button>
            </div>
            {row.status === "uploading" && row.uploadProgress !== null && (
              <ProgressBar value={row.uploadProgress} tone="upload" label={`Uploading ${row.name}`} />
            )}
            {props.renderLocalExtra?.(row.id)}
          </div>
        </li>
      ))}
    </ul>
  );
}

function LocalStatusBadge({ row }: { row: LocalPlaylistRow }) {
  const meta = LOCAL_STATUS_META[row.status];
  const Icon =
    row.status === "synced" ? Check
    : row.status === "uploading" ? Loader2
    : row.status === "upload-failed" ? AlertCircle
    : row.status === "not-uploaded" ? HardDrive
    : CloudUpload;
  return (
    <span className={`flex items-center gap-1 font-medium ${meta.className}`}>
      <Icon size={10} className={row.status === "uploading" ? "animate-spin" : ""} aria-hidden="true" />
      {row.status === "uploading" && row.uploadProgress !== null ? `Uploading… ${row.uploadProgress}%` : meta.label}
    </span>
  );
}

function LocalPrimaryAction({ row, ...props }: TabProps & { row: LocalPlaylistRow }) {
  if (row.status === "synced") {
    return (
      <span className="flex items-center gap-1 rounded border border-green-500/30 bg-green-500/10 px-2 py-1 text-[10px] font-semibold text-green-400">
        <Cloud size={11} aria-hidden="true" />
        <Check size={10} className="-ml-1" aria-hidden="true" />
        Synced
      </span>
    );
  }
  if (!props.cloudAvailable) return null;

  const uploading = row.status === "uploading";
  const failed = row.status === "upload-failed";
  const blocked = !props.uploadSupported || !props.isOnline;
  const label = uploading
    ? "Uploading…"
    : failed
      ? "Try again"
      : row.status === "updates-available"
        ? "Upload changes"
        : "Upload to cloud";
  const hint = !props.uploadSupported
    ? "Uploading is available on the EQHO website"
    : !props.isOnline
      ? "Reconnect to upload"
      : undefined;

  return (
    <button
      type="button"
      onClick={() => props.onUpload(row.id)}
      disabled={uploading || blocked || row.trackCount === 0}
      aria-busy={uploading}
      title={hint}
      className={`flex items-center gap-1 rounded border px-2 py-1 text-[10px] font-semibold transition disabled:cursor-not-allowed ${
        blocked
          ? "border-white/10 bg-white/[0.03] text-white/35"
          : failed
            ? "border-red-500/40 bg-red-500/10 text-red-400 hover:bg-red-500/20"
            : "border-[#ff4fa3]/50 bg-gradient-to-r from-[#ff4fa3]/15 to-[#ff8a00]/15 text-[#ff9ccb] hover:from-[#ff4fa3]/25 hover:to-[#ff8a00]/25 disabled:opacity-60"
      }`}
    >
      {uploading ? <Loader2 size={11} className="animate-spin" aria-hidden="true" />
        : failed ? <AlertCircle size={11} aria-hidden="true" />
        : <CloudUpload size={11} aria-hidden="true" />}
      {label}
      {hint && <span className="sr-only">{` (${hint})`}</span>}
    </button>
  );
}

function RowMenu({ row, ...props }: TabProps & { row: LocalPlaylistRow }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className="flex h-6 w-6 shrink-0 items-center justify-center rounded text-white/50 hover:bg-white/10 hover:text-white"
        aria-label={`More options for ${row.name}`}
        title="More options"
      >
        <MoreHorizontal size={14} aria-hidden="true" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="border-white/10 bg-[#0b1224] text-white">
        <DropdownMenuItem disabled={row.trackCount === 0} onSelect={() => props.onAddToQueue(row.id)}>
          Add to queue
        </DropdownMenuItem>
        <DropdownMenuItem disabled={row.trackCount === 0} onSelect={() => props.onOpenPlaylist(row.id)}>
          Open playlist
        </DropdownMenuItem>
        <DropdownMenuSeparator className="bg-white/10" />
        <DropdownMenuItem onSelect={() => props.onClear(row.id)} className="text-orange-400 focus:text-orange-300">
          Clear
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function CloudTab(props: TabProps) {
  const { cloudRows, compact } = props;

  if (!props.cloudAvailable) {
    return (
      <p className="rounded-xl border border-dashed border-white/15 p-4 text-center text-[11px] leading-relaxed text-white/60">
        Sign in to your EQHO account to use EQHO Cloud.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <p className="text-[10px] text-white/50">
          {cloudRows.length} {cloudRows.length === 1 ? "playlist" : "playlists"} in your account
        </p>
        <button
          type="button"
          onClick={props.onRefreshCloud}
          disabled={!props.isOnline || props.cloudLoading}
          className="flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] font-semibold text-white/60 hover:text-white disabled:cursor-not-allowed disabled:text-white/30"
        >
          <RefreshCw size={11} className={props.cloudLoading ? "animate-spin" : ""} aria-hidden="true" />
          Refresh
        </button>
      </div>

      {props.cloudLoading && cloudRows.length === 0 ? (
        <p className="flex items-center justify-center gap-2 p-4 text-[11px] text-white/50" role="status">
          <Loader2 size={14} className="animate-spin" aria-hidden="true" />
          Loading EQHO Cloud…
        </p>
      ) : cloudRows.length === 0 ? (
        <p className="rounded-xl border border-dashed border-white/15 p-4 text-center text-[11px] leading-relaxed text-white/60 text-pretty">
          No playlists in EQHO Cloud yet. Upload a playlist from this device to access it on your other devices.
        </p>
      ) : (
        <ul className="flex flex-col gap-1.5">
          {cloudRows.map((row) => {
            const updated = formatUpdated(row.updatedAt);
            const size = formatBytes(row.sizeBytes);
            return (
              <li key={row.id} className="flex flex-col gap-1.5 rounded-lg border border-white/10 bg-white/[0.02] p-2">
                <div className="flex items-start gap-2">
                  <Cloud size={14} className="mt-0.5 shrink-0 text-[#ff8fc4]" aria-hidden="true" />
                  <div className="min-w-0 flex-1">
                    <p className={`truncate font-semibold text-white ${compact ? "text-[11px]" : "text-sm"}`}>{row.name}</p>
                    <p className="flex flex-wrap items-center gap-x-1.5 text-[10px] text-white/50">
                      <span>{row.trackCount} {row.trackCount === 1 ? "track" : "tracks"}</span>
                      {updated && (<><span aria-hidden="true" className="text-white/20">•</span><span>Updated {updated}</span></>)}
                      {size && (<><span aria-hidden="true" className="text-white/20">•</span><span>~{size}</span></>)}
                    </p>
                  </div>
                </div>
                <CloudAction row={row} {...props} />
                {row.status === "downloading" && row.downloadProgress !== null && (
                  <ProgressBar value={row.downloadProgress} tone="device" label={`Downloading ${row.name}`} />
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

function CloudAction({ row, ...props }: TabProps & { row: CloudPlaylistRow }) {
  const offline = !props.isOnline;
  const base = "flex w-full items-center justify-center gap-1.5 rounded border px-2 py-1 text-[10px] font-semibold transition disabled:cursor-not-allowed";

  if (row.status === "downloaded") {
    return (
      <span className={`${base} border-green-500/30 bg-green-500/10 text-green-400`}>
        <Check size={11} aria-hidden="true" />
        Downloaded
      </span>
    );
  }
  if (row.status === "downloading") {
    return (
      <span className={`${base} border-cyan-500/40 bg-cyan-500/10 text-cyan-300`} role="status" aria-live="polite">
        <Loader2 size={11} className="animate-spin" aria-hidden="true" />
        Downloading {row.downloadProgress ?? 0}%
      </span>
    );
  }
  if (row.status === "update-available") {
    return (
      <div className="flex flex-col gap-1">
        <span className="flex items-center gap-1 text-[10px] font-medium text-cyan-300">
          <AlertCircle size={10} aria-hidden="true" />
          Update available
        </span>
        <button
          type="button"
          onClick={() => props.onReviewUpdate(row.id)}
          disabled={offline}
          className={`${base} ${offline ? "border-white/10 text-white/35" : "border-cyan-500/50 bg-cyan-500/10 text-cyan-300 hover:bg-cyan-500/20"}`}
        >
          <Download size={11} aria-hidden="true" />
          Download update
        </button>
      </div>
    );
  }
  const failed = row.status === "download-failed";
  return (
    <button
      type="button"
      onClick={() => props.onDownload(row.id)}
      disabled={offline || row.trackCount === 0}
      title={offline ? "Reconnect to download" : undefined}
      className={`${base} ${
        offline
          ? "border-white/10 text-white/35"
          : failed
            ? "border-red-500/40 bg-red-500/10 text-red-400 hover:bg-red-500/20"
            : "border-cyan-500/50 bg-cyan-500/10 text-cyan-300 hover:bg-cyan-500/20"
      }`}
    >
      {failed ? <AlertCircle size={11} aria-hidden="true" /> : <Download size={11} aria-hidden="true" />}
      {failed ? "Download failed — Try again" : "Download to this device"}
    </button>
  );
}

function ProgressBar({ value, tone, label }: { value: number; tone: "device" | "upload"; label: string }) {
  return (
    <div
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={value}
      className="h-1 w-full overflow-hidden rounded-full bg-white/10"
    >
      <div
        className={`h-full rounded-full transition-[width] ${tone === "device" ? "bg-cyan-400" : "bg-gradient-to-r from-[#ff4fa3] to-[#ff8a00]"}`}
        style={{ width: `${Math.max(0, Math.min(100, value))}%` }}
      />
    </div>
  );
}

export type ConflictResolution = "download-update" | "keep-current" | "keep-local-upload" | "replace-with-cloud" | "save-both";

export function PlaylistConflictDialog({
  conflict,
  uploadSupported,
  onResolve,
  onCancel,
}: {
  conflict: { name: string; kind: CloudConflictKind } | null;
  uploadSupported: boolean;
  onResolve: (resolution: ConflictResolution) => void;
  onCancel: () => void;
}) {
  const both = conflict?.kind === "both-changed";
  const btn = "rounded-md border px-3 py-2 text-xs font-semibold transition disabled:cursor-not-allowed disabled:opacity-40";
  return (
    <Dialog open={!!conflict} onOpenChange={(open) => { if (!open) onCancel(); }}>
      <DialogContent className="border-white/10 bg-[#0b1224] text-white sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-balance">{conflict?.name}</DialogTitle>
          <DialogDescription className="text-white/70 text-pretty">
            {both
              ? "This playlist has changes on this device and in EQHO Cloud."
              : "An updated version of this playlist is available in EQHO Cloud."}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="flex flex-col gap-2 sm:flex-col">
          {both ? (
            <>
              <button
                type="button"
                disabled={!uploadSupported}
                title={uploadSupported ? undefined : "Uploading is available on the EQHO website"}
                onClick={() => onResolve("keep-local-upload")}
                className={`${btn} border-[#ff4fa3]/50 bg-[#ff4fa3]/15 text-[#ff9ccb] hover:bg-[#ff4fa3]/25`}
              >
                Keep local version and upload it
              </button>
              <button type="button" onClick={() => onResolve("replace-with-cloud")} className={`${btn} border-cyan-500/50 bg-cyan-500/10 text-cyan-300 hover:bg-cyan-500/20`}>
                Replace with cloud version
              </button>
              <button type="button" onClick={() => onResolve("save-both")} className={`${btn} border-white/20 bg-white/5 text-white hover:bg-white/10`}>
                Save both as separate playlists
              </button>
            </>
          ) : (
            <>
              <button type="button" onClick={() => onResolve("download-update")} className={`${btn} border-cyan-500/50 bg-cyan-500/10 text-cyan-300 hover:bg-cyan-500/20`}>
                Download update
              </button>
              <button type="button" onClick={() => onResolve("keep-current")} className={`${btn} border-white/20 bg-white/5 text-white hover:bg-white/10`}>
                Keep current version
              </button>
            </>
          )}
          <button type="button" onClick={onCancel} className={`${btn} border-transparent text-white/60 hover:text-white`}>
            Cancel
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
