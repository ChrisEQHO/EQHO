# ios/Plugin (legacy CocoaPods layout)

This directory exists for the legacy CocoaPods source layout. Under **Capacitor 8
Swift Package Manager** (the package manager this app uses) the plugin's Swift
sources are compiled from:

    ios/Sources/EqhoAudioPlugin/

as declared by the `path:` of the `EqhoAudioPlugin` target in `Package.swift`.

Do **not** place `.swift` files here: SPM only compiles files under the target
`path`, so anything in this folder would be silently ignored and could cause
confusion. The `EqhoAudio.podspec` (kept for CocoaPods-based projects) also
points at `ios/Sources/**`, so both package managers use the same single source
of truth.
