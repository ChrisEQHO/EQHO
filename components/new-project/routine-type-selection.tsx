"use client"

import { Trophy, Sparkles, Dumbbell, Music2 } from "lucide-react"
import { cn } from "@/lib/utils"

interface RoutineTypeSelectionProps {
  selected: string | null
  onSelect: (type: string) => void
}

const routineTypes = [
  { id: "competition", label: "Competition", icon: Trophy, description: "Official events" },
  { id: "exhibition", label: "Exhibition", icon: Sparkles, description: "Showcase performances" },
  { id: "training", label: "Training", icon: Dumbbell, description: "Practice sessions" },
  { id: "choreography", label: "Choreography", icon: Music2, description: "Creative work" },
]

export function RoutineTypeSelection({ selected, onSelect }: RoutineTypeSelectionProps) {
  return (
    <div className="rounded-xl border border-border/50 bg-card/50 p-5 backdrop-blur-sm">
      <h3 className="mb-4 text-lg font-semibold text-foreground">Routine Type</h3>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
        {routineTypes.map((type) => {
          const isSelected = selected === type.id
          
          return (
            <button
              key={type.id}
              onClick={() => onSelect(type.id)}
              className={cn(
                "group relative flex flex-col items-center gap-2 rounded-xl border-2 p-4 transition-all duration-300 hover-lift",
                isSelected
                  ? "border-eqho-blue bg-eqho-blue/10 shadow-lg shadow-eqho-blue/20"
                  : "border-border/50 bg-card hover:border-muted-foreground/30 hover:bg-secondary"
              )}
            >
              <type.icon
                className={cn(
                  "h-6 w-6 transition-all duration-300",
                  isSelected
                    ? "text-eqho-blue"
                    : "text-muted-foreground group-hover:text-foreground"
                )}
              />
              <div className="text-center">
                <span
                  className={cn(
                    "block text-sm font-medium transition-colors",
                    isSelected ? "text-foreground" : "text-foreground"
                  )}
                >
                  {type.label}
                </span>
                <span className="text-xs text-muted-foreground">{type.description}</span>
              </div>

              {/* Selection indicator */}
              {isSelected && (
                <div className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-eqho-blue text-white">
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
