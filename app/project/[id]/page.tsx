"use client"

import { Sidebar } from "@/components/dashboard/sidebar"
import { ProjectHeader } from "@/components/project/project-header"
import { RoutineTimeline } from "@/components/project/routine-timeline"
import { ProjectProgressCards } from "@/components/project/project-progress-cards"
import { UploadedAssets } from "@/components/project/uploaded-assets"
import { AIRecommendations } from "@/components/project/ai-recommendations"
import { RecentActivity } from "@/components/project/recent-activity"
import { ProjectSummaryPanel } from "@/components/project/project-summary-panel"

export default function ProjectOverviewPage() {
  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar activePage="my-routines" />

      <main className="flex-1 overflow-auto custom-scrollbar">
        {/* Waveform background accents */}
        <div className="pointer-events-none fixed right-0 top-0 h-64 w-64 opacity-30">
          <svg viewBox="0 0 200 200" className="h-full w-full waveform-accent">
            <path
              d="M20 100 Q30 60 40 100 Q50 140 60 100 Q70 60 80 100 Q90 140 100 100 Q110 60 120 100 Q130 140 140 100 Q150 60 160 100 Q170 140 180 100"
              stroke="url(#wave-gradient-project)"
              strokeWidth="2"
              fill="none"
            />
            <defs>
              <linearGradient id="wave-gradient-project" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#FF4DA6" />
                <stop offset="100%" stopColor="#00C896" />
              </linearGradient>
            </defs>
          </svg>
        </div>

        <div className="flex">
          {/* Main Content */}
          <div className="flex-1 space-y-6 p-6 lg:p-8 lg:pr-4">
            <ProjectHeader />
            <RoutineTimeline />
            <ProjectProgressCards />
            <UploadedAssets />
            <AIRecommendations />
            <RecentActivity />

            {/* Bottom Info Section */}
            <div className="rounded-xl border border-border/50 bg-card/50 p-6 text-center">
              <p className="text-sm text-muted-foreground">
                EQHO keeps every edit, asset and export connected in one competition-ready workflow.
              </p>
            </div>
          </div>

          {/* Right Side Panel */}
          <div className="hidden w-80 shrink-0 p-6 lg:block lg:pl-4">
            <ProjectSummaryPanel />
          </div>
        </div>
      </main>
    </div>
  )
}
