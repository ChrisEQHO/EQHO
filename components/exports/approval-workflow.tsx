"use client"

import { useState } from "react"
import {
  CheckCircle2,
  RotateCcw,
  MessageSquare,
  Send,
  User,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

const comments = [
  {
    id: 1,
    author: "Coach Martinez",
    role: "coach",
    message: "The build-up at 0:45 is perfect! Can we make the ending fade slightly longer?",
    timestamp: "1:23",
    time: "2 hours ago",
  },
  {
    id: 2,
    author: "Sarah Chen",
    role: "athlete",
    message: "I love the new transition! The beat drop matches my tumbling pass perfectly.",
    timestamp: "0:45",
    time: "3 hours ago",
  },
  {
    id: 3,
    author: "Coach Martinez",
    role: "coach",
    message: "Great work on the intro section. Approved for competition use.",
    timestamp: "0:12",
    time: "Yesterday",
  },
]

export function ApprovalWorkflow() {
  const [newComment, setNewComment] = useState("")

  return (
    <div className="rounded-xl border border-border/50 bg-card p-5">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-lg font-semibold text-foreground">Approval Workflow</h3>
      </div>

      {/* Comments List */}
      <div className="mb-4 max-h-64 space-y-3 overflow-y-auto custom-scrollbar pr-1">
        {comments.map((comment) => (
          <div
            key={comment.id}
            className="rounded-lg border border-border/30 bg-secondary/30 p-3 transition-colors hover:bg-secondary/50"
          >
            <div className="mb-2 flex items-start justify-between">
              <div className="flex items-center gap-2">
                <div
                  className={cn(
                    "flex h-7 w-7 items-center justify-center rounded-full",
                    comment.role === "coach"
                      ? "bg-eqho-blue/20 text-eqho-blue"
                      : "bg-eqho-pink/20 text-eqho-pink"
                  )}
                >
                  <User className="h-3.5 w-3.5" />
                </div>
                <div>
                  <span className="text-sm font-medium text-foreground">
                    {comment.author}
                  </span>
                  <span className="ml-2 text-xs text-muted-foreground">
                    @ {comment.timestamp}
                  </span>
                </div>
              </div>
              <span className="text-xs text-muted-foreground">{comment.time}</span>
            </div>
            <p className="text-sm text-muted-foreground">{comment.message}</p>
          </div>
        ))}
      </div>

      {/* Add Comment */}
      <div className="mb-4 flex gap-2">
        <div className="relative flex-1">
          <input
            type="text"
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Add a timestamped note..."
            className="w-full rounded-lg border border-border/50 bg-secondary/50 px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-eqho-blue/50 focus:outline-none focus:ring-1 focus:ring-eqho-blue/20"
          />
          <Button
            size="icon"
            variant="ghost"
            className="absolute right-1 top-1/2 h-7 w-7 -translate-y-1/2 text-muted-foreground hover:text-eqho-blue"
          >
            <MessageSquare className="h-4 w-4" />
          </Button>
        </div>
        <Button
          size="icon"
          className="h-9 w-9 bg-eqho-blue text-white hover:bg-eqho-blue/80"
        >
          <Send className="h-4 w-4" />
        </Button>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-2">
        <Button className="flex-1 gap-2 bg-eqho-green text-white hover:bg-eqho-green/80">
          <CheckCircle2 className="h-4 w-4" />
          Approve
        </Button>
        <Button
          variant="outline"
          className="flex-1 gap-2 border-eqho-pink/50 text-eqho-pink hover:bg-eqho-pink/10 hover:border-eqho-pink"
        >
          <RotateCcw className="h-4 w-4" />
          Request Changes
        </Button>
      </div>
    </div>
  )
}
