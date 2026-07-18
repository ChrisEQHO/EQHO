package com.eqhoplayer.audio;

import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

/**
 * Android stub for the eqho-audio plugin.
 *
 * This is intentionally NOT registered (the npm package's `capacitor` manifest
 * declares only `ios`), so `cap sync android` never picks it up and Android
 * falls back to the JavaScript sequencer. It documents the method surface a
 * future Android engine (MediaSessionService + ExoPlayer) must implement to
 * mirror `src/definitions.ts`. Each method currently resolves as unavailable so
 * that, if wired up prematurely, callers fail gracefully rather than crash.
 */
@CapacitorPlugin(name = "EqhoAudio")
public class EqhoAudioPlugin extends Plugin {

    private void notImplemented(PluginCall call) {
        call.unavailable("eqho-audio native queue is iOS-only; use the JS sequencer on Android.");
    }

    @PluginMethod
    public void configure(PluginCall call) { notImplemented(call); }

    @PluginMethod
    public void setQueue(PluginCall call) { notImplemented(call); }

    @PluginMethod
    public void play(PluginCall call) { notImplemented(call); }

    @PluginMethod
    public void pause(PluginCall call) { notImplemented(call); }

    @PluginMethod
    public void resume(PluginCall call) { notImplemented(call); }

    @PluginMethod
    public void stop(PluginCall call) { notImplemented(call); }

    @PluginMethod
    public void skipNext(PluginCall call) { notImplemented(call); }

    @PluginMethod
    public void skipPrevious(PluginCall call) { notImplemented(call); }

    @PluginMethod
    public void seek(PluginCall call) { notImplemented(call); }

    @PluginMethod
    public void setVolume(PluginCall call) { notImplemented(call); }

    @PluginMethod
    public void getState(PluginCall call) { notImplemented(call); }
}
