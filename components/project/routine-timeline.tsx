"use client"

import { useState } from "react"
import { Play, Pause, Edit3, Sparkles, ZoomIn, ZoomOut } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

const timelineSections = [
  { id: 1, name: "Intro", start: 0, end: 12, color: "from-eqho-blue to-eqho-blue/60" },
  { id: 2, name: "Build", start: 12, end: 35, color: "from-eqho-green to-eqho-green/60" },
  { id: 3, name: "Highlight", start: 35, end: 58, color: "from-eqho-pink to-eqho-pink/60" },
  { id: 4, name: "Transition", start: 58, end: 72, color: "from-purple-500 to-purple-500/60" },
  { id: 5, name: "Ending", start: 72, end: 90, color: "from-eqho-blue to-eqho-blue/60" },
]

const aiMarkers = [
  { time: 42, type: "suggestion", label: "Transition" },
  { time: 78, type: "edit", label: "AI Edit" },
]

export function RoutineTimeline() {
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(35)
  const totalDuration = 90

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, "0")}`
  }

  return (
    <div className="rounded-xl border border-border/50 bg-card p-5">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="flex items-center gap-2 text-lg font-semibold text-foreground">
          Routine Timeline Overview
          <span className="text-sm font-normal text-muted-foreground">
            ({formatTime(totalDuration)})
          </span>
        </h2>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
          >
            <ZoomOut className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
          >
            <ZoomIn className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Timeline Track */}
      <div className="relative mb-4">
        {/* Time markers */}
        <div className="mb-2 flex justify-between text-xs text-muted-foreground">
          <span>0:00</span>
          <span>0:30</span>
          <span>1:00</span>
          <span>1:30</span>
        </div>

        {/* Waveform Background */}
        <div className="relative h-20 overflow-hidden rounded-lg bg-eqho-navy">
          {/* Gradient waveform visualization */}
          <svg className="absolute inset-0 h-full w-full" preserveAspectRatio="none">
            <defs>
              <linearGradient id="waveGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#3D8BFF" stopOpacity="0.6" />
                <stop offset="25%" stopColor="#00C896" stopOpacity="0.8" />
                <stop offset="50%" stopColor="#FF4DA6" stopOpacity="1" />
                <stop offset="75%" stopColor="#00C896" stopOpacity="0.8" />
                <stop offset="100%" stopColor="#3D8BFF" stopOpacity="0.6" />
              </linearGradient>
            </defs>
            {/* Waveform bars */}
            {Array.from({ length: 60 }).map((_, i) => {
              const height = 20 + Math.sin(i * 0.3) * 15 + Math.random() * 20
              return (
                <rect
                  key={i}
                  x={i * (100 / 60) + "%"}
                  y={50 - height / 2 + "%"}
                  width="1%"
                  height={height + "%"}
                  fill="url(#waveGradient)"
                  rx="1"
                />
              )
            })}
          </svg>

          {/* Section overlays */}
          {timelineSections.map((section) => (
            <div
              key={section.id}
              className={cn(
                "absolute top-0 h-full border-r border-white/10 bg-gradient-to-r opacity-20",
                section.color
              )}
              style={{
                left: `${(section.start / totalDuration) * 100}%`,
                width: `${((section.end - section.start) / totalDuration) * 100}%`,
              }}
            />
          ))}

          {/* AI Markers */}
          {aiMarkers.map((marker, idx) => (
            <div
              key={idx}
              className="absolute top-1 z-10"
              style={{ left: `${(marker.time / totalDuration) * 100}%` }}
            >
              <div className="flex flex-col items-center">
                <div
                  className={cn(
                    "flex h-5 w-5 items-center justify-center rounded-full",
                    marker.type === "suggestion"
                      ? "bg-eqho-pink shadow-lg shadow-eqho-pink/30"
                      : "bg-eqho-green shadow-lg shadow-eqho-green/30"
                  )}
                >
                  <Sparkles className="h-3 w-3 text-white" />
                </div>
              </div>
            </div>
          ))}

          {/* Playhead */}
          <div
            className="absolute top-0 z-20 h-full w-0.5 bg-white shadow-lg shadow-white/50"
            style={{ left: `${(currentTime / totalDuration) * 100}%` }}
          >
            <div className="absolute -top-2 left-1/2 -translate-x-1/2 rounded bg-white px-1.5 py-0.5 text-[10px] font-medium text-eqho-navy">
              {formatTime(currentTime)}
            </div>
          </div>
        </div>

        {/* Section Labels */}
        <div className="relative mt-2 flex">
          {timelineSections.map((section) => (
            <div
              key={section.id}
              className="flex items-center justify-center text-xs font-medium"
              style={{
                width: `${((section.end - section.start) / totalDuration) * 100}%`,
              }}
            >
              <span
                className={cn(
                  "rounded-full px-2 py-0.5",
                  section.name === "Intro" && "bg-eqho-blue/20 text-eqho-blue",
                  section.name === "Build" && "bg-eqho-green/20 text-eqho-green",
                  section.name === "Highlight" && "bg-eqho-pink/20 text-eqho-pink",
                  section.name === "Transition" && "bg-purple-500/20 text-purple-400",
                  section.name === "Ending" && "bg-eqho-blue/20 text-eqho-blue"
                )}
              >
                {section.name}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            onClick={() => setIsPlaying(!isPlaying)}
            className="gap-2 bg-gradient-to-r from-eqho-pink to-eqho-blue text-white shadow-lg shadow-eqho-pink/20"
          >
            {isPlaying ? (
              <Pause className="h-4 w-4" />
            ) : (
              <Play className="h-4 w-4" />
            )}
            {isPlaying ? "Pause" : "Preview"}
          </Button>

          <Button
            variant="outline"
            size="sm"
            className="gap-2 border-border/50 bg-card text-foreground hover:bg-secondary"
          >
            <Edit3 className="h-4 w-4" />
            Edit Timeline
          </Button>
        </div>

        <div className="flex items-center gap-3 text-sm text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <div className="h-2 w-2 rounded-full bg-eqho-pink" />
            <span>AI Suggestion</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="h-2 w-2 rounded-full bg-eqho-green" />
            <span>AI Edit</span>
          </div>
        </div>
      </div>
    </div>
  )
}
