"use client"

import { Play, Edit3, Music, Mic, Zap, TrendingUp, MoreHorizontal } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

const assets = [
  {
    id: 1,
    name: "Main Floor Music",
    type: "Music Track",
    icon: Music,
    duration: "1:30",
    bpm: 128,
    key: "C Major",
    color: "eqho-pink",
  },
  {
    id: 2,
    name: "Coach Voiceover",
    type: "Voiceover",
    icon: Mic,
    duration: "0:08",
    bpm: null,
    key: null,
    color: "eqho-blue",
  },
  {
    id: 3,
    name: "Impact Hit Pack",
    type: "Sound Effects",
    icon: Zap,
    duration: "0:02",
    bpm: null,
    key: null,
    color: "eqho-green",
  },
  {
    id: 4,
    name: "Energy Riser",
    type: "Riser",
    icon: TrendingUp,
    duration: "0:04",
    bpm: null,
    key: null,
    color: "purple-500",
  },
]

export function UploadedAssets() {
  return (
    <div className="rounded-xl border border-border/50 bg-card p-5">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-foreground">Uploaded Assets</h2>
        <Button
          variant="outline"
          size="sm"
          className="gap-2 border-border/50 bg-card text-muted-foreground hover:bg-secondary hover:text-foreground"
        >
          + Add Asset
        </Button>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {assets.map((asset) => (
          <div
            key={asset.id}
            className="group flex items-center gap-4 rounded-xl border border-border/50 bg-eqho-navy/50 p-4 transition-all duration-200 hover:border-border hover:bg-eqho-navy"
          >
            {/* Waveform Preview */}
            <div className="relative h-14 w-20 shrink-0 overflow-hidden rounded-lg bg-eqho-navy">
              <svg className="absolute inset-0 h-full w-full" preserveAspectRatio="none">
                {Array.from({ length: 20 }).map((_, i) => {
                  const height = 30 + Math.sin(i * 0.5) * 20 + Math.random() * 15
                  return (
                    <rect
                      key={i}
                      x={i * 5 + "%"}
                      y={50 - height / 2 + "%"}
                      width="4%"
                      height={height + "%"}
                      fill={
                        asset.color === "eqho-pink"
                          ? "#FF4DA6"
                          : asset.color === "eqho-blue"
                          ? "#3D8BFF"
                          : asset.color === "eqho-green"
                          ? "#00C896"
                          : "#A855F7"
                      }
                      opacity={0.6}
                      rx="1"
                    />
                  )
                })}
              </svg>

              {/* Play button overlay */}
              <button className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition-opacity group-hover:opacity-100">
                <div
                  className={cn(
                    "flex h-8 w-8 items-center justify-center rounded-full",
                    asset.color === "eqho-pink" && "bg-eqho-pink",
                    asset.color === "eqho-blue" && "bg-eqho-blue",
                    asset.color === "eqho-green" && "bg-eqho-green",
                    asset.color === "purple-500" && "bg-purple-500"
                  )}
                >
                  <Play className="h-3.5 w-3.5 text-white" fill="white" />
                </div>
              </button>
            </div>

            {/* Asset Info */}
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <asset.icon
                  className={cn(
                    "h-4 w-4 shrink-0",
                    asset.color === "eqho-pink" && "text-eqho-pink",
                    asset.color === "eqho-blue" && "text-eqho-blue",
                    asset.color === "eqho-green" && "text-eqho-green",
                    asset.color === "purple-500" && "text-purple-400"
                  )}
                />
                <span className="truncate font-medium text-foreground">
                  {asset.name}
                </span>
              </div>
              <div className="mt-1 text-xs text-muted-foreground">{asset.type}</div>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <span className="rounded bg-secondary px-2 py-0.5 text-xs text-foreground">
                  {asset.duration}
                </span>
                {asset.bpm && (
                  <span className="rounded bg-secondary px-2 py-0.5 text-xs text-foreground">
                    {asset.bpm} BPM
                  </span>
                )}
                {asset.key && (
                  <span className="rounded bg-secondary px-2 py-0.5 text-xs text-foreground">
                    {asset.key}
                  </span>
                )}
              </div>
            </div>

            {/* Edit Button */}
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 shrink-0 p-0 text-muted-foreground opacity-0 transition-opacity hover:text-foreground group-hover:opacity-100"
            >
              <Edit3 className="h-4 w-4" />
            </Button>
          </div>
        ))}
      </div>
    </div>
  )
}
