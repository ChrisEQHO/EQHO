"use client"

import { CheckCircle2, Clock, AlertCircle, FileAudio, Link2 } from "lucide-react"
import { cn } from "@/lib/utils"

const recentUploads = [
  {
    id: "upload-1",
    name: "Finals_Routine_V3.mp3",
    status: "complete",
    progress: 100,
    linkedProject: "Nationals 2026 Floor",
    tags: ["competition", "finals"],
    waveformColor: "pink",
  },
  {
    id: "upload-2",
    name: "Impact_Collection.zip",
    status: "processing",
    progress: 67,
    linkedProject: null,
    tags: ["impacts", "sfx"],
    waveformColor: "blue",
  },
  {
    id: "upload-3",
    name: "Crowd_Ambience_Loop.wav",
    status: "complete",
    progress: 100,
    linkedProject: "Spring Competition",
    tags: ["crowd", "ambient"],
    waveformColor: "green",
  },
  {
    id: "upload-4",
    name: "VO_Intro_Take5.mp3",
    status: "error",
    progress: 0,
    linkedProject: null,
    tags: ["voiceover"],
    waveformColor: "pink",
  },
]

// Simple waveform component for recent uploads
function MiniWaveform({ color }: { color: string }) {
  const colorClass = {
    pink: "bg-eqho-pink",
    green: "bg-eqho-green",
    blue: "bg-eqho-blue",
  }[color] || "bg-eqho-blue"

  return (
    <div className="flex h-8 w-16 items-center gap-[2px]">
      {Array.from({ length: 12 }).map((_, i) => {
        const height = Math.random() * 100
        return (
          <div
            key={i}
            className={cn("w-1 rounded-full opacity-50", colorClass)}
            style={{ height: `${Math.max(15, height)}%` }}
          />
        )
      })}
    </div>
  )
}

function StatusIcon({ status }: { status: string }) {
  switch (status) {
    case "complete":
      return <CheckCircle2 className="h-4 w-4 text-eqho-green" />
    case "processing":
      return <Clock className="h-4 w-4 text-eqho-blue animate-pulse" />
    case "error":
      return <AlertCircle className="h-4 w-4 text-destructive" />
    default:
      return null
  }
}

export function RecentUploads() {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-foreground">Recent Uploads</h2>
        <button className="text-sm text-muted-foreground transition-colors hover:text-eqho-blue">
          View All
        </button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {recentUploads.map((upload) => (
          <div
            key={upload.id}
            className={cn(
              "group relative rounded-xl border border-border/50 bg-card/50 p-4 transition-all duration-200 hover-lift hover:border-border hover:bg-card",
              upload.status === "error" && "border-destructive/30"
            )}
          >
            {/* Status Badge */}
            <div className="mb-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <StatusIcon status={upload.status} />
                <span
                  className={cn(
                    "text-xs font-medium capitalize",
                    upload.status === "complete" && "text-eqho-green",
                    upload.status === "processing" && "text-eqho-blue",
                    upload.status === "error" && "text-destructive"
                  )}
                >
                  {upload.status}
                </span>
              </div>
              {upload.status === "processing" && (
                <span className="text-xs text-muted-foreground">{upload.progress}%</span>
              )}
            </div>

            {/* Waveform */}
            <div className="mb-3 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-secondary">
                <FileAudio className="h-5 w-5 text-muted-foreground" />
              </div>
              <MiniWaveform color={upload.waveformColor} />
            </div>

            {/* File Name */}
            <h3 className="mb-2 truncate text-sm font-medium text-foreground">
              {upload.name}
            </h3>

            {/* Tags */}
            <div className="mb-3 flex flex-wrap gap-1">
              {upload.tags.map((tag) => (
                <span
                  key={tag}
                  className="rounded-full bg-secondary px-2 py-0.5 text-xs text-muted-foreground"
                >
                  {tag}
                </span>
              ))}
            </div>

            {/* Linked Project */}
            {upload.linkedProject && (
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Link2 className="h-3 w-3" />
                <span className="truncate">{upload.linkedProject}</span>
              </div>
            )}

            {/* Progress Bar for Processing */}
            {upload.status === "processing" && (
              <div className="mt-3 h-1 w-full overflow-hidden rounded-full bg-secondary">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-eqho-pink to-eqho-blue transition-all duration-300"
                  style={{ width: `${upload.progress}%` }}
                />
              </div>
            )}

            {/* Error Message */}
            {upload.status === "error" && (
              <button className="mt-2 text-xs text-destructive hover:underline">
                Retry upload
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
