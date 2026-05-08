"use client"

import { useState } from "react"
import { Play, Pause, SkipBack, SkipForward, Repeat, Volume2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { cn } from "@/lib/utils"

export function PlaybackControls() {
  const [isPlaying, setIsPlaying] = useState(false)
  const [isLooping, setIsLooping] = useState(false)
  const [currentTime, setCurrentTime] = useState(22.5)
  const [masterVolume, setMasterVolume] = useState(85)
  const totalTime = 90

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    const ms = Math.floor((seconds % 1) * 100)
    return `${mins}:${secs.toString().padStart(2, "0")}.${ms.toString().padStart(2, "0")}`
  }

  return (
    <div className="flex items-center justify-between border-t border-border/50 bg-card/50 px-4 py-3">
      {/* Left - Playback Controls */}
      <div className="flex items-center gap-2">
        {/* Skip Back */}
        <Button
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
        >
          <SkipBack className="h-4 w-4" />
        </Button>

        {/* Play/Pause */}
        <Button
          size="sm"
          onClick={() => setIsPlaying(!isPlaying)}
          className={cn(
            "h-10 w-10 rounded-full p-0 transition-all duration-200",
            isPlaying
              ? "bg-eqho-green text-white shadow-lg shadow-eqho-green/30 hover:bg-eqho-green/90"
              : "bg-gradient-to-r from-eqho-pink to-eqho-blue text-white shadow-lg shadow-eqho-pink/20 hover:opacity-90"
          )}
        >
          {isPlaying ? (
            <Pause className="h-5 w-5" />
          ) : (
            <Play className="h-5 w-5 ml-0.5" />
          )}
        </Button>

        {/* Skip Forward */}
        <Button
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
        >
          <SkipForward className="h-4 w-4" />
        </Button>

        {/* Loop Toggle */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsLooping(!isLooping)}
          className={cn(
            "h-8 w-8 p-0 transition-all",
            isLooping
              ? "text-eqho-blue"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          <Repeat className="h-4 w-4" />
        </Button>
      </div>

      {/* Center - Time Display and Scrubber */}
      <div className="flex flex-1 max-w-2xl items-center gap-4 px-8">
        <span className="w-20 text-right font-mono text-sm text-foreground">
          {formatTime(currentTime)}
        </span>
        
        <Slider
          value={[currentTime]}
          max={totalTime}
          step={0.1}
          onValueChange={(v) => setCurrentTime(v[0])}
          className="flex-1"
        />
        
        <span className="w-20 font-mono text-sm text-muted-foreground">
          {formatTime(totalTime)}
        </span>
      </div>

      {/* Right - Info Display */}
      <div className="flex items-center gap-4">
        {/* BPM */}
        <div className="flex flex-col items-center">
          <span className="text-xs text-muted-foreground">BPM</span>
          <span className="text-sm font-semibold text-eqho-pink">128</span>
        </div>

        {/* Key */}
        <div className="flex flex-col items-center">
          <span className="text-xs text-muted-foreground">Key</span>
          <span className="text-sm font-semibold text-eqho-green">C min</span>
        </div>

        {/* Time Signature */}
        <div className="flex flex-col items-center">
          <span className="text-xs text-muted-foreground">Time</span>
          <span className="text-sm font-semibold text-eqho-blue">4/4</span>
        </div>

        {/* Master Volume */}
        <div className="flex items-center gap-2 rounded-lg bg-secondary/50 px-3 py-1.5">
          <Volume2 className="h-4 w-4 text-muted-foreground" />
          <Slider
            value={[masterVolume]}
            max={100}
            step={1}
            onValueChange={(v) => setMasterVolume(v[0])}
            className="w-20"
          />
          <span className="w-8 text-right text-xs text-muted-foreground">
            {masterVolume}%
          </span>
        </div>
      </div>
    </div>
  )
}
