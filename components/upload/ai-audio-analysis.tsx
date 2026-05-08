"use client"

import { Sparkles, Activity, Music2, Zap, Scissors, TrendingUp, Volume2 } from "lucide-react"
import { cn } from "@/lib/utils"

const analysisCards = [
  {
    id: 1,
    title: "BPM Detection",
    value: "128",
    unit: "BPM",
    confidence: 98,
    icon: Activity,
    color: "pink",
    description: "Consistent tempo throughout",
  },
  {
    id: 2,
    title: "Key Detection",
    value: "A",
    unit: "Minor",
    confidence: 94,
    icon: Music2,
    color: "green",
    description: "Harmonic analysis complete",
  },
  {
    id: 3,
    title: "Energy Level",
    value: "High",
    unit: "",
    confidence: 91,
    icon: Zap,
    color: "blue",
    description: "Peak energy at 1:45",
  },
  {
    id: 4,
    title: "Intro Section",
    value: "0:00",
    unit: "- 0:18",
    confidence: 96,
    icon: Volume2,
    color: "pink",
    description: "Soft build detected",
  },
  {
    id: 5,
    title: "Chorus Sections",
    value: "3",
    unit: "found",
    confidence: 89,
    icon: TrendingUp,
    color: "green",
    description: "At 0:45, 1:30, 2:15",
  },
  {
    id: 6,
    title: "Recommended Cuts",
    value: "5",
    unit: "points",
    confidence: 92,
    icon: Scissors,
    color: "blue",
    description: "Optimal transition points",
  },
]

const colorClasses = {
  pink: {
    bg: "from-eqho-pink/20 to-eqho-pink/5",
    border: "border-eqho-pink/30 hover:border-eqho-pink/50",
    glow: "group-hover:shadow-eqho-pink/20",
    icon: "text-eqho-pink",
    bar: "bg-eqho-pink",
  },
  green: {
    bg: "from-eqho-green/20 to-eqho-green/5",
    border: "border-eqho-green/30 hover:border-eqho-green/50",
    glow: "group-hover:shadow-eqho-green/20",
    icon: "text-eqho-green",
    bar: "bg-eqho-green",
  },
  blue: {
    bg: "from-eqho-blue/20 to-eqho-blue/5",
    border: "border-eqho-blue/30 hover:border-eqho-blue/50",
    glow: "group-hover:shadow-eqho-blue/20",
    icon: "text-eqho-blue",
    bar: "bg-eqho-blue",
  },
}

export function AIAudioAnalysis() {
  return (
    <div className="glass-panel rounded-xl p-5">
      <div className="mb-5 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-eqho-pink/20 to-eqho-blue/20">
          <Sparkles className="h-5 w-5 text-eqho-pink" />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-foreground">AI Audio Analysis</h2>
          <p className="text-xs text-muted-foreground">Automatically detected from your uploaded music</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {analysisCards.map((card) => {
          const colors = colorClasses[card.color as keyof typeof colorClasses]
          return (
            <div
              key={card.id}
              className={cn(
                "group relative overflow-hidden rounded-xl border bg-gradient-to-br p-4 transition-all duration-300 hover-lift",
                colors.bg,
                colors.border,
                "group-hover:shadow-lg",
                colors.glow
              )}
            >
              {/* Glow effect */}
              <div className={cn(
                "absolute -right-4 -top-4 h-16 w-16 rounded-full blur-2xl opacity-0 transition-opacity duration-300 group-hover:opacity-50",
                card.color === "pink" && "bg-eqho-pink",
                card.color === "green" && "bg-eqho-green",
                card.color === "blue" && "bg-eqho-blue"
              )} />

              <div className="relative z-10">
                <div className="flex items-start justify-between">
                  <div className={cn("flex h-9 w-9 items-center justify-center rounded-lg bg-card/50", colors.icon)}>
                    <card.icon className="h-4 w-4" />
                  </div>
                  <span className="text-xs text-muted-foreground">{card.confidence}% confidence</span>
                </div>

                <div className="mt-3">
                  <p className="text-xs text-muted-foreground">{card.title}</p>
                  <p className="mt-0.5 text-2xl font-bold text-foreground">
                    {card.value}
                    <span className="ml-1 text-sm font-normal text-muted-foreground">{card.unit}</span>
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">{card.description}</p>
                </div>

                {/* Confidence bar */}
                <div className="mt-3 h-1 overflow-hidden rounded-full bg-secondary/50">
                  <div
                    className={cn("h-full transition-all duration-500", colors.bar)}
                    style={{ width: `${card.confidence}%` }}
                  />
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
