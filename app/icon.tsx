import { ImageResponse } from 'next/og'

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
        <svg width="24" height="24" viewBox="0 0 32 32" fill="none">
          <defs>
            <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#FF2D75" />
              <stop offset="50%" stopColor="#FF7A00" />
              <stop offset="100%" stopColor="#FFD21F" />
            </linearGradient>
          </defs>
          {/* E shape */}
          <rect x="4" y="6" width="4" height="20" rx="2" fill="url(#grad)" />
          <rect x="4" y="6" width="12" height="4" rx="2" fill="url(#grad)" />
          <rect x="4" y="14" width="10" height="4" rx="2" fill="url(#grad)" />
          <rect x="4" y="22" width="12" height="4" rx="2" fill="url(#grad)" />
          {/* Q shape */}
          <circle cx="22" cy="16" r="8" stroke="url(#grad)" strokeWidth="4" fill="none" />
          <rect x="22" y="20" width="4" height="10" rx="2" fill="url(#grad)" transform="rotate(-45 24 22)" />
        </svg>
      </div>
    ),
    {
      ...size,
    }
  )
}
