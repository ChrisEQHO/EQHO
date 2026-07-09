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
  // Build the mobile static export. The `--webpack` flag is NOT supported by
  // this Next.js version (`next build` rejects it as an unknown option), so we
  // run the plain build command.
  run('next', ['build'])
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
