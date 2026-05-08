"use client"

import { Sparkles, Play, Check, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

const recommendations = [
  {
    id: 1,
    title: "Suggested smoother transition at 00:42",
    description: "AI detected a jarring cut between build and highlight sections",
    type: "transition",
    confidence: 94,
    status: "pending",
  },
  {
    id: 2,
    title: "Detected stronger beat drop at 01:18",
    description: "Moving the hit to this beat could create better impact timing",
    type: "timing",
    confidence: 87,
    status: "pending",
  },
  {
    id: 3,
    title: "Recommended shorter intro",
    description: "Current intro may exceed competition time requirements",
    type: "duration",
    confidence: 91,
    status: "applied",
  },
  {
    id: 4,
    title: "Voiceover timing improvement",
    description: "Shifting voiceover 0.3s earlier aligns better with choreography cue",
    type: "voiceover",
    confidence: 82,
    status: "pending",
  },
]

export function AIRecommendations() {
  return (
    <div className="rounded-xl border border-border/50 bg-card p-5">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="flex items-center gap-2 text-lg font-semibold text-foreground">
          <Sparkles className="h-5 w-5 text-eqho-pink" />
          AI Recommendations
        </h2>
        <span className="rounded-full bg-eqho-pink/10 px-3 py-1 text-xs font-medium text-eqho-pink">
          {recommendations.filter((r) => r.status === "pending").length} pending
        </span>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {recommendations.map((rec) => (
          <div
            key={rec.id}
            className={cn(
              "group relative overflow-hidden rounded-xl border p-4 transition-all duration-300",
              rec.status === "applied"
                ? "border-eqho-green/30 bg-eqho-green/5"
                : "border-border/50 bg-eqho-navy/50 hover:border-eqho-pink/30 hover:shadow-lg hover:shadow-eqho-pink/10"
            )}
          >
            {/* Glow effect */}
            {rec.status !== "applied" && (
              <div className="absolute inset-0 bg-gradient-to-br from-eqho-pink/5 via-transparent to-eqho-blue/5 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
            )}

            <div className="relative">
              <div className="mb-2 flex items-start justify-between gap-2">
                <h3 className="font-medium text-foreground">{rec.title}</h3>
                {rec.status === "applied" && (
                  <span className="flex items-center gap-1 rounded-full bg-eqho-green/10 px-2 py-0.5 text-xs font-medium text-eqho-green">
                    <Check className="h-3 w-3" />
                    Applied
                  </span>
                )}
              </div>

              <p className="mb-3 text-sm text-muted-foreground">{rec.description}</p>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="rounded bg-secondary px-2 py-0.5 text-xs text-muted-foreground">
                    {rec.type}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {rec.confidence}% confidence
                  </span>
                </div>

                {rec.status === "pending" && (
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 w-7 p-0 text-muted-foreground hover:bg-secondary hover:text-foreground"
                    >
                      <Play className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      size="sm"
                      className="h-7 gap-1 bg-eqho-pink/10 px-2 text-xs text-eqho-pink hover:bg-eqho-pink/20"
                    >
                      <Check className="h-3 w-3" />
                      Apply
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 w-7 p-0 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                    >
                      <X className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
