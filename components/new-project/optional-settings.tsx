"use client"

import { Sparkles, Mic } from "lucide-react"
import { cn } from "@/lib/utils"
import type { ProjectConfig } from "@/app/new-project/page"

interface OptionalSettingsProps {
  config: ProjectConfig
  onUpdate: <K extends keyof ProjectConfig>(key: K, value: ProjectConfig[K]) => void
}

const musicKeys = ["Any", "C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"]

export function OptionalSettings({ config, onUpdate }: OptionalSettingsProps) {
  return (
    <div className="rounded-xl border border-border/50 bg-card/50 p-5 backdrop-blur-sm">
      <h3 className="mb-4 text-lg font-semibold text-foreground">Optional Settings</h3>
      
      <div className="space-y-5">
        {/* BPM Range */}
        <div>
          <div className="mb-3 flex items-center justify-between">
            <label className="text-sm font-medium text-foreground">BPM Range</label>
            <span className="text-sm font-mono text-eqho-green">
              {config.bpmRange[0]} - {config.bpmRange[1]} BPM
            </span>
          </div>
          <div className="flex items-center gap-4">
            <input
              type="range"
              min="60"
              max="180"
              value={config.bpmRange[0]}
              onChange={(e) =>
                onUpdate("bpmRange", [parseInt(e.target.value), config.bpmRange[1]])
              }
              className="h-2 flex-1 cursor-pointer appearance-none rounded-full bg-border accent-eqho-green"
            />
            <input
              type="range"
              min="60"
              max="180"
              value={config.bpmRange[1]}
              onChange={(e) =>
                onUpdate("bpmRange", [config.bpmRange[0], parseInt(e.target.value)])
              }
              className="h-2 flex-1 cursor-pointer appearance-none rounded-full bg-border accent-eqho-blue"
            />
          </div>
        </div>

        {/* Music Key */}
        <div>
          <label className="mb-3 block text-sm font-medium text-foreground">Music Key</label>
          <div className="flex flex-wrap gap-2">
            {musicKeys.map((key) => (
              <button
                key={key}
                onClick={() => onUpdate("musicKey", key)}
                className={cn(
                  "rounded-lg border px-3 py-1.5 text-sm font-medium transition-all duration-200",
                  config.musicKey === key
                    ? "border-eqho-blue bg-eqho-blue/10 text-eqho-blue"
                    : "border-border/50 bg-card text-muted-foreground hover:border-muted-foreground/50 hover:text-foreground"
                )}
              >
                {key}
              </button>
            ))}
          </div>
        </div>

        {/* Toggles */}
        <div className="flex flex-col gap-4 sm:flex-row sm:gap-6">
          {/* Voiceover Toggle */}
          <button
            onClick={() => onUpdate("voiceover", !config.voiceover)}
            className={cn(
              "flex flex-1 items-center gap-3 rounded-xl border-2 p-4 transition-all duration-300",
              config.voiceover
                ? "border-eqho-pink bg-eqho-pink/10 shadow-md shadow-eqho-pink/10"
                : "border-border/50 bg-card hover:border-muted-foreground/30"
            )}
          >
            <div
              className={cn(
                "flex h-10 w-10 items-center justify-center rounded-lg transition-colors",
                config.voiceover ? "bg-eqho-pink/20 text-eqho-pink" : "bg-secondary text-muted-foreground"
              )}
            >
              <Mic className="h-5 w-5" />
            </div>
            <div className="text-left">
              <span className="block text-sm font-semibold text-foreground">Voiceover</span>
              <span className="text-xs text-muted-foreground">Include vocal cues</span>
            </div>
            <div
              className={cn(
                "ml-auto h-6 w-11 rounded-full transition-colors",
                config.voiceover ? "bg-eqho-pink" : "bg-border"
              )}
            >
              <div
                className={cn(
                  "h-5 w-5 translate-y-0.5 rounded-full bg-white shadow-sm transition-transform",
                  config.voiceover ? "translate-x-5" : "translate-x-0.5"
                )}
              />
            </div>
          </button>

          {/* AI Suggestions Toggle */}
          <button
            onClick={() => onUpdate("aiSuggestions", !config.aiSuggestions)}
            className={cn(
              "flex flex-1 items-center gap-3 rounded-xl border-2 p-4 transition-all duration-300",
              config.aiSuggestions
                ? "border-eqho-green bg-eqho-green/10 shadow-md shadow-eqho-green/10"
                : "border-border/50 bg-card hover:border-muted-foreground/30"
            )}
          >
            <div
              className={cn(
                "flex h-10 w-10 items-center justify-center rounded-lg transition-colors",
                config.aiSuggestions
                  ? "bg-eqho-green/20 text-eqho-green"
                  : "bg-secondary text-muted-foreground"
              )}
            >
              <Sparkles className="h-5 w-5" />
            </div>
            <div className="text-left">
              <span className="block text-sm font-semibold text-foreground">AI Suggestions</span>
              <span className="text-xs text-muted-foreground">Smart recommendations</span>
            </div>
            <div
              className={cn(
                "ml-auto h-6 w-11 rounded-full transition-colors",
                config.aiSuggestions ? "bg-eqho-green" : "bg-border"
              )}
            >
              <div
                className={cn(
                  "h-5 w-5 translate-y-0.5 rounded-full bg-white shadow-sm transition-transform",
                  config.aiSuggestions ? "translate-x-5" : "translate-x-0.5"
                )}
              />
            </div>
          </button>
        </div>
      </div>
    </div>
  )
}
