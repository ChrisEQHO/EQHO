/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
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
