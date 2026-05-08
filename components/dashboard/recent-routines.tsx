"use client"

import { useState } from "react"
import { Play, MoreHorizontal, Clock, Music, Plus } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

interface Routine {
  name: string
  sport: string
  duration: string
  lastEdited: string
  status: "complete" | "in-progress" | "draft"
}

const routines: Routine[] = [
  {
    name: "Nationals Floor Routine 2024",
    sport: "Gymnastics",
    duration: "1:30",
    lastEdited: "2 hours ago",
    status: "complete",
  },
  {
    name: "Competition Cheer Mix",
    sport: "Cheer",
    duration: "2:30",
    lastEdited: "5 hours ago",
    status: "in-progress",
  },
  {
    name: "Contemporary Dance Piece",
    sport: "Dance",
    duration: "3:15",
    lastEdited: "1 day ago",
    status: "complete",
  },
  {
    name: "Acro Team Finals",
    sport: "Acro",
    duration: "2:45",
    lastEdited: "2 days ago",
    status: "draft",
  },
  {
    name: "Junior Elite Floor",
    sport: "Gymnastics",
    duration: "1:30",
    lastEdited: "3 days ago",
    status: "complete",
  },
]

const sportColors: Record<string, string> = {
  Gymnastics: "bg-eqho-pink/10 text-eqho-pink border-eqho-pink/20",
  Cheer: "bg-eqho-green/10 text-eqho-green border-eqho-green/20",
  Dance: "bg-eqho-blue/10 text-eqho-blue border-eqho-blue/20",
  Acro: "bg-purple-500/10 text-purple-400 border-purple-500/20",
}

const statusConfig: Record<string, { bg: string; text: string; label: string; dot: string }> = {
  complete: { bg: "bg-eqho-green/10", text: "text-eqho-green", label: "Complete", dot: "bg-eqho-green" },
  "in-progress": { bg: "bg-eqho-blue/10", text: "text-eqho-blue", label: "In Progress", dot: "bg-eqho-blue" },
  draft: { bg: "bg-muted", text: "text-muted-foreground", label: "Draft", dot: "bg-muted-foreground" },
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-eqho-pink/20 via-eqho-green/10 to-eqho-blue/20">
        <Music className="h-8 w-8 text-eqho-blue" />
      </div>
      <h4 className="mb-2 font-semibold text-foreground">No routines yet</h4>
      <p className="mb-4 max-w-xs text-sm text-muted-foreground">
        Create your first routine and start crafting competition-ready music.
      </p>
      <Button className="gap-2 bg-gradient-to-r from-eqho-pink to-eqho-blue text-white hover:opacity-90">
        <Plus className="h-4 w-4" />
        Create Routine
      </Button>
    </div>
  )
}

export function RecentRoutines() {
  const [showEmpty] = useState(false) // Toggle for demo purposes

  return (
    <div className="rounded-xl border border-border/50 bg-card">
      <div className="flex items-center justify-between border-b border-border/50 px-5 py-4">
        <h3 className="font-semibold text-foreground">Recent Routines</h3>
        <button className="text-sm text-eqho-blue transition-colors hover:text-eqho-blue/80 hover:underline">
          View All
        </button>
      </div>
      
      {showEmpty ? (
        <EmptyState />
      ) : (
        <div className="divide-y divide-border/50">
          {routines.map((routine, index) => (
            <div
              key={routine.name}
              className="group flex items-center justify-between px-5 py-3.5 transition-all duration-200 hover:bg-secondary/30"
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <div className="flex items-center gap-4">
                <button className="flex h-10 w-10 items-center justify-center rounded-xl bg-secondary text-muted-foreground transition-all duration-200 group-hover:bg-eqho-blue group-hover:text-white group-hover:shadow-lg group-hover:shadow-eqho-blue/20 group-hover:scale-105">
                  <Play className="h-4 w-4 transition-transform group-hover:scale-110" />
                </button>
                <div className="min-w-0">
                  <p className="font-medium text-foreground truncate max-w-[200px] sm:max-w-none">{routine.name}</p>
                  <div className="mt-1.5 flex flex-wrap items-center gap-2 text-xs">
                    <span
                      className={cn(
                        "rounded-full border px-2 py-0.5 font-medium",
                        sportColors[routine.sport]
                      )}
                    >
                      {routine.sport}
                    </span>
                    <span className="flex items-center gap-1 text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      {routine.duration}
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3 sm:gap-4">
                <span className="hidden text-xs text-muted-foreground sm:block">
                  {routine.lastEdited}
                </span>
                <span
                  className={cn(
                    "flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium",
                    statusConfig[routine.status].bg,
                    statusConfig[routine.status].text
                  )}
                >
                  <span className={cn(
                    "h-1.5 w-1.5 rounded-full",
                    statusConfig[routine.status].dot
                  )} />
                  <span className="hidden sm:inline">{statusConfig[routine.status].label}</span>
                </span>
                <button className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground opacity-0 transition-all duration-200 hover:bg-secondary hover:text-foreground group-hover:opacity-100">
                  <MoreHorizontal className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
