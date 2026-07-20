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
  const label = `Completed ${count} ${count === 1 ? "time" : "times"} this session`;
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-[#ff4fa3] to-[#ff8a00] font-bold text-white shadow-sm shrink-0 ${
        isLg ? "px-2.5 py-1 text-sm" : "px-1.5 py-[1px] text-[10px]"
      } ${className}`}
      title={label}
      aria-label={label}
    >
      {count}
    </span>
  );
}
