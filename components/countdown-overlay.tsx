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
  return (
    <div className="fixed inset-0 z-[400] flex flex-col items-center justify-center bg-black">
      <div
        key={count}
        className="flex items-center justify-center"
        style={{ animation: "eqhoCountdownPop 1s ease-out" }}
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

      <div className="mt-4 text-center px-6">
        <p className="text-white/50 text-sm font-semibold uppercase tracking-[0.35em] mb-3">
          Up Next
        </p>
        <p className="text-2xl sm:text-3xl font-black text-white uppercase tracking-wide text-balance">
          {nextTitle}
        </p>
      </div>

      <style jsx>{`
        @keyframes eqhoCountdownPop {
          0% {
            transform: scale(0.6);
            opacity: 0;
          }
          30% {
            transform: scale(1.08);
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
