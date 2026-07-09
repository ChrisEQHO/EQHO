#!/usr/bin/env node

/**
 * Build entry point used by `npm run build`.
 *
 * - Web build (default): just runs `next build`.
 * - Mobile build (NEXT_PUBLIC_BUILD_TARGET=mobile): temporarily removes the
 *   server-only routes that cannot exist in a static export (`output: export`),
 *   runs `next build` to produce the /out folder for Capacitor, then always
 *   restores the moved files — even if the build fails — so the working tree is
 *   never left in a broken state.
 *
 * This makes `NEXT_PUBLIC_BUILD_TARGET=mobile npm run build` work on its own,
 * matching the documented Capacitor workflow.
 */

const { execFileSync } = require('child_process')
const fs = require('fs')
const path = require('path')

const isMobile = process.env.NEXT_PUBLIC_BUILD_TARGET === 'mobile'
const scriptsDir = __dirname
const projectRoot = process.cwd()
const backupDir = path.join(projectRoot, '.mobile-build-backup')

// Resolve the Next.js CLI directly instead of relying on PATH. Running the JS
// entry point through the current Node keeps App Router detection working even
// when `next` isn't on PATH in the caller's shell.
function resolveNextBin() {
  try {
    return require.resolve('next/dist/bin/next', { paths: [projectRoot] })
  } catch {
    return null
  }
}

function runNext(args) {
  const nextBin = resolveNextBin()
  if (nextBin) {
    execFileSync(process.execPath, [nextBin, ...args], { stdio: 'inherit', cwd: projectRoot })
  } else {
    // Fallback to PATH-resolved binary.
    execFileSync('next', args, { stdio: 'inherit', cwd: projectRoot })
  }
}

function runNode(scriptFile) {
  execFileSync(process.execPath, [path.join(scriptsDir, scriptFile)], {
    stdio: 'inherit',
    cwd: projectRoot,
  })
}

if (!isMobile) {
  // Standard web build.
  runNext(['build'])
  process.exit(0)
}

// Self-heal: a previously interrupted mobile build (crash / Ctrl-C / OOM) can
// leave server-only routes stranded in `.mobile-build-backup`, so the working
// tree is half-moved. Building on top of that half-moved tree is what triggers
// the "Couldn't find a `pages` directory" error. Restore any stale backup first
// so every mobile build starts from a clean App Router tree.
if (fs.existsSync(backupDir)) {
  console.log('[build] Found leftover .mobile-build-backup — restoring before build...')
  runNode('restore-web-build.js')
}

console.log('[build] Mobile target detected — preparing static export...')
runNode('prepare-mobile-build.js')

let buildError = null
try {
  // Build the mobile static export with the default bundler. Do not pass extra
  // bundler flags here — this Next.js version rejects unknown build options.
  runNext(['build'])
} catch (err) {
  buildError = err
} finally {
  console.log('[build] Restoring web-only routes...')
  runNode('restore-web-build.js')
}

if (buildError) {
  console.error('[build] Mobile build failed.')
  process.exit(1)
}

console.log('[build] Mobile static export complete (see /out).')
