"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { FolderOpen, Search } from "lucide-react"

interface Template {
  name: string
  sport: string
  duration: string
  uses: string
  gradient: string
  hoverGlow: string
}

const templates: Template[] = [
  {
    name: "Power Floor Mix",
    sport: "Gymnastics",
    duration: "1:30",
    uses: "2.4k",
    gradient: "from-eqho-pink to-rose-600",
    hoverGlow: "group-hover:shadow-eqho-pink/20",
  },
  {
    name: "Competition Cheer",
    sport: "Cheer",
    duration: "2:30",
    uses: "1.8k",
    gradient: "from-eqho-green to-emerald-600",
    hoverGlow: "group-hover:shadow-eqho-green/20",
  },
  {
    name: "Contemporary Emotion",
    sport: "Dance",
    duration: "3:00",
    uses: "1.2k",
    gradient: "from-eqho-blue to-indigo-600",
    hoverGlow: "group-hover:shadow-eqho-blue/20",
  },
  {
    name: "Dynamic Trio",
    sport: "Acro",
    duration: "2:45",
    uses: "956",
    gradient: "from-purple-500 to-violet-600",
    hoverGlow: "group-hover:shadow-purple-500/20",
  },
]

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-eqho-green/20 to-eqho-blue/20">
        <FolderOpen className="h-8 w-8 text-eqho-green" />
      </div>
      <h4 className="mb-2 font-semibold text-foreground">No templates found</h4>
      <p className="mb-4 max-w-xs text-sm text-muted-foreground">
        Browse our library of professionally crafted templates to get started.
      </p>
      <Button variant="secondary" className="gap-2">
        <Search className="h-4 w-4" />
        Browse Templates
      </Button>
    </div>
  )
}

export function PopularTemplates() {
  const [showEmpty] = useState(false)

  return (
    <div className="rounded-xl border border-border/50 bg-card">
      <div className="flex items-center justify-between border-b border-border/50 px-5 py-4">
        <h3 className="font-semibold text-foreground">Popular Templates</h3>
        <button className="text-sm text-eqho-blue transition-colors hover:text-eqho-blue/80 hover:underline">
          Browse All
        </button>
      </div>
      
      {showEmpty ? (
        <EmptyState />
      ) : (
        <div className="grid gap-4 p-5 sm:grid-cols-2">
          {templates.map((template, index) => (
            <div
              key={template.name}
              className={cn(
                "group relative overflow-hidden rounded-xl border border-border/50 bg-secondary/30 p-4 transition-all duration-300 hover:border-border hover-lift",
                template.hoverGlow,
                "hover:shadow-lg"
              )}
              style={{ animationDelay: `${index * 75}ms` }}
            >
              {/* Waveform Preview with animation */}
              <div
                className={cn(
                  "mb-4 flex h-16 items-center justify-center rounded-lg bg-gradient-to-r transition-all duration-300 group-hover:scale-[1.02]",
                  template.gradient
                )}
              >
                <svg
                  viewBox="0 0 100 30"
                  className="h-8 w-full px-4"
                  preserveAspectRatio="none"
                >
                  <path
                    d="M0,15 Q5,5 10,15 Q15,25 20,15 Q25,5 30,15 Q35,25 40,15 Q45,5 50,15 Q55,25 60,15 Q65,5 70,15 Q75,25 80,15 Q85,5 90,15 Q95,25 100,15"
                    fill="none"
                    stroke="rgba(255,255,255,0.8)"
                    strokeWidth="2"
                    className="transition-all duration-500"
                    style={{
                      strokeDasharray: "200",
                      strokeDashoffset: "0",
                    }}
                  />
                </svg>
              </div>

              <div className="mb-3">
                <h4 className="font-medium text-foreground">{template.name}</h4>
                <div className="mt-1.5 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                  <span className="rounded-full bg-secondary px-2 py-0.5">{template.sport}</span>
                  <span>{template.duration}</span>
                  <span className="text-eqho-green">{template.uses} uses</span>
                </div>
              </div>

              <Button
                size="sm"
                variant="secondary"
                className="w-full transition-all duration-300 group-hover:bg-gradient-to-r group-hover:from-eqho-pink group-hover:to-eqho-blue group-hover:text-white group-hover:shadow-lg group-hover:shadow-eqho-pink/20"
              >
                Use Template
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
