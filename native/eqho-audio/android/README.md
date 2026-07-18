# android (not wired — intentional)

`eqho-audio` provides **iOS** locked-screen queue playback. It is deliberately
NOT registered for Android: the `capacitor` manifest in `package.json` declares
only `ios`, so `npx cap sync android` will not attempt to build anything here and
Android automatically falls back to the app's JavaScript `<audio>` sequencer
(`nativeQueueAvailable()` returns `false` off iOS).

This folder exists so the plugin has a complete, conventional layout and a place
for a future Android implementation (an equivalent `MediaSessionService` +
`ExoPlayer` engine). To enable Android later:

1. Add a real implementation under `android/src/main/java/...`.
2. Add an `"android"` entry to the `capacitor` object in `package.json`.
3. Re-run `npx cap sync android`.

The stub `EqhoAudioPlugin.java` below documents the method surface that a future
Android engine must implement to match `src/definitions.ts`.
