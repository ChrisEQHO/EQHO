"use client"

import { Scissors, Layers, Mic, Volume2, GitMerge, ExternalLink } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

const quickActions = [
  {
    id: 1,
    title: "Trim to Routine Length",
    description: "Auto-trim to your competition time limit",
    icon: Scissors,
    color: "pink",
  },
  {
    id: 2,
    title: "Blend Tracks",
    description: "Seamlessly combine multiple audio files",
    icon: Layers,
    color: "green",
  },
  {
    id: 3,
    title: "Add Intro Voiceover",
    description: "Record or generate AI voiceover intro",
    icon: Mic,
    color: "blue",
  },
  {
    id: 4,
    title: "Add Sound Effects",
    description: "Browse and add crowd FX, risers & impacts",
    icon: Volume2,
    color: "pink",
  },
  {
    id: 5,
    title: "Create Smooth Transition",
    description: "AI-generated crossfades between sections",
    icon: GitMerge,
    color: "green",
  },
  {
    id: 6,
    title: "Open in Editor",
    description: "Full editing suite with timeline view",
    icon: ExternalLink,
    color: "blue",
    primary: true,
  },
]

const colorClasses = {
  pink: {
    icon: "text-eqho-pink",
    hover: "hover:border-eqho-pink/50 hover:shadow-eqho-pink/10",
    iconBg: "bg-eqho-pink/10",
  },
  green: {
    icon: "text-eqho-green",
    hover: "hover:border-eqho-green/50 hover:shadow-eqho-green/10",
    iconBg: "bg-eqho-green/10",
  },
  blue: {
    icon: "text-eqho-blue",
    hover: "hover:border-eqho-blue/50 hover:shadow-eqho-blue/10",
    iconBg: "bg-eqho-blue/10",
  },
}

export function QuickActions() {
  return (
    <div className="glass-panel rounded-xl p-5">
      <div className="mb-5">
        <h2 className="text-lg font-semibold text-foreground">Quick Actions</h2>
        <p className="text-xs text-muted-foreground">Start editing with AI-powered shortcuts</p>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {quickActions.map((action) => {
          const colors = colorClasses[action.color as keyof typeof colorClasses]
          
          if (action.primary) {
            return (
              <Button
                key={action.id}
                className="group relative h-auto flex-col items-start gap-3 overflow-hidden bg-gradient-to-r from-eqho-pink to-eqho-blue p-4 text-left text-white shadow-lg shadow-eqho-pink/20 transition-all duration-200 hover:opacity-90 hover:shadow-xl hover:shadow-eqho-pink/30 hover:scale-[1.02]"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/20">
                  <action.icon className="h-5 w-5" />
                </div>
                <div>
                  <p className="font-semibold">{action.title}</p>
                  <p className="text-xs text-white/80">{action.description}</p>
                </div>
              </Button>
            )
          }

          return (
            <button
              key={action.id}
              className={cn(
                "group flex h-auto flex-col items-start gap-3 rounded-xl border border-border/30 bg-card/50 p-4 text-left transition-all duration-200 hover:bg-card hover:shadow-lg hover-lift",
                colors.hover
              )}
            >
              <div className={cn("flex h-10 w-10 items-center justify-center rounded-lg", colors.iconBg)}>
                <action.icon className={cn("h-5 w-5", colors.icon)} />
              </div>
              <div>
                <p className="font-medium text-foreground">{action.title}</p>
                <p className="text-xs text-muted-foreground">{action.description}</p>
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}
