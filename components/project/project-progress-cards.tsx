"use client"

import { FileAudio, Sparkles, MessageSquare, Download, CheckCircle2 } from "lucide-react"
import { cn } from "@/lib/utils"

const progressItems = [
  {
    label: "Uploaded Files",
    value: "4",
    subtext: "assets linked",
    icon: FileAudio,
    color: "eqho-blue",
    progress: 100,
  },
  {
    label: "AI Suggestions",
    value: "3/5",
    subtext: "completed",
    icon: Sparkles,
    color: "eqho-pink",
    progress: 60,
  },
  {
    label: "Pending Reviews",
    value: "2",
    subtext: "from coach",
    icon: MessageSquare,
    color: "eqho-green",
    progress: null,
  },
  {
    label: "Export Versions",
    value: "3",
    subtext: "saved",
    icon: Download,
    color: "purple-500",
    progress: null,
  },
  {
    label: "Completion",
    value: "78%",
    subtext: "project ready",
    icon: CheckCircle2,
    color: "eqho-green",
    progress: 78,
  },
]

export function ProjectProgressCards() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
      {progressItems.map((item) => (
        <div
          key={item.label}
          className="group relative overflow-hidden rounded-xl border border-border/50 bg-card p-4 transition-all duration-300 hover-lift card-shine"
        >
          {/* Glow effect on hover */}
          <div
            className={cn(
              "absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100",
              item.color === "eqho-blue" && "bg-eqho-blue/5",
              item.color === "eqho-pink" && "bg-eqho-pink/5",
              item.color === "eqho-green" && "bg-eqho-green/5",
              item.color === "purple-500" && "bg-purple-500/5"
            )}
          />

          <div className="relative">
            <div className="mb-3 flex items-center justify-between">
              <div
                className={cn(
                  "flex h-9 w-9 items-center justify-center rounded-lg transition-transform duration-300 group-hover:scale-110",
                  item.color === "eqho-blue" && "bg-eqho-blue/10 text-eqho-blue",
                  item.color === "eqho-pink" && "bg-eqho-pink/10 text-eqho-pink",
                  item.color === "eqho-green" && "bg-eqho-green/10 text-eqho-green",
                  item.color === "purple-500" && "bg-purple-500/10 text-purple-400"
                )}
              >
                <item.icon className="h-4 w-4" />
              </div>
            </div>

            <div className="text-2xl font-bold text-foreground">{item.value}</div>
            <div className="text-sm text-muted-foreground">{item.label}</div>
            <div className="mt-1 text-xs text-muted-foreground/70">{item.subtext}</div>

            {/* Progress bar */}
            {item.progress !== null && (
              <div className="mt-3 h-1 overflow-hidden rounded-full bg-secondary">
                <div
                  className={cn(
                    "h-full rounded-full transition-all duration-500",
                    item.color === "eqho-blue" && "bg-eqho-blue",
                    item.color === "eqho-pink" && "bg-eqho-pink",
                    item.color === "eqho-green" && "bg-eqho-green",
                    item.color === "purple-500" && "bg-purple-500"
                  )}
                  style={{ width: `${item.progress}%` }}
                />
              </div>
            )}
          </div>

          {/* Bottom accent line */}
          <div
            className={cn(
              "absolute bottom-0 left-0 h-0.5 w-0 transition-all duration-300 group-hover:w-full",
              item.color === "eqho-blue" && "bg-eqho-blue",
              item.color === "eqho-pink" && "bg-eqho-pink",
              item.color === "eqho-green" && "bg-eqho-green",
              item.color === "purple-500" && "bg-purple-500"
            )}
          />
        </div>
      ))}
    </div>
  )
}
