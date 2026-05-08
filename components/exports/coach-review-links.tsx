"use client"

import {
  Eye,
  EyeOff,
  MessageSquare,
  ExternalLink,
  Send,
  Link2,
  Clock,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

const reviewLinks = [
  {
    id: 1,
    reviewerName: "Coach Martinez",
    athleteTeam: "Elite Squad - Floor",
    status: "approved",
    comments: 3,
    viewed: true,
    expiryDate: "May 15, 2026",
  },
  {
    id: 2,
    reviewerName: "Coach Williams",
    athleteTeam: "Junior Team - Beam",
    status: "pending",
    comments: 0,
    viewed: false,
    expiryDate: "May 20, 2026",
  },
  {
    id: 3,
    reviewerName: "Coach Thompson",
    athleteTeam: "Sarah Chen - Nationals",
    status: "changes_requested",
    comments: 5,
    viewed: true,
    expiryDate: "May 12, 2026",
  },
  {
    id: 4,
    reviewerName: "Coach Davis",
    athleteTeam: "Regional Team - Vault",
    status: "pending",
    comments: 1,
    viewed: true,
    expiryDate: "May 18, 2026",
  },
]

const statusConfig = {
  approved: {
    icon: CheckCircle2,
    label: "Approved",
    color: "text-eqho-green",
    bg: "bg-eqho-green/10",
    border: "border-eqho-green/30",
  },
  pending: {
    icon: Clock,
    label: "Pending",
    color: "text-eqho-blue",
    bg: "bg-eqho-blue/10",
    border: "border-eqho-blue/30",
  },
  changes_requested: {
    icon: AlertTriangle,
    label: "Changes Requested",
    color: "text-eqho-pink",
    bg: "bg-eqho-pink/10",
    border: "border-eqho-pink/30",
  },
}

export function CoachReviewLinks() {
  return (
    <div className="rounded-xl border border-border/50 bg-card p-5">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-lg font-semibold text-foreground">Coach Review Links</h3>
        <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">
          Create Link
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {reviewLinks.map((link) => {
          const status = statusConfig[link.status as keyof typeof statusConfig]
          const StatusIcon = status.icon

          return (
            <div
              key={link.id}
              className={cn(
                "group rounded-lg border bg-secondary/30 p-4 transition-all duration-200 hover:bg-secondary/50 hover-lift",
                status.border
              )}
            >
              {/* Header */}
              <div className="mb-3 flex items-start justify-between">
                <div>
                  <h4 className="font-medium text-foreground">{link.reviewerName}</h4>
                  <p className="text-sm text-muted-foreground">{link.athleteTeam}</p>
                </div>
                <div className={cn("flex items-center gap-1.5 rounded-full px-2.5 py-1", status.bg)}>
                  <StatusIcon className={cn("h-3.5 w-3.5", status.color)} />
                  <span className={cn("text-xs font-medium", status.color)}>{status.label}</span>
                </div>
              </div>

              {/* Meta */}
              <div className="mb-4 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  {link.viewed ? (
                    <Eye className="h-3 w-3 text-eqho-green" />
                  ) : (
                    <EyeOff className="h-3 w-3" />
                  )}
                  {link.viewed ? "Viewed" : "Not viewed"}
                </span>
                <span className="flex items-center gap-1">
                  <MessageSquare className="h-3 w-3" />
                  {link.comments} comments
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  Expires {link.expiryDate}
                </span>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1 gap-1.5 border-border/50 bg-transparent text-xs hover:bg-secondary hover:border-eqho-blue/50"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                  Open Review
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-muted-foreground hover:text-eqho-green"
                >
                  <Send className="h-3.5 w-3.5" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-muted-foreground hover:text-eqho-blue"
                >
                  <Link2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
