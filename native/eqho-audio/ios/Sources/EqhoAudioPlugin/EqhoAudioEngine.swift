import Foundation
import AVFoundation
import MediaPlayer

// MARK: - Models

struct EqhoConfig {
    var gapSeconds: Double = 0
    var repeats: Int = 1
    var backToBack: Bool = false
    var countdownBeeps: Bool = false
    var countdownSeconds: Int = 3
    var volume: Float = 1.0

    /// Merge only the values that were actually provided (nil = keep existing).
    init(gapSeconds: Double? = nil, repeats: Int? = nil, backToBack: Bool? = nil,
         countdownBeeps: Bool? = nil, countdownSeconds: Int? = nil, volume: Float? = nil) {
        if let v = gapSeconds { self.gapSeconds = max(0, v) }
        if let v = repeats { self.repeats = max(1, v) }
        if let v = backToBack { self.backToBack = v }
        if let v = countdownBeeps { self.countdownBeeps = v }
        if let v = countdownSeconds { self.countdownSeconds = max(0, v) }
        if let v = volume { self.volume = min(1, max(0, v)) }
    }
}

struct EqhoTrack {
    let id: String
    let title: String
    let path: String

    /// AVFoundation cannot open blob:/data:/https: URLs — only on-disk files.
    var fileURL: URL? {
        if path.hasPrefix("file://") { return URL(string: path) }
        return URL(fileURLWithPath: path)
    }
}

struct EqhoStateSnapshot {
    let index: Int
    let isPlaying: Bool
    let isGap: Bool
    let gapRemaining: Int
    let position: Double
    let duration: Double
    let round: Int
}

// MARK: - Delegate

protocol EqhoAudioEngineDelegate: AnyObject {
    func engineDidChangeTrack(index: Int, id: String, title: String, duration: Double, round: Int)
    func engineDidStartGap(seconds: Int, nextIndex: Int, nextId: String, nextTitle: String)
    func engineGapTick(remaining: Int)
    func engineDidEndGap()
    func enginePosition(index: Int, currentTime: Double, duration: Double)
    func enginePlayStateChanged(isPlaying: Bool)
    func engineSessionFinished(reason: String)
    func engineRemoteCommand(command: String)
    func engineError(message: String, trackId: String?)
}

// MARK: - Engine

/// AVFoundation queue engine. The whole sequence (tracks + gaps + beeps +
/// repeats + back-to-back) runs natively so iOS keeps it alive via the `audio`
/// background mode while the screen is locked — something the JS `<audio>` +
/// `setInterval` sequencer cannot do because WKWebView suspends JS timers.
final class EqhoAudioEngine: NSObject, AVAudioPlayerDelegate {

    weak var delegate: EqhoAudioEngineDelegate?

    private var config = EqhoConfig()
    private var queue: [EqhoTrack] = []
    private var index = 0
    private var round = 1
    /// For back-to-back: true once the current track is on its second pass.
    private var onSecondPass = false

    private var player: AVAudioPlayer?
    /// Silent looping player kept running DURING gaps so the audio session (and
    /// therefore the app) stays alive between tracks while the device is locked.
    private var keepAlivePlayer: AVAudioPlayer?

    private var gapTimer: Timer?
    private var positionTimer: Timer?
    private var gapRemaining = 0
    private var isGap = false
    private var isStopped = true

    private lazy var beepData: Data = Self.makeTone(frequency: 880, seconds: 0.12, volume: 0.9)
    private lazy var silenceData: Data = Self.makeTone(frequency: 0, seconds: 1.0, volume: 0.0)

    override init() {
        super.init()
        configureAudioSession()
        setupRemoteCommands()
    }

    // MARK: Public API

    func configure(_ newConfig: EqhoConfig) {
        // Preserve fields the caller omitted by merging onto the current config.
        var merged = config
        merged.gapSeconds = newConfig.gapSeconds
        merged.repeats = newConfig.repeats
        merged.backToBack = newConfig.backToBack
        merged.countdownBeeps = newConfig.countdownBeeps
        merged.countdownSeconds = newConfig.countdownSeconds
        merged.volume = newConfig.volume
        config = merged
        player?.volume = config.volume
    }

    func setQueue(_ tracks: [EqhoTrack], startIndex: Int) {
        stopTimers()
        queue = tracks
        index = min(max(0, startIndex), max(0, tracks.count - 1))
        round = 1
        onSecondPass = false
        isGap = false
    }

    func play() {
        guard !queue.isEmpty else {
            delegate?.engineError(message: "Cannot play: queue is empty", trackId: nil)
            return
        }
        isStopped = false
        activateSession(true)
        startTrack(at: index, resetSecondPass: true)
    }

    func pause() {
        player?.pause()
        stopPositionTimer()
        updateNowPlaying(rate: 0)
        delegate?.enginePlayStateChanged(isPlaying: false)
    }

    func resume() {
        guard !queue.isEmpty else { return }
        isStopped = false
        activateSession(true)
        if isGap {
            // Resuming mid-gap: keep counting down.
            keepAlivePlayer?.play()
        } else if let p = player {
            p.play()
            startPositionTimer()
            updateNowPlaying(rate: 1)
        } else {
            startTrack(at: index, resetSecondPass: true)
        }
        delegate?.enginePlayStateChanged(isPlaying: true)
    }

    func stop(reason: String) {
        isStopped = true
        stopTimers()
        player?.stop()
        player = nil
        keepAlivePlayer?.stop()
        keepAlivePlayer = nil
        isGap = false
        gapRemaining = 0
        activateSession(false)
        MPNowPlayingInfoCenter.default().nowPlayingInfo = nil
        delegate?.enginePlayStateChanged(isPlaying: false)
        delegate?.engineSessionFinished(reason: reason)
    }

    func skipNext() {
        cancelGap()
        advance(userInitiated: true)
    }

    func skipPrevious() {
        cancelGap()
        // If we're more than 3s into the track, restart it; otherwise go back.
        if let p = player, p.currentTime > 3 {
            p.currentTime = 0
            return
        }
        onSecondPass = false
        if index > 0 {
            index -= 1
        }
        startTrack(at: index, resetSecondPass: true)
    }

    func seek(to seconds: Double) {
        guard let p = player else { return }
        p.currentTime = min(max(0, seconds), p.duration)
        updateNowPlaying(rate: p.isPlaying ? 1 : 0)
        delegate?.enginePosition(index: index, currentTime: p.currentTime, duration: p.duration)
    }

    func setVolume(_ volume: Float) {
        config.volume = min(1, max(0, volume))
        player?.volume = config.volume
    }

    func currentState() -> EqhoStateSnapshot {
        EqhoStateSnapshot(
            index: index,
            isPlaying: player?.isPlaying ?? false,
            isGap: isGap,
            gapRemaining: gapRemaining,
            position: player?.currentTime ?? 0,
            duration: player?.duration ?? 0,
            round: round
        )
    }

    // MARK: Track playback

    private func startTrack(at newIndex: Int, resetSecondPass: Bool) {
        guard queue.indices.contains(newIndex) else { return }
        if resetSecondPass { onSecondPass = false }
        index = newIndex
        isGap = false

        let track = queue[newIndex]
        guard let url = track.fileURL else {
            delegate?.engineError(message: "Track has no playable file path", trackId: track.id)
            advance(userInitiated: false)
            return
        }

        do {
            let newPlayer = try AVAudioPlayer(contentsOf: url)
            newPlayer.delegate = self
            newPlayer.volume = config.volume
            newPlayer.prepareToPlay()
            player?.stop()
            player = newPlayer
            newPlayer.play()

            delegate?.engineDidChangeTrack(
                index: index, id: track.id, title: track.title,
                duration: newPlayer.duration, round: round
            )
            delegate?.enginePlayStateChanged(isPlaying: true)
            startPositionTimer()
            updateNowPlaying(rate: 1)
        } catch {
            delegate?.engineError(message: "Failed to load audio: \(error.localizedDescription)", trackId: track.id)
            advance(userInitiated: false)
        }
    }

    /// Decide what plays after the current track finishes (or is skipped).
    private func advance(userInitiated: Bool) {
        guard !queue.isEmpty else { return }

        // Back-to-back: replay the same track once before moving on.
        if config.backToBack && !onSecondPass && !userInitiated {
            onSecondPass = true
            beginGapThen { [weak self] in
                guard let self = self else { return }
                self.startTrack(at: self.index, resetSecondPass: false)
            }
            return
        }
        onSecondPass = false

        let isLastInRound = index >= queue.count - 1
        if !isLastInRound {
            let next = index + 1
            beginGapThen { [weak self] in self?.startTrack(at: next, resetSecondPass: true) }
            return
        }

        // End of the playlist for this round.
        if round < config.repeats {
            round += 1
            beginGapThen { [weak self] in self?.startTrack(at: 0, resetSecondPass: true) }
        } else {
            stop(reason: "completed")
        }
    }

    // MARK: Gap handling

    private func beginGapThen(_ completion: @escaping () -> Void) {
        let gap = Int(config.gapSeconds.rounded())
        if gap <= 0 {
            completion()
            return
        }

        isGap = true
        gapRemaining = gap
        stopPositionTimer()
        startKeepAlive()

        let nextIndex = (index >= queue.count - 1) ? 0 : index + 1
        let nextTrack = queue.indices.contains(nextIndex) ? queue[nextIndex] : nil
        delegate?.engineDidStartGap(
            seconds: gap,
            nextIndex: nextIndex,
            nextId: nextTrack?.id ?? "",
            nextTitle: nextTrack?.title ?? ""
        )

        gapTimer?.invalidate()
        gapTimer = Timer.scheduledTimer(withTimeInterval: 1.0, repeats: true) { [weak self] _ in
            guard let self = self else { return }
            self.gapRemaining -= 1

            if self.config.countdownBeeps && self.gapRemaining > 0 && self.gapRemaining <= self.config.countdownSeconds {
                self.playBeep()
            }

            if self.gapRemaining > 0 {
                self.delegate?.engineGapTick(remaining: self.gapRemaining)
            } else {
                self.endGap(completion)
            }
        }
        if let t = gapTimer { RunLoop.main.add(t, forMode: .common) }
    }

    private func endGap(_ completion: @escaping () -> Void) {
        gapTimer?.invalidate()
        gapTimer = nil
        isGap = false
        gapRemaining = 0
        stopKeepAlive()
        delegate?.engineDidEndGap()
        completion()
    }

    private func cancelGap() {
        gapTimer?.invalidate()
        gapTimer = nil
        if isGap {
            isGap = false
            gapRemaining = 0
            stopKeepAlive()
            delegate?.engineDidEndGap()
        }
    }

    // MARK: Timers

    private func startPositionTimer() {
        stopPositionTimer()
        positionTimer = Timer.scheduledTimer(withTimeInterval: 0.5, repeats: true) { [weak self] _ in
            guard let self = self, let p = self.player, p.isPlaying else { return }
            self.delegate?.enginePosition(index: self.index, currentTime: p.currentTime, duration: p.duration)
            self.updateNowPlaying(rate: 1)
        }
        if let t = positionTimer { RunLoop.main.add(t, forMode: .common) }
    }

    private func stopPositionTimer() {
        positionTimer?.invalidate()
        positionTimer = nil
    }

    private func stopTimers() {
        stopPositionTimer()
        gapTimer?.invalidate()
        gapTimer = nil
    }

    // MARK: AVAudioPlayerDelegate

    func audioPlayerDidFinishPlaying(_ player: AVAudioPlayer, successfully flag: Bool) {
        guard player === self.player, !isStopped else { return }
        delegate?.enginePosition(index: index, currentTime: player.duration, duration: player.duration)
        advance(userInitiated: false)
    }

    func audioPlayerDecodeErrorDidOccur(_ player: AVAudioPlayer, error: Error?) {
        let track = queue.indices.contains(index) ? queue[index] : nil
        delegate?.engineError(message: "Decode error: \(error?.localizedDescription ?? "unknown")", trackId: track?.id)
        advance(userInitiated: false)
    }

    // MARK: Audio session

    private func configureAudioSession() {
        do {
            let session = AVAudioSession.sharedInstance()
            try session.setCategory(.playback, mode: .default, options: [])
        } catch {
            delegate?.engineError(message: "Audio session category failed: \(error.localizedDescription)", trackId: nil)
        }
    }

    private func activateSession(_ active: Bool) {
        do {
            try AVAudioSession.sharedInstance().setActive(active, options: active ? [] : [.notifyOthersOnDeactivation])
        } catch {
            // Non-fatal: activation can fail transiently (e.g. during interruptions).
        }
    }

    // MARK: Keep-alive (locked-screen gap survival)

    private func startKeepAlive() {
        guard keepAlivePlayer == nil else {
            keepAlivePlayer?.play()
            return
        }
        do {
            let p = try AVAudioPlayer(data: silenceData)
            p.numberOfLoops = -1
            p.volume = 0
            p.prepareToPlay()
            p.play()
            keepAlivePlayer = p
        } catch {
            // If silence generation fails the gap timer still runs while the app
            // is foregrounded; only locked-screen gap survival is affected.
        }
    }

    private func stopKeepAlive() {
        keepAlivePlayer?.stop()
        keepAlivePlayer = nil
    }

    // MARK: Beeps

    private func playBeep() {
        do {
            let beep = try AVAudioPlayer(data: beepData)
            beep.volume = config.volume
            beep.prepareToPlay()
            beep.play()
            // Retain briefly so it isn't deallocated mid-tone.
            beepRetain = beep
        } catch {
            // Beep failure is non-fatal.
        }
    }
    private var beepRetain: AVAudioPlayer?

    // MARK: Now Playing / remote commands

    private func setupRemoteCommands() {
        let center = MPRemoteCommandCenter.shared()

        center.playCommand.addTarget { [weak self] _ in
            self?.resume()
            self?.delegate?.engineRemoteCommand(command: "play")
            return .success
        }
        center.pauseCommand.addTarget { [weak self] _ in
            self?.pause()
            self?.delegate?.engineRemoteCommand(command: "pause")
            return .success
        }
        center.togglePlayPauseCommand.addTarget { [weak self] _ in
            guard let self = self else { return .commandFailed }
            if self.player?.isPlaying == true { self.pause() } else { self.resume() }
            self.delegate?.engineRemoteCommand(command: "toggle")
            return .success
        }
        center.nextTrackCommand.addTarget { [weak self] _ in
            self?.skipNext()
            self?.delegate?.engineRemoteCommand(command: "next")
            return .success
        }
        center.previousTrackCommand.addTarget { [weak self] _ in
            self?.skipPrevious()
            self?.delegate?.engineRemoteCommand(command: "previous")
            return .success
        }
        center.nextTrackCommand.isEnabled = true
        center.previousTrackCommand.isEnabled = true
    }

    private func updateNowPlaying(rate: Float) {
        guard queue.indices.contains(index) else { return }
        let track = queue[index]
        var info: [String: Any] = [
            MPMediaItemPropertyTitle: track.title,
            MPMediaItemPropertyAlbumTitle: "EQHO Session"
        ]
        if let p = player {
            info[MPMediaItemPropertyPlaybackDuration] = p.duration
            info[MPNowPlayingInfoPropertyElapsedPlaybackTime] = p.currentTime
        }
        info[MPNowPlayingInfoPropertyPlaybackRate] = rate
        MPNowPlayingInfoCenter.default().nowPlayingInfo = info
    }

    // MARK: Tone synthesis

    /// Build an in-memory 16-bit PCM WAV. `frequency: 0` => silence. Used for
    /// countdown beeps and the silent keep-alive loop so the plugin ships no
    /// binary audio assets.
    private static func makeTone(frequency: Double, seconds: Double, volume: Float) -> Data {
        let sampleRate = 44100.0
        let frameCount = Int(sampleRate * seconds)
        let bytesPerSample = 2
        let dataSize = frameCount * bytesPerSample

        var data = Data()

        func appendLE(_ value: UInt32, _ bytes: Int) {
            var v = value.littleEndian
            withUnsafeBytes(of: &v) { data.append($0.bindMemory(to: UInt8.self).baseAddress!, count: bytes) }
        }

        // RIFF header
        data.append(contentsOf: Array("RIFF".utf8))
        appendLE(UInt32(36 + dataSize), 4)
        data.append(contentsOf: Array("WAVE".utf8))
        // fmt chunk
        data.append(contentsOf: Array("fmt ".utf8))
        appendLE(16, 4)                      // PCM chunk size
        appendLE(1, 2)                       // audio format = PCM
        appendLE(1, 2)                       // channels = mono
        appendLE(UInt32(sampleRate), 4)      // sample rate
        appendLE(UInt32(sampleRate) * 2, 4)  // byte rate
        appendLE(2, 2)                       // block align
        appendLE(16, 2)                      // bits per sample
        // data chunk
        data.append(contentsOf: Array("data".utf8))
        appendLE(UInt32(dataSize), 4)

        let amplitude = Double(volume) * 32767.0
        for i in 0..<frameCount {
            let sample: Int16
            if frequency <= 0 {
                sample = 0
            } else {
                // Fade the beep edges to avoid clicks.
                let t = Double(i) / sampleRate
                let env = min(1.0, min(t, seconds - t) * 40.0)
                let value = sin(2.0 * Double.pi * frequency * t) * amplitude * max(0, env)
                sample = Int16(max(-32767, min(32767, value)))
            }
            var le = sample.littleEndian
            withUnsafeBytes(of: &le) { data.append($0.bindMemory(to: UInt8.self).baseAddress!, count: 2) }
        }
        return data
    }
}
