import { cn } from "@/lib/utils"

// Branded, abstract artwork placeholder for EQHO Music.
//
// The prototype ships NO fabricated cover art or creator photos. This renders a
// premium EQHO-gradient tile (pink → orange with a rotating accent) plus a
// waveform motif, so the browsing layout looks finished while remaining honestly
// a placeholder. `accent` varies the hue per card; `label` is shown small.

const GRADIENTS: { from: string; via: string; to: string }[] = [
  { from: "#ff4fa3", via: "#ff6b2c", to: "#ff8a00" },
  { from: "#b86cff", via: "#ff4fa3", to: "#ff6b2c" },
  { from: "#ff8a00", via: "#ff6b2c", to: "#ff4fa3" },
  { from: "#00d9ff", via: "#b86cff", to: "#ff4fa3" },
  { from: "#ff4fa3", via: "#b86cff", to: "#00d9ff" },
  { from: "#ff6b2c", via: "#ff4fa3", to: "#b86cff" },
]

// A gentle deterministic bar pattern so every tile feels composed, not random.
const BAR_HEIGHTS = [38, 62, 48, 78, 90, 66, 50, 72, 44, 84, 58, 40]

export function ArtworkPlaceholder({
  accent = 0,
  label,
  variant = "track",
  className,
}: {
  accent?: number
  label?: string
  variant?: "track" | "creator"
  className?: string
}) {
  const g = GRADIENTS[accent % GRADIENTS.length]

  return (
    <div
      className={cn(
        "relative flex h-full w-full items-end justify-center overflow-hidden",
        className,
      )}
      style={{
        backgroundImage: `linear-gradient(135deg, ${g.from} 0%, ${g.via} 52%, ${g.to} 100%)`,
      }}
      aria-hidden="true"
    >
      {/* soft top glow */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(120% 90% at 50% 0%, rgba(255,255,255,0.28), rgba(255,255,255,0) 60%)",
        }}
      />
      {/* deep vignette for text contrast */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "linear-gradient(180deg, rgba(2,6,23,0) 40%, rgba(2,6,23,0.55) 100%)",
        }}
      />

      {variant === "creator" ? (
        // Concentric ring monogram motif for creator slots.
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="grid h-16 w-16 place-items-center rounded-full border border-white/40 bg-white/10 backdrop-blur-sm">
            <div className="h-8 w-8 rounded-full border border-white/60" />
          </div>
        </div>
      ) : (
        // Equaliser/waveform motif for track slots.
        <div className="absolute inset-0 flex items-center justify-center gap-[6px] px-6">
          {BAR_HEIGHTS.map((h, i) => (
            <span
              key={i}
              className="w-[5px] rounded-full bg-white/70"
              style={{ height: `${h}%`, opacity: 0.35 + (h / 100) * 0.5 }}
            />
          ))}
        </div>
      )}

      {label ? (
        <span className="relative z-10 mb-2 rounded-full bg-black/30 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-white/90 backdrop-blur-sm">
          {label}
        </span>
      ) : null}
    </div>
  )
}
