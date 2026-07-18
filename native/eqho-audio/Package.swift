// swift-tools-version: 5.9
import PackageDescription

// Capacitor 8 iOS uses Swift Package Manager. The generated app manifest
// (ios/App/CapApp-SPM/Package.swift) references this package by the name that
// Capacitor derives from the npm package name via fixName("eqho-audio") =>
// "EqhoAudio". It adds BOTH:
//     .package(name: "EqhoAudio", path: "<relpath>")
//     .product(name: "EqhoAudio", package: "EqhoAudio")
// Therefore this Package MUST be named "EqhoAudio" and expose a library product
// named "EqhoAudio". The underlying target can be named anything; we use
// "EqhoAudioPlugin" and keep its sources under ios/Sources/EqhoAudioPlugin
// (the same convention the official @capacitor/* SPM plugins use).
let package = Package(
    name: "EqhoAudio",
    platforms: [.iOS(.v14)],
    products: [
        .library(
            name: "EqhoAudio",
            targets: ["EqhoAudioPlugin"])
    ],
    dependencies: [
        .package(url: "https://github.com/ionic-team/capacitor-swift-pm.git", from: "8.0.0")
    ],
    targets: [
        .target(
            name: "EqhoAudioPlugin",
            dependencies: [
                .product(name: "Capacitor", package: "capacitor-swift-pm"),
                .product(name: "Cordova", package: "capacitor-swift-pm")
            ],
            path: "ios/Sources/EqhoAudioPlugin")
    ]
)
