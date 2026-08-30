// Static download-only promotional advert for EQHO Player.
// Rendered at EXACTLY 1080 x 1350 px (Facebook / Instagram 4:5 portrait).
// This component is presentational only — it is not linked anywhere on the
// site and does not alter the existing site or player. The advert-preview page
// scales it down for on-screen preview and exports this node at full size.
export function EqhoAdvert() {
  return (
    <div
      id="eqho-advert"
      className="relative overflow-hidden font-sans text-white"
      style={{ width: 1080, height: 1350, backgroundColor: "#020617" }}
    >
      {/* Brand glows — soft radial washes in the real EQHO palette
          (pink/orange top, blue lower-left). Kept subtle, no heavy effects. */}
      <div
        className="pointer-events-none absolute"
        style={{
          top: -260,
          right: -180,
          width: 820,
          height: 820,
          background:
            "radial-gradient(circle, rgba(255,79,163,0.28) 0%, rgba(255,138,0,0.16) 38%, rgba(2,6,23,0) 70%)",
        }}
      />
      <div
        className="pointer-events-none absolute"
        style={{
          bottom: -300,
          left: -220,
          width: 860,
          height: 860,
          background:
            "radial-gradient(circle, rgba(37,99,235,0.30) 0%, rgba(6,182,212,0.14) 40%, rgba(2,6,23,0) 72%)",
        }}
      />

      {/* Content */}
      <div
        className="relative flex h-full w-full flex-col"
        style={{ padding: "72px 80px 64px" }}
      >
        {/* Logo */}
        <img
          src="/images/eqho-player-header-v2.png"
          alt="EQHO Player"
          style={{ height: 92, width: "auto", objectFit: "contain" }}
        />

        {/* Headline block */}
        <div style={{ marginTop: 44 }}>
          <p
            className="font-semibold uppercase"
            style={{ fontSize: 22, letterSpacing: "0.22em", color: "#9aa4c0" }}
          >
            EQHO Player is now
          </p>
          <h1
            className="font-extrabold text-balance"
            style={{ fontSize: 78, lineHeight: 1.0, marginTop: 14 }}
          >
            <span
              style={{
                background:
                  "linear-gradient(100deg, #ff4fa3 0%, #ff6b5c 50%, #ff8a00 100%)",
                WebkitBackgroundClip: "text",
                backgroundClip: "text",
                color: "transparent",
              }}
            >
              Free to use until 1 October 2026
            </span>
          </h1>
        </div>

        {/* Genuine player interface */}
        <div
          className="relative overflow-hidden"
          style={{
            marginTop: 40,
            height: 340,
            borderRadius: 22,
            border: "1px solid rgba(255,255,255,0.10)",
            boxShadow:
              "0 30px 70px rgba(0,0,0,0.55), 0 0 0 1px rgba(255,79,163,0.10)",
          }}
        >
          <img
            src="/marketing/player-hero.png"
            alt="The EQHO Player session interface showing the up-next running order and now-playing controls"
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
              objectPosition: "top center",
            }}
          />
        </div>

        {/* Supporting copy */}
        <div style={{ marginTop: 36 }}>
          <p style={{ fontSize: 30, lineHeight: 1.42, color: "#e6e9f2" }}>
            Organise your routine music, keep training sessions moving and spend
            more time coaching.
          </p>
          <p
            style={{
              fontSize: 30,
              lineHeight: 1.42,
              color: "#e6e9f2",
              marginTop: 18,
            }}
          >
            Prepare your playlists now for the upcoming competition season.
          </p>
        </div>

        {/* CTA + URL pinned to the bottom */}
        <div className="mt-auto flex items-end justify-between" style={{ gap: 24 }}>
          <div>
            <p
              style={{
                fontSize: 24,
                lineHeight: 1.4,
                color: "#c3c9db",
                marginBottom: 22,
                maxWidth: 560,
              }}
            >
              Try the interactive demo or create your free account.
            </p>
            <div
              className="inline-flex items-center font-bold"
              style={{
                height: 88,
                padding: "0 46px",
                borderRadius: 9999,
                fontSize: 34,
                color: "#ffffff",
                background:
                  "linear-gradient(100deg, #ff4fa3 0%, #ff8a00 100%)",
                boxShadow: "0 16px 40px rgba(255,105,60,0.40)",
              }}
            >
              Try EQHO Player
            </div>
          </div>

          <p
            className="font-semibold"
            style={{ fontSize: 26, color: "#ffffff", paddingBottom: 6 }}
          >
            www.eqho-player.com
          </p>
        </div>
      </div>
    </div>
  )
}
