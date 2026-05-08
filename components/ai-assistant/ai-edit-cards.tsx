"use client"

import { useState } from "react"
import { Scissors, Blend, Sparkles, Mic, Play, Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { cn } from "@/lib/utils"

const editCards = [
  {
    id: 1,
    icon: Scissors,
    title: "Trim routine to 1:30",
    color: "eqho-pink",
    details: {
      originalLength: "1:45",
      suggestedCuts: "0:15 from ending",
      confidence: 94,
    },
  },
  {
    id: 2,
    icon: Blend,
    title: "Blend Song A into Song B",
    color: "eqho-green",
    details: {
      crossfade: "4 beats",
      timing: "00:42 - 00:46",
      confidence: 89,
    },
  },
  {
    id: 3,
    icon: Sparkles,
    title: "Add AI Sound Effect",
    color: "eqho-blue",
    details: {
      effect: "Crowd Impact",
      placement: "01:12",
      intensity: 75,
    },
  },
  {
    id: 4,
    icon: Mic,
    title: "Generate Voiceover",
    color: "eqho-pink",
    details: {
      voiceStyle: "Energetic Female",
      timing: "0:00 - 0:05",
      confidence: 91,
    },
  },
]

export function AIEditCards() {
  const [intensityValues, setIntensityValues] = useState<Record<number, number>>({
    3: 75,
  })

  return (
    <div className="rounded-xl border border-border/50 bg-card/50 p-5 backdrop-blur-sm">
      <h2 className="mb-4 text-lg font-semibold text-foreground">AI Edit Cards</h2>
      <p className="mb-6 text-sm text-muted-foreground">
        Review and apply AI-suggested edits to your routine
      </p>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {editCards.map((card) => (
          <div
            key={card.id}
            className={cn(
              "group rounded-xl border p-4 transition-all duration-300 hover-lift card-shine",
              card.color === "eqho-pink" && "border-eqho-pink/20 hover:border-eqho-pink/40 hover:shadow-lg hover:shadow-eqho-pink/10",
              card.color === "eqho-green" && "border-eqho-green/20 hover:border-eqho-green/40 hover:shadow-lg hover:shadow-eqho-green/10",
              card.color === "eqho-blue" && "border-eqho-blue/20 hover:border-eqho-blue/40 hover:shadow-lg hover:shadow-eqho-blue/10"
            )}
          >
            {/* Header */}
            <div className="flex items-start justify-between gap-3 mb-4">
              <div className="flex items-center gap-3">
                <div
                  className={cn(
                    "flex h-10 w-10 items-center justify-center rounded-lg",
                    card.color === "eqho-pink" && "bg-eqho-pink/10",
                    card.color === "eqho-green" && "bg-eqho-green/10",
                    card.color === "eqho-blue" && "bg-eqho-blue/10"
                  )}
                >
                  <card.icon
                    className={cn(
                      "h-5 w-5",
                      card.color === "eqho-pink" && "text-eqho-pink",
                      card.color === "eqho-green" && "text-eqho-green",
                      card.color === "eqho-blue" && "text-eqho-blue"
                    )}
                  />
                </div>
                <h3 className="font-medium text-foreground">{card.title}</h3>
              </div>
              {card.details.confidence && (
                <span
                  className={cn(
                    "rounded-full px-2 py-0.5 text-xs font-medium",
                    card.details.confidence >= 90
                      ? "bg-eqho-green/20 text-eqho-green"
                      : "bg-eqho-blue/20 text-eqho-blue"
                  )}
                >
                  {card.details.confidence}%
                </span>
              )}
            </div>

            {/* Details */}
            <div className="space-y-2 mb-4">
              {card.id === 1 && (
                <>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Original Length</span>
                    <span className="text-foreground font-medium">{card.details.originalLength}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Suggested Cuts</span>
                    <span className="text-eqho-pink font-medium">{card.details.suggestedCuts}</span>
                  </div>
                </>
              )}
              {card.id === 2 && (
                <>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Crossfade</span>
                    <span className="text-foreground font-medium">{card.details.crossfade}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Timing</span>
                    <span className="text-eqho-green font-medium">{card.details.timing}</span>
                  </div>
                </>
              )}
              {card.id === 3 && (
                <>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Effect</span>
                    <span className="text-foreground font-medium">{card.details.effect}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Placement</span>
                    <span className="text-eqho-blue font-medium">{card.details.placement}</span>
                  </div>
                  <div className="mt-3">
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-muted-foreground">Intensity</span>
                      <span className="text-foreground font-medium">{intensityValues[3]}%</span>
                    </div>
                    <Slider
                      value={[intensityValues[3] || 75]}
                      onValueChange={(value) => setIntensityValues({ ...intensityValues, 3: value[0] })}
                      max={100}
                      step={1}
                      className="w-full"
                    />
                  </div>
                </>
              )}
              {card.id === 4 && (
                <>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Voice Style</span>
                    <span className="text-foreground font-medium">{card.details.voiceStyle}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Timing</span>
                    <span className="text-eqho-pink font-medium">{card.details.timing}</span>
                  </div>
                </>
              )}
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2">
              {(card.id === 2 || card.id === 4) && (
                <Button
                  size="sm"
                  variant="outline"
                  className="flex-1 gap-1.5 border-border/50 text-xs hover:border-eqho-green/50"
                >
                  <Play className="h-3 w-3" />
                  Preview
                </Button>
              )}
              <Button
                size="sm"
                className={cn(
                  "flex-1 gap-1.5 text-xs text-white transition-all duration-200",
                  card.color === "eqho-pink" && "bg-eqho-pink hover:bg-eqho-pink/90",
                  card.color === "eqho-green" && "bg-eqho-green hover:bg-eqho-green/90",
                  card.color === "eqho-blue" && "bg-eqho-blue hover:bg-eqho-blue/90"
                )}
              >
                <Check className="h-3 w-3" />
                Apply
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
