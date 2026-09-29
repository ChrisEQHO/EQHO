import type { ReactNode } from "react";
import {
  AlertCircle,
  Cloud,
  CloudUpload,
  Download,
  FolderUp,
  GitMerge,
  HardDrive,
  ListMusic,
  Maximize2,
  Plane,
  RefreshCw,
  SlidersHorizontal,
  Trash2,
  type LucideIcon,
} from "lucide-react";

const B = ({ children }: { children: ReactNode }) => <strong className="font-semibold text-white">{children}</strong>;

type Section = {
  id: string;
  title: string;
  Icon: LucideIcon;
  body: ReactNode;
};

const SECTIONS: Section[] = [
  {
    id: "upload",
    title: "Uploading a playlist folder",
    Icon: FolderUp,
    body: (
      <>
        <p>
          Put the music for each playlist in its own folder on your computer. Name the folder clearly, for example
          &quot;Regionals Day 1&quot;. Supported formats are MP3, WAV and M4A.
        </p>
        <p>
          Drag the folder onto the upload area, or click it and choose the folder. The folder name becomes the playlist
          name, and the files become its tracks. The new playlist appears under <B>On this device</B>.
        </p>
      </>
    ),
  },
  {
    id: "locations",
    title: "Device playlists and cloud playlists",
    Icon: HardDrive,
    body: (
      <>
        <p>The playlist panel has two tabs:</p>
        <ul>
          <li>
            <B>On this device</B> holds playlists stored on this device. These are ready to play offline.
          </li>
          <li>
            <B>EQHO Cloud</B> holds playlists saved to your EQHO account. You can see them on any device where you are
            signed in, but you can only play them offline once you have downloaded them to that device.
          </li>
        </ul>
        <p>
          Each device playlist shows its cloud status: <B>Saved to cloud</B>, <B>Changes not saved</B>,{" "}
          <B>Not saved to cloud</B>, <B>Update available</B> or <B>Conflict needs review</B>.
        </p>
      </>
    ),
  },
  {
    id: "save-one",
    title: "Saving playlists to EQHO Cloud",
    Icon: CloudUpload,
    body: (
      <>
        <p>
          <B>One playlist:</B> on a playlist under <B>On this device</B>, choose <B>Save to EQHO Cloud</B>. The audio
          and running order are uploaded to your account. When it finishes, the status changes to <B>Saved to cloud</B>.
        </p>
        <p>
          <B>All playlists:</B> in Settings, choose <B>Save all to EQHO Cloud</B> to upload every playlist on this
          device.
        </p>
        <p>
          If an upload fails, the playlist shows <B>Upload failed</B>. Tracks that did not upload are not counted as
          saved, so try again before you rely on the cloud copy. If a device shows &quot;Uploading is available on the
          EQHO website&quot;, upload from the website instead. That device can still download playlists.
        </p>
      </>
    ),
  },
  {
    id: "download",
    title: "Downloading a playlist to another device",
    Icon: Download,
    body: (
      <>
        <p>
          Sign in with the same EQHO account email, open the <B>EQHO Cloud</B> tab and choose{" "}
          <B>Download to this device</B> on the playlist. Audio is never downloaded automatically, including in the
          installed apps. Each device has to download each playlist it needs.
        </p>
        <p>
          <B>Confirming a playlist is ready offline:</B> once the download finishes, the playlist appears under{" "}
          <B>On this device</B>, which is where playlists that are ready to play offline are kept. If a download fails,
          the playlist shows <B>Download failed</B>. Choose <B>Try download again</B>.
        </p>
      </>
    ),
  },
  {
    id: "open-add",
    title: "Opening versus adding a playlist",
    Icon: ListMusic,
    body: (
      <>
        <ul>
          <li>
            <B>Open</B> replaces the current session queue with this playlist. If a session is playing, you are asked
            to confirm first.
          </li>
          <li>
            <B>Add to session</B> adds this playlist&apos;s tracks to the end of the current queue. Use it to combine
            several playlists into one session. If the queue is empty, it starts a new queue.
          </li>
        </ul>
      </>
    ),
  },
  {
    id: "queue",
    title: "Building and reordering the session queue",
    Icon: ListMusic,
    body: (
      <>
        <p>
          The session queue shows the tracks that will play, in order. To reorder, drag a track row up or down. A cyan
          line shows where it will land.
        </p>
        <ul>
          <li>
            Click a track&apos;s <B>X</B> to hide it. Hidden tracks are skipped but stay in the queue. Choose{" "}
            <B>Unhide</B> to bring one back, or <B>Restore</B> in the queue header to bring them all back.
          </li>
          <li>
            <B>Reset</B> restores the original order and marks every track as unplayed.
          </li>
          <li>
            <B>Clear Playlist</B> empties the session queue. It does not delete any saved playlist.
          </li>
        </ul>
      </>
    ),
  },
  {
    id: "timing",
    title: "Gaps, countdowns, repeats and back-to-back",
    Icon: SlidersHorizontal,
    body: (
      <ul>
        <li>
          <B>Gap</B>: the pause between routines. Change it with the +/- buttons in 5-second steps.
        </li>
        <li>
          <B>Countdown Before Routine</B> (Settings): how many of the final gap seconds beep as a get-ready cue.
        </li>
        <li>
          <B>Repeat Playlist</B>: how many times the whole queue plays.
        </li>
        <li>
          <B>Back to Back (B2B)</B>: each routine plays twice in a row before moving on.
        </li>
        <li>
          The total session time includes tracks, gaps, repeats and B2B. Changing a default in Settings during a
          session does not restart or reset playback.
        </li>
      </ul>
    ),
  },
  {
    id: "coach",
    title: "Main player and Coach Mode",
    Icon: Maximize2,
    body: (
      <>
        <p>
          The main player and Coach Mode control the same session, so play, pause, skip and the timer stay in step
          when you switch between them.
        </p>
        <p>
          Choose <B>Coach</B> in the header to open Coach Mode, a large display for gyms and projectors. Press Escape to
          exit. Coach Display options are in Settings.
        </p>
      </>
    ),
  },
  {
    id: "travel",
    title: "Preparing for offline use before travelling",
    Icon: Plane,
    body: (
      <ol>
        <li>On a connected device, check that each playlist you need shows <B>Saved to cloud</B>.</li>
        <li>
          On the device you are travelling with, choose <B>Download to this device</B> for each playlist. Choose{" "}
          <B>Update download</B> on any playlist that offers it.
        </li>
        <li>Confirm each playlist appears under <B>On this device</B>.</li>
        <li>Turn on airplane mode and open one playlist to check it plays.</li>
      </ol>
    ),
  },
  {
    id: "update",
    title: "Updating a cloud playlist",
    Icon: RefreshCw,
    body: (
      <>
        <p>
          After you edit a playlist that is already in the cloud, it shows <B>Changes not saved</B>. Choose{" "}
          <B>Save changes</B> to update the cloud copy.
        </p>
        <p>
          Other devices then show <B>Update available</B>. Choose <B>Update download</B> there to replace the copy on
          that device, or <B>Keep current version</B> to keep it. That update won&apos;t be offered again until the
          cloud copy changes.
        </p>
      </>
    ),
  },
  {
    id: "conflicts",
    title: "Resolving device and cloud conflicts",
    Icon: GitMerge,
    body: (
      <>
        <p>
          <B>Conflict needs review</B> means the playlist was changed both on this device and in EQHO Cloud. Choose{" "}
          <B>Review conflict</B> and pick one option:
        </p>
        <ul>
          <li>
            <B>Keep device version and upload it</B>: replaces the cloud copy. Cloud changes are overwritten.
          </li>
          <li>
            <B>Replace device version with cloud version</B>: replaces the copy on this device. Changes made on this
            device are lost.
          </li>
          <li>
            <B>Keep both</B>: downloads the cloud copy as a separate playlist and renames this device&apos;s copy to
            &quot;(this device)&quot;. Nothing is overwritten.
          </li>
          <li>
            <B>Cancel</B>: nothing changes.
          </li>
        </ul>
      </>
    ),
  },
  {
    id: "remove",
    title: "Removing and deleting playlists",
    Icon: Trash2,
    body: (
      <ul>
        <li>
          <B>Remove from this device</B> (in a device playlist&apos;s More options menu) deletes the copy on this device
          only. The EQHO Cloud copy is kept, and you can download it again later.
        </li>
        <li>
          <B>Delete from EQHO Cloud permanently</B> (in a cloud playlist&apos;s menu) removes the playlist and its audio
          from your account, so no device can download it again. This cannot be undone.
        </li>
        <li>
          <B>Download Playlists</B> in Settings saves a ZIP of your playlists&apos; audio files plus a{" "}
          <code className="rounded bg-white/10 px-1 text-xs">playlist_info.json</code> with each track&apos;s name, order
          and duration. It does not include your settings, gaps or session presets.
        </li>
      </ul>
    ),
  },
  {
    id: "troubleshoot",
    title: "When a playlist will not play",
    Icon: AlertCircle,
    body: (
      <ul>
        <li>
          Check that it appears under <B>On this device</B>. Cloud-only playlists must be downloaded first.
        </li>
        <li>
          If it shows <B>Download failed</B> or <B>Update available</B>, choose <B>Try download again</B> or{" "}
          <B>Update download</B>.
        </li>
        <li>Check the queue isn&apos;t empty and the tracks aren&apos;t all hidden. Choose <B>Restore</B> to unhide them.</li>
        <li>Check the device volume and the player volume.</li>
        <li>Make sure every device is signed in with the same EQHO account email.</li>
        <li>
          If the source files are damaged or in an unsupported format, re-upload the folder from your computer.
        </li>
      </ul>
    ),
  },
];

export function HelpGuideSections() {
  return (
    <>
      <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-6">
        <div className="mb-3 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[#ff4fa3] to-[#ff8a00]">
            <Cloud size={18} aria-hidden="true" />
          </div>
          <h2 className="text-xl font-bold">Getting started</h2>
        </div>
        <p className="text-sm leading-relaxed text-white/70 text-pretty">
          Upload a playlist folder, choose <B>Open</B> or <B>Add to session</B>, set your gap and repeats, then press
          Start Session. To use a playlist on another device, save it to EQHO Cloud here and download it there.
        </p>
        <nav aria-label="Guide topics" className="mt-4 flex flex-wrap gap-2">
          {SECTIONS.map((s) => (
            <a
              key={s.id}
              href={`#help-${s.id}`}
              className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-white/70 transition hover:border-white/25 hover:text-white"
            >
              {s.title}
            </a>
          ))}
        </nav>
      </div>

      {SECTIONS.map(({ id, title, Icon, body }) => (
        <section
          key={id}
          id={`help-${id}`}
          aria-labelledby={`help-${id}-title`}
          className="scroll-mt-4 rounded-2xl border border-white/10 bg-white/[0.02] p-6"
        >
          <div className="mb-3 flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 bg-white/5">
              <Icon size={16} className="text-[#ff8a00]" aria-hidden="true" />
            </div>
            <h2 id={`help-${id}-title`} className="text-lg font-bold text-balance">
              {title}
            </h2>
          </div>
          <div className="flex flex-col gap-3 text-sm leading-relaxed text-white/70 [&_li]:pl-1 [&_ol]:flex [&_ol]:list-decimal [&_ol]:flex-col [&_ol]:gap-1.5 [&_ol]:pl-5 [&_ul]:flex [&_ul]:list-disc [&_ul]:flex-col [&_ul]:gap-1.5 [&_ul]:pl-5">
            {body}
          </div>
        </section>
      ))}
    </>
  );
}
