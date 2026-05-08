"use client"

import { cn } from "@/lib/utils"

interface MusicMoodSelectionProps {
  selected: string[]
  onSelect: (moods: string[]) => void
}

const moods = [
  { id: "energetic", label: "Energetic", color: "eqho-pink" },
  { id: "powerful", label: "Powerful", color: "eqho-blue" },
  { id: "cinematic", label: "Cinematic", color: "eqho-green" },
  { id: "emotional", label: "Emotional", color: "eqho-pink" },
  { id: "aggressive", label: "Aggressive", color: "eqho-blue" },
  { id: "fun", label: "Fun", color: "eqho-green" },
  { id: "dark", label: "Dark", color: "eqho-blue" },
  { id: "inspiring", label: "Inspiring", color: "eqho-pink" },
]

export function MusicMoodSelection({ selected, onSelect }: MusicMoodSelectionProps) {
  const toggleMood = (moodId: string) => {
    if (selected.includes(moodId)) {
      onSelect(selected.filter((id) => id !== moodId))
    } else {
      onSelect([...selected, moodId])
    }
  }

  return (
    <div className="rounded-xl border border-border/50 bg-card/50 p-5 backdrop-blur-sm">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-lg font-semibold text-foreground">Music Style / Mood</h3>
        <span className="text-sm text-muted-foreground">Select multiple</span>
      </div>
      <div className="flex flex-wrap gap-3">
        {moods.map((mood) => {
          const isSelected = selected.includes(mood.id)
          
          return (
            <button
              key={mood.id}
              onClick={() => toggleMood(mood.id)}
              className={cn(
                "group relative rounded-full border-2 px-4 py-2 text-sm font-medium transition-all duration-300",
                isSelected
                  ? mood.color === "eqho-pink"
                    ? "border-eqho-pink bg-eqho-pink/10 text-eqho-pink shadow-md shadow-eqho-pink/20"
                    : mood.color === "eqho-green"
                      ? "border-eqho-green bg-eqho-green/10 text-eqho-green shadow-md shadow-eqho-green/20"
                      : "border-eqho-blue bg-eqho-blue/10 text-eqho-blue shadow-md shadow-eqho-blue/20"
                  : "border-border/50 bg-card text-muted-foreground hover:border-muted-foreground/50 hover:text-foreground"
              )}
            >
              {mood.label}
              
              {/* Pulse animation when selected */}
              {isSelected && (
                <span
                  className={cn(
                    "absolute inset-0 rounded-full opacity-0 animate-ping",
                    mood.color === "eqho-pink"
                      ? "bg-eqho-pink/30"
                      : mood.color === "eqho-green"
                        ? "bg-eqho-green/30"
                        : "bg-eqho-blue/30"
                  )}
                  style={{ animationDuration: "1.5s", animationIterationCount: "1" }}
                />
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}
