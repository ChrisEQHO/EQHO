"use client"

import { useState } from "react"
import { Wand2, AlertTriangle, Sparkles, Clock } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

const moods = [
  { label: "Energetic", active: false },
  { label: "Dramatic", active: true },
  { label: "Uplifting", active: false },
  { label: "Intense", active: false },
  { label: "Powerful", active: false },
  { label: "Triumphant", active: false },
]

const genres = [
  { label: "EDM", active: true },
  { label: "Orchestral", active: false },
  { label: "Hip Hop", active: false },
  { label: "Pop", active: false },
  { label: "Rock", active: false },
  { label: "Cinematic", active: false },
]

const durations = [
  { label: "0:30", value: 30 },
  { label: "1:00", value: 60 },
  { label: "1:30", value: 90 },
  { label: "2:00", value: 120 },
  { label: "2:30", value: 150 },
]

export function AIMusicGeneration() {
  const [prompt, setPrompt] = useState("")
  const [selectedMoods, setSelectedMoods] = useState<string[]>(["Dramatic"])
  const [selectedGenres, setSelectedGenres] = useState<string[]>(["EDM"])
  const [selectedDuration, setSelectedDuration] = useState(90)

  const toggleMood = (mood: string) => {
    setSelectedMoods((prev) =>
      prev.includes(mood)
        ? prev.filter((m) => m !== mood)
        : [...prev, mood]
    )
  }

  const toggleGenre = (genre: string) => {
    setSelectedGenres((prev) =>
      prev.includes(genre)
        ? prev.filter((g) => g !== genre)
        : [...prev, genre]
    )
  }

  return (
    <div className="rounded-xl border border-border/50 bg-card/50 p-5 backdrop-blur-sm">
      <div className="flex items-center gap-2 mb-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-eqho-pink via-eqho-green to-eqho-blue">
          <Wand2 className="h-4 w-4 text-white" />
        </div>
        <h2 className="text-lg font-semibold text-foreground">AI Music Generation</h2>
        <span className="ml-auto rounded-full bg-eqho-pink/10 px-2 py-0.5 text-xs font-medium text-eqho-pink">
          Beta
        </span>
      </div>

      {/* Warning */}
      <div className="mb-6 flex items-start gap-3 rounded-lg border border-amber-500/20 bg-amber-500/5 p-3">
        <AlertTriangle className="h-5 w-5 shrink-0 text-amber-500" />
        <p className="text-sm text-muted-foreground">
          AI-generated music is optional. EQHO is designed primarily for routine editing workflows.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Left Column - Prompt */}
        <div className="space-y-4">
          <div>
            <label className="mb-2 block text-sm font-medium text-foreground">
              Describe your music
            </label>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="E.g., An energetic gymnastics floor routine with dramatic builds, powerful drops, and an epic ending..."
              className="h-28 w-full resize-none rounded-xl border border-border/50 bg-eqho-navy/50 px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-eqho-pink/50 focus:outline-none focus:ring-1 focus:ring-eqho-pink/30 transition-all duration-200"
            />
          </div>

          {/* Mood Selection */}
          <div>
            <label className="mb-2 block text-sm font-medium text-foreground">
              Mood
            </label>
            <div className="flex flex-wrap gap-2">
              {moods.map((mood) => (
                <button
                  key={mood.label}
                  onClick={() => toggleMood(mood.label)}
                  className={cn(
                    "rounded-full border px-3 py-1.5 text-xs font-medium transition-all duration-200",
                    selectedMoods.includes(mood.label)
                      ? "border-eqho-pink/50 bg-eqho-pink/10 text-eqho-pink"
                      : "border-border/50 bg-secondary/30 text-muted-foreground hover:border-eqho-pink/30 hover:text-foreground"
                  )}
                >
                  {mood.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column - Genre & Duration */}
        <div className="space-y-4">
          {/* Genre Selection */}
          <div>
            <label className="mb-2 block text-sm font-medium text-foreground">
              Genre
            </label>
            <div className="flex flex-wrap gap-2">
              {genres.map((genre) => (
                <button
                  key={genre.label}
                  onClick={() => toggleGenre(genre.label)}
                  className={cn(
                    "rounded-full border px-3 py-1.5 text-xs font-medium transition-all duration-200",
                    selectedGenres.includes(genre.label)
                      ? "border-eqho-green/50 bg-eqho-green/10 text-eqho-green"
                      : "border-border/50 bg-secondary/30 text-muted-foreground hover:border-eqho-green/30 hover:text-foreground"
                  )}
                >
                  {genre.label}
                </button>
              ))}
            </div>
          </div>

          {/* Duration Selection */}
          <div>
            <label className="mb-2 block text-sm font-medium text-foreground">
              <Clock className="inline h-4 w-4 mr-1 text-muted-foreground" />
              Duration
            </label>
            <div className="flex flex-wrap gap-2">
              {durations.map((duration) => (
                <button
                  key={duration.value}
                  onClick={() => setSelectedDuration(duration.value)}
                  className={cn(
                    "rounded-lg border px-4 py-2 text-sm font-medium transition-all duration-200",
                    selectedDuration === duration.value
                      ? "border-eqho-blue/50 bg-eqho-blue/10 text-eqho-blue"
                      : "border-border/50 bg-secondary/30 text-muted-foreground hover:border-eqho-blue/30 hover:text-foreground"
                  )}
                >
                  {duration.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Generate Button */}
      <div className="mt-6 flex items-center justify-between gap-4">
        <div className="text-sm text-muted-foreground">
          <Sparkles className="inline h-4 w-4 mr-1 text-eqho-pink" />
          AI will generate unique royalty-free music based on your selections
        </div>
        <Button className="gap-2 bg-gradient-to-r from-eqho-pink via-eqho-green to-eqho-blue text-white shadow-lg shadow-eqho-pink/20 transition-all duration-200 hover:opacity-90 hover:shadow-xl hover:shadow-eqho-pink/30 hover:scale-[1.02] px-6">
          <Wand2 className="h-4 w-4" />
          Generate Music
        </Button>
      </div>
    </div>
  )
}
