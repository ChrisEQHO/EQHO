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
const path = require('path')

const isMobile = process.env.NEXT_PUBLIC_BUILD_TARGET === 'mobile'
const scriptsDir = __dirname

function run(command, args) {
  execFileSync(command, args, { stdio: 'inherit', cwd: process.cwd() })
}

function runNode(scriptFile) {
  run(process.execPath, [path.join(scriptsDir, scriptFile)])
}

if (!isMobile) {
  // Standard web build.
  run('next', ['build'])
  process.exit(0)
}

console.log('[build] Mobile target detected — preparing static export...')
runNode('prepare-mobile-build.js')

let buildError = null
try {
  // Build the mobile static export with the WEBPACK bundler, not Turbopack.
  // Next.js 16 defaults to Turbopack, whose content-hashed chunk filenames can
  // contain characters like "~" and ".." (e.g. `0jgl3s3x4~r9..js`). The iOS
  // Capacitor WKWebView serves bundled files through a custom scheme handler
  // that normalizes NSURL paths, which mangles those "~"/".." segments into
  // 404s — so the CSS/JS never load and the app shows an unstyled plain-blue
  // screen. Webpack emits clean hexadecimal filenames that load reliably on iOS.
  run('next', ['build', '--webpack'])
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
