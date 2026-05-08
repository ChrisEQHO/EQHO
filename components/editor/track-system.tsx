"use client"

import { useState } from "react"
import { Volume2, VolumeX, Headphones, GripVertical, Lock, Unlock } from "lucide-react"
import { Slider } from "@/components/ui/slider"
import { cn } from "@/lib/utils"

interface Track {
  id: string
  name: string
  color: string
  volume: number
  isMuted: boolean
  isSolo: boolean
  isLocked: boolean
  clips: {
    id: string
    name: string
    start: number
    width: number
  }[]
}

const initialTracks: Track[] = [
  {
    id: "music",
    name: "Music",
    color: "eqho-pink",
    volume: 80,
    isMuted: false,
    isSolo: false,
    isLocked: false,
    clips: [
      { id: "m1", name: "Main Track.mp3", start: 0, width: 100 },
    ],
  },
  {
    id: "effects",
    name: "Effects",
    color: "eqho-blue",
    volume: 65,
    isMuted: false,
    isSolo: false,
    isLocked: false,
    clips: [
      { id: "e1", name: "Impact Hit", start: 35, width: 8 },
      { id: "e2", name: "Transition", start: 52, width: 6 },
      { id: "e3", name: "Final Hit", start: 85, width: 10 },
    ],
  },
  {
    id: "voiceover",
    name: "Voiceover",
    color: "eqho-green",
    volume: 75,
    isMuted: false,
    isSolo: false,
    isLocked: false,
    clips: [
      { id: "v1", name: "Intro VO", start: 2, width: 12 },
    ],
  },
  {
    id: "crowd",
    name: "Crowd",
    color: "eqho-blue",
    volume: 40,
    isMuted: true,
    isSolo: false,
    isLocked: false,
    clips: [
      { id: "c1", name: "Crowd Cheer", start: 65, width: 15 },
    ],
  },
  {
    id: "risers",
    name: "Risers",
    color: "eqho-pink",
    volume: 55,
    isMuted: false,
    isSolo: false,
    isLocked: false,
    clips: [
      { id: "r1", name: "Build Up", start: 28, width: 7 },
      { id: "r2", name: "Final Riser", start: 75, width: 10 },
    ],
  },
]

export function TrackSystem() {
  const [tracks, setTracks] = useState<Track[]>(initialTracks)

  const toggleMute = (trackId: string) => {
    setTracks(tracks.map(t => 
      t.id === trackId ? { ...t, isMuted: !t.isMuted } : t
    ))
  }

  const toggleSolo = (trackId: string) => {
    setTracks(tracks.map(t => 
      t.id === trackId ? { ...t, isSolo: !t.isSolo } : t
    ))
  }

  const toggleLock = (trackId: string) => {
    setTracks(tracks.map(t => 
      t.id === trackId ? { ...t, isLocked: !t.isLocked } : t
    ))
  }

  const updateVolume = (trackId: string, value: number[]) => {
    setTracks(tracks.map(t => 
      t.id === trackId ? { ...t, volume: value[0] } : t
    ))
  }

  return (
    <div className="flex-1 overflow-auto custom-scrollbar bg-background/50">
      {tracks.map((track) => (
        <div
          key={track.id}
          className={cn(
            "flex border-b border-border/30 transition-opacity",
            track.isMuted && "opacity-50"
          )}
        >
          {/* Track Controls */}
          <div className="flex w-48 shrink-0 items-center gap-2 border-r border-border/30 bg-card/50 px-3 py-2">
            {/* Drag Handle */}
            <GripVertical className="h-4 w-4 cursor-grab text-muted-foreground/50" />

            {/* Track Name */}
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <div
                  className={cn(
                    "h-2 w-2 rounded-full",
                    track.color === "eqho-pink" && "bg-eqho-pink",
                    track.color === "eqho-green" && "bg-eqho-green",
                    track.color === "eqho-blue" && "bg-eqho-blue"
                  )}
                />
                <span className="text-sm font-medium text-foreground">{track.name}</span>
              </div>
            </div>

            {/* Track Buttons */}
            <div className="flex items-center gap-1">
              {/* Mute */}
              <button
                onClick={() => toggleMute(track.id)}
                className={cn(
                  "flex h-6 w-6 items-center justify-center rounded text-xs transition-all",
                  track.isMuted
                    ? "bg-destructive/20 text-destructive"
                    : "bg-secondary text-muted-foreground hover:text-foreground"
                )}
              >
                {track.isMuted ? (
                  <VolumeX className="h-3.5 w-3.5" />
                ) : (
                  <Volume2 className="h-3.5 w-3.5" />
                )}
              </button>

              {/* Solo */}
              <button
                onClick={() => toggleSolo(track.id)}
                className={cn(
                  "flex h-6 w-6 items-center justify-center rounded text-xs transition-all",
                  track.isSolo
                    ? "bg-eqho-green/20 text-eqho-green"
                    : "bg-secondary text-muted-foreground hover:text-foreground"
                )}
              >
                <Headphones className="h-3.5 w-3.5" />
              </button>

              {/* Lock */}
              <button
                onClick={() => toggleLock(track.id)}
                className={cn(
                  "flex h-6 w-6 items-center justify-center rounded text-xs transition-all",
                  track.isLocked
                    ? "bg-eqho-blue/20 text-eqho-blue"
                    : "bg-secondary text-muted-foreground hover:text-foreground"
                )}
              >
                {track.isLocked ? (
                  <Lock className="h-3.5 w-3.5" />
                ) : (
                  <Unlock className="h-3.5 w-3.5" />
                )}
              </button>
            </div>

            {/* Volume Slider */}
            <div className="w-16">
              <Slider
                value={[track.volume]}
                max={100}
                step={1}
                onValueChange={(v) => updateVolume(track.id, v)}
                className="h-1"
              />
            </div>
          </div>

          {/* Track Timeline */}
          <div className="relative flex-1 bg-secondary/20 py-2">
            {/* Grid lines */}
            <div className="absolute inset-0 flex">
              {Array.from({ length: 18 }).map((_, i) => (
                <div
                  key={i}
                  className="flex-1 border-r border-border/10"
                />
              ))}
            </div>

            {/* Audio Clips */}
            {track.clips.map((clip) => (
              <div
                key={clip.id}
                className={cn(
                  "absolute top-1 bottom-1 rounded-md cursor-move transition-all hover:brightness-110 group",
                  "border border-white/10 shadow-lg",
                  track.color === "eqho-pink" && "bg-gradient-to-r from-eqho-pink/60 to-eqho-pink/40",
                  track.color === "eqho-green" && "bg-gradient-to-r from-eqho-green/60 to-eqho-green/40",
                  track.color === "eqho-blue" && "bg-gradient-to-r from-eqho-blue/60 to-eqho-blue/40"
                )}
                style={{
                  left: `${clip.start}%`,
                  width: `${clip.width}%`,
                }}
              >
                {/* Mini waveform */}
                <div className="absolute inset-0 flex items-center overflow-hidden px-1">
                  {clip.width > 10 && (
                    <span className="truncate text-[10px] font-medium text-white/80">
                      {clip.name}
                    </span>
                  )}
                </div>

                {/* Resize handles */}
                <div className="absolute left-0 top-0 bottom-0 w-1 cursor-ew-resize bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="absolute right-0 top-0 bottom-0 w-1 cursor-ew-resize bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
