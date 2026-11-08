import { readFileSync } from 'node:fs'

const packageVersion = JSON.parse(readFileSync(new URL('./package.json', import.meta.url), 'utf8')).version ?? ''
const commitSha = (process.env.VERCEL_GIT_COMMIT_SHA || process.env.GITHUB_SHA || '').slice(0, 7)

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Non-secret build identifiers shown in Settings > Help > Diagnostics.
  env: {
    NEXT_PUBLIC_APP_VERSION: packageVersion,
    NEXT_PUBLIC_BUILD_NUMBER: process.env.BUILD_NUMBER || process.env.GITHUB_RUN_NUMBER || '',
    NEXT_PUBLIC_WEB_BUNDLE_VERSION: commitSha || `local-${new Date().toISOString().slice(0, 10)}`,
  },
  // TEMP (diagnose-only): route the local prod probe build to a separate dist
  // dir so it never clobbers the running dev server's .next. Removed after diagnosis.
  ...(process.env.BUILD_PROBE === '1' && { distDir: '.next-probe' }),
  images: {
    unoptimized: true,
  },
  // Canonical-domain redirect: send the bare apex to www, preserving the FULL
  // path and query string (`:path*` + automatic query passthrough). This keeps
  // auth parameters (?code / ?token_hash / ?next) intact instead of dropping the
  // user on the homepage, and guarantees one canonical origin for everything.
  // `redirects()` is unsupported by `output: export`, so it is only defined for
  // the web build (the mobile app never touches these public domains).
  ...(process.env.NEXT_PUBLIC_BUILD_TARGET !== 'mobile' && {
    async redirects() {
      return [
        {
          source: '/:path*',
          has: [{ type: 'host', value: 'eqho-player.com' }],
          destination: 'https://www.eqho-player.com/:path*',
          permanent: true,
        },
      ]
    },
  }),
  // Static export for Capacitor mobile builds
  // Set NEXT_PUBLIC_BUILD_TARGET=mobile to enable static export
  ...(process.env.NEXT_PUBLIC_BUILD_TARGET === 'mobile' && {
    output: 'export',
    distDir: 'out',
    // REQUIRED for Capacitor routing. Without it, `output: export` writes each
    // route as a bare file (out/forgot-password.html). Inside the WebView, when
    // the App Router client-nav falls back to a hard navigation to "/forgot-password",
    // Capacitor's static server can't map that path to the .html file and serves the
    // index.html fallback instead — which reboots the app at "/" and, since the user
    // is logged out, shows the login page again ("clicking Forgot password just
    // reloads login"). With trailingSlash, routes export as out/forgot-password/index.html,
    // so both soft and hard navigation resolve correctly. Only affects the mobile build.
    trailingSlash: true,
  }),
}

export default nextConfig
