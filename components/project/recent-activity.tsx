"use client"

import { Upload, Edit3, Sparkles, Download, CheckCircle, MessageSquare } from "lucide-react"
import { cn } from "@/lib/utils"

const activities = [
  {
    id: 1,
    type: "upload",
    icon: Upload,
    title: "Uploaded Energy Riser",
    description: "New riser added to asset library",
    time: "2 hours ago",
    color: "eqho-blue",
  },
  {
    id: 2,
    type: "edit",
    icon: Edit3,
    title: "Edited transition at 00:42",
    description: "Manual adjustment to section timing",
    time: "3 hours ago",
    color: "eqho-green",
  },
  {
    id: 3,
    type: "ai",
    icon: Sparkles,
    title: "AI shortened intro by 2s",
    description: "Automated edit applied from suggestion",
    time: "5 hours ago",
    color: "eqho-pink",
  },
  {
    id: 4,
    type: "export",
    icon: Download,
    title: "Exported v3.1 (WAV)",
    description: "High quality export for review",
    time: "Yesterday",
    color: "purple-500",
  },
  {
    id: 5,
    type: "approval",
    icon: CheckCircle,
    title: "Coach approved v3.0",
    description: "Sarah M. approved the routine",
    time: "Yesterday",
    color: "eqho-green",
  },
  {
    id: 6,
    type: "comment",
    icon: MessageSquare,
    title: "New comment from coach",
    description: '"Love the new ending transition!"',
    time: "2 days ago",
    color: "eqho-blue",
  },
]

export function RecentActivity() {
  return (
    <div className="rounded-xl border border-border/50 bg-card p-5">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-foreground">Recent Activity</h2>
        <button className="text-sm text-eqho-blue transition-colors hover:text-eqho-blue/80">
          View All
        </button>
      </div>

      <div className="relative">
        {/* Timeline line */}
        <div className="absolute left-4 top-0 h-full w-px bg-border/50" />

        <div className="space-y-4">
          {activities.map((activity, index) => (
            <div
              key={activity.id}
              className="group relative flex items-start gap-4 pl-0"
            >
              {/* Icon */}
              <div
                className={cn(
                  "relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-border/50 bg-card transition-all duration-200 group-hover:scale-110",
                  activity.color === "eqho-blue" && "group-hover:border-eqho-blue/50 group-hover:shadow-sm group-hover:shadow-eqho-blue/20",
                  activity.color === "eqho-green" && "group-hover:border-eqho-green/50 group-hover:shadow-sm group-hover:shadow-eqho-green/20",
                  activity.color === "eqho-pink" && "group-hover:border-eqho-pink/50 group-hover:shadow-sm group-hover:shadow-eqho-pink/20",
                  activity.color === "purple-500" && "group-hover:border-purple-500/50 group-hover:shadow-sm group-hover:shadow-purple-500/20"
                )}
              >
                <activity.icon
                  className={cn(
                    "h-3.5 w-3.5",
                    activity.color === "eqho-blue" && "text-eqho-blue",
                    activity.color === "eqho-green" && "text-eqho-green",
                    activity.color === "eqho-pink" && "text-eqho-pink",
                    activity.color === "purple-500" && "text-purple-400"
                  )}
                />
              </div>

              {/* Content */}
              <div className="min-w-0 flex-1 pt-0.5">
                <div className="flex items-center justify-between gap-2">
                  <p className="font-medium text-foreground">{activity.title}</p>
                  <span className="shrink-0 text-xs text-muted-foreground">
                    {activity.time}
                  </span>
                </div>
                <p className="mt-0.5 text-sm text-muted-foreground">
                  {activity.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
