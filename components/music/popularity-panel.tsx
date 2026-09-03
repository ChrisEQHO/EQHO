import { SampleBadge } from "./sample-badge"
import type { TrackSampleSignals } from "@/lib/music/types"

// Renders the illustrative popularity + per-country breakdown for a track.
// Every number here is sample data and is wrapped in a prominent "Sample —
// illustrative only" treatment so it can never be read as real sales (spec §21/§31).
export function PopularityPanel({ sample }: { sample: TrackSampleSignals }) {
  const countries = [...sample.illustrativeCountries].sort((a, b) => b.percent - a.percent)

  return (
    <div className="flex flex-col gap-4 rounded-xl border border-dashed border-white/15 bg-white/[0.02] p-5">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-base font-semibold text-white">Licence popularity</h2>
        <SampleBadge />
      </div>

      <p className="text-xs leading-relaxed text-white/45">
        These figures are illustrative placeholders that demonstrate how popularity and reach will be shown. They are
        not real sales and no licences have been sold in this preview.
      </p>

      <div className="flex items-end gap-2">
        <span className="text-3xl font-semibold text-white">{sample.illustrativeLicences.toLocaleString()}</span>
        <span className="pb-1 text-xs text-white/50">sample licences</span>
      </div>

      <div className="flex flex-col gap-2.5">
        <p className="text-xs uppercase tracking-wide text-white/40">Where it&apos;s used (sample)</p>
        {countries.map((c) => (
          <div key={c.country} className="flex flex-col gap-1">
            <div className="flex items-center justify-between text-xs">
              <span className="text-white/70">{c.country}</span>
              <span className="text-white/45">{c.percent}%</span>
            </div>
            <div className="h-1.5 overflow-hidden rounded-full bg-white/10">
              <div
                className="h-full rounded-full bg-gradient-to-r from-[#ff4fa3] to-[#ff8a00]"
                style={{ width: `${c.percent}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
