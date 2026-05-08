"use client"

import { 
  Music2, 
  TrendingUp, 
  Zap, 
  Flag, 
  Activity,
  Sparkles,
  Volume2
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

const timelineSections = [
  {
    label: "Intro",
    time: "0:00 - 0:12",
    color: "eqho-pink",
    icon: Music2,
    description: "Opening sequence detected",
  },
  {
    label: "Build",
    time: "0:12 - 0:38",
    color: "eqho-green",
    icon: TrendingUp,
    description: "Energy buildup section",
  },
  {
    label: "Climax",
    time: "0:38 - 1:15",
    color: "eqho-blue",
    icon: Zap,
    description: "Peak energy moment",
  },
  {
    label: "Ending",
    time: "1:15 - 1:30",
    color: "eqho-pink",
    icon: Flag,
    description: "Recommended finale",
  },
]

const analysisData = [
  { label: "BPM", value: "128", icon: Activity },
  { label: "Key", value: "A Minor", icon: Music2 },
  { label: "Energy", value: "High", icon: Zap },
]

const suggestedEffects = [
  { time: "0:00", effect: "Crowd cheer", type: "impact" },
  { time: "0:38", effect: "Riser", type: "transition" },
  { time: "1:12", effect: "Impact hit", type: "impact" },
  { time: "1:28", effect: "Crowd roar", type: "ending" },
]

export function AITimelineSuggestions() {
  return (
    <div className="sticky top-8 space-y-4">
      {/* Timeline Sections */}
      <div className="rounded-xl border border-border/50 bg-card/50 p-5 backdrop-blur-sm">
        <div className="flex items-center gap-2 mb-4">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-eqho-green to-eqho-blue">
            <Activity className="h-4 w-4 text-white" />
          </div>
          <h3 className="font-semibold text-foreground">Timeline Analysis</h3>
        </div>

        {/* Visual Timeline */}
        <div className="mb-4 h-3 rounded-full bg-eqho-navy overflow-hidden flex">
          <div className="h-full bg-eqho-pink/60" style={{ width: "13%" }} />
          <div className="h-full bg-eqho-green/60" style={{ width: "29%" }} />
          <div className="h-full bg-eqho-blue/60" style={{ width: "41%" }} />
          <div className="h-full bg-eqho-pink/60" style={{ width: "17%" }} />
        </div>

        {/* Sections List */}
        <div className="space-y-2">
          {timelineSections.map((section) => (
            <div
              key={section.label}
              className={cn(
                "flex items-center gap-3 rounded-lg border p-2.5 transition-all duration-200 hover:bg-secondary/30",
                section.color === "eqho-pink" && "border-eqho-pink/20",
                section.color === "eqho-green" && "border-eqho-green/20",
                section.color === "eqho-blue" && "border-eqho-blue/20"
              )}
            >
              <div
                className={cn(
                  "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg",
                  section.color === "eqho-pink" && "bg-eqho-pink/10",
                  section.color === "eqho-green" && "bg-eqho-green/10",
                  section.color === "eqho-blue" && "bg-eqho-blue/10"
                )}
              >
                <section.icon
                  className={cn(
                    "h-4 w-4",
                    section.color === "eqho-pink" && "text-eqho-pink",
                    section.color === "eqho-green" && "text-eqho-green",
                    section.color === "eqho-blue" && "text-eqho-blue"
                  )}
                />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-medium text-sm text-foreground">{section.label}</span>
                  <span className="text-xs text-muted-foreground">{section.time}</span>
                </div>
                <p className="text-xs text-muted-foreground truncate">{section.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* BPM/Key Analysis */}
      <div className="rounded-xl border border-border/50 bg-card/50 p-5 backdrop-blur-sm">
        <h3 className="font-semibold text-foreground mb-4">Audio Analysis</h3>
        <div className="grid grid-cols-3 gap-2">
          {analysisData.map((item) => (
            <div
              key={item.label}
              className="rounded-lg border border-border/30 bg-eqho-navy/30 p-3 text-center"
            >
              <item.icon className="h-4 w-4 mx-auto mb-1 text-muted-foreground" />
              <div className="text-sm font-semibold text-foreground">{item.value}</div>
              <div className="text-xs text-muted-foreground">{item.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Suggested Effects */}
      <div className="rounded-xl border border-border/50 bg-card/50 p-5 backdrop-blur-sm">
        <div className="flex items-center gap-2 mb-4">
          <Sparkles className="h-4 w-4 text-eqho-pink" />
          <h3 className="font-semibold text-foreground">Suggested Effects</h3>
        </div>
        <div className="space-y-2">
          {suggestedEffects.map((item, index) => (
            <div
              key={index}
              className="flex items-center justify-between gap-2 rounded-lg border border-border/30 bg-secondary/20 p-2.5 transition-all duration-200 hover:bg-secondary/40 group"
            >
              <div className="flex items-center gap-2">
                <Volume2 className="h-4 w-4 text-muted-foreground" />
                <div>
                  <div className="text-sm text-foreground">{item.effect}</div>
                  <div className="text-xs text-muted-foreground">{item.time}</div>
                </div>
              </div>
              <Button
                size="sm"
                variant="ghost"
                className="h-7 px-2 text-xs opacity-0 group-hover:opacity-100 transition-opacity"
              >
                Add
              </Button>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
