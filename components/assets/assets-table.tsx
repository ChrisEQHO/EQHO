"use client"

import { useState } from "react"
import {
  Play,
  Pause,
  Heart,
  MoreHorizontal,
  Music,
  Mic,
  Zap,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

interface AssetsTableProps {
  selectedAsset: string | null
  onSelectAsset: (id: string) => void
}

const assets = [
  {
    id: "cosmic-energy",
    name: "Cosmic Energy Mix",
    category: "Music",
    categoryIcon: Music,
    duration: "2:34",
    bpm: 128,
    key: "Am",
    uploadDate: "May 6, 2026",
    tags: ["electronic", "high-energy", "competition"],
    favorite: true,
    waveformColor: "pink",
  },
  {
    id: "power-intro",
    name: "Power Intro Voiceover",
    category: "Voiceover",
    categoryIcon: Mic,
    duration: "0:15",
    bpm: null,
    key: null,
    uploadDate: "May 4, 2026",
    tags: ["intro", "announcer"],
    favorite: false,
    waveformColor: "green",
  },
  {
    id: "bass-drop",
    name: "Heavy Bass Drop",
    category: "Sound FX",
    categoryIcon: Zap,
    duration: "0:08",
    bpm: null,
    key: "E",
    uploadDate: "May 3, 2026",
    tags: ["impact", "bass", "hit"],
    favorite: true,
    waveformColor: "blue",
  },
  {
    id: "crowd-cheer",
    name: "Crowd Cheer Loop",
    category: "Sound FX",
    categoryIcon: Zap,
    duration: "0:12",
    bpm: null,
    key: null,
    uploadDate: "May 2, 2026",
    tags: ["crowd", "ambient", "loop"],
    favorite: false,
    waveformColor: "green",
  },
  {
    id: "epic-riser",
    name: "Epic Riser 32 Bar",
    category: "Music",
    categoryIcon: Music,
    duration: "0:45",
    bpm: 140,
    key: "Dm",
    uploadDate: "May 1, 2026",
    tags: ["riser", "build", "tension"],
    favorite: true,
    waveformColor: "pink",
  },
]

// Simple waveform component for table
function MiniWaveform({ color }: { color: string }) {
  const colorClass = {
    pink: "bg-eqho-pink",
    green: "bg-eqho-green",
    blue: "bg-eqho-blue",
  }[color] || "bg-eqho-blue"

  return (
    <div className="flex h-8 w-24 items-center gap-[2px]">
      {Array.from({ length: 20 }).map((_, i) => {
        const height = Math.random() * 100
        return (
          <div
            key={i}
            className={cn("w-1 rounded-full opacity-60", colorClass)}
            style={{ height: `${Math.max(20, height)}%` }}
          />
        )
      })}
    </div>
  )
}

export function AssetsTable({ selectedAsset, onSelectAsset }: AssetsTableProps) {
  const [playingId, setPlayingId] = useState<string | null>(null)
  const [favorites, setFavorites] = useState<Set<string>>(
    new Set(assets.filter((a) => a.favorite).map((a) => a.id))
  )

  const toggleFavorite = (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    setFavorites((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }

  const togglePlay = (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    setPlayingId(playingId === id ? null : id)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-foreground">All Assets</h2>
        <span className="text-sm text-muted-foreground">{assets.length} files</span>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-xl border border-border/50 bg-card/30">
        {/* Table Header */}
        <div className="hidden border-b border-border/50 bg-secondary/30 px-4 py-3 lg:grid lg:grid-cols-12 lg:gap-4">
          <div className="col-span-4 text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Asset
          </div>
          <div className="col-span-1 text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Category
          </div>
          <div className="col-span-1 text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Duration
          </div>
          <div className="col-span-1 text-xs font-medium uppercase tracking-wider text-muted-foreground">
            BPM
          </div>
          <div className="col-span-1 text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Key
          </div>
          <div className="col-span-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Tags
          </div>
          <div className="col-span-2 text-xs font-medium uppercase tracking-wider text-muted-foreground text-right">
            Actions
          </div>
        </div>

        {/* Table Body */}
        <div className="divide-y divide-border/30">
          {assets.map((asset) => (
            <div
              key={asset.id}
              onClick={() => onSelectAsset(asset.id)}
              className={cn(
                "group cursor-pointer px-4 py-4 transition-all duration-200 hover:bg-secondary/30",
                selectedAsset === asset.id && "bg-eqho-blue/5 border-l-2 border-l-eqho-blue"
              )}
            >
              <div className="flex flex-col gap-3 lg:grid lg:grid-cols-12 lg:items-center lg:gap-4">
                {/* Asset Name + Waveform */}
                <div className="col-span-4 flex items-center gap-3">
                  {/* Play Button */}
                  <button
                    onClick={(e) => togglePlay(asset.id, e)}
                    className={cn(
                      "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg transition-all duration-200",
                      playingId === asset.id
                        ? "bg-eqho-pink text-white"
                        : "bg-secondary text-muted-foreground hover:bg-eqho-pink/20 hover:text-eqho-pink"
                    )}
                  >
                    {playingId === asset.id ? (
                      <Pause className="h-4 w-4" />
                    ) : (
                      <Play className="h-4 w-4" />
                    )}
                  </button>

                  {/* Waveform Preview */}
                  <div className="hidden sm:block">
                    <MiniWaveform color={asset.waveformColor} />
                  </div>

                  {/* Name */}
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium text-foreground">
                      {asset.name}
                    </p>
                    <p className="text-xs text-muted-foreground lg:hidden">
                      {asset.category} • {asset.duration}
                    </p>
                  </div>
                </div>

                {/* Category */}
                <div className="col-span-1 hidden lg:block">
                  <div className="flex items-center gap-2">
                    <asset.categoryIcon className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">
                      {asset.category}
                    </span>
                  </div>
                </div>

                {/* Duration */}
                <div className="col-span-1 hidden text-sm text-muted-foreground lg:block">
                  {asset.duration}
                </div>

                {/* BPM */}
                <div className="col-span-1 hidden lg:block">
                  {asset.bpm ? (
                    <span className="rounded-md bg-eqho-pink/10 px-2 py-1 text-xs font-medium text-eqho-pink">
                      {asset.bpm}
                    </span>
                  ) : (
                    <span className="text-sm text-muted-foreground/50">—</span>
                  )}
                </div>

                {/* Key */}
                <div className="col-span-1 hidden lg:block">
                  {asset.key ? (
                    <span className="rounded-md bg-eqho-blue/10 px-2 py-1 text-xs font-medium text-eqho-blue">
                      {asset.key}
                    </span>
                  ) : (
                    <span className="text-sm text-muted-foreground/50">—</span>
                  )}
                </div>

                {/* Tags */}
                <div className="col-span-2 hidden lg:block">
                  <div className="flex flex-wrap gap-1">
                    {asset.tags.slice(0, 2).map((tag) => (
                      <span
                        key={tag}
                        className="rounded-full bg-secondary px-2 py-0.5 text-xs text-muted-foreground"
                      >
                        {tag}
                      </span>
                    ))}
                    {asset.tags.length > 2 && (
                      <span className="rounded-full bg-secondary px-2 py-0.5 text-xs text-muted-foreground">
                        +{asset.tags.length - 2}
                      </span>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="col-span-2 flex items-center justify-end gap-2">
                  <button
                    onClick={(e) => toggleFavorite(asset.id, e)}
                    className={cn(
                      "flex h-8 w-8 items-center justify-center rounded-lg transition-all duration-200",
                      favorites.has(asset.id)
                        ? "text-eqho-pink"
                        : "text-muted-foreground hover:text-eqho-pink"
                    )}
                  >
                    <Heart
                      className={cn(
                        "h-4 w-4",
                        favorites.has(asset.id) && "fill-current"
                      )}
                    />
                  </button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-muted-foreground hover:text-foreground"
                  >
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
