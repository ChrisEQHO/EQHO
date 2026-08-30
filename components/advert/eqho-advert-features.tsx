// Static download-only promotional advert #2 for EQHO Player.
// Highlights the LIVE-SESSION features of the player while it is in use.
// Rendered at EXACTLY 1080 x 1350 px (Facebook / Instagram 4:5 portrait).
// Presentational only — not linked anywhere on the site and it changes nothing
// about the existing site or player. The preview page scales it for on-screen
// preview and exports this node at full size.

const FEATURES: { title: string; body: string }[] = [
  {
    title: "Live session countdown",
    body: "See exactly how long is left and which routine is up next.",
  },
  {
    title: "Rounds & auto gaps",
    body: "Loop the set for multiple rounds with timed gaps between routines.",
  },
  {
    title: "Drag-to-reorder running order",
    body: "Reshuffle the line-up in seconds — no stopping the music.",
  },
  {
    title: "Hands-free playback",
    body: "Tracks advance on their own so you can stay focused on coaching.",
  },
]

export function EqhoAdvertFeatures() {
  return (
    <div
      id="eqho-advert-features"
      className="relative overflow-hidden font-sans text-white"
      style={{ width: 1080, height: 1350, backgroundColor: "#020617" }}
    >
      {/* Brand glows — pink/orange top-right, blue lower-left. */}
      <div
        className="pointer-events-none absolute"
        style={{
          top: -280,
          right: -200,
          width: 860,
          height: 860,
          background:
            "radial-gradient(circle, rgba(255,79,163,0.26) 0%, rgba(255,138,0,0.15) 40%, rgba(2,6,23,0) 72%)",
        }}
      />
      <div
        className="pointer-events-none absolute"
        style={{
          bottom: -320,
          left: -240,
          width: 900,
          height: 900,
          background:
            "radial-gradient(circle, rgba(37,99,235,0.28) 0%, rgba(6,182,212,0.13) 42%, rgba(2,6,23,0) 74%)",
        }}
      />

      {/* Content */}
      <div
        className="relative flex h-full w-full flex-col"
        style={{ padding: "68px 76px 60px" }}
      >
        {/* Logo + eyebrow */}
        <div className="flex items-center justify-between">
          <img
            src="/images/eqho-player-header-v2.png"
            alt="EQHO Player"
            style={{ height: 80, width: "auto", objectFit: "contain" }}
          />
          <span
            className="font-semibold uppercase"
            style={{
              fontSize: 20,
              letterSpacing: "0.18em",
              color: "#9aa4c0",
            }}
          >
            Built for training sessions
          </span>
        </div>

        {/* Headline */}
        <h1
          className="font-extrabold text-balance"
          style={{ fontSize: 66, lineHeight: 1.02, marginTop: 40 }}
        >
          Run the whole session
          <br />
          <span
            style={{
              background:
                "linear-gradient(100deg, #ff4fa3 0%, #ff6b5c 50%, #ff8a00 100%)",
              WebkitBackgroundClip: "text",
              backgroundClip: "text",
              color: "transparent",
            }}
          >
            without touching your phone
          </span>
        </h1>

        {/* Genuine full-screen coach-mode interface */}
        <div
          className="relative overflow-hidden"
          style={{
            marginTop: 38,
            height: 452,
            borderRadius: 22,
            border: "1px solid rgba(255,255,255,0.10)",
            boxShadow:
              "0 30px 70px rgba(0,0,0,0.55), 0 0 0 1px rgba(255,79,163,0.10)",
          }}
        >
          <img
            src="/marketing/player-fullscreen.png"
            alt="EQHO Player full-screen session view showing the session-remaining countdown, current routine, transport controls, waveform and up-next running order"
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
              objectPosition: "top center",
            }}
          />
        </div>

        {/* Feature grid */}
        <div
          className="grid"
          style={{
            marginTop: 34,
            gridTemplateColumns: "1fr 1fr",
            columnGap: 28,
            rowGap: 24,
          }}
        >
          {FEATURES.map((f) => (
            <div key={f.title} className="flex items-start" style={{ gap: 16 }}>
              {/* Gradient check dot */}
              <div
                className="flex shrink-0 items-center justify-center"
                style={{
                  width: 34,
                  height: 34,
                  marginTop: 4,
                  borderRadius: 9999,
                  background:
                    "linear-gradient(135deg, #ff4fa3 0%, #ff8a00 100%)",
                }}
              >
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#ffffff"
                  strokeWidth="3.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </div>
              <div>
                <p
                  className="font-bold"
                  style={{ fontSize: 27, lineHeight: 1.2 }}
                >
                  {f.title}
                </p>
                <p
                  style={{
                    fontSize: 21,
                    lineHeight: 1.36,
                    color: "#c3c9db",
                    marginTop: 6,
                  }}
                >
                  {f.body}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* CTA + URL pinned to the bottom */}
        <div
          className="mt-auto flex items-end justify-between"
          style={{ gap: 24 }}
        >
          <div
            className="inline-flex items-center font-bold"
            style={{
              height: 86,
              padding: "0 44px",
              borderRadius: 9999,
              fontSize: 32,
              color: "#ffffff",
              background: "linear-gradient(100deg, #ff4fa3 0%, #ff8a00 100%)",
              boxShadow: "0 16px 40px rgba(255,105,60,0.40)",
            }}
          >
            Try the interactive demo
          </div>

          <p
            className="font-semibold"
            style={{ fontSize: 25, color: "#ffffff", paddingBottom: 6 }}
          >
            www.eqho-player.com
          </p>
        </div>
      </div>
    </div>
  )
}
