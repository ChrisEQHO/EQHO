"use client"

import { useState } from "react"
import { Sidebar } from "@/components/dashboard/sidebar"
import { ExportsHeader } from "@/components/exports/exports-header"
import { ExportsStats } from "@/components/exports/exports-stats"
import { RecentExports } from "@/components/exports/recent-exports"
import { CoachReviewLinks } from "@/components/exports/coach-review-links"
import { VersionHistory } from "@/components/exports/version-history"
import { ApprovalWorkflow } from "@/components/exports/approval-workflow"
import { ExportSettingsPanel } from "@/components/exports/export-settings-panel"

export default function ExportsPage() {
  const [showExportPanel, setShowExportPanel] = useState(true)

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar activePage="exports" />

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto custom-scrollbar">
        {/* Waveform Accents */}
        <div className="pointer-events-none absolute right-0 top-0 h-64 w-96 opacity-30">
          <svg viewBox="0 0 400 100" className="h-full w-full waveform-accent">
            <defs>
              <linearGradient id="wave-grad-exports" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#FF4DA6" />
                <stop offset="100%" stopColor="#00C896" />
              </linearGradient>
            </defs>
            {[...Array(50)].map((_, i) => (
              <rect
                key={i}
                x={i * 8}
                y={50 - Math.sin(i * 0.3) * 30 - Math.random() * 10}
                width="3"
                height={Math.sin(i * 0.3) * 60 + Math.random() * 20 + 10}
                fill="url(#wave-grad-exports)"
                opacity={0.15 + Math.random() * 0.1}
                rx="1"
              />
            ))}
          </svg>
        </div>

        <div className="relative p-6 lg:p-8 lg:pl-6">
          <ExportsHeader />

          {/* Stats Cards */}
          <ExportsStats />

          {/* Main Grid */}
          <div className="mt-8 flex gap-6">
            {/* Left Column */}
            <div className="flex-1 space-y-6">
              <RecentExports />
              <CoachReviewLinks />
              <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
                <VersionHistory />
                <ApprovalWorkflow />
              </div>

              {/* Bottom Info Card */}
              <div className="rounded-xl border border-border/50 bg-gradient-to-r from-eqho-blue/10 via-transparent to-eqho-green/10 p-5">
                <p className="text-center text-sm text-muted-foreground">
                  Keep track of every revision, export and approval in one place.
                </p>
              </div>
            </div>

            {/* Right Panel - Export Settings */}
            {showExportPanel && (
              <div className="hidden w-80 shrink-0 xl:block">
                <ExportSettingsPanel onClose={() => setShowExportPanel(false)} />
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
