import { Info } from "lucide-react"
import { cn } from "@/lib/utils"

// A small, unmissable label placed next to any illustrative "popularity" or
// country figure so it can never be mistaken for real sales data (spec §21/§31).
export function SampleBadge({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border border-amber-400/30 bg-amber-400/10 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-amber-300",
        className,
      )}
    >
      <Info className="h-3 w-3" aria-hidden="true" />
      Sample — illustrative only
    </span>
  )
}
