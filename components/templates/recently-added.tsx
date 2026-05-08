"use client"

import { Clock, Layers, Sparkles, ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface RecentlyAddedProps {
  filters: {
    search: string
    sport: string
    length: string
    level: string
  }
  selectedCategory: string | null
}

const recentTemplates = [
  {
    id: 1,
    name: "Pom Power Intro",
    sport: "Pom",
    length: "1:45",
    sections: 5,
    color: "pink",
    isNew: true,
  },
  {
    id: 2,
    name: "Hip Hop Street Vibe",
    sport: "Hip Hop",
    length: "2:00",
    sections: 6,
    color: "green",
    isNew: true,
  },
  {
    id: 3,
    name: "Drill Team Precision",
    sport: "Drill Team",
    length: "2:30",
    sections: 8,
    color: "blue",
    isNew: false,
  },
  {
    id: 4,
    name: "Dance Contemporary",
    sport: "Dance",
    length: "1:30",
    sections: 4,
    color: "pink",
    isNew: false,
  },
  {
    id: 5,
    name: "Acro Group Showcase",
    sport: "Acro",
    length: "2:15",
    sections: 7,
    color: "green",
    isNew: true,
  },
]

const colorMap = {
  pink: {
    bg: "bg-eqho-pink/10",
    border: "hover:border-eqho-pink/30",
    glow: "hover:shadow-eqho-pink/10",
    waveform: "#FF4DA6",
  },
  green: {
    bg: "bg-eqho-green/10",
    border: "hover:border-eqho-green/30",
    glow: "hover:shadow-eqho-green/10",
    waveform: "#00C896",
  },
  blue: {
    bg: "bg-eqho-blue/10",
    border: "hover:border-eqho-blue/30",
    glow: "hover:shadow-eqho-blue/10",
    waveform: "#3D8BFF",
  },
}

function MiniWaveform({ color }: { color: string }) {
  return (
    <div className="flex h-10 w-16 items-center justify-center gap-[2px]">
      {Array.from({ length: 12 }).map((_, i) => {
        const height = Math.sin(i * 0.5) * 50 + 50
        return (
          <div
            key={i}
            className="rounded-full"
            style={{
              width: "2px",
              height: `${height}%`,
              backgroundColor: color,
              opacity: 0.7,
            }}
          />
        )
      })}
    </div>
  )
}

export function RecentlyAdded({ filters, selectedCategory }: RecentlyAddedProps) {
  // Filter templates based on active filters
  const filteredTemplates = recentTemplates.filter((template) => {
    if (filters.search && !template.name.toLowerCase().includes(filters.search.toLowerCase())) {
      return false
    }
    if (filters.sport !== "all" && template.sport.toLowerCase().replace(" ", "-") !== filters.sport) {
      return false
    }
    if (selectedCategory && template.sport.toLowerCase().replace(" ", "-") !== selectedCategory) {
      return false
    }
    return true
  })

  return (
    <section>
      <div className="mb-5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-eqho-green" />
          <h2 className="text-lg font-semibold text-foreground">Recently Added</h2>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="gap-1 text-muted-foreground hover:text-foreground transition-colors duration-200"
        >
          View all
          <ArrowRight className="h-4 w-4" />
        </Button>
      </div>

      {filteredTemplates.length === 0 ? (
        <div className="glass-panel rounded-xl p-8 text-center">
          <p className="text-sm text-muted-foreground">
            No recently added templates match your filters.
          </p>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          {filteredTemplates.map((template) => {
            const colors = colorMap[template.color as keyof typeof colorMap]
            return (
              <div
                key={template.id}
                className={cn(
                  "group relative flex items-center gap-3 rounded-xl border border-border/50 bg-card p-4 transition-all duration-200 hover-lift cursor-pointer",
                  colors.border,
                  colors.glow,
                  "hover:shadow-lg"
                )}
              >
                {/* New Badge */}
                {template.isNew && (
                  <div className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-eqho-green text-[10px] font-bold text-white">
                    N
                  </div>
                )}

                {/* Mini Waveform Thumbnail */}
                <div className={cn("shrink-0 rounded-lg p-2", colors.bg)}>
                  <MiniWaveform color={colors.waveform} />
                </div>

                {/* Info */}
                <div className="min-w-0 flex-1">
                  <h3 className="truncate font-medium text-foreground text-sm group-hover:text-white transition-colors duration-200">
                    {template.name}
                  </h3>
                  <p className="text-xs text-muted-foreground">{template.sport}</p>
                  <div className="mt-1 flex items-center gap-3 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {template.length}
                    </span>
                    <span className="flex items-center gap-1">
                      <Layers className="h-3 w-3" />
                      {template.sections}
                    </span>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </section>
  )
}
