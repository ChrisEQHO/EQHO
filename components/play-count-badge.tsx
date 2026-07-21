/**
 * Small branded badge showing how many times a track has been played fully to the
 * end (i.e. completed routines) in the current session. Renders nothing until the
 * track has at least one full completion. Uses the EQHO pink -> orange brand
 * gradient so it matches the player across every surface (desktop, coach
 * fullscreen, iPad and iPhone web + native app).
 */
export function PlayCountBadge({
  count,
  size = "sm",
  className = "",
}: {
  count: number;
  size?: "sm" | "lg";
  className?: string;
}) {
  if (!count || count < 1) return null;
  const isLg = size === "lg";
  const label = `Completed ${count} ${count === 1 ? "routine" : "routines"} this session`;
  return (
    <span
      className={`inline-flex items-center justify-center rounded-full bg-gradient-to-br from-[#ff4fa3] to-[#ff8a00] font-black tabular-nums leading-none text-white ring-2 ring-white/25 shrink-0 ${
        isLg
          ? "min-w-[32px] h-8 px-2.5 text-base"
          : "min-w-[22px] h-[22px] px-1.5 text-xs"
      } ${className}`}
      style={{ boxShadow: "0 0 10px rgba(255,79,163,0.55), 0 2px 6px rgba(0,0,0,0.35)" }}
      title={label}
      aria-label={label}
    >
      {count}
    </span>
  );
}
