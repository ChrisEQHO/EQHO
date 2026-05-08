"use client"

import { useState } from "react"
import { Activity, Music, Clock, Wand2, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export function AudioMetadata() {
  const [isDetecting, setIsDetecting] = useState(false)

  const handleDetect = () => {
    setIsDetecting(true)
    setTimeout(() => setIsDetecting(false), 2000)
  }

  return (
    <div className="flex items-center justify-between border-t border-border/50 bg-card/30 px-4 py-2">
      {/* Left - Metadata Display */}
      <div className="flex items-center gap-6">
        {/* BPM */}
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-md bg-eqho-pink/10">
            <Activity className="h-4 w-4 text-eqho-pink" />
          </div>
          <div>
            <p className="text-[10px] uppercase text-muted-foreground">BPM</p>
            <p className="text-sm font-semibold text-foreground">128</p>
          </div>
        </div>

        {/* Key */}
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-md bg-eqho-green/10">
            <Music className="h-4 w-4 text-eqho-green" />
          </div>
          <div>
            <p className="text-[10px] uppercase text-muted-foreground">Key</p>
            <p className="text-sm font-semibold text-foreground">C Minor</p>
          </div>
        </div>

        {/* Time Signature */}
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-md bg-eqho-blue/10">
            <Clock className="h-4 w-4 text-eqho-blue" />
          </div>
          <div>
            <p className="text-[10px] uppercase text-muted-foreground">Time Sig</p>
            <p className="text-sm font-semibold text-foreground">4/4</p>
          </div>
        </div>

        {/* Duration */}
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-md bg-secondary">
            <Clock className="h-4 w-4 text-muted-foreground" />
          </div>
          <div>
            <p className="text-[10px] uppercase text-muted-foreground">Duration</p>
            <p className="text-sm font-semibold text-foreground">1:30.00</p>
          </div>
        </div>
      </div>

      {/* Right - Detect Button */}
      <Button
        variant="outline"
        size="sm"
        onClick={handleDetect}
        disabled={isDetecting}
        className={cn(
          "gap-2 border-border/50 transition-all",
          isDetecting && "opacity-70"
        )}
      >
        {isDetecting ? (
          <>
            <RefreshCw className="h-4 w-4 animate-spin" />
            <span>Detecting...</span>
          </>
        ) : (
          <>
            <Wand2 className="h-4 w-4 text-eqho-blue" />
            <span>Detect BPM & Key</span>
          </>
        )}
      </Button>
    </div>
  )
}
