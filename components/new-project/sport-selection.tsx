"use client"

import { cn } from "@/lib/utils"

interface SportSelectionProps {
  selected: string | null
  onSelect: (sport: string) => void
}

const sports = [
  {
    id: "cheerleading",
    label: "Cheerleading",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" className="h-8 w-8 lg:h-10 lg:w-10">
        <path
          d="M12 4L14 6L12 8L10 6L12 4Z"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinejoin="round"
        />
        <path
          d="M12 8V12M12 12L8 16M12 12L16 16M8 16L6 20M16 16L18 20"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M4 8L6 10M20 8L18 10"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
      </svg>
    ),
    color: "eqho-pink",
  },
  {
    id: "gymnastics",
    label: "Gymnastics",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" className="h-8 w-8 lg:h-10 lg:w-10">
        <circle cx="12" cy="5" r="2" stroke="currentColor" strokeWidth="1.5" />
        <path
          d="M8 10C8 10 10 12 12 10C14 8 16 10 16 10M12 10V14M12 14L9 20M12 14L15 20"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M7 13H5M17 13H19"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
      </svg>
    ),
    color: "eqho-green",
  },
  {
    id: "dance",
    label: "Dance",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" className="h-8 w-8 lg:h-10 lg:w-10">
        <circle cx="12" cy="4" r="2" stroke="currentColor" strokeWidth="1.5" />
        <path
          d="M12 6V10M12 10C10 10 8 12 8 14M12 10C14 10 16 12 16 14M8 14L6 20M16 14L18 20M12 10L12 16M12 16L10 20M12 16L14 20"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
    color: "eqho-blue",
  },
  {
    id: "acro",
    label: "Acro",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" className="h-8 w-8 lg:h-10 lg:w-10">
        <circle cx="10" cy="4" r="2" stroke="currentColor" strokeWidth="1.5" />
        <circle cx="16" cy="8" r="2" stroke="currentColor" strokeWidth="1.5" />
        <path
          d="M10 6V10L8 14L6 20M10 10L12 14L14 20M16 10V14L18 20"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
    color: "eqho-pink",
  },
]

export function SportSelection({ selected, onSelect }: SportSelectionProps) {
  return (
    <div className="rounded-xl border border-border/50 bg-card/50 p-5 backdrop-blur-sm">
      <h3 className="mb-4 text-lg font-semibold text-foreground">Select Sport</h3>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
        {sports.map((sport) => {
          const isSelected = selected === sport.id
          return (
            <button
              key={sport.id}
              onClick={() => onSelect(sport.id)}
              className={cn(
                "group relative flex flex-col items-center gap-3 rounded-xl border-2 p-4 transition-all duration-300 hover-lift lg:p-6",
                isSelected
                  ? sport.color === "eqho-pink"
                    ? "border-eqho-pink bg-eqho-pink/10 shadow-lg shadow-eqho-pink/20"
                    : sport.color === "eqho-green"
                      ? "border-eqho-green bg-eqho-green/10 shadow-lg shadow-eqho-green/20"
                      : "border-eqho-blue bg-eqho-blue/10 shadow-lg shadow-eqho-blue/20"
                  : "border-border/50 bg-card hover:border-muted-foreground/30 hover:bg-secondary"
              )}
            >
              {/* Glow effect on selection */}
              {isSelected && (
                <div
                  className={cn(
                    "absolute inset-0 rounded-xl opacity-20 blur-xl",
                    sport.color === "eqho-pink"
                      ? "bg-eqho-pink"
                      : sport.color === "eqho-green"
                        ? "bg-eqho-green"
                        : "bg-eqho-blue"
                  )}
                />
              )}

              <div
                className={cn(
                  "relative transition-all duration-300",
                  isSelected
                    ? sport.color === "eqho-pink"
                      ? "text-eqho-pink"
                      : sport.color === "eqho-green"
                        ? "text-eqho-green"
                        : "text-eqho-blue"
                    : "text-muted-foreground group-hover:text-foreground"
                )}
              >
                {sport.icon}
              </div>
              <span
                className={cn(
                  "relative text-sm font-medium transition-colors",
                  isSelected ? "text-foreground" : "text-muted-foreground group-hover:text-foreground"
                )}
              >
                {sport.label}
              </span>

              {/* Selection indicator */}
              {isSelected && (
                <div
                  className={cn(
                    "absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full text-white",
                    sport.color === "eqho-pink"
                      ? "bg-eqho-pink"
                      : sport.color === "eqho-green"
                        ? "bg-eqho-green"
                        : "bg-eqho-blue"
                  )}
                >
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
