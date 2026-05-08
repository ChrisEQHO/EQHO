"use client"

import {
  Save,
  Sparkles,
  Download,
  MessageSquare,
  RotateCcw,
} from "lucide-react"
import { cn } from "@/lib/utils"

const historyItems = [
  {
    id: 1,
    type: "export",
    title: "Exported WAV v3.2",
    description: "24-bit / 48kHz export",
    timestamp: "2 hours ago",
    icon: Download,
    color: "eqho-green",
  },
  {
    id: 2,
    type: "ai",
    title: "AI Edit Applied",
    description: "Auto-leveled transitions",
    timestamp: "3 hours ago",
    icon: Sparkles,
    color: "eqho-pink",
  },
  {
    id: 3,
    type: "comment",
    title: "Comment Added",
    description: "Coach Martinez: Love the build-up!",
    timestamp: "Yesterday",
    icon: MessageSquare,
    color: "eqho-blue",
  },
  {
    id: 4,
    type: "save",
    title: "Version Saved",
    description: "Manual save - v3.1",
    timestamp: "Yesterday",
    icon: Save,
    color: "muted-foreground",
  },
  {
    id: 5,
    type: "ai",
    title: "AI Edit Applied",
    description: "Beat-matched intro section",
    timestamp: "2 days ago",
    icon: Sparkles,
    color: "eqho-pink",
  },
  {
    id: 6,
    type: "save",
    title: "Version Saved",
    description: "Auto-save - v3.0",
    timestamp: "2 days ago",
    icon: Save,
    color: "muted-foreground",
  },
]

export function VersionHistory() {
  return (
    <div className="rounded-xl border border-border/50 bg-card p-5">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-lg font-semibold text-foreground">Version History</h3>
        <button className="flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground">
          <RotateCcw className="h-3.5 w-3.5" />
          Restore
        </button>
      </div>

      {/* Timeline */}
      <div className="relative space-y-0">
        {/* Timeline line */}
        <div className="absolute left-[17px] top-2 h-[calc(100%-16px)] w-px bg-border/50" />

        {historyItems.map((item, index) => (
          <div
            key={item.id}
            className="group relative flex gap-4 py-3 transition-colors hover:bg-secondary/30 -mx-2 px-2 rounded-lg"
          >
            {/* Icon */}
            <div
              className={cn(
                "relative z-10 flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-2 border-card bg-secondary transition-all duration-200 group-hover:scale-110",
                item.color === "eqho-pink" && "bg-eqho-pink/10",
                item.color === "eqho-green" && "bg-eqho-green/10",
                item.color === "eqho-blue" && "bg-eqho-blue/10"
              )}
            >
              <item.icon
                className={cn(
                  "h-4 w-4",
                  item.color === "eqho-pink" && "text-eqho-pink",
                  item.color === "eqho-green" && "text-eqho-green",
                  item.color === "eqho-blue" && "text-eqho-blue",
                  item.color === "muted-foreground" && "text-muted-foreground"
                )}
              />
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0 pt-1">
              <h4 className="text-sm font-medium text-foreground">{item.title}</h4>
              <p className="mt-0.5 text-xs text-muted-foreground truncate">
                {item.description}
              </p>
            </div>

            {/* Timestamp */}
            <span className="shrink-0 pt-1 text-xs text-muted-foreground">
              {item.timestamp}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
