import { NextResponse } from 'next/server'

// Fallback for /downloads/eqho-player-mac.dmg.
//
// When the real binary exists at public/downloads/eqho-player-mac.dmg, Next.js
// serves that static file directly (the public/ filesystem check runs before
// the afterFiles rewrite that points here), so this handler never runs.
//
// When the file is missing, the rewrite routes here instead of returning a 404,
// and we show a friendly "Mac download coming soon" message.
export const dynamic = 'force-static'

export function GET() {
  return new NextResponse(
    `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Mac download coming soon</title>
    <style>
      body {
        margin: 0;
        min-height: 100vh;
        display: flex;
        align-items: center;
        justify-content: center;
        background: #0b0b0f;
        color: #f8fafc;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
        text-align: center;
        padding: 24px;
      }
      .card { max-width: 420px; }
      h1 { font-size: 22px; margin: 0 0 8px; }
      p { color: #94a3b8; line-height: 1.6; margin: 0; }
    </style>
  </head>
  <body>
    <div class="card">
      <h1>Mac download coming soon</h1>
      <p>The EQHO Player desktop app for Mac isn't available just yet. Please check back soon.</p>
    </div>
  </body>
</html>`,
    {
      status: 200,
      headers: { 'content-type': 'text/html; charset=utf-8' },
    },
  )
}
