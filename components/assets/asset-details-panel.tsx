"use client"

import { useState } from "react"
import {
  X,
  Play,
  Pause,
  Music,
  Clock,
  Hash,
  Key,
  Calendar,
  Link2,
  Sparkles,
  FileText,
  Volume2,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface AssetDetailsPanelProps {
  assetId: string
  onClose: () => void
}

// Mock asset data
const assetData: Record<string, {
  name: string
  category: string
  duration: string
  bpm: number | null
  key: string | null
  uploadDate: string
  fileSize: string
  format: string
  sampleRate: string
  bitDepth: string
  linkedProjects: string[]
  notes: string
  tags: string[]
  waveformColor: string
}> = {
  "cosmic-energy": {
    name: "Cosmic Energy Mix",
    category: "Music",
    duration: "2:34",
    bpm: 128,
    key: "Am",
    uploadDate: "May 6, 2026",
    fileSize: "5.8 MB",
    format: "MP3",
    sampleRate: "44.1 kHz",
    bitDepth: "16-bit",
    linkedProjects: ["Nationals 2026 Floor", "Spring Competition"],
    notes: "Main competition music. High energy electronic track with strong drops.",
    tags: ["electronic", "high-energy", "competition", "floor"],
    waveformColor: "pink",
  },
}

// Waveform component
function WaveformPreview({ color }: { color: string }) {
  const colorClass = {
    pink: "from-eqho-pink to-eqho-pink/50",
    green: "from-eqho-green to-eqho-green/50",
    blue: "from-eqho-blue to-eqho-blue/50",
  }[color] || "from-eqho-blue to-eqho-blue/50"

  return (
    <div className="relative h-24 w-full overflow-hidden rounded-lg bg-secondary/50">
      {/* Waveform Bars */}
      <div className="absolute inset-0 flex items-center justify-center gap-[2px] px-2">
        {Array.from({ length: 60 }).map((_, i) => {
          const height = Math.sin(i * 0.3) * 30 + Math.random() * 40 + 20
          return (
            <div
              key={i}
              className={cn("w-1 rounded-full bg-gradient-to-t", colorClass)}
              style={{ height: `${height}%` }}
            />
          )
        })}
      </div>
      {/* Playhead */}
      <div className="absolute left-1/3 top-0 h-full w-0.5 bg-white/80" />
      {/* Time Markers */}
      <div className="absolute bottom-1 left-2 text-xs text-muted-foreground">0:00</div>
      <div className="absolute bottom-1 right-2 text-xs text-muted-foreground">2:34</div>
    </div>
  )
}

export function AssetDetailsPanel({ assetId, onClose }: AssetDetailsPanelProps) {
  const [isPlaying, setIsPlaying] = useState(false)
  const asset = assetData[assetId] || assetData["cosmic-energy"]

  return (
    <aside className="hidden w-80 shrink-0 border-l border-border/50 bg-card/30 lg:block">
      <div className="flex h-full flex-col">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border/50 p-4">
          <h3 className="font-semibold text-foreground">Asset Details</h3>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-6">
          {/* Waveform Preview */}
          <div className="space-y-3">
            <WaveformPreview color={asset.waveformColor} />
            <div className="flex items-center justify-center gap-3">
              <button
                onClick={() => setIsPlaying(!isPlaying)}
                className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-r from-eqho-pink to-eqho-blue text-white shadow-lg shadow-eqho-pink/20 transition-all hover:scale-105 hover:shadow-xl hover:shadow-eqho-pink/30"
              >
                {isPlaying ? (
                  <Pause className="h-5 w-5" />
                ) : (
                  <Play className="h-5 w-5 ml-0.5" />
                )}
              </button>
            </div>
          </div>

          {/* Asset Name */}
          <div>
            <h4 className="text-lg font-semibold text-foreground">{asset.name}</h4>
            <p className="text-sm text-muted-foreground">{asset.category}</p>
          </div>

          {/* Metadata Grid */}
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-lg bg-secondary/50 p-3">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Clock className="h-4 w-4" />
                <span className="text-xs">Duration</span>
              </div>
              <p className="mt-1 font-medium text-foreground">{asset.duration}</p>
            </div>
            <div className="rounded-lg bg-secondary/50 p-3">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Hash className="h-4 w-4" />
                <span className="text-xs">BPM</span>
              </div>
              <p className="mt-1 font-medium text-foreground">
                {asset.bpm || "—"}
              </p>
            </div>
            <div className="rounded-lg bg-secondary/50 p-3">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Key className="h-4 w-4" />
                <span className="text-xs">Key</span>
              </div>
              <p className="mt-1 font-medium text-foreground">
                {asset.key || "—"}
              </p>
            </div>
            <div className="rounded-lg bg-secondary/50 p-3">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Volume2 className="h-4 w-4" />
                <span className="text-xs">Format</span>
              </div>
              <p className="mt-1 font-medium text-foreground">{asset.format}</p>
            </div>
          </div>

          {/* BPM & Key Detection */}
          <div className="rounded-lg border border-eqho-blue/30 bg-eqho-blue/5 p-4">
            <div className="flex items-center gap-2 mb-3">
              <Sparkles className="h-4 w-4 text-eqho-blue" />
              <span className="text-sm font-medium text-foreground">AI Detection</span>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                className="flex-1 border-eqho-blue/30 text-eqho-blue hover:bg-eqho-blue/10"
              >
                Detect BPM
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="flex-1 border-eqho-blue/30 text-eqho-blue hover:bg-eqho-blue/10"
              >
                Detect Key
              </Button>
            </div>
          </div>

          {/* Technical Details */}
          <div className="space-y-2">
            <h5 className="text-sm font-medium text-foreground">Technical Details</h5>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">File Size</span>
                <span className="text-foreground">{asset.fileSize}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Sample Rate</span>
                <span className="text-foreground">{asset.sampleRate}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Bit Depth</span>
                <span className="text-foreground">{asset.bitDepth}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Upload Date</span>
                <span className="text-foreground">{asset.uploadDate}</span>
              </div>
            </div>
          </div>

          {/* Linked Projects */}
          <div className="space-y-2">
            <h5 className="text-sm font-medium text-foreground flex items-center gap-2">
              <Link2 className="h-4 w-4" />
              Linked Projects
            </h5>
            <div className="space-y-2">
              {asset.linkedProjects.map((project) => (
                <button
                  key={project}
                  className="w-full rounded-lg bg-secondary/50 px-3 py-2 text-left text-sm text-foreground transition-colors hover:bg-secondary"
                >
                  {project}
                </button>
              ))}
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <h5 className="text-sm font-medium text-foreground flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Notes
            </h5>
            <p className="text-sm text-muted-foreground">{asset.notes}</p>
          </div>

          {/* AI Enhancement Suggestions */}
          <div className="rounded-lg border border-eqho-pink/30 bg-gradient-to-br from-eqho-pink/5 to-eqho-blue/5 p-4">
            <div className="flex items-center gap-2 mb-3">
              <Sparkles className="h-4 w-4 text-eqho-pink" />
              <span className="text-sm font-medium text-foreground">AI Suggestions</span>
            </div>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-start gap-2">
                <span className="mt-1 h-1.5 w-1.5 rounded-full bg-eqho-pink shrink-0" />
                <span>Consider normalizing audio levels for better consistency</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-1 h-1.5 w-1.5 rounded-full bg-eqho-green shrink-0" />
                <span>This track pairs well with &quot;Epic Riser 32 Bar&quot;</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="border-t border-border/50 p-4">
          <div className="flex gap-2">
            <Button variant="outline" className="flex-1">
              Edit Metadata
            </Button>
            <Button className="flex-1 bg-gradient-to-r from-eqho-pink to-eqho-blue text-white">
              Use in Project
            </Button>
          </div>
        </div>
      </div>
    </aside>
  )
}
