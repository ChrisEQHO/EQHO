"use client"

import { useState } from "react"
import { Download, FileAudio, Upload } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

interface ExportItem {
  name: string
  format: "MP3" | "WAV"
  quality: string
  timestamp: string
  size: string
}

const exports: ExportItem[] = [
  {
    name: "Nationals Floor Routine 2024",
    format: "MP3",
    quality: "320kbps",
    timestamp: "Today, 2:34 PM",
    size: "4.2 MB",
  },
  {
    name: "Competition Cheer Mix",
    format: "WAV",
    quality: "48kHz",
    timestamp: "Today, 11:20 AM",
    size: "28.6 MB",
  },
  {
    name: "Contemporary Dance Piece",
    format: "MP3",
    quality: "320kbps",
    timestamp: "Yesterday, 4:15 PM",
    size: "7.1 MB",
  },
  {
    name: "Junior Elite Floor",
    format: "WAV",
    quality: "48kHz",
    timestamp: "May 5, 2024",
    size: "18.3 MB",
  },
]

const formatColors: Record<string, { bg: string; text: string; border: string }> = {
  MP3: { bg: "bg-eqho-pink/10", text: "text-eqho-pink", border: "border-eqho-pink/20" },
  WAV: { bg: "bg-eqho-blue/10", text: "text-eqho-blue", border: "border-eqho-blue/20" },
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-eqho-blue/20 to-eqho-green/20">
        <Upload className="h-8 w-8 text-eqho-blue" />
      </div>
      <h4 className="mb-2 font-semibold text-foreground">No exports yet</h4>
      <p className="mb-4 max-w-xs text-sm text-muted-foreground">
        Export your first routine to download competition-ready audio files.
      </p>
      <Button variant="secondary" className="gap-2">
        <Download className="h-4 w-4" />
        Learn About Exports
      </Button>
    </div>
  )
}

export function RecentExports() {
  const [showEmpty] = useState(false)

  return (
    <div className="rounded-xl border border-border/50 bg-card">
      <div className="flex items-center justify-between border-b border-border/50 px-5 py-4">
        <h3 className="font-semibold text-foreground">Recent Exports</h3>
        <button className="text-sm text-eqho-blue transition-colors hover:text-eqho-blue/80 hover:underline">
          View All
        </button>
      </div>
      
      {showEmpty ? (
        <EmptyState />
      ) : (
        <div className="divide-y divide-border/50">
          {exports.map((exportItem, index) => (
            <div
              key={index}
              className="group flex items-center justify-between px-5 py-3.5 transition-all duration-200 hover:bg-secondary/30"
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-secondary text-muted-foreground transition-all duration-200 group-hover:bg-eqho-green/10 group-hover:text-eqho-green">
                  <FileAudio className="h-4 w-4" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-foreground truncate max-w-[180px] sm:max-w-none">{exportItem.name}</p>
                  <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                    <span
                      className={cn(
                        "rounded border px-1.5 py-0.5 font-medium",
                        formatColors[exportItem.format].bg,
                        formatColors[exportItem.format].text,
                        formatColors[exportItem.format].border
                      )}
                    >
                      {exportItem.format}
                    </span>
                    <span>{exportItem.quality}</span>
                    <span className="hidden sm:inline">•</span>
                    <span className="hidden sm:inline">{exportItem.size}</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="hidden text-xs text-muted-foreground md:block">{exportItem.timestamp}</span>
                <button className="flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground opacity-0 transition-all duration-200 hover:bg-eqho-green/10 hover:text-eqho-green group-hover:opacity-100">
                  <Download className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
