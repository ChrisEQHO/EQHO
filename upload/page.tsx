"use client"

import { Sidebar } from "@/components/dashboard/sidebar"
import { UploadHeader } from "@/components/upload/upload-header"
import { UploadZone } from "@/components/upload/upload-zone"
import { RecentlyUploaded } from "@/components/upload/recently-uploaded"
import { AIAudioAnalysis } from "@/components/upload/ai-audio-analysis"
import { QuickActions } from "@/components/upload/quick-actions"
import { ProjectAssignment } from "@/components/upload/project-assignment"

export default function UploadPage() {
  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar activePage="upload-music" />
      
      <main className="flex-1 overflow-auto custom-scrollbar">
        {/* Waveform Background Accents */}
        <div className="pointer-events-none fixed right-0 top-0 h-96 w-96 opacity-30">
          <div className="waveform-accent absolute inset-0 bg-gradient-to-bl from-eqho-pink/10 via-transparent to-transparent" />
        </div>
        <div className="pointer-events-none fixed bottom-0 left-64 h-64 w-64 opacity-20">
          <div className="waveform-accent absolute inset-0 bg-gradient-to-tr from-eqho-green/10 via-transparent to-transparent" />
        </div>

        <div className="relative z-10 p-6 lg:p-8">
          <UploadHeader />
          
          <div className="mt-8 grid grid-cols-1 gap-8 xl:grid-cols-3">
            {/* Main Content - 2 columns */}
            <div className="space-y-8 xl:col-span-2">
              <UploadZone />
              <RecentlyUploaded />
              <AIAudioAnalysis />
              <QuickActions />
              
              {/* Bottom Info Panel */}
              <div className="glass-panel rounded-xl p-5">
                <p className="text-center text-sm text-muted-foreground">
                  EQHO analyses your uploaded music to suggest the best structure, transitions and edit points for competition routines.
                </p>
              </div>
            </div>
            
            {/* Right Side Panel */}
            <div className="xl:col-span-1">
              <ProjectAssignment />
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
