import { allGenres, allMoods } from "@/lib/music/catalog"
import { BrowseExplorer } from "@/components/music/browse-explorer"
import { SampleBadge } from "@/components/music/sample-badge"

export const metadata = {
  title: "Browse — EQHO Music",
  description: "Search and filter the EQHO Music catalogue.",
}

export default function BrowsePage() {
  const genres = allGenres()
  const moods = allMoods()

  return (
    <div className="flex flex-col gap-6 pb-16">
      <header className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold text-white">Browse the catalogue</h1>
        <p className="max-w-2xl text-sm leading-relaxed text-white/55">
          Filter by genre and mood, or sort by what&apos;s most licensed. The &ldquo;Hidden gems&rdquo; sort
          deliberately surfaces lesser-used tracks so newer work gets a fair hearing.
        </p>
        <div className="flex items-center gap-2 text-xs text-white/40">
          <SampleBadge />
          <span>Popularity ordering uses illustrative sample data only.</span>
        </div>
      </header>

      <BrowseExplorer genres={genres} moods={moods} />
    </div>
  )
}
