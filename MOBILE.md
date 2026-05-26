# EQHO Player - Mobile App Build Guide

This guide explains how to build EQHO Player as a native iOS and Android app using Capacitor.

## Prerequisites

- Node.js 18+ and npm/pnpm
- For iOS: macOS with Xcode 15+ installed
- For Android: Android Studio with SDK installed

## Initial Setup

1. Install dependencies:
```bash
npm install
# or
pnpm install
```

2. Add native platforms (first time only):
```bash
npx cap add ios
npx cap add android
```

## Building for Mobile

### iOS

```bash
npm run cap:ios
```

This will:
1. Build the Next.js app with static export
2. Sync the web assets to the iOS project
3. Open Xcode

In Xcode:
- Select your development team in Signing & Capabilities
- Connect your iPhone or select a simulator
- Click the Play button to run

### Android

```bash
npm run cap:android
```

This will:
1. Build the Next.js app with static export
2. Sync the web assets to the Android project
3. Open Android Studio

In Android Studio:
- Wait for Gradle sync to complete
- Connect your Android device or start an emulator
- Click the Run button

## Manual Sync

If you only need to sync web assets without opening the IDE:

```bash
npm run cap:sync
```

## Project Structure

```
/
├── ios/                 # iOS native project (generated)
├── android/             # Android native project (generated)
├── out/                 # Static export output (mobile builds)
├── capacitor.config.ts  # Capacitor configuration
└── ...
```

## Environment Variables

The mobile build uses `NEXT_PUBLIC_BUILD_TARGET=mobile` to enable static export mode. This is automatically set by the `build:mobile` script.

## Notes

- The web version on Vercel remains unaffected - it uses the standard Next.js build
- Mobile builds use static export to the `/out` directory
- Capacitor wraps the web app in a native WebView
- Native features like splash screen and status bar are configured in `capacitor.config.ts`

## Troubleshooting

### Build fails with export errors
Some Next.js features are not compatible with static export. Ensure:
- No server-side features in pages
- No dynamic routes without `generateStaticParams`
- Images use `unoptimized: true` (already configured)

### iOS signing issues
- Open Xcode and select your Apple Developer team
- Ensure you have a valid provisioning profile

### Android SDK issues
- Open Android Studio > SDK Manager
- Install the required SDK versions
