"use client"

import { useState } from "react"
import { Music, Wand2, Grid3X3, Clock, Sparkles } from "lucide-react"
import { Switch } from "@/components/ui/switch"

export function AudioPreferences() {
  const [bpmDetection, setBpmDetection] = useState(true)
  const [snapToGrid, setSnapToGrid] = useState(true)
  const [aiAssistant, setAiAssistant] = useState(true)

  return (
    <div className="rounded-xl border border-border/50 bg-card p-6 hover-lift">
      <h3 className="mb-6 text-lg font-semibold text-foreground">Audio Preferences</h3>

      <div className="space-y-6">
        {/* Default Export Format */}
        <div className="space-y-2">
          <label className="flex items-center gap-2 text-sm font-medium text-foreground">
            <Music className="h-4 w-4 text-eqho-pink" />
            Default Export Format
          </label>
          <div className="flex flex-wrap gap-2">
            {["WAV", "MP3", "FLAC", "AIFF"].map((format) => (
              <button
                key={format}
                className={`rounded-lg border px-4 py-2 text-sm font-medium transition-all duration-200 ${
                  format === "WAV"
                    ? "border-eqho-pink/50 bg-eqho-pink/10 text-eqho-pink"
                    : "border-border/50 bg-secondary/30 text-muted-foreground hover:bg-secondary/50 hover:text-foreground"
                }`}
              >
                {format}
              </button>
            ))}
          </div>
        </div>

        {/* Default Audio Quality */}
        <div className="space-y-2">
          <label className="flex items-center gap-2 text-sm font-medium text-foreground">
            <Wand2 className="h-4 w-4 text-eqho-blue" />
            Default Audio Quality
          </label>
          <div className="flex flex-wrap gap-2">
            {[
              { label: "Standard", value: "128kbps" },
              { label: "High", value: "256kbps" },
              { label: "Lossless", value: "320kbps" },
            ].map((quality) => (
              <button
                key={quality.value}
                className={`rounded-lg border px-4 py-2 text-sm transition-all duration-200 ${
                  quality.label === "High"
                    ? "border-eqho-blue/50 bg-eqho-blue/10 text-eqho-blue"
                    : "border-border/50 bg-secondary/30 text-muted-foreground hover:bg-secondary/50 hover:text-foreground"
                }`}
              >
                <span className="font-medium">{quality.label}</span>
                <span className="ml-1 text-xs opacity-70">{quality.value}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Default Routine Length */}
        <div className="space-y-2">
          <label className="flex items-center gap-2 text-sm font-medium text-foreground">
            <Clock className="h-4 w-4 text-eqho-green" />
            Default Routine Length
          </label>
          <div className="flex flex-wrap gap-2">
            {["1:00", "1:30", "2:00", "2:30", "3:00", "Custom"].map((length) => (
              <button
                key={length}
                className={`rounded-lg border px-4 py-2 text-sm font-medium transition-all duration-200 ${
                  length === "2:00"
                    ? "border-eqho-green/50 bg-eqho-green/10 text-eqho-green"
                    : "border-border/50 bg-secondary/30 text-muted-foreground hover:bg-secondary/50 hover:text-foreground"
                }`}
              >
                {length}
              </button>
            ))}
          </div>
        </div>

        {/* Toggle Settings */}
        <div className="space-y-4 border-t border-border/30 pt-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-eqho-pink/10">
                <Music className="h-4 w-4 text-eqho-pink" />
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">BPM Detection</p>
                <p className="text-xs text-muted-foreground">Auto-detect tempo on upload</p>
              </div>
            </div>
            <Switch
              checked={bpmDetection}
              onCheckedChange={setBpmDetection}
              className="data-[state=checked]:bg-eqho-pink"
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-eqho-blue/10">
                <Grid3X3 className="h-4 w-4 text-eqho-blue" />
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">Snap-to-Grid</p>
                <p className="text-xs text-muted-foreground">Align clips to grid lines</p>
              </div>
            </div>
            <Switch
              checked={snapToGrid}
              onCheckedChange={setSnapToGrid}
              className="data-[state=checked]:bg-eqho-blue"
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-eqho-pink/10 to-eqho-blue/10">
                <Sparkles className="h-4 w-4 text-eqho-green" />
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">AI Assistant</p>
                <p className="text-xs text-muted-foreground">Enable AI suggestions in editor</p>
              </div>
            </div>
            <Switch
              checked={aiAssistant}
              onCheckedChange={setAiAssistant}
              className="data-[state=checked]:bg-eqho-green"
            />
          </div>
        </div>
      </div>
    </div>
  )
}
