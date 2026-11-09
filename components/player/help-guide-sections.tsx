import type { ReactNode } from "react";
import {
  Activity,
  AlertCircle,
  CheckCircle2,
  Cloud,
  CloudOff,
  CloudUpload,
  Database,
  Download,
  FileAudio,
  FolderUp,
  GitMerge,
  HardDrive,
  KeyRound,
  ListMusic,
  Lock,
  Maximize2,
  Plane,
  RefreshCw,
  Repeat,
  SlidersHorizontal,
  Smartphone,
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
    title: "Creating playlists",
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
        <p>
          To save the current session queue as a playlist instead, choose <B>Create New Playlist</B> and give it a name.
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
          If an upload fails, the playlist shows <B>Upload failed</B> and lists each track that did not upload, with the
          reason. Tracks that did not upload are not counted as saved. Choose <B>Retry failed track</B> (or{" "}
          <B>Retry failed tracks</B>) to send only those tracks again, and check the playlist shows{" "}
          <B>Saved to cloud</B> before you rely on the cloud copy. If a device shows &quot;Uploading is available on the
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
          Before downloading, the player checks there is enough free space on this device. If there isn&apos;t, nothing
          is downloaded and you see how much space the playlist needs.
        </p>
        <p>
          If a download fails, the playlist shows <B>Download failed</B> and lists the tracks that did not download.
          Choose <B>Retry failed tracks</B> to fetch only those tracks, or <B>Try download again</B> to start over.
        </p>
      </>
    ),
  },
  {
    id: "offline-ready",
    title: "Checking a playlist is offline ready",
    Icon: CheckCircle2,
    body: (
      <>
        <p>
          A playlist only shows <B>Offline ready</B> once every track has downloaded and been checked as playable audio
          on this device. Until then it shows another status:
        </p>
        <ul>
          <li>
            <B>Cloud only</B>: saved to your account but not on this device yet.
          </li>
          <li>
            <B>On this device</B> or <B>Cloud and device</B>: stored here, but not yet confirmed offline ready.
          </li>
          <li>
            <B>Downloading</B> or <B>Uploading</B>: a transfer is in progress.
          </li>
          <li>
            <B>Update available</B>: a newer version is in EQHO Cloud.
          </li>
          <li>
            <B>Needs attention</B>: one or more tracks failed. Open the playlist to see which ones and why.
          </li>
        </ul>
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
            Each track has an <B>Included</B> / <B>Excluded</B> switch. <B>Excluded</B> tracks stay in the queue but
            are skipped and don&apos;t count towards the session time.
          </li>
          <li>
            <B>Clear Playlist</B> empties the session queue. It does not delete any saved playlist.
          </li>
        </ul>
      </>
    ),
  },
  {
    id: "plays",
    title: "Per-track play counts",
    Icon: Repeat,
    body: (
      <>
        <p>
          Use the <B>Plays</B> control on a track to set how many times it plays in a row before the session moves on.
          The row shows its progress: <B>Upcoming</B>, then <B>1 of 3</B>, <B>2 of 3</B> and so on while it plays, then{" "}
          <B>Complete</B>.
        </p>
        <p>
          A play only counts when the track reaches its natural end. Skipping or restarting a track doesn&apos;t count
          as a play. With <B>Back to Back (B2B)</B> on, each play is doubled.
        </p>
      </>
    ),
  },
  {
    id: "reset",
    title: "Reset and Restore defaults",
    Icon: RefreshCw,
    body: (
      <ul>
        <li>
          <B>Reset</B> restarts the session&apos;s progress. Completed plays go back to zero, but your play counts,
          included tracks and order are kept.
        </li>
        <li>
          <B>Restore (n)</B> appears when you have hidden tracks with a track&apos;s <B>X</B>, and brings them all back
          into the queue.
        </li>
        <li>
          <B>Restore defaults</B> returns the queue to its original order, includes every track and sets each track to
          1 play.
        </li>
        <li>
          <B>Start New Session</B> (shown when a session finishes) starts the same queue again from the first track.
        </li>
      </ul>
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
          <B>Repeat Playlist</B>: how many times the whole queue plays. Each round plays every included track its full
          number of plays, and completed plays start again from zero at the start of each round.
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
    title: "Standard and fullscreen players",
    Icon: Maximize2,
    body: (
      <>
        <p>
          The standard player and the fullscreen player control the same session, so play, pause, skip, play counts and
          the timer stay in step when you switch between them. Switching never restarts the track.
        </p>
        <p>
          Choose <B>Coach</B> in the header to open the fullscreen Coach view, a large display for gyms and projectors.
          Choose <B>Exit Fullscreen</B> or press Escape to return. Coach Display options are in Settings.
        </p>
      </>
    ),
  },
  {
    id: "devices",
    title: "Using EQHO Player on a phone or iPad",
    Icon: Smartphone,
    body: (
      <>
        <p>
          On a phone, the player is split into icon tabs along the top: <B>Playing</B>, <B>Playlists</B> and{" "}
          <B>Settings</B>, plus a button that opens the fullscreen Coach view. On an iPad, the same tabs show their
          labels, and the layout is centred so controls stay within easy reach in portrait or landscape.
        </p>
        <p>
          Sign in with the same EQHO account email on every device. Each device keeps its own downloaded playlists, so
          download the ones you need on each phone or iPad.
        </p>
      </>
    ),
  },
  {
    id: "keep-open",
    title: "Keeping the device open during playback",
    Icon: Lock,
    body: (
      <>
        <p>
          While a session is playing, keep the player open and the device unlocked. When the player shows{" "}
          <B>Keep this device unlocked during playback</B>, that is a reminder that locking your phone or tablet, or
          switching to another app, may interrupt the music.
        </p>
        <ul>
          <li>Set auto-lock to Never (or the longest option) before a competition.</li>
          <li>Plug the device in for long sessions.</li>
          <li>Turn on Do Not Disturb so calls and notifications don&apos;t interrupt the audio.</li>
        </ul>
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
        <li>
          Check the queue isn&apos;t empty and the tracks aren&apos;t all <B>Excluded</B> or hidden. Choose{" "}
          <B>Restore defaults</B> to include them all, or <B>Restore (n)</B> to bring hidden tracks back.
        </li>
        <li>Check the device volume and the player volume.</li>
        <li>Make sure every device is signed in with the same EQHO account email.</li>
        <li>
          If the source files are damaged or in an unsupported format, re-upload the folder from your computer.
        </li>
      </ul>
    ),
  },
  {
    id: "missing-audio",
    title: "Missing audio",
    Icon: FileAudio,
    body: (
      <>
        <p>
          A track marked <B>Missing audio</B> has a name in the playlist but no audio file on this device, so it is
          skipped. This usually happens after a download was interrupted or storage was cleared.
        </p>
        <ul>
          <li>For a cloud playlist, choose <B>Retry failed tracks</B> or <B>Try download again</B>.</li>
          <li>
            If the message says &quot;The audio file is missing from EQHO Cloud&quot;, upload the folder again from the
            device or computer that still has it.
          </li>
        </ul>
      </>
    ),
  },
  {
    id: "failed-transfers",
    title: "Failed cloud transfers",
    Icon: CloudOff,
    body: (
      <>
        <p>Each failed track shows the reason. What to do:</p>
        <ul>
          <li>
            &quot;The connection was interrupted&quot;: reconnect to Wi-Fi or mobile data, then choose{" "}
            <B>Retry failed tracks</B>. Tracks that already transferred are kept.
          </li>
          <li>&quot;Your sign-in expired&quot;: sign in again, then retry.</li>
          <li>&quot;EQHO Cloud is temporarily unavailable&quot;: wait a few minutes and retry.</li>
          <li>
            &quot;This audio belongs to a different account&quot;: sign in with the account that uploaded the playlist.
          </li>
        </ul>
      </>
    ),
  },
  {
    id: "storage",
    title: "Storage problems",
    Icon: Database,
    body: (
      <>
        <p>
          If you see &quot;Not enough space on this device&quot; or &quot;This device is out of storage&quot;, the
          download stops before anything is half-saved.
        </p>
        <ul>
          <li>
            Use <B>Remove from this device</B> on playlists you no longer need. Their EQHO Cloud copies are kept.
          </li>
          <li>Free up space in the device&apos;s own storage settings, then choose <B>Retry failed tracks</B>.</li>
        </ul>
      </>
    ),
  },
  {
    id: "auth",
    title: "Signing in again",
    Icon: KeyRound,
    body: (
      <>
        <p>
          If your sign-in expires, playlists already on this device keep playing, but cloud uploads and downloads stop
          with &quot;Your sign-in expired. Sign in again, then retry.&quot; Sign in with the same email, then retry the
          transfer.
        </p>
        <p>
          If the player shows <B>Unable to verify your account</B>, check your connection and choose <B>Try Again</B>. If
          you have forgotten your password, choose <B>Forgot your password?</B> on the sign-in page.
        </p>
      </>
    ),
  },
  {
    id: "diagnostics",
    title: "Diagnostics",
    Icon: Activity,
    body: (
      <>
        <p>
          <B>Settings</B> &gt; <B>Help</B> &gt; <B>Diagnostics</B> shows the app version, platform, connection,
          sign-in state and storage on this device. Choose <B>Copy</B> and paste it into your message when you contact
          support.
        </p>
        <p>Diagnostics never include your email, athlete names, track names or sign-in tokens.</p>
      </>
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
