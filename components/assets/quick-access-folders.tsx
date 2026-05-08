"use client"

import { Music, Mic, Zap, TrendingUp, Users, Archive } from "lucide-react"
import { cn } from "@/lib/utils"

const folders = [
  {
    id: "competition-music",
    name: "Competition Music",
    icon: Music,
    count: 24,
    recentActivity: "2 files added today",
    color: "pink",
    gradient: "from-eqho-pink/20 to-eqho-pink/5",
    iconBg: "bg-eqho-pink/20",
    iconColor: "text-eqho-pink",
    glowColor: "group-hover:shadow-eqho-pink/20",
  },
  {
    id: "voiceovers",
    name: "Voiceovers",
    icon: Mic,
    count: 12,
    recentActivity: "Updated 3 days ago",
    color: "green",
    gradient: "from-eqho-green/20 to-eqho-green/5",
    iconBg: "bg-eqho-green/20",
    iconColor: "text-eqho-green",
    glowColor: "group-hover:shadow-eqho-green/20",
  },
  {
    id: "sound-effects",
    name: "Sound Effects",
    icon: Zap,
    count: 48,
    recentActivity: "5 files added this week",
    color: "blue",
    gradient: "from-eqho-blue/20 to-eqho-blue/5",
    iconBg: "bg-eqho-blue/20",
    iconColor: "text-eqho-blue",
    glowColor: "group-hover:shadow-eqho-blue/20",
  },
  {
    id: "risers-impacts",
    name: "Risers & Impacts",
    icon: TrendingUp,
    count: 36,
    recentActivity: "Updated yesterday",
    color: "pink",
    gradient: "from-eqho-pink/20 to-eqho-blue/10",
    iconBg: "bg-gradient-to-br from-eqho-pink/20 to-eqho-blue/20",
    iconColor: "text-eqho-pink",
    glowColor: "group-hover:shadow-eqho-pink/20",
  },
  {
    id: "crowd-fx",
    name: "Crowd FX",
    icon: Users,
    count: 18,
    recentActivity: "8 files added this month",
    color: "green",
    gradient: "from-eqho-green/20 to-eqho-blue/10",
    iconBg: "bg-gradient-to-br from-eqho-green/20 to-eqho-blue/20",
    iconColor: "text-eqho-green",
    glowColor: "group-hover:shadow-eqho-green/20",
  },
  {
    id: "archived",
    name: "Archived Projects",
    icon: Archive,
    count: 7,
    recentActivity: "Last accessed 2 weeks ago",
    color: "gray",
    gradient: "from-muted/30 to-muted/10",
    iconBg: "bg-muted/30",
    iconColor: "text-muted-foreground",
    glowColor: "group-hover:shadow-muted/10",
  },
]

export function QuickAccessFolders() {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-foreground">Quick Access</h2>
        <button className="text-sm text-muted-foreground transition-colors hover:text-eqho-blue">
          View All Folders
        </button>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
        {folders.map((folder) => (
          <button
            key={folder.id}
            className={cn(
              "group relative flex flex-col items-center gap-3 rounded-xl border border-border/50 bg-gradient-to-br p-5 text-center transition-all duration-300 hover-lift card-shine",
              folder.gradient,
              "hover:border-border hover:shadow-lg",
              folder.glowColor
            )}
          >
            {/* Icon */}
            <div
              className={cn(
                "flex h-12 w-12 items-center justify-center rounded-xl transition-transform duration-200 group-hover:scale-110",
                folder.iconBg
              )}
            >
              <folder.icon className={cn("h-6 w-6", folder.iconColor)} />
            </div>

            {/* Name */}
            <div className="space-y-1">
              <h3 className="text-sm font-medium text-foreground line-clamp-1">
                {folder.name}
              </h3>
              <p className="text-xs text-muted-foreground">{folder.count} items</p>
            </div>

            {/* Recent Activity - Hidden on small screens */}
            <p className="hidden text-xs text-muted-foreground/70 lg:block">
              {folder.recentActivity}
            </p>

            {/* Hover Glow Effect */}
            <div
              className={cn(
                "absolute inset-0 -z-10 rounded-xl opacity-0 blur-xl transition-opacity duration-300 group-hover:opacity-50",
                folder.color === "pink" && "bg-eqho-pink/20",
                folder.color === "green" && "bg-eqho-green/20",
                folder.color === "blue" && "bg-eqho-blue/20",
                folder.color === "gray" && "bg-muted/20"
              )}
            />
          </button>
        ))}
      </div>
    </div>
  )
}
