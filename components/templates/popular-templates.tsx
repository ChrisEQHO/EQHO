"use client"

import { Play, Clock, Layers, Star, ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface PopularTemplatesProps {
  filters: {
    search: string
    sport: string
    length: string
    level: string
  }
  selectedCategory: string | null
}

const templates = [
  {
    id: 1,
    name: "Cheer Elite 2:30",
    sport: "Cheerleading",
    level: "Elite",
    description: "High-energy routine with dynamic transitions, stunts, and a powerful finale.",
    length: "2:30",
    sections: 8,
    color: "pink",
    featured: true,
  },
  {
    id: 2,
    name: "Gymnastics Floor 90s",
    sport: "Gymnastics",
    level: "Intermediate",
    description: "Classic floor routine structure with tumbling passes and dance elements.",
    length: "1:30",
    sections: 6,
    color: "green",
    featured: true,
  },
  {
    id: 3,
    name: "Acro Dynamic 2:15",
    sport: "Acro",
    level: "Elite",
    description: "Balanced routine with partner skills, group stunts, and artistic moments.",
    length: "2:15",
    sections: 7,
    color: "blue",
    featured: true,
  },
  {
    id: 4,
    name: "Dance Solo Build",
    sport: "Dance",
    level: "Professional",
    description: "Solo performance structure with emotional peaks and technical showcases.",
    length: "2:00",
    sections: 5,
    color: "pink",
    featured: true,
  },
]

const colorMap = {
  pink: {
    gradient: "from-eqho-pink/20 via-eqho-pink/10 to-transparent",
    glow: "group-hover:shadow-eqho-pink/20",
    border: "group-hover:border-eqho-pink/30",
    accent: "bg-eqho-pink",
    text: "text-eqho-pink",
    waveform: "#FF4DA6",
  },
  green: {
    gradient: "from-eqho-green/20 via-eqho-green/10 to-transparent",
    glow: "group-hover:shadow-eqho-green/20",
    border: "group-hover:border-eqho-green/30",
    accent: "bg-eqho-green",
    text: "text-eqho-green",
    waveform: "#00C896",
  },
  blue: {
    gradient: "from-eqho-blue/20 via-eqho-blue/10 to-transparent",
    glow: "group-hover:shadow-eqho-blue/20",
    border: "group-hover:border-eqho-blue/30",
    accent: "bg-eqho-blue",
    text: "text-eqho-blue",
    waveform: "#3D8BFF",
  },
}

function WaveformPreview({ color }: { color: string }) {
  return (
    <div className="relative h-24 w-full overflow-hidden rounded-lg bg-background/50">
      {/* Animated Waveform Bars */}
      <div className="absolute inset-0 flex items-center justify-center gap-[3px] px-4">
        {Array.from({ length: 40 }).map((_, i) => {
          const height = Math.sin(i * 0.3) * 30 + 40 + Math.random() * 20
          return (
            <div
              key={i}
              className="rounded-full transition-all duration-300"
              style={{
                width: "3px",
                height: `${height}%`,
                backgroundColor: color,
                opacity: 0.6 + Math.random() * 0.4,
              }}
            />
          )
        })}
      </div>
      
      {/* Play Button Overlay */}
      <div className="absolute inset-0 flex items-center justify-center opacity-0 transition-opacity duration-200 group-hover:opacity-100">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/10 backdrop-blur-sm">
          <Play className="h-5 w-5 text-white" fill="white" />
        </div>
      </div>
    </div>
  )
}

export function PopularTemplates({ filters, selectedCategory }: PopularTemplatesProps) {
  // Filter templates based on active filters
  const filteredTemplates = templates.filter((template) => {
    if (filters.search && !template.name.toLowerCase().includes(filters.search.toLowerCase())) {
      return false
    }
    if (filters.sport !== "all" && template.sport.toLowerCase().replace(" ", "-") !== filters.sport) {
      return false
    }
    if (filters.level !== "all" && template.level.toLowerCase() !== filters.level) {
      return false
    }
    if (selectedCategory && template.sport.toLowerCase() !== selectedCategory.toLowerCase()) {
      return false
    }
    return true
  })

  return (
    <section>
      <div className="mb-5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Star className="h-5 w-5 text-eqho-pink" />
          <h2 className="text-lg font-semibold text-foreground">Popular Templates</h2>
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
        <div className="glass-panel rounded-xl p-12 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-eqho-pink/20 to-eqho-blue/20">
            <Layers className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="mb-2 font-semibold text-foreground">No templates found</h3>
          <p className="text-sm text-muted-foreground">
            Try adjusting your filters to see more templates.
          </p>
        </div>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
          {filteredTemplates.map((template) => {
            const colors = colorMap[template.color as keyof typeof colorMap]
            return (
              <div
                key={template.id}
                className={cn(
                  "group relative overflow-hidden rounded-xl border border-border/50 bg-card transition-all duration-300 hover-lift card-shine",
                  colors.glow,
                  colors.border,
                  "hover:shadow-xl"
                )}
              >
                {/* Gradient Overlay */}
                <div
                  className={cn(
                    "pointer-events-none absolute inset-0 bg-gradient-to-br opacity-0 transition-opacity duration-300 group-hover:opacity-100",
                    colors.gradient
                  )}
                />

                {/* Waveform Preview */}
                <div className="relative p-4 pb-0">
                  <WaveformPreview color={colors.waveform} />
                </div>

                {/* Content */}
                <div className="relative p-4">
                  {/* Tags */}
                  <div className="mb-3 flex flex-wrap gap-2">
                    <span
                      className={cn(
                        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
                        colors.accent,
                        "text-white"
                      )}
                    >
                      {template.sport}
                    </span>
                    <span className="inline-flex items-center rounded-full bg-secondary px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
                      {template.level}
                    </span>
                  </div>

                  {/* Title */}
                  <h3 className="mb-2 font-semibold text-foreground transition-colors duration-200 group-hover:text-white">
                    {template.name}
                  </h3>

                  {/* Description */}
                  <p className="mb-4 line-clamp-2 text-sm text-muted-foreground">
                    {template.description}
                  </p>

                  {/* Meta Info */}
                  <div className="mb-4 flex items-center gap-4 text-xs text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Clock className="h-3.5 w-3.5" />
                      {template.length}
                    </div>
                    <div className="flex items-center gap-1">
                      <Layers className="h-3.5 w-3.5" />
                      {template.sections} sections
                    </div>
                  </div>

                  {/* Use Template Button */}
                  <Button
                    className={cn(
                      "w-full bg-gradient-to-r text-white transition-all duration-200 hover:opacity-90 hover:shadow-lg",
                      template.color === "pink" && "from-eqho-pink to-eqho-pink/80 hover:shadow-eqho-pink/25",
                      template.color === "green" && "from-eqho-green to-eqho-green/80 hover:shadow-eqho-green/25",
                      template.color === "blue" && "from-eqho-blue to-eqho-blue/80 hover:shadow-eqho-blue/25"
                    )}
                  >
                    Use Template
                  </Button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </section>
  )
}
