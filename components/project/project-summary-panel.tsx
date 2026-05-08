"use client"

import { Clock, Music, Key, FileText, Download, Users, Sliders } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"

const summaryItems = [
  { label: "Routine Length", value: "1:30", icon: Clock },
  { label: "BPM", value: "128", icon: Music },
  { label: "Key", value: "C Major", icon: Key },
  { label: "Template", value: "Nationals Gym", icon: FileText },
  { label: "Export Quality", value: "WAV 24-bit", icon: Download },
  { label: "Linked Team", value: "Elite Gymnastics", icon: Users },
]

export function ProjectSummaryPanel() {
  return (
    <div className="sticky top-6 space-y-4">
      {/* Project Summary Card */}
      <div className="rounded-xl border border-border/50 bg-card p-5">
        <h3 className="mb-4 text-lg font-semibold text-foreground">Project Summary</h3>

        <div className="space-y-3">
          {summaryItems.map((item) => (
            <div
              key={item.label}
              className="flex items-center justify-between rounded-lg bg-eqho-navy/50 px-3 py-2.5"
            >
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <item.icon className="h-4 w-4" />
                <span>{item.label}</span>
              </div>
              <span className="text-sm font-medium text-foreground">{item.value}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Open Editor Button */}
      <Link href="/editor" className="block">
        <Button className="group relative h-14 w-full overflow-hidden bg-gradient-to-r from-eqho-pink via-eqho-green to-eqho-blue text-white shadow-lg shadow-eqho-pink/30 transition-all duration-300 hover:shadow-xl hover:shadow-eqho-pink/40">
          {/* Animated glow */}
          <div className="absolute inset-0 bg-gradient-to-r from-eqho-pink via-eqho-green to-eqho-blue opacity-0 blur-xl transition-opacity duration-300 group-hover:opacity-50" />
          
          <span className="relative flex items-center gap-2 text-base font-semibold">
            <Sliders className="h-5 w-5" />
            Open Full Editor
          </span>
        </Button>
      </Link>

      {/* Quick Stats */}
      <div className="rounded-xl border border-border/50 bg-card p-4">
        <div className="grid grid-cols-2 gap-3">
          <div className="text-center">
            <div className="text-2xl font-bold text-eqho-pink">12</div>
            <div className="text-xs text-muted-foreground">Total Edits</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-eqho-green">5</div>
            <div className="text-xs text-muted-foreground">AI Assists</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-eqho-blue">3</div>
            <div className="text-xs text-muted-foreground">Versions</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-400">2</div>
            <div className="text-xs text-muted-foreground">Reviewers</div>
          </div>
        </div>
      </div>

      {/* Coach Info */}
      <div className="rounded-xl border border-border/50 bg-card p-4">
        <div className="mb-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
          Linked Coach
        </div>
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-eqho-pink to-eqho-blue text-sm font-semibold text-white">
            SM
          </div>
          <div>
            <div className="font-medium text-foreground">Sarah Mitchell</div>
            <div className="text-xs text-muted-foreground">Elite Gymnastics</div>
          </div>
        </div>
      </div>
    </div>
  )
}
