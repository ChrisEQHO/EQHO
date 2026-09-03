#!/usr/bin/env node

/**
 * Prepare the app for Capacitor mobile static export.
 * Temporarily moves dynamic routes that can't be statically exported.
 * Run before: NEXT_PUBLIC_BUILD_TARGET=mobile next build
 * Run after:  node scripts/restore-web-build.js
 */

const fs = require('fs')
const path = require('path')

// Production backend the packaged mobile app talks to over HTTPS. The static
// export has no server of its own, so every relative `/api/...` call must be
// rewritten to this origin (see lib/api-client.ts). Override by exporting
// NEXT_PUBLIC_API_BASE_URL before running this script.
const MOBILE_API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || 'https://www.eqho-player.com'

// Env vars that must be baked into the mobile bundle at build time. NEXT_PUBLIC_
// vars are inlined by Next during `next build`, so they have to be present in the
// environment/`.env.production.local` before the build runs.
const mobileEnv = {
  NEXT_PUBLIC_BUILD_TARGET: 'mobile',
  NEXT_PUBLIC_API_BASE_URL: MOBILE_API_BASE_URL,
}

// `next build` (production) loads `.env.production.local` automatically. We write
// the mobile vars there so the build is deterministic no matter how it's invoked,
// backing up any existing file so restore can put it back verbatim.
const envFile = '.env.production.local'
const envBackupName = '__env_production_local__.bak'

// Server-only routes that cannot exist in a static export (`output: export`).
// The Capacitor app talks to the hosted backend over HTTP, so these are safe to
// exclude from the mobile bundle. `restore-web-build.js` puts them all back after.
const filesToMove = [
  'app/icon.tsx',
  'app/apple-icon.tsx',
  'app/auth', // whole auth folder (callback route handler + error page)
  'app/api', // all API route handlers (POST/dynamic, Supabase/Stripe/R2)
  'middleware.ts', // middleware is not supported with output: export
]

// Server Action files that cannot be statically exported. Instead of removing
// them (they are imported by pages), we swap in client-safe stubs during the
// mobile build and restore the originals afterwards.
const filesToStub = [
  { real: 'app/actions/account.ts', stub: 'scripts/mobile-stubs/account.ts' },
  { real: 'app/actions/subscription.ts', stub: 'scripts/mobile-stubs/subscription.ts' },
]

const backupDir = '.mobile-build-backup'

// Create backup directory
if (!fs.existsSync(backupDir)) {
  fs.mkdirSync(backupDir, { recursive: true })
}

// Move files/directories to backup (renameSync handles both).
filesToMove.forEach(file => {
  const src = path.join(process.cwd(), file)
  const dest = path.join(process.cwd(), backupDir, file)
  
  if (fs.existsSync(src)) {
    // Create destination parent directory
    fs.mkdirSync(path.dirname(dest), { recursive: true })
    // Move file or directory
    fs.renameSync(src, dest)
    console.log(`Moved: ${file} -> ${backupDir}/${file}`)
  }
})

// Swap Server Action files for client-safe stubs. The real file is backed up
// under `${backupDir}/__stubbed__/<real path>` so restore can tell it apart from
// the moved (removed) files above.
filesToStub.forEach(({ real, stub }) => {
  const realPath = path.join(process.cwd(), real)
  const stubPath = path.join(process.cwd(), stub)
  const backupPath = path.join(process.cwd(), backupDir, '__stubbed__', real)

  if (fs.existsSync(realPath) && fs.existsSync(stubPath)) {
    fs.mkdirSync(path.dirname(backupPath), { recursive: true })
    fs.renameSync(realPath, backupPath)
    fs.copyFileSync(stubPath, realPath)
    console.log(`Stubbed: ${real} (backup at ${backupDir}/__stubbed__/${real})`)
  }
})

// Write the mobile env vars into `.env.production.local`, backing up any existing
// file first so restore can put it back exactly as it was.
const envPath = path.join(process.cwd(), envFile)
if (fs.existsSync(envPath)) {
  fs.renameSync(envPath, path.join(process.cwd(), backupDir, envBackupName))
  console.log(`Backed up existing ${envFile} -> ${backupDir}/${envBackupName}`)
}
const envContents =
  Object.entries(mobileEnv)
    .map(([key, value]) => `${key}=${value}`)
    .join('\n') + '\n'
fs.writeFileSync(envPath, envContents)
console.log(`Wrote ${envFile}:`)
Object.entries(mobileEnv).forEach(([key, value]) => console.log(`  ${key}=${value}`))

console.log('\nMobile build preparation complete.')
console.log('Run: pnpm build')
console.log('Then: node scripts/restore-web-build.js')
