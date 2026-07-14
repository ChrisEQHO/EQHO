# eqho-audio — native locked-screen audio queue (iOS)

A local Capacitor plugin that plays a queue of on-disk audio files natively with
AVFoundation, so an EQHO session keeps advancing through tracks — with gaps,
countdown beeps, repeats and back-to-back — **while the iPhone/iPad is locked**.

The JavaScript `<audio>` + `setInterval` sequencer cannot do this: WKWebView
suspends JS timers when the screen locks, so the gap never counts down and the
next track never starts. This plugin moves the whole sequence into native code
that the OS keeps alive via the audio background mode.

On web and the desktop wrapper the plugin is not present, so the app falls back
to the existing JS sequencer automatically (`nativeQueueAvailable()` is false).

---

## Architecture

```
app/page.tsx
  └─ lib/use-native-session.ts   React hook: materialize queue + mirror native events into state
       ├─ lib/native-queue.ts    blob/File -> file:// via @capacitor/filesystem (AVFoundation can't read blob:)
       └─ lib/eqho-audio.ts      typed bridge over the Capacitor plugin
            └─ eqho-audio (this package)
                 ├─ index.js / index.d.ts        registerPlugin('EqhoAudio')
                 └─ ios/Sources/EqhoAudioPlugin/
                      ├─ EqhoAudioPlugin.m        CAP_PLUGIN registration (JS name "EqhoAudio")
                      ├─ EqhoAudioPlugin.swift     marshals JS calls -> engine
                      └─ EqhoAudioEngine.swift     AVAudioPlayer queue, gap timer, beeps, Now Playing / remote commands
```

### Why files, not blob URLs
`URL.createObjectURL(file)` produces a `blob:` URL that only exists inside the
WKWebView; native `AVAudioPlayer` cannot open it. `lib/native-queue.ts` writes
each track's bytes to `Directory.Cache/eqho-queue/<id>.<ext>` and hands the
resulting `file://` paths to the plugin. Cache files are re-materialized on
demand if the OS evicts them.

### Locked-screen keep-alive
The engine keeps a silent looping `AVAudioPlayer` running during the gap so the
audio session (and therefore the app's execution) stays alive between tracks
while locked. `AVAudioSession` is configured `.playback` with background audio.

---

## Build & test (must be done on macOS — cannot be done in v0)

Prerequisites: macOS with Xcode + command line tools, CocoaPods, an Apple
developer account for on-device testing.

1. Build the web assets and sync native projects:
   ```bash
   pnpm build:mobile        # produces the static export in /out
   npx cap sync ios         # copies web assets + installs the eqho-audio pod
   ```
   `cap sync` auto-discovers this plugin because it is a dependency in
   package.json (`"eqho-audio": "file:./native/eqho-audio"`) with a podspec.

2. Confirm the iOS background audio mode is enabled. In `ios/App/App/Info.plist`
   there must be:
   ```xml
   <key>UIBackgroundModes</key>
   <array>
     <string>audio</string>
   </array>
   ```
   (Add it once; `cap sync` does not manage this key.)

3. Open and run on a **real device** (locked-screen behavior can't be verified in
   the simulator reliably):
   ```bash
   npx cap open ios
   ```
   Then Product ▸ Run in Xcode with your device selected.

### On-device test checklist
- Start a session with 2+ tracks and a gap (e.g. 10s). Lock the device.
- The current track keeps playing; at the end the countdown beeps fire and the
  next track starts — all while locked.
- Lock-screen / Control Center shows Now Playing with working play/pause and
  next/previous.
- Repeats and back-to-back behave the same locked as unlocked.
- Volume slider in-app changes loudness; route to Bluetooth and confirm.
- Airplane mode: locally-uploaded tracks still play (they are materialized to
  disk), confirming no network dependency.

---

## Notes
- Config values (gap, repeats, back-to-back, countdown, volume) are pushed via
  `configure()` before `setQueue()` / `play()`.
- Events emitted to JS: `trackChanged`, `gapStarted`, `gapTick`, `gapEnded`,
  `position`, `playStateChanged`, `sessionFinished`, `remoteCommand`, `error`.
- This package is intentionally build-step-free (hand-written `index.js` +
  `index.d.ts`) so it needs no compilation on the JS side.
