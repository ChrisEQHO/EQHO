"use client"

import { cn } from "@/lib/utils"

interface LevelSelectionProps {
  selected: string | null
  onSelect: (level: string) => void
}

const levels = [
  { id: "beginner", label: "Beginner", description: "Entry level routines" },
  { id: "junior", label: "Junior", description: "Intermediate complexity" },
  { id: "senior", label: "Senior", description: "Advanced routines" },
  { id: "elite", label: "Elite", description: "Competition ready" },
]

export function LevelSelection({ selected, onSelect }: LevelSelectionProps) {
  return (
    <div className="rounded-xl border border-border/50 bg-card/50 p-5 backdrop-blur-sm">
      <h3 className="mb-4 text-lg font-semibold text-foreground">Select Level</h3>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
        {levels.map((level, index) => {
          const isSelected = selected === level.id
          // Gradient from beginner to elite
          const gradientPosition = index / (levels.length - 1)
          
          return (
            <button
              key={level.id}
              onClick={() => onSelect(level.id)}
              className={cn(
                "group relative flex flex-col items-start gap-1 rounded-xl border-2 p-4 text-left transition-all duration-300 hover-lift",
                isSelected
                  ? "border-eqho-green bg-eqho-green/10 shadow-lg shadow-eqho-green/20"
                  : "border-border/50 bg-card hover:border-muted-foreground/30 hover:bg-secondary"
              )}
            >
              {/* Progress bar indicator */}
              <div className="mb-2 h-1.5 w-full overflow-hidden rounded-full bg-border/50">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-eqho-green to-eqho-blue transition-all duration-500"
                  style={{ width: `${(gradientPosition + 0.25) * 100}%` }}
                />
              </div>

              <span
                className={cn(
                  "text-sm font-semibold transition-colors",
                  isSelected ? "text-eqho-green" : "text-foreground"
                )}
              >
                {level.label}
              </span>
              <span className="text-xs text-muted-foreground">{level.description}</span>

              {/* Selection indicator */}
              {isSelected && (
                <div className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-eqho-green text-white">
                  <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}
