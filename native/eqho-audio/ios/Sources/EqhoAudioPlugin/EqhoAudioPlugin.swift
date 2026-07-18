import Foundation
import Capacitor

/// Capacitor bridge for the native EQHO audio-queue engine.
///
/// Registration (Capacitor 8): conforming to `CAPBridgedPlugin` and declaring
/// `identifier` / `jsName` / `pluginMethods` registers the plugin WITHOUT a
/// separate Objective-C `.m` file. `jsName` MUST equal the string passed to
/// `registerPlugin('EqhoAudio')` on the JS side (see index.js).
///
/// This class only marshals JS <-> native; all playback lives in
/// `EqhoAudioEngine` so the queue keeps advancing while the device is locked.
@objc(EqhoAudioPlugin)
public class EqhoAudioPlugin: CAPPlugin, CAPBridgedPlugin {
    public let identifier = "EqhoAudioPlugin"
    public let jsName = "EqhoAudio"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "configure", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "setQueue", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "play", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "pause", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "resume", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "stop", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "skipNext", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "skipPrevious", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "seek", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "setVolume", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "getState", returnType: CAPPluginReturnPromise)
    ]

    private lazy var engine: EqhoAudioEngine = {
        let e = EqhoAudioEngine()
        e.delegate = self
        return e
    }()

    override public func load() {
        // Force the engine (and its audio session / remote command wiring) to
        // initialize as soon as the plugin loads.
        _ = engine
    }

    // MARK: - Configuration & queue

    @objc func configure(_ call: CAPPluginCall) {
        let config = EqhoConfig(
            gapSeconds: call.getDouble("gapSeconds"),
            repeats: call.getInt("repeats"),
            backToBack: call.getBool("backToBack"),
            countdownBeeps: call.getBool("countdownBeeps"),
            countdownSeconds: call.getInt("countdownSeconds"),
            volume: call.getFloat("volume")
        )
        engine.configure(config)
        call.resolve()
    }

    @objc func setQueue(_ call: CAPPluginCall) {
        guard let rawTracks = call.getArray("tracks") as? [[String: Any]] else {
            call.reject("setQueue requires a `tracks` array")
            return
        }
        let tracks: [EqhoTrack] = rawTracks.compactMap { dict in
            guard let id = dict["id"] as? String,
                  let path = dict["path"] as? String else { return nil }
            let title = dict["title"] as? String ?? ""
            return EqhoTrack(id: id, title: title, path: path)
        }
        if tracks.isEmpty {
            call.reject("setQueue received no playable tracks")
            return
        }
        let startIndex = call.getInt("startIndex") ?? 0
        engine.setQueue(tracks, startIndex: startIndex)
        call.resolve()
    }

    // MARK: - Transport

    @objc func play(_ call: CAPPluginCall) {
        engine.play()
        call.resolve()
    }

    @objc func pause(_ call: CAPPluginCall) {
        engine.pause()
        call.resolve()
    }

    @objc func resume(_ call: CAPPluginCall) {
        engine.resume()
        call.resolve()
    }

    @objc func stop(_ call: CAPPluginCall) {
        engine.stop(reason: "stopped")
        call.resolve()
    }

    @objc func skipNext(_ call: CAPPluginCall) {
        engine.skipNext()
        call.resolve()
    }

    @objc func skipPrevious(_ call: CAPPluginCall) {
        engine.skipPrevious()
        call.resolve()
    }

    @objc func seek(_ call: CAPPluginCall) {
        guard let seconds = call.getDouble("seconds") else {
            call.reject("seek requires `seconds`")
            return
        }
        engine.seek(to: seconds)
        call.resolve()
    }

    @objc func setVolume(_ call: CAPPluginCall) {
        guard let volume = call.getFloat("volume") else {
            call.reject("setVolume requires `volume`")
            return
        }
        engine.setVolume(volume)
        call.resolve()
    }

    @objc func getState(_ call: CAPPluginCall) {
        let s = engine.currentState()
        call.resolve([
            "index": s.index,
            "isPlaying": s.isPlaying,
            "isGap": s.isGap,
            "gapRemaining": s.gapRemaining,
            "position": s.position,
            "duration": s.duration,
            "round": s.round
        ])
    }
}

// MARK: - Engine -> JS events

extension EqhoAudioPlugin: EqhoAudioEngineDelegate {
    func engineDidChangeTrack(index: Int, id: String, title: String, duration: Double, round: Int) {
        notifyListeners("trackChanged", data: [
            "index": index, "id": id, "title": title, "duration": duration, "round": round
        ])
    }

    func engineDidStartGap(seconds: Int, nextIndex: Int, nextId: String, nextTitle: String) {
        notifyListeners("gapStarted", data: [
            "seconds": seconds, "nextIndex": nextIndex, "nextId": nextId, "nextTitle": nextTitle
        ])
    }

    func engineGapTick(remaining: Int) {
        notifyListeners("gapTick", data: ["remaining": remaining])
    }

    func engineDidEndGap() {
        notifyListeners("gapEnded", data: [:])
    }

    func enginePosition(index: Int, currentTime: Double, duration: Double) {
        notifyListeners("position", data: [
            "index": index, "currentTime": currentTime, "duration": duration
        ])
    }

    func enginePlayStateChanged(isPlaying: Bool) {
        notifyListeners("playStateChanged", data: ["isPlaying": isPlaying])
    }

    func engineSessionFinished(reason: String) {
        notifyListeners("sessionFinished", data: ["reason": reason])
    }

    func engineRemoteCommand(command: String) {
        notifyListeners("remoteCommand", data: ["command": command])
    }

    func engineError(message: String, trackId: String?) {
        var data: [String: Any] = ["message": message]
        if let trackId = trackId { data["trackId"] = trackId }
        notifyListeners("error", data: data)
    }
}
