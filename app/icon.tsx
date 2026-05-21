import { ImageResponse } from 'next/og'

export const runtime = 'edge'

export const size = {
  width: 32,
  height: 32,
}
export const contentType = 'image/png'

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          fontSize: 24,
          background: 'white',
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: 6,
        }}
      >
        <svg width="28" height="28" viewBox="0 0 100 100">
          <defs>
            <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#FF2D75" />
              <stop offset="50%" stopColor="#FF7A00" />
              <stop offset="100%" stopColor="#FFD21F" />
            </linearGradient>
          </defs>
          <text
            x="50"
            y="72"
            textAnchor="middle"
            fontFamily="Arial Black, sans-serif"
            fontSize="58"
            fontWeight="900"
            fill="url(#grad)"
          >
            EQ
          </text>
        </svg>
      </div>
    ),
    {
      ...size,
    }
  )
}
