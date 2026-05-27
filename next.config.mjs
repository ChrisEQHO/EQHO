/** @type {import('next').NextConfig} */
const isMobileBuild = process.env.NEXT_PUBLIC_BUILD_TARGET === 'mobile'

const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  // Static export for Capacitor mobile builds
  ...(isMobileBuild && {
    output: 'export',
    distDir: 'out',
  }),
}

export default nextConfig
