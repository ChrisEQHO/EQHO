"use client";

import { useState, type DragEvent, type ReactNode } from "react";
import {
  AlertCircle,
  AlertTriangle,
  Check,
  Cloud,
  CloudOff,
  CloudUpload,
  Download,
  HardDrive,
  ListMusic,
  Loader2,
  MoreHorizontal,
  Play,
  Plus,
  RefreshCw,
  X,
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

type TabProps = PlaylistCloudPanelProps & { compact: boolean; errorDetailsFor: (name: string) => string | null };

/*
 * Colour meaning (kept consistent across the panel):
 * cyan = primary action / on this device, violet = EQHO Cloud,
 * emerald = synced only, amber = in progress / needs action, red = failure / destructive.
 */
type Tone = "success" | "progress" | "error" | "cloud" | "device" | "muted";

const TONE_CLASS: Record<Tone, string> = {
  success: "border-emerald-400/30 bg-emerald-400/10 text-emerald-300",
  progress: "border-amber-400/30 bg-amber-400/10 text-amber-300",
  error: "border-red-400/40 bg-red-500/10 text-red-300",
  cloud: "border-violet-400/30 bg-violet-400/10 text-violet-300",
  device: "border-cyan-400/30 bg-cyan-400/10 text-cyan-300",
  muted: "border-white/10 bg-white/5 text-white/60",
};

const FOCUS_RING =
  "outline-none focus-visible:ring-2 focus-visible:ring-cyan-300 focus-visible:ring-offset-2 focus-visible:ring-offset-[#070d1a]";

function buttonSize(compact: boolean) {
  return compact
    ? "min-h-8 px-2.5 text-[11px] [@media(pointer:coarse)]:min-h-11"
    : "min-h-11 px-3 text-xs";
}

const PRIMARY_BTN =
  "inline-flex items-center justify-center gap-1.5 rounded-md bg-cyan-400 font-semibold text-[#051322] transition hover:bg-cyan-300 active:bg-cyan-500 disabled:cursor-not-allowed disabled:bg-white/10 disabled:text-white/40";
const SECONDARY_BTN =
  "inline-flex items-center justify-center gap-1.5 rounded-md border border-white/15 bg-white/[0.04] font-semibold text-white/85 transition hover:border-white/25 hover:bg-white/10 active:bg-white/15 disabled:cursor-not-allowed disabled:text-white/35 disabled:hover:bg-white/[0.04]";
const CLOUD_GHOST_BTN =
  "inline-flex items-center justify-center gap-1.5 rounded-md font-semibold text-violet-300 transition hover:bg-violet-400/10 hover:text-violet-200 active:bg-violet-400/20 disabled:cursor-not-allowed disabled:text-white/35 disabled:hover:bg-transparent";

function cardDomId(variant: string, kind: "local" | "cloud", id: string) {
  return `playlist-card-${variant}-${kind}-${id}`;
}

function formatUpdated(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });
}

function trackLabel(count: number) {
  return `${count} ${count === 1 ? "track" : "tracks"}`;
}

export function PlaylistCloudPanel(props: PlaylistCloudPanelProps) {
  const { variant, tab, onTabChange, notice } = props;
  const compact = variant === "sidebar";
  const [dismissedKey, setDismissedKey] = useState<string | null>(null);

  const failedLocal = props.localRows.filter((r) => r.status === "upload-failed");
  const failedCloud = props.cloudRows.filter((r) => r.status === "download-failed");
  const attentionCount = failedLocal.length + failedCloud.length;
  const attentionKey = [...failedLocal.map((r) => `l:${r.id}`), ...failedCloud.map((r) => `c:${r.id}`)].join("|");
  const showAttention = attentionCount > 0 && dismissedKey !== attentionKey;

  // Error notices that name a failed playlist are shown inside that card's
  // "View details" instead of as a separate large banner.
  const failedNames = [...failedLocal, ...failedCloud].map((r) => r.name);
  const errorNoticeIsForCard =
    notice?.tone === "error" && failedNames.some((name) => notice.text.includes(name));
  const errorDetailsFor = (name: string) =>
    notice?.tone === "error" && notice.text.includes(name) ? notice.text : null;

  const reviewAttention = () => {
    const target = failedLocal[0]
      ? { tab: "device" as const, domId: cardDomId(variant, "local", failedLocal[0].id) }
      : failedCloud[0]
        ? { tab: "cloud" as const, domId: cardDomId(variant, "cloud", failedCloud[0].id) }
        : null;
    if (!target) return;
    if (tab !== target.tab) onTabChange(target.tab);
    let attempts = 0;
    const focusCard = () => {
      const el = document.getElementById(target.domId);
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "nearest" });
        el.focus({ preventScroll: true });
      } else if (attempts++ < 10) {
        requestAnimationFrame(focusCard);
      }
    };
    requestAnimationFrame(focusCard);
  };

  const tabs = [
    { value: "device", label: "On this device", hint: "Ready to play offline", Icon: HardDrive },
    { value: "cloud", label: "EQHO Cloud", hint: "Playlists saved to your account", Icon: Cloud },
  ] as const;

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-2">
      <div
        role="tablist"
        aria-label="Playlist location"
        className="grid shrink-0 grid-cols-2 gap-1 rounded-lg border border-white/10 bg-white/[0.03] p-1"
      >
        {tabs.map(({ value, label, hint, Icon }) => {
          const active = tab === value;
          const activeClass =
            value === "device"
              ? "bg-cyan-400/15 text-cyan-200 ring-1 ring-inset ring-cyan-400/50"
              : "bg-violet-400/15 text-violet-200 ring-1 ring-inset ring-violet-400/50";
          return (
            <button
              key={value}
              type="button"
              role="tab"
              id={`playlist-tab-${variant}-${value}`}
              aria-selected={active}
              aria-controls={`playlist-tabpanel-${variant}`}
              onClick={() => onTabChange(value)}
              className={`flex min-w-0 flex-col items-start gap-0.5 rounded-md px-2 text-left transition ${FOCUS_RING} ${
                compact ? "min-h-10 py-1.5 [@media(pointer:coarse)]:min-h-11" : "min-h-12 py-2"
              } ${active ? activeClass : "text-white/60 hover:bg-white/5 hover:text-white/90 active:bg-white/10"}`}
            >
              <span className={`flex items-center gap-1.5 font-semibold ${compact ? "text-[11px]" : "text-xs"}`}>
                <Icon size={compact ? 13 : 14} aria-hidden="true" />
                {label}
              </span>
              <span className={`leading-tight ${compact ? "text-[10px]" : "text-[11px]"} ${active ? "opacity-80" : "text-white/45"}`}>
                {hint}
              </span>
            </button>
          );
        })}
      </div>

      {!props.isOnline && (
        <p
          role="status"
          className="flex shrink-0 items-start gap-1.5 rounded-lg border border-white/10 bg-white/[0.03] px-2 py-1.5 text-[11px] leading-relaxed text-white/65"
        >
          <CloudOff size={13} className="mt-0.5 shrink-0" aria-hidden="true" />
          {"You're offline. Downloaded playlists still play, but EQHO Cloud can't be reached."}
        </p>
      )}

      <div aria-live="polite" className="shrink-0 empty:hidden">
        {showAttention && (
          <div className={`flex items-center gap-2 rounded-lg border px-2 py-1.5 ${TONE_CLASS.error}`}>
            <AlertTriangle size={14} className="shrink-0" aria-hidden="true" />
            <p className="min-w-0 flex-1 text-[11px] font-semibold leading-snug">
              {attentionCount === 1 ? "1 playlist needs attention" : `${attentionCount} playlists need attention`}
            </p>
            <button
              type="button"
              onClick={reviewAttention}
              className={`rounded px-2 text-[11px] font-semibold text-red-200 underline underline-offset-2 hover:text-white ${FOCUS_RING} min-h-8 [@media(pointer:coarse)]:min-h-11`}
            >
              Review
            </button>
            <button
              type="button"
              onClick={() => setDismissedKey(attentionKey)}
              aria-label="Dismiss attention message"
              className={`flex shrink-0 items-center justify-center rounded text-red-200/80 hover:bg-red-500/15 hover:text-white ${FOCUS_RING} size-8 [@media(pointer:coarse)]:size-11`}
            >
              <X size={14} aria-hidden="true" />
            </button>
          </div>
        )}
      </div>

      {notice && !errorNoticeIsForCard && (
        <p
          role={notice.tone === "error" ? "alert" : "status"}
          className={`flex shrink-0 items-start gap-1.5 rounded-lg border px-2 py-1.5 text-[11px] font-medium leading-relaxed ${
            notice.tone === "success" ? TONE_CLASS.success : TONE_CLASS.error
          }`}
        >
          {notice.tone === "success" ? (
            <Check size={13} className="mt-0.5 shrink-0" aria-hidden="true" />
          ) : (
            <AlertCircle size={13} className="mt-0.5 shrink-0" aria-hidden="true" />
          )}
          {notice.text}
        </p>
      )}

      <div
        role="tabpanel"
        id={`playlist-tabpanel-${variant}`}
        aria-labelledby={`playlist-tab-${variant}-${tab}`}
        className="min-h-0 flex-1 overflow-y-auto"
      >
        {tab === "device" ? (
          <DeviceTab {...props} compact={compact} errorDetailsFor={errorDetailsFor} />
        ) : (
          <CloudTab {...props} compact={compact} errorDetailsFor={errorDetailsFor} />
        )}
      </div>
    </div>
  );
}

function StatusBadge({ tone, icon, spin, children }: { tone: Tone; icon: typeof Check; spin?: boolean; children: ReactNode }) {
  const Icon = icon;
  return (
    <span className={`inline-flex shrink-0 items-center gap-1 rounded-full border px-1.5 py-0.5 text-[10px] font-semibold leading-none ${TONE_CLASS[tone]}`}>
      <Icon size={11} className={spin ? "animate-spin" : ""} aria-hidden="true" />
      {children}
    </span>
  );
}

function PlaylistCardShell({
  domId,
  icon,
  iconTone,
  title,
  meta,
  badge,
  menu,
  compact,
  failed,
  children,
  onDragOver,
  onDrop,
}: {
  domId: string;
  icon: typeof Check;
  iconTone: "device" | "cloud";
  title: string;
  meta: ReactNode;
  badge: ReactNode;
  menu?: ReactNode;
  compact: boolean;
  failed?: boolean;
  children: ReactNode;
  onDragOver?: (e: DragEvent<HTMLDivElement>) => void;
  onDrop?: (e: DragEvent<HTMLDivElement>) => void;
}) {
  const Icon = icon;
  return (
    <div
      id={domId}
      tabIndex={-1}
      onDragOver={onDragOver}
      onDrop={onDrop}
      className={`flex flex-col gap-2 rounded-lg border bg-white/[0.02] p-2 outline-none transition focus-visible:ring-2 focus-visible:ring-red-300/70 ${
        failed ? "border-red-400/35" : "border-white/10 hover:border-white/20"
      }`}
    >
      <div className="flex items-start gap-2">
        <span
          className={`flex shrink-0 items-center justify-center rounded-md ${compact ? "size-7" : "size-9"} ${
            iconTone === "device" ? "bg-cyan-400/10 text-cyan-300" : "bg-violet-400/10 text-violet-300"
          }`}
        >
          <Icon size={compact ? 14 : 16} aria-hidden="true" />
        </span>
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <p
            title={title}
            className={`line-clamp-2 break-words font-semibold leading-snug text-white ${compact ? "text-xs" : "text-sm"}`}
          >
            {title}
          </p>
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <span className="text-[11px] text-white/55">{meta}</span>
            {badge}
          </div>
        </div>
        {menu}
      </div>
      {children}
    </div>
  );
}

function InlineFailure({ message, details }: { message: string; details: string | null }) {
  return (
    <div className="flex flex-col gap-1 rounded-md bg-red-500/10 px-2 py-1.5 text-[11px] leading-relaxed text-red-200">
      <p className="flex items-start gap-1.5">
        <AlertCircle size={13} className="mt-0.5 shrink-0 text-red-300" aria-hidden="true" />
        {message}
      </p>
      {details && (
        <details className="group pl-5">
          <summary className={`cursor-pointer select-none text-red-200/80 underline underline-offset-2 hover:text-white ${FOCUS_RING} rounded`}>
            View details
          </summary>
          <p className="mt-1 break-words text-red-100/80">{details}</p>
        </details>
      )}
    </div>
  );
}

function ActionRow({ compact, children }: { compact: boolean; children: ReactNode }) {
  return (
    <div className={`flex gap-1.5 ${compact ? "flex-wrap" : "flex-col min-[420px]:flex-row min-[420px]:flex-wrap"}`}>
      {children}
    </div>
  );
}

function DeviceTab(props: TabProps) {
  const { localRows, compact } = props;

  if (localRows.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-white/15 p-4 text-center">
        <ListMusic size={24} className="text-white/35" aria-hidden="true" />
        <p className="text-xs leading-relaxed text-white/65 text-pretty">
          No playlists on this device yet. Add a music folder, or download a playlist from EQHO Cloud.
        </p>
        <div className="flex flex-wrap justify-center gap-2">
          <button
            type="button"
            onClick={() => document.getElementById(props.uploadInputId)?.click()}
            className={`${PRIMARY_BTN} ${buttonSize(compact)} ${FOCUS_RING}`}
          >
            <Plus size={13} aria-hidden="true" />
            Add music folder
          </button>
          <button
            type="button"
            onClick={() => props.onTabChange("cloud")}
            className={`${CLOUD_GHOST_BTN} border border-violet-400/30 ${buttonSize(compact)} ${FOCUS_RING}`}
          >
            <Cloud size={13} aria-hidden="true" />
            View EQHO Cloud
          </button>
        </div>
      </div>
    );
  }

  return (
    <ul className="flex flex-col gap-2">
      {localRows.map((row) => (
        <li key={row.id}>
          <LocalCard row={row} {...props} />
        </li>
      ))}
    </ul>
  );
}

function localBadge(row: LocalPlaylistRow) {
  switch (row.status) {
    case "synced":
      return <StatusBadge tone="success" icon={Check}>Synced</StatusBadge>;
    case "uploading":
      return (
        <StatusBadge tone="progress" icon={Loader2} spin>
          {row.uploadProgress !== null ? `Uploading ${row.uploadProgress}%` : "Uploading"}
        </StatusBadge>
      );
    case "upload-failed":
      return <StatusBadge tone="error" icon={AlertCircle}>Upload failed</StatusBadge>;
    case "updates-available":
      return <StatusBadge tone="progress" icon={CloudUpload}>Changes not in cloud</StatusBadge>;
    default:
      return <StatusBadge tone="device" icon={HardDrive}>On this device</StatusBadge>;
  }
}

function LocalCard({ row, ...props }: TabProps & { row: LocalPlaylistRow }) {
  const { compact } = props;
  const size = buttonSize(compact);
  const usable = row.trackCount > 0;
  const failed = row.status === "upload-failed";
  const uploading = row.status === "uploading";
  const uploadBlocked = !props.uploadSupported || !props.isOnline;
  const uploadHint = !props.uploadSupported
    ? "Uploading is available on the EQHO website"
    : !props.isOnline
      ? "Reconnect to upload"
      : undefined;
  const canOfferUpload =
    props.cloudAvailable && (row.status === "not-uploaded" || row.status === "updates-available");

  const openBtn = (primary: boolean) => (
    <button
      type="button"
      onClick={() => props.onOpenPlaylist(row.id)}
      disabled={!usable}
      className={`${primary ? PRIMARY_BTN : SECONDARY_BTN} ${size} ${FOCUS_RING} ${primary && !compact ? "min-[420px]:flex-1" : ""}`}
    >
      <Play size={13} aria-hidden="true" />
      Open playlist
    </button>
  );
  const queueBtn = (
    <button
      type="button"
      onClick={() => props.onAddToQueue(row.id)}
      disabled={!usable}
      className={`${SECONDARY_BTN} ${size} ${FOCUS_RING}`}
    >
      <Plus size={13} aria-hidden="true" />
      Add to queue
    </button>
  );

  return (
    <PlaylistCardShell
      domId={cardDomId(props.variant, "local", row.id)}
      icon={ListMusic}
      iconTone="device"
      title={row.name}
      meta={trackLabel(row.trackCount)}
      badge={localBadge(row)}
      compact={compact}
      failed={failed}
      onDragOver={props.onRowDrop ? (e) => { e.preventDefault(); e.dataTransfer.dropEffect = "move"; } : undefined}
      onDrop={props.onRowDrop ? (e) => props.onRowDrop!(row.id, e) : undefined}
      menu={<RowMenu row={row} {...props} />}
    >
      {failed && (
        <InlineFailure message="Couldn't save this playlist to EQHO Cloud." details={props.errorDetailsFor(row.name)} />
      )}

      {uploading && row.uploadProgress !== null && (
        <ProgressBar value={row.uploadProgress} label={`Uploading ${row.name} to EQHO Cloud`} />
      )}

      <ActionRow compact={compact}>
        {failed ? (
          <>
            <button
              type="button"
              onClick={() => props.onUpload(row.id)}
              disabled={uploadBlocked || !usable}
              title={uploadHint}
              className={`${PRIMARY_BTN} ${size} ${FOCUS_RING} ${!compact ? "min-[420px]:flex-1" : ""}`}
            >
              <RefreshCw size={13} aria-hidden="true" />
              Try upload again
              {uploadHint && <span className="sr-only">{` (${uploadHint})`}</span>}
            </button>
            {openBtn(false)}
            {usable && queueBtn}
          </>
        ) : (
          <>
            {openBtn(true)}
            {queueBtn}
            {canOfferUpload && (
              <button
                type="button"
                onClick={() => props.onUpload(row.id)}
                disabled={uploadBlocked || !usable}
                title={uploadHint}
                className={`${CLOUD_GHOST_BTN} ${size} ${FOCUS_RING}`}
              >
                <CloudUpload size={13} aria-hidden="true" />
                {row.status === "updates-available" ? "Upload changes" : "Save to EQHO Cloud"}
                {uploadHint && <span className="sr-only">{` (${uploadHint})`}</span>}
              </button>
            )}
          </>
        )}
      </ActionRow>

      {canOfferUpload && uploadHint && (
        <p className="text-[10px] leading-relaxed text-white/45">{uploadHint}</p>
      )}

      {props.renderLocalExtra?.(row.id)}
    </PlaylistCardShell>
  );
}

function RowMenu({ row, ...props }: TabProps & { row: LocalPlaylistRow }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className={`flex shrink-0 items-center justify-center rounded-md text-white/55 hover:bg-white/10 hover:text-white ${FOCUS_RING} ${
          props.compact ? "size-8 [@media(pointer:coarse)]:size-11" : "size-11"
        }`}
        aria-label={`More options for ${row.name}`}
        title="More options"
      >
        <MoreHorizontal size={16} aria-hidden="true" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="border-white/10 bg-[#0b1224] text-white">
        <DropdownMenuItem disabled={row.trackCount === 0} onSelect={() => props.onAddToQueue(row.id)}>
          Add to queue
        </DropdownMenuItem>
        <DropdownMenuItem disabled={row.trackCount === 0} onSelect={() => props.onOpenPlaylist(row.id)}>
          Open playlist
        </DropdownMenuItem>
        <DropdownMenuSeparator className="bg-white/10" />
        <DropdownMenuItem onSelect={() => props.onClear(row.id)} className="text-red-300 focus:bg-red-500/15 focus:text-red-200">
          Clear from this device
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function CloudTab(props: TabProps) {
  const { cloudRows, compact } = props;

  if (!props.cloudAvailable) {
    return (
      <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed border-violet-400/25 p-4 text-center">
        <Cloud size={24} className="text-violet-300/70" aria-hidden="true" />
        <p className="text-xs leading-relaxed text-white/65 text-pretty">
          Sign in to your EQHO account to save playlists to EQHO Cloud and use them on your other devices.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between gap-2">
        <p className="text-[11px] text-white/55">
          {cloudRows.length} {cloudRows.length === 1 ? "playlist" : "playlists"} saved to your account
        </p>
        <button
          type="button"
          onClick={props.onRefreshCloud}
          disabled={!props.isOnline || props.cloudLoading}
          aria-busy={props.cloudLoading}
          className={`${SECONDARY_BTN} ${compact ? "min-h-8 px-2 text-[11px] [@media(pointer:coarse)]:min-h-11" : "min-h-11 px-3 text-xs"} ${FOCUS_RING}`}
        >
          <RefreshCw size={12} className={props.cloudLoading ? "animate-spin" : ""} aria-hidden="true" />
          Refresh
        </button>
      </div>

      {props.cloudLoading && cloudRows.length === 0 ? (
        <p className="flex items-center justify-center gap-2 p-4 text-xs text-white/55" role="status">
          <Loader2 size={14} className="animate-spin" aria-hidden="true" />
          Loading EQHO Cloud…
        </p>
      ) : cloudRows.length === 0 ? (
        <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed border-violet-400/25 p-4 text-center">
          <Cloud size={24} className="text-violet-300/70" aria-hidden="true" />
          <p className="text-xs leading-relaxed text-white/65 text-pretty">
            No playlists in EQHO Cloud yet. Choose Save to EQHO Cloud on a playlist on this device to use it on your other devices.
          </p>
        </div>
      ) : (
        <ul className="flex flex-col gap-2">
          {cloudRows.map((row) => (
            <li key={row.id}>
              <CloudCard row={row} {...props} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function cloudBadge(row: CloudPlaylistRow) {
  switch (row.status) {
    case "downloaded":
      return <StatusBadge tone="device" icon={HardDrive}>Downloaded</StatusBadge>;
    case "downloading":
      return (
        <StatusBadge tone="progress" icon={Loader2} spin>
          {`Downloading ${row.downloadProgress ?? 0}%`}
        </StatusBadge>
      );
    case "update-available":
      return <StatusBadge tone="progress" icon={AlertCircle}>Update available</StatusBadge>;
    case "download-failed":
      return <StatusBadge tone="error" icon={AlertCircle}>Download failed</StatusBadge>;
    default:
      return <StatusBadge tone="cloud" icon={Cloud}>In EQHO Cloud</StatusBadge>;
  }
}

function CloudCard({ row, ...props }: TabProps & { row: CloudPlaylistRow }) {
  const { compact } = props;
  const size = buttonSize(compact);
  const offline = !props.isOnline;
  const updated = formatUpdated(row.updatedAt);
  const bytes = formatBytes(row.sizeBytes);
  const meta = [trackLabel(row.trackCount), updated && `Updated ${updated}`, bytes && `~${bytes}`]
    .filter(Boolean)
    .join(" · ");
  const primaryWide = !compact ? "min-[420px]:flex-1" : "";

  let actions: ReactNode;
  if (row.status === "downloaded") {
    actions = (
      <button
        type="button"
        onClick={() => props.onTabChange("device")}
        className={`${SECONDARY_BTN} ${size} ${FOCUS_RING} ${primaryWide}`}
      >
        <HardDrive size={13} aria-hidden="true" />
        Open on this device
      </button>
    );
  } else if (row.status === "downloading") {
    actions = (
      <button type="button" disabled aria-busy="true" className={`${PRIMARY_BTN} ${size} ${primaryWide}`}>
        <Loader2 size={13} className="animate-spin" aria-hidden="true" />
        Downloading…
      </button>
    );
  } else if (row.status === "update-available") {
    actions = (
      <button
        type="button"
        onClick={() => props.onReviewUpdate(row.id)}
        disabled={offline}
        title={offline ? "Reconnect to download" : undefined}
        className={`${PRIMARY_BTN} ${size} ${FOCUS_RING} ${primaryWide}`}
      >
        <Download size={13} aria-hidden="true" />
        Review update
      </button>
    );
  } else {
    const failed = row.status === "download-failed";
    actions = (
      <button
        type="button"
        onClick={() => props.onDownload(row.id)}
        disabled={offline || row.trackCount === 0}
        title={offline ? "Reconnect to download" : undefined}
        className={`${PRIMARY_BTN} ${size} ${FOCUS_RING} ${primaryWide}`}
      >
        {failed ? <RefreshCw size={13} aria-hidden="true" /> : <Download size={13} aria-hidden="true" />}
        {failed ? "Try download again" : "Download"}
        {offline && <span className="sr-only"> (Reconnect to download)</span>}
      </button>
    );
  }

  return (
    <PlaylistCardShell
      domId={cardDomId(props.variant, "cloud", row.id)}
      icon={Cloud}
      iconTone="cloud"
      title={row.name}
      meta={meta}
      badge={cloudBadge(row)}
      compact={compact}
      failed={row.status === "download-failed"}
    >
      {row.status === "not-downloaded" && (
        <p className="text-[11px] leading-relaxed text-white/55">
          Available in EQHO Cloud. Not downloaded to this device yet.
        </p>
      )}
      {row.status === "download-failed" && (
        <InlineFailure
          message="Couldn't download this playlist. Nothing was saved to this device."
          details={props.errorDetailsFor(row.name)}
        />
      )}
      {row.status === "downloading" && row.downloadProgress !== null && (
        <ProgressBar value={row.downloadProgress} label={`Downloading ${row.name} to this device`} />
      )}
      <ActionRow compact={compact}>{actions}</ActionRow>
      {offline && row.status !== "downloaded" && row.status !== "downloading" && (
        <p className="text-[10px] leading-relaxed text-white/45">Reconnect to download.</p>
      )}
    </PlaylistCardShell>
  );
}

function ProgressBar({ value, label }: { value: number; label: string }) {
  return (
    <div
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={value}
      className="h-1.5 w-full overflow-hidden rounded-full bg-white/10"
    >
      <div
        className="h-full rounded-full bg-amber-400 transition-[width]"
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
                className={`${btn} border-violet-400/50 bg-violet-400/15 text-violet-200 hover:bg-violet-400/25`}
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
