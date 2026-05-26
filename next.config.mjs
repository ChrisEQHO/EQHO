/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  // Static export for Capacitor mobile builds
  // Set NEXT_PUBLIC_BUILD_TARGET=mobile to enable static export
  ...(process.env.NEXT_PUBLIC_BUILD_TARGET === 'mobile' && {
    output: 'export',
    distDir: 'out',
  }),
}

export default nextConfig
