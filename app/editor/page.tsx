"use client"

import { useState } from "react"
import { Sidebar } from "@/components/dashboard/sidebar"
import { EditorHeader } from "@/components/editor/editor-header"
import { WorkflowNav } from "@/components/editor/workflow-nav"
import { Timeline } from "@/components/editor/timeline"
import { TrackSystem } from "@/components/editor/track-system"
import { PlaybackControls } from "@/components/editor/playback-controls"
import { ToolPanel } from "@/components/editor/tool-panel"
import { AIAssistant } from "@/components/editor/ai-assistant"
import { AudioMetadata } from "@/components/editor/audio-metadata"

export default function EditorPage() {
  const [activeWorkflow, setActiveWorkflow] = useState<"upload" | "edit" | "ai-assist" | "export">("edit")

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      {/* Sidebar */}
      <Sidebar activePage="editor" />

      {/* Main Content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Editor Header */}
        <EditorHeader />

        {/* Workflow Navigation */}
        <WorkflowNav active={activeWorkflow} onChange={setActiveWorkflow} />

        {/* Main Editor Layout */}
        <div className="flex flex-1 overflow-hidden">
          {/* Left Tool Panel */}
          <ToolPanel />

          {/* Center - Timeline and Tracks */}
          <div className="flex flex-1 flex-col overflow-hidden">
            {/* Timeline */}
            <Timeline />

            {/* Track System */}
            <TrackSystem />

            {/* Playback Controls */}
            <PlaybackControls />

            {/* Audio Metadata */}
            <AudioMetadata />
          </div>

          {/* Right - AI Assistant Panel */}
          <AIAssistant />
        </div>
      </div>
    </div>
  )
}
