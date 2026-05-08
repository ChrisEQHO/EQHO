"use client"

import { Clock, Music, Trophy, Zap, Sparkles } from "lucide-react"
import { cn } from "@/lib/utils"
import type { ProjectConfig } from "@/app/new-project/page"

interface ProjectSummaryProps {
  config: ProjectConfig
}

export function ProjectSummary({ config }: ProjectSummaryProps) {
  const hasSelections = config.sport || config.level || config.routineType || config.length

  return (
    <div className="rounded-xl border border-border/50 bg-card/50 p-5 backdrop-blur-sm">
      <h3 className="mb-4 text-lg font-semibold text-foreground">Project Summary</h3>

      {!hasSelections ? (
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-eqho-pink/10 via-eqho-green/10 to-eqho-blue/10">
            <Sparkles className="h-8 w-8 text-muted-foreground" />
          </div>
          <p className="text-sm text-muted-foreground">
            Start selecting options to see your project summary
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Summary Items */}
          <div className="space-y-3">
            {/* Sport */}
            <SummaryItem
              icon={<Trophy className="h-4 w-4" />}
              label="Sport"
              value={config.sport ? capitalize(config.sport) : null}
              color="eqho-pink"
            />

            {/* Level */}
            <SummaryItem
              icon={<Zap className="h-4 w-4" />}
              label="Level"
              value={config.level ? capitalize(config.level) : null}
              color="eqho-green"
            />

            {/* Routine Type */}
            <SummaryItem
              icon={<Music className="h-4 w-4" />}
              label="Type"
              value={config.routineType ? capitalize(config.routineType) : null}
              color="eqho-blue"
            />

            {/* Length */}
            <SummaryItem
              icon={<Clock className="h-4 w-4" />}
              label="Length"
              value={config.length}
              color="eqho-pink"
            />
          </div>

          {/* Moods */}
          {config.moods.length > 0 && (
            <div className="border-t border-border/50 pt-4">
              <span className="mb-2 block text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Music Moods
              </span>
              <div className="flex flex-wrap gap-1.5">
                {config.moods.map((mood) => (
                  <span
                    key={mood}
                    className="rounded-full bg-gradient-to-r from-eqho-pink/10 to-eqho-blue/10 px-2.5 py-1 text-xs font-medium text-foreground"
                  >
                    {capitalize(mood)}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Settings */}
          <div className="border-t border-border/50 pt-4">
            <span className="mb-2 block text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Settings
            </span>
            <div className="space-y-2 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">BPM Range</span>
                <span className="font-mono text-foreground">
                  {config.bpmRange[0]}-{config.bpmRange[1]}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Key</span>
                <span className="font-medium text-foreground">{config.musicKey}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Voiceover</span>
                <span
                  className={cn(
                    "font-medium",
                    config.voiceover ? "text-eqho-green" : "text-muted-foreground"
                  )}
                >
                  {config.voiceover ? "On" : "Off"}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">AI Suggestions</span>
                <span
                  className={cn(
                    "font-medium",
                    config.aiSuggestions ? "text-eqho-green" : "text-muted-foreground"
                  )}
                >
                  {config.aiSuggestions ? "On" : "Off"}
                </span>
              </div>
            </div>
          </div>

          {/* Recommended Template Preview */}
          {config.sport && config.level && (
            <div className="border-t border-border/50 pt-4">
              <span className="mb-3 block text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Recommended Template
              </span>
              <div className="group relative overflow-hidden rounded-lg border border-border/50 bg-card p-3 transition-all duration-300 hover:border-eqho-blue/50 hover:shadow-lg hover:shadow-eqho-blue/10">
                {/* Waveform preview */}
                <div className="mb-2 flex h-12 items-center justify-center gap-0.5">
                  {Array.from({ length: 32 }).map((_, i) => (
                    <div
                      key={i}
                      className="w-1 rounded-full bg-gradient-to-t from-eqho-pink via-eqho-green to-eqho-blue transition-all duration-300"
                      style={{
                        height: `${20 + Math.sin(i * 0.5) * 15 + Math.random() * 10}px`,
                        opacity: 0.6 + Math.random() * 0.4,
                      }}
                    />
                  ))}
                </div>
                <div className="text-center">
                  <span className="block text-sm font-medium text-foreground">
                    {capitalize(config.sport)} {capitalize(config.level)} Mix
                  </span>
                  <span className="text-xs text-muted-foreground">AI-suggested template</span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function SummaryItem({
  icon,
  label,
  value,
  color,
}: {
  icon: React.ReactNode
  label: string
  value: string | null
  color: "eqho-pink" | "eqho-green" | "eqho-blue"
}) {
  return (
    <div className="flex items-center gap-3">
      <div
        className={cn(
          "flex h-8 w-8 items-center justify-center rounded-lg transition-all duration-300",
          value
            ? color === "eqho-pink"
              ? "bg-eqho-pink/10 text-eqho-pink"
              : color === "eqho-green"
                ? "bg-eqho-green/10 text-eqho-green"
                : "bg-eqho-blue/10 text-eqho-blue"
            : "bg-secondary text-muted-foreground"
        )}
      >
        {icon}
      </div>
      <div className="flex-1">
        <span className="block text-xs text-muted-foreground">{label}</span>
        <span
          className={cn(
            "block text-sm font-medium transition-colors",
            value ? "text-foreground" : "text-muted-foreground"
          )}
        >
          {value || "Not selected"}
        </span>
      </div>
    </div>
  )
}

function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1)
}
