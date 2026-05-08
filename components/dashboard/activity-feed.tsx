"use client"

import { useState } from "react"
import { Sparkles, Upload, Download, Save, Bell, Activity } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

interface ActivityItem {
  type: string
  message: string
  time: string
  icon: React.ElementType
  color: string
  iconBg: string
}

const activities: ActivityItem[] = [
  {
    type: "ai",
    message: "AI suggestion applied to \"Nationals Floor Routine\"",
    time: "5 min ago",
    icon: Sparkles,
    color: "text-eqho-pink",
    iconBg: "bg-eqho-pink/10",
  },
  {
    type: "export",
    message: "Exported \"Competition Cheer Mix\" as MP3",
    time: "2 hours ago",
    icon: Download,
    color: "text-eqho-green",
    iconBg: "bg-eqho-green/10",
  },
  {
    type: "upload",
    message: "Uploaded 3 new audio tracks to Asset Library",
    time: "4 hours ago",
    icon: Upload,
    color: "text-eqho-blue",
    iconBg: "bg-eqho-blue/10",
  },
  {
    type: "save",
    message: "Auto-saved changes to \"Contemporary Dance Piece\"",
    time: "5 hours ago",
    icon: Save,
    color: "text-muted-foreground",
    iconBg: "bg-muted",
  },
  {
    type: "ai",
    message: "AI generated 4 transition suggestions",
    time: "Yesterday",
    icon: Sparkles,
    color: "text-eqho-pink",
    iconBg: "bg-eqho-pink/10",
  },
  {
    type: "export",
    message: "Exported \"Acro Team Finals\" as WAV",
    time: "Yesterday",
    icon: Download,
    color: "text-eqho-green",
    iconBg: "bg-eqho-green/10",
  },
]

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-eqho-pink/20 to-eqho-blue/20">
        <Activity className="h-8 w-8 text-eqho-pink" />
      </div>
      <h4 className="mb-2 font-semibold text-foreground">No recent activity</h4>
      <p className="mb-4 max-w-xs text-sm text-muted-foreground">
        Your activity feed will show edits, exports, and AI suggestions.
      </p>
      <Button variant="secondary" size="sm" className="gap-2">
        <Bell className="h-4 w-4" />
        Enable Notifications
      </Button>
    </div>
  )
}

export function ActivityFeed() {
  const [showEmpty] = useState(false)

  return (
    <div className="rounded-xl border border-border/50 bg-card">
      <div className="flex items-center justify-between border-b border-border/50 px-5 py-4">
        <h3 className="font-semibold text-foreground">Activity Feed</h3>
        <button className="text-sm text-eqho-blue transition-colors hover:text-eqho-blue/80 hover:underline">
          View All
        </button>
      </div>
      
      {showEmpty ? (
        <EmptyState />
      ) : (
        <div className="max-h-[340px] overflow-y-auto custom-scrollbar">
          <div className="divide-y divide-border/50">
            {activities.map((activity, index) => (
              <div
                key={index}
                className="group flex items-start gap-3 px-5 py-3.5 transition-all duration-200 hover:bg-secondary/30"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <div
                  className={cn(
                    "mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl transition-all duration-200 group-hover:scale-105",
                    activity.iconBg,
                    activity.color
                  )}
                >
                  <activity.icon className="h-4 w-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm text-foreground leading-relaxed">{activity.message}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{activity.time}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
