"use client"

import { useState } from "react"
import {
  X,
  FileAudio,
  Volume2,
  AudioWaveform,
  Clock,
  Droplet,
  CloudUpload,
  Download,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { cn } from "@/lib/utils"

interface ExportSettingsPanelProps {
  onClose?: () => void
}

const formats = [
  { id: "wav", label: "WAV", description: "Lossless audio" },
  { id: "mp3", label: "MP3", description: "Compressed audio" },
  { id: "flac", label: "FLAC", description: "Lossless compressed" },
]

const qualities = [
  { id: "high", label: "High", description: "24-bit / 48kHz" },
  { id: "standard", label: "Standard", description: "16-bit / 44.1kHz" },
  { id: "compressed", label: "Compressed", description: "320 kbps MP3" },
]

const destinations = [
  { id: "download", label: "Download", icon: Download },
  { id: "cloud", label: "Cloud Storage", icon: CloudUpload },
]

export function ExportSettingsPanel({ onClose }: ExportSettingsPanelProps) {
  const [selectedFormat, setSelectedFormat] = useState("wav")
  const [selectedQuality, setSelectedQuality] = useState("high")
  const [selectedDestination, setSelectedDestination] = useState("download")
  const [normalizeAudio, setNormalizeAudio] = useState(true)
  const [fadeOut, setFadeOut] = useState(true)
  const [watermark, setWatermark] = useState(false)

  return (
    <div className="sticky top-6 rounded-xl border border-border/50 bg-card">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border/50 p-4">
        <h3 className="font-semibold text-foreground">Export Settings</h3>
        {onClose && (
          <button
            onClick={onClose}
            className="flex h-6 w-6 items-center justify-center rounded text-muted-foreground hover:bg-secondary hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      <div className="p-4 space-y-5">
        {/* Export Format */}
        <div>
          <label className="mb-2 flex items-center gap-2 text-sm font-medium text-foreground">
            <FileAudio className="h-4 w-4 text-eqho-blue" />
            Export Format
          </label>
          <div className="grid grid-cols-3 gap-2">
            {formats.map((format) => (
              <button
                key={format.id}
                onClick={() => setSelectedFormat(format.id)}
                className={cn(
                  "rounded-lg border p-2 text-center transition-all duration-200",
                  selectedFormat === format.id
                    ? "border-eqho-blue bg-eqho-blue/10 text-foreground"
                    : "border-border/50 bg-secondary/30 text-muted-foreground hover:border-border hover:bg-secondary/50"
                )}
              >
                <div className="text-sm font-medium">{format.label}</div>
                <div className="text-xs opacity-70">{format.description}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Audio Quality */}
        <div>
          <label className="mb-2 flex items-center gap-2 text-sm font-medium text-foreground">
            <Volume2 className="h-4 w-4 text-eqho-green" />
            Audio Quality
          </label>
          <div className="space-y-2">
            {qualities.map((quality) => (
              <button
                key={quality.id}
                onClick={() => setSelectedQuality(quality.id)}
                className={cn(
                  "flex w-full items-center justify-between rounded-lg border p-3 transition-all duration-200",
                  selectedQuality === quality.id
                    ? "border-eqho-green bg-eqho-green/10"
                    : "border-border/50 bg-secondary/30 hover:border-border hover:bg-secondary/50"
                )}
              >
                <span className="text-sm font-medium text-foreground">{quality.label}</span>
                <span className="text-xs text-muted-foreground">{quality.description}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Toggles */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="flex items-center gap-2 text-sm text-foreground">
              <AudioWaveform className="h-4 w-4 text-muted-foreground" />
              Normalize Audio
            </label>
            <Switch checked={normalizeAudio} onCheckedChange={setNormalizeAudio} />
          </div>
          <div className="flex items-center justify-between">
            <label className="flex items-center gap-2 text-sm text-foreground">
              <Clock className="h-4 w-4 text-muted-foreground" />
              Fade Out
            </label>
            <Switch checked={fadeOut} onCheckedChange={setFadeOut} />
          </div>
          <div className="flex items-center justify-between">
            <label className="flex items-center gap-2 text-sm text-foreground">
              <Droplet className="h-4 w-4 text-muted-foreground" />
              Add Watermark
            </label>
            <Switch checked={watermark} onCheckedChange={setWatermark} />
          </div>
        </div>

        {/* Export Destination */}
        <div>
          <label className="mb-2 flex items-center gap-2 text-sm font-medium text-foreground">
            Export Destination
          </label>
          <div className="grid grid-cols-2 gap-2">
            {destinations.map((dest) => (
              <button
                key={dest.id}
                onClick={() => setSelectedDestination(dest.id)}
                className={cn(
                  "flex flex-col items-center gap-1.5 rounded-lg border p-3 transition-all duration-200",
                  selectedDestination === dest.id
                    ? "border-eqho-pink bg-eqho-pink/10"
                    : "border-border/50 bg-secondary/30 hover:border-border hover:bg-secondary/50"
                )}
              >
                <dest.icon
                  className={cn(
                    "h-5 w-5",
                    selectedDestination === dest.id ? "text-eqho-pink" : "text-muted-foreground"
                  )}
                />
                <span className="text-xs font-medium text-foreground">{dest.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Export Button */}
        <Button className="w-full gap-2 bg-gradient-to-r from-eqho-pink via-eqho-green to-eqho-blue text-white shadow-lg shadow-eqho-pink/20 transition-all duration-300 hover:opacity-90 hover:shadow-xl hover:shadow-eqho-pink/30 hover:scale-[1.02] h-12 text-base font-semibold">
          <Download className="h-5 w-5" />
          Export Final Routine
        </Button>
      </div>
    </div>
  )
}
