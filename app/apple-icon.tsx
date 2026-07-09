import { ImageResponse } from 'next/og'

// Render at build time so the route is compatible with `output: export`
// (Capacitor mobile static build). Edge runtime cannot be statically exported.
export const dynamic = 'force-static'

export const size = {
  width: 180,
  height: 180,
}
export const contentType = 'image/png'

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          fontSize: 100,
          fontWeight: 900,
          background: 'white',
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: 32,
          fontFamily: 'Arial Black, sans-serif',
          backgroundImage: 'linear-gradient(135deg, #FF2D75 0%, #FF7A00 50%, #FFD21F 100%)',
          WebkitBackgroundClip: 'text',
          color: 'transparent',
        }}
      >
        EQ
      </div>
    ),
    {
      ...size,
    }
  )
}
