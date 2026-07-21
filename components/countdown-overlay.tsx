"use client";

/**
 * Full-screen "get ready" countdown overlay shown during the gap between tracks.
 *
 * This is the SINGLE source of truth for the countdown on every web player
 * surface (desktop, iPad web, mobile web) so they all look identical to the
 * native mobile app: a giant pink -> orange gradient number on a black
 * background, with "UP NEXT" and the upcoming track title beneath it.
 *
 * The number is drawn as SVG <text> with an SVG linearGradient fill instead of
 * CSS `background-clip: text`. At huge font sizes iPad/iOS Safari fails to paint
 * gradient-clipped HTML text (it renders fully transparent), but an SVG gradient
 * fill paints reliably on every browser — so we get the true brand gradient
 * everywhere without the invisibility bug.
 */
export function CountdownOverlay({
  count,
  nextTitle,
}: {
  count: number;
  nextTitle: string;
}) {
  console.log("[v0] IPAD OVERLAY rendered visibleCountdown=", count, "mounted=true");
  return (
    <div className="fixed inset-0 z-[400] flex flex-col items-center justify-center bg-black">
      <div
        key={count}
        className="flex items-center justify-center"
        // The pop is a subtle SCALE emphasis only. Crucially it never touches
        // opacity and starts/ends at scale(1): if iPad Safari's compositor is idle
        // during the silent gap and the animation never advances past its first
        // frame, the number is STILL fully visible at its resting state. (The old
        // keyframes began at opacity:0/scale:0.6, so a stalled animation left each
        // freshly key-remounted number invisible on iPad — the frozen-countdown bug.)
        style={{ animation: "eqhoCountdownPop 0.9s ease-out" }}
      >
        <svg
          viewBox="0 0 200 170"
          className="h-[52vh] max-h-[560px] w-auto max-w-[88vw]"
          role="img"
          aria-label={`Starting in ${count} seconds`}
          style={{
            filter:
              "drop-shadow(0 0 60px rgba(255,79,163,0.45)) drop-shadow(0 0 120px rgba(255,138,0,0.30))",
          }}
        >
          <defs>
            <linearGradient id="eqhoCountdownGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#ff4fa3" />
              <stop offset="100%" stopColor="#ff8a00" />
            </linearGradient>
          </defs>
          <text
            x="100"
            y="92"
            textAnchor="middle"
            dominantBaseline="central"
            fill="url(#eqhoCountdownGradient)"
            fontSize="170"
            fontWeight="900"
            style={{ fontFamily: "inherit", letterSpacing: "-0.03em" }}
          >
            {count}
          </text>
        </svg>
      </div>

      {/* TEMPORARY on-device proof (spec §9) — remove after physical iPad confirms
          the number steps 5→4→3→2→1. Shows the live value actually rendered. */}
      <div className="mt-2 rounded-md border border-[#ff4fa3]/60 bg-black/80 px-3 py-1 font-mono text-xs text-white">
        RENDER: {count}
      </div>

      <div className="mt-4 text-center px-6">
        <p className="text-white/50 text-sm font-semibold uppercase tracking-[0.35em] mb-3">
          Up Next
        </p>
        <p className="text-2xl sm:text-3xl font-black text-white uppercase tracking-wide text-balance">
          {nextTitle}
        </p>
      </div>

      <style jsx>{`
        /* Scale-only emphasis. opacity stays 1 at every keyframe and the element's
           resting state is scale(1)/opacity(1), so a stalled animation on an idle
           iPad compositor can never hide the number. */
        @keyframes eqhoCountdownPop {
          0% {
            transform: scale(1);
            opacity: 1;
          }
          40% {
            transform: scale(1.12);
            opacity: 1;
          }
          100% {
            transform: scale(1);
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
}
