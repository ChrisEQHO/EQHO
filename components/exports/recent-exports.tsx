"use client"

import { useState } from "react"
import {
  Play,
  Pause,
  Download,
  Link2,
  RefreshCw,
  Trash2,
  MoreHorizontal,
  FileAudio,
  CheckCircle2,
  Clock,
  AlertCircle,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"

const exports = [
  {
    id: 1,
    name: "Nationals Floor Routine 2026",
    type: "WAV",
    size: "48.2 MB",
    quality: "24-bit / 48kHz",
    timestamp: "2 hours ago",
    version: "v3.2",
    status: "complete",
  },
  {
    id: 2,
    name: "Regional Beam Mix",
    type: "MP3",
    size: "8.4 MB",
    quality: "320 kbps",
    timestamp: "Yesterday",
    version: "v2.1",
    status: "complete",
  },
  {
    id: 3,
    name: "State Championship Floor",
    type: "WAV",
    size: "52.1 MB",
    quality: "24-bit / 48kHz",
    timestamp: "3 days ago",
    version: "v1.0",
    status: "processing",
  },
  {
    id: 4,
    name: "Practice Mix - Tumbling",
    type: "MP3",
    size: "6.2 MB",
    quality: "256 kbps",
    timestamp: "1 week ago",
    version: "v1.3",
    status: "error",
  },
]

const statusConfig = {
  complete: {
    icon: CheckCircle2,
    label: "Complete",
    color: "text-eqho-green",
    bg: "bg-eqho-green/10",
  },
  processing: {
    icon: Clock,
    label: "Processing",
    color: "text-eqho-blue",
    bg: "bg-eqho-blue/10",
  },
  error: {
    icon: AlertCircle,
    label: "Failed",
    color: "text-destructive",
    bg: "bg-destructive/10",
  },
}

export function RecentExports() {
  const [playingId, setPlayingId] = useState<number | null>(null)

  return (
    <div className="rounded-xl border border-border/50 bg-card p-5">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-lg font-semibold text-foreground">Recent Exports</h3>
        <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">
          View All
        </Button>
      </div>

      <div className="space-y-3">
        {exports.map((exp) => {
          const status = statusConfig[exp.status as keyof typeof statusConfig]
          const StatusIcon = status.icon

          return (
            <div
              key={exp.id}
              className="group flex items-center gap-4 rounded-lg border border-border/30 bg-secondary/30 p-4 transition-all duration-200 hover:border-border/60 hover:bg-secondary/50 hover-lift"
            >
              {/* Play Button */}
              <button
                onClick={() => setPlayingId(playingId === exp.id ? null : exp.id)}
                className={cn(
                  "flex h-12 w-12 shrink-0 items-center justify-center rounded-lg transition-all duration-200",
                  exp.status === "complete"
                    ? "bg-gradient-to-br from-eqho-pink/20 to-eqho-blue/20 hover:from-eqho-pink/30 hover:to-eqho-blue/30"
                    : "bg-secondary cursor-not-allowed opacity-50"
                )}
                disabled={exp.status !== "complete"}
              >
                {playingId === exp.id ? (
                  <Pause className="h-5 w-5 text-eqho-pink" />
                ) : (
                  <Play className="h-5 w-5 text-eqho-pink ml-0.5" />
                )}
              </button>

              {/* Info */}
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <h4 className="truncate font-medium text-foreground">{exp.name}</h4>
                  <span className="shrink-0 rounded bg-eqho-blue/10 px-1.5 py-0.5 text-xs font-medium text-eqho-blue">
                    {exp.version}
                  </span>
                </div>
                <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <FileAudio className="h-3 w-3" />
                    {exp.type}
                  </span>
                  <span>{exp.size}</span>
                  <span className="hidden sm:inline">{exp.quality}</span>
                  <span>{exp.timestamp}</span>
                </div>
              </div>

              {/* Status Badge */}
              <div className={cn("flex items-center gap-1.5 rounded-full px-2.5 py-1", status.bg)}>
                <StatusIcon className={cn("h-3.5 w-3.5", status.color)} />
                <span className={cn("text-xs font-medium", status.color)}>{status.label}</span>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-muted-foreground hover:text-eqho-green"
                  disabled={exp.status !== "complete"}
                >
                  <Download className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-muted-foreground hover:text-eqho-blue"
                  disabled={exp.status !== "complete"}
                >
                  <Link2 className="h-4 w-4" />
                </Button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-40">
                    <DropdownMenuItem className="gap-2">
                      <RefreshCw className="h-4 w-4" />
                      Regenerate
                    </DropdownMenuItem>
                    <DropdownMenuItem className="gap-2 text-destructive">
                      <Trash2 className="h-4 w-4" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
