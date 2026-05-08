"use client"

import { Play, Pause, Edit2, MoreHorizontal, Music, Clock, Activity } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useState } from "react"
import { cn } from "@/lib/utils"

const recentUploads = [
  {
    id: 1,
    name: "Competition Mix Final v3.mp3",
    duration: "2:45",
    bpm: 128,
    key: "A Minor",
    progress: 100,
    linkedProject: "Floor Routine - Nationals",
    uploadedAt: "2 hours ago",
  },
  {
    id: 2,
    name: "Intro Build Track.wav",
    duration: "0:32",
    bpm: 140,
    key: "C Major",
    progress: 100,
    linkedProject: "Beam Routine",
    uploadedAt: "5 hours ago",
  },
  {
    id: 3,
    name: "Epic Drop Section.mp3",
    duration: "1:15",
    bpm: 150,
    key: "E Minor",
    progress: 78,
    linkedProject: null,
    uploadedAt: "Just now",
  },
]

export function RecentlyUploaded() {
  const [playingId, setPlayingId] = useState<number | null>(null)

  if (recentUploads.length === 0) {
    return (
      <div className="glass-panel rounded-xl p-8 text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-eqho-blue/20 to-eqho-green/20">
          <Music className="h-8 w-8 text-eqho-blue" />
        </div>
        <h3 className="text-lg font-semibold text-foreground">No uploads yet</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          Upload your first music file to get started
        </p>
      </div>
    )
  }

  return (
    <div className="glass-panel rounded-xl p-5">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-foreground">Recently Uploaded</h2>
        <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">
          View All
        </Button>
      </div>

      <div className="space-y-3">
        {recentUploads.map((file) => (
          <div
            key={file.id}
            className={cn(
              "group relative flex items-center gap-4 rounded-lg border border-border/30 bg-card/50 p-4 transition-all duration-200 hover:border-eqho-blue/30 hover:bg-card hover-lift",
              file.progress < 100 && "border-eqho-green/30"
            )}
          >
            {/* Waveform Preview */}
            <div className="relative flex h-14 w-20 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-gradient-to-br from-eqho-pink/10 to-eqho-blue/10">
              {/* Mini waveform */}
              <svg viewBox="0 0 80 40" className="h-full w-full">
                <defs>
                  <linearGradient id={`wave-${file.id}`} x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#FF4DA6" />
                    <stop offset="100%" stopColor="#3D8BFF" />
                  </linearGradient>
                </defs>
                {[...Array(20)].map((_, i) => {
                  const height = Math.random() * 24 + 8
                  return (
                    <rect
                      key={i}
                      x={i * 4}
                      y={20 - height / 2}
                      width="2"
                      height={height}
                      fill={`url(#wave-${file.id})`}
                      opacity={file.progress === 100 ? 0.8 : 0.4}
                    />
                  )
                })}
              </svg>
              {/* Play button overlay */}
              <button
                onClick={() => setPlayingId(playingId === file.id ? null : file.id)}
                className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition-opacity duration-200 group-hover:opacity-100"
              >
                {playingId === file.id ? (
                  <Pause className="h-5 w-5 text-white" />
                ) : (
                  <Play className="h-5 w-5 text-white" />
                )}
              </button>
            </div>

            {/* File Info */}
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <h3 className="truncate font-medium text-foreground">{file.name}</h3>
                {file.progress < 100 && (
                  <span className="shrink-0 rounded-full bg-eqho-green/20 px-2 py-0.5 text-xs font-medium text-eqho-green">
                    Uploading
                  </span>
                )}
              </div>
              <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {file.duration}
                </span>
                <span className="flex items-center gap-1">
                  <Activity className="h-3 w-3" />
                  {file.bpm} BPM
                </span>
                <span className="rounded bg-secondary/50 px-1.5 py-0.5">{file.key}</span>
                {file.linkedProject && (
                  <span className="truncate text-eqho-blue">{file.linkedProject}</span>
                )}
              </div>

              {/* Progress bar for uploading files */}
              {file.progress < 100 && (
                <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-secondary">
                  <div
                    className="h-full bg-gradient-to-r from-eqho-green to-eqho-blue transition-all duration-300"
                    style={{ width: `${file.progress}%` }}
                  />
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex shrink-0 items-center gap-2">
              <span className="hidden text-xs text-muted-foreground sm:block">{file.uploadedAt}</span>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-muted-foreground hover:text-eqho-blue"
              >
                <Edit2 className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-muted-foreground hover:text-foreground"
              >
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
