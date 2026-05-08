"use client"

import { useState } from "react"
import { Sidebar } from "@/components/dashboard/sidebar"
import { AIAssistantHeader } from "@/components/ai-assistant/ai-assistant-header"
import { AIPromptWorkspace } from "@/components/ai-assistant/ai-prompt-workspace"
import { AIWorkflowSteps } from "@/components/ai-assistant/ai-workflow-steps"
import { AIEditCards } from "@/components/ai-assistant/ai-edit-cards"
import { AITimelineSuggestions } from "@/components/ai-assistant/ai-timeline-suggestions"
import { AIMusicGeneration } from "@/components/ai-assistant/ai-music-generation"

export default function AIAssistantPage() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar activePage="ai-assistant" />

      {/* Main Content */}
      <main className="flex-1 overflow-auto custom-scrollbar">
        {/* Waveform Background Accents */}
        <div className="pointer-events-none fixed right-0 top-0 h-96 w-96 opacity-30">
          <div className="absolute inset-0 bg-gradient-to-bl from-eqho-pink/10 via-transparent to-transparent waveform-accent" />
        </div>
        <div className="pointer-events-none fixed bottom-0 left-64 h-64 w-64 opacity-20">
          <div className="absolute inset-0 bg-gradient-to-tr from-eqho-blue/10 via-transparent to-transparent waveform-accent" />
        </div>

        <div className="relative z-10 p-4 lg:p-8">
          <AIAssistantHeader />

          <div className="mt-8 grid grid-cols-1 gap-6 xl:grid-cols-[1fr_320px]">
            {/* Left Column - Main Content */}
            <div className="space-y-6">
              {/* AI Prompt Workspace */}
              <AIPromptWorkspace />

              {/* AI Music Editing Workflow */}
              <AIWorkflowSteps />

              {/* AI Edit Cards */}
              <AIEditCards />

              {/* AI Music Generation */}
              <AIMusicGeneration />
            </div>

            {/* Right Column - Timeline Suggestions */}
            <div className="hidden xl:block">
              <AITimelineSuggestions />
            </div>
          </div>

          {/* Mobile Timeline Suggestions */}
          <div className="mt-6 xl:hidden">
            <AITimelineSuggestions />
          </div>
        </div>
      </main>
    </div>
  )
}
