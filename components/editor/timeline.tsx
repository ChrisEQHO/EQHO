"use client"

import { useState } from "react"
import { ZoomIn, ZoomOut, Flag } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

const sectionMarkers = [
  { id: 1, time: 0, label: "Intro", color: "eqho-pink" },
  { id: 2, time: 15, label: "Build", color: "eqho-green" },
  { id: 3, time: 32, label: "Hit 1", color: "eqho-blue" },
  { id: 4, time: 48, label: "Bridge", color: "eqho-green" },
  { id: 5, time: 65, label: "Hit 2", color: "eqho-blue" },
  { id: 6, time: 78, label: "Ending", color: "eqho-pink" },
]

const totalDuration = 90 // seconds

export function Timeline() {
  const [zoom, setZoom] = useState(1)
  const [playheadPosition, setPlayheadPosition] = useState(25) // percentage

  const handleTimelineClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const x = e.clientX - rect.left
    const percentage = (x / rect.width) * 100
    setPlayheadPosition(Math.max(0, Math.min(100, percentage)))
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, "0")}`
  }

  return (
    <div className="border-b border-border/50 bg-card/30 p-4">
      {/* Timeline Header */}
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-medium text-foreground">Timeline</h3>
          <span className="rounded bg-secondary px-2 py-0.5 text-xs text-muted-foreground">
            {formatTime((playheadPosition / 100) * totalDuration)} / {formatTime(totalDuration)}
          </span>
        </div>
        
        {/* Zoom Controls */}
        <div className="flex items-center gap-1 rounded-lg border border-border/50 bg-secondary/50 p-1">
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0 text-muted-foreground hover:text-foreground"
            onClick={() => setZoom(Math.max(0.5, zoom - 0.25))}
          >
            <ZoomOut className="h-3.5 w-3.5" />
          </Button>
          <span className="w-12 text-center text-xs text-muted-foreground">
            {Math.round(zoom * 100)}%
          </span>
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0 text-muted-foreground hover:text-foreground"
            onClick={() => setZoom(Math.min(2, zoom + 0.25))}
          >
            <ZoomIn className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      {/* Section Markers */}
      <div className="mb-2 flex items-center gap-2">
        {sectionMarkers.map((marker) => (
          <div
            key={marker.id}
            className={cn(
              "flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium transition-all hover:scale-105 cursor-pointer",
              marker.color === "eqho-pink" && "bg-eqho-pink/20 text-eqho-pink",
              marker.color === "eqho-green" && "bg-eqho-green/20 text-eqho-green",
              marker.color === "eqho-blue" && "bg-eqho-blue/20 text-eqho-blue"
            )}
          >
            <Flag className="h-3 w-3" />
            {marker.label}
          </div>
        ))}
      </div>

      {/* Timeline Ruler */}
      <div className="relative">
        {/* Time markers */}
        <div className="mb-1 flex justify-between text-[10px] text-muted-foreground">
          {Array.from({ length: 10 }).map((_, i) => (
            <span key={i}>{formatTime((i / 9) * totalDuration)}</span>
          ))}
        </div>

        {/* Waveform Timeline */}
        <div
          className="relative h-20 cursor-pointer overflow-hidden rounded-lg bg-secondary/50"
          onClick={handleTimelineClick}
        >
          {/* Waveform visualization */}
          <svg
            className="absolute inset-0 h-full w-full"
            preserveAspectRatio="none"
            viewBox="0 0 1000 80"
          >
            <defs>
              <linearGradient id="waveform-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#FF4DA6" />
                <stop offset="50%" stopColor="#00C896" />
                <stop offset="100%" stopColor="#3D8BFF" />
              </linearGradient>
            </defs>
            {/* Generate waveform bars */}
            {Array.from({ length: 200 }).map((_, i) => {
              const height = 10 + Math.random() * 60
              const isHighlight = i % 20 < 3
              return (
                <rect
                  key={i}
                  x={i * 5}
                  y={(80 - height) / 2}
                  width="3"
                  height={height}
                  fill="url(#waveform-gradient)"
                  opacity={isHighlight ? 0.9 : 0.4 + Math.random() * 0.3}
                  rx="1"
                />
              )
            })}
          </svg>

          {/* Section overlays */}
          {sectionMarkers.map((marker, index) => {
            const nextMarker = sectionMarkers[index + 1]
            const startPercent = (marker.time / totalDuration) * 100
            const endPercent = nextMarker
              ? (nextMarker.time / totalDuration) * 100
              : 100
            const width = endPercent - startPercent

            return (
              <div
                key={marker.id}
                className={cn(
                  "absolute top-0 h-full border-l-2 opacity-20 transition-opacity hover:opacity-40",
                  marker.color === "eqho-pink" && "border-eqho-pink bg-eqho-pink/10",
                  marker.color === "eqho-green" && "border-eqho-green bg-eqho-green/10",
                  marker.color === "eqho-blue" && "border-eqho-blue bg-eqho-blue/10"
                )}
                style={{
                  left: `${startPercent}%`,
                  width: `${width}%`,
                }}
              >
                <span className="absolute left-1 top-1 text-[10px] font-medium text-foreground opacity-60">
                  {marker.label}
                </span>
              </div>
            )
          })}

          {/* Playhead */}
          <div
            className="absolute top-0 h-full w-0.5 bg-white shadow-[0_0_10px_rgba(255,255,255,0.5)] transition-all duration-75"
            style={{ left: `${playheadPosition}%` }}
          >
            <div className="absolute -left-1.5 -top-1 h-3 w-3 rounded-full bg-white shadow-lg" />
          </div>
        </div>
      </div>
    </div>
  )
}
