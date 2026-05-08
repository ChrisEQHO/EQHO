"use client"

import { useState } from "react"
import { Clock, Settings2 } from "lucide-react"
import { cn } from "@/lib/utils"

interface RoutineLengthSelectionProps {
  selected: string | null
  onSelect: (length: string) => void
}

const presetLengths = [
  { id: "1:00", label: "1:00", minutes: 1 },
  { id: "1:30", label: "1:30", minutes: 1.5 },
  { id: "2:00", label: "2:00", minutes: 2 },
  { id: "2:30", label: "2:30", minutes: 2.5 },
]

export function RoutineLengthSelection({ selected, onSelect }: RoutineLengthSelectionProps) {
  const [customMode, setCustomMode] = useState(false)
  const [customMinutes, setCustomMinutes] = useState(2)
  const [customSeconds, setCustomSeconds] = useState(0)

  const handleCustomSelect = () => {
    setCustomMode(true)
    onSelect(`${customMinutes}:${customSeconds.toString().padStart(2, "0")}`)
  }

  const updateCustomTime = (minutes: number, seconds: number) => {
    setCustomMinutes(minutes)
    setCustomSeconds(seconds)
    onSelect(`${minutes}:${seconds.toString().padStart(2, "0")}`)
  }

  return (
    <div className="rounded-xl border border-border/50 bg-card/50 p-5 backdrop-blur-sm">
      <h3 className="mb-4 text-lg font-semibold text-foreground">Routine Length</h3>
      <div className="flex flex-wrap gap-3">
        {/* Preset buttons */}
        {presetLengths.map((length) => {
          const isSelected = selected === length.id && !customMode
          
          return (
            <button
              key={length.id}
              onClick={() => {
                setCustomMode(false)
                onSelect(length.id)
              }}
              className={cn(
                "group relative flex items-center gap-2 rounded-xl border-2 px-4 py-3 transition-all duration-300 hover-lift",
                isSelected
                  ? "border-eqho-pink bg-eqho-pink/10 shadow-lg shadow-eqho-pink/20"
                  : "border-border/50 bg-card hover:border-muted-foreground/30 hover:bg-secondary"
              )}
            >
              <Clock
                className={cn(
                  "h-4 w-4 transition-colors",
                  isSelected ? "text-eqho-pink" : "text-muted-foreground group-hover:text-foreground"
                )}
              />
              <span
                className={cn(
                  "font-semibold tabular-nums transition-colors",
                  isSelected ? "text-foreground" : "text-foreground"
                )}
              >
                {length.label}
              </span>

              {isSelected && (
                <div className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-eqho-pink text-white">
                  <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              )}
            </button>
          )
        })}

        {/* Custom button */}
        <button
          onClick={handleCustomSelect}
          className={cn(
            "group relative flex items-center gap-2 rounded-xl border-2 px-4 py-3 transition-all duration-300 hover-lift",
            customMode
              ? "border-eqho-green bg-eqho-green/10 shadow-lg shadow-eqho-green/20"
              : "border-border/50 bg-card hover:border-muted-foreground/30 hover:bg-secondary"
          )}
        >
          <Settings2
            className={cn(
              "h-4 w-4 transition-colors",
              customMode ? "text-eqho-green" : "text-muted-foreground group-hover:text-foreground"
            )}
          />
          <span className="font-medium">Custom</span>
        </button>
      </div>

      {/* Custom time picker */}
      {customMode && (
        <div className="mt-4 flex items-center gap-4 rounded-lg border border-border/50 bg-card p-4">
          <div className="flex items-center gap-2">
            <label className="text-sm text-muted-foreground">Minutes:</label>
            <input
              type="number"
              min="0"
              max="10"
              value={customMinutes}
              onChange={(e) => updateCustomTime(parseInt(e.target.value) || 0, customSeconds)}
              className="w-16 rounded-lg border border-border bg-background px-3 py-2 text-center font-mono text-foreground focus:border-eqho-green focus:outline-none focus:ring-1 focus:ring-eqho-green"
            />
          </div>
          <span className="text-xl font-bold text-muted-foreground">:</span>
          <div className="flex items-center gap-2">
            <label className="text-sm text-muted-foreground">Seconds:</label>
            <input
              type="number"
              min="0"
              max="59"
              value={customSeconds}
              onChange={(e) => updateCustomTime(customMinutes, parseInt(e.target.value) || 0)}
              className="w-16 rounded-lg border border-border bg-background px-3 py-2 text-center font-mono text-foreground focus:border-eqho-green focus:outline-none focus:ring-1 focus:ring-eqho-green"
            />
          </div>
        </div>
      )}
    </div>
  )
}
