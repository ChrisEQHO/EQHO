"use client"

import { useState } from "react"
import { Sidebar } from "@/components/dashboard/sidebar"
import { NewProjectHeader } from "@/components/new-project/header"
import { ProgressSteps } from "@/components/new-project/progress-steps"
import { SportSelection } from "@/components/new-project/sport-selection"
import { LevelSelection } from "@/components/new-project/level-selection"
import { RoutineTypeSelection } from "@/components/new-project/routine-type-selection"
import { RoutineLengthSelection } from "@/components/new-project/routine-length-selection"
import { MusicMoodSelection } from "@/components/new-project/music-mood-selection"
import { OptionalSettings } from "@/components/new-project/optional-settings"
import { ProjectSummary } from "@/components/new-project/project-summary"
import { ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"

export interface ProjectConfig {
  sport: string | null
  level: string | null
  routineType: string | null
  length: string | null
  moods: string[]
  bpmRange: [number, number]
  musicKey: string
  voiceover: boolean
  aiSuggestions: boolean
}

export default function NewProjectPage() {
  const [config, setConfig] = useState<ProjectConfig>({
    sport: null,
    level: null,
    routineType: null,
    length: null,
    moods: [],
    bpmRange: [120, 140],
    musicKey: "Any",
    voiceover: false,
    aiSuggestions: true,
  })

  const updateConfig = <K extends keyof ProjectConfig>(key: K, value: ProjectConfig[K]) => {
    setConfig((prev) => ({ ...prev, [key]: value }))
  }

  const isValid = config.sport && config.level && config.routineType && config.length

  return (
    <div className="flex min-h-screen bg-background">
      {/* Sidebar */}
      <Sidebar activePage="new-project" />

      {/* Main Content */}
      <div className="flex flex-1 flex-col">
        {/* Header */}
        <NewProjectHeader />

        {/* New Project Content */}
        <main className="relative flex-1 overflow-auto custom-scrollbar">
          {/* Waveform Background Accents */}
          <div className="pointer-events-none absolute inset-0 overflow-hidden">
            <svg
              className="absolute -right-20 -top-10 h-64 w-96 opacity-[0.03] waveform-accent"
              viewBox="0 0 200 80"
              preserveAspectRatio="none"
            >
              <path
                d="M0,40 Q10,20 20,40 Q30,60 40,40 Q50,20 60,40 Q70,60 80,40 Q90,20 100,40 Q110,60 120,40 Q130,20 140,40 Q150,60 160,40 Q170,20 180,40 Q190,60 200,40"
                fill="none"
                stroke="url(#wave-gradient-np-1)"
                strokeWidth="3"
              />
              <defs>
                <linearGradient id="wave-gradient-np-1" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#FF4DA6" />
                  <stop offset="100%" stopColor="#00C896" />
                </linearGradient>
              </defs>
            </svg>

            <svg
              className="absolute -bottom-10 -left-20 h-48 w-80 opacity-[0.03] waveform-accent"
              viewBox="0 0 200 60"
              preserveAspectRatio="none"
              style={{ animationDelay: "2s" }}
            >
              <path
                d="M0,30 Q10,15 20,30 Q30,45 40,30 Q50,15 60,30 Q70,45 80,30 Q90,15 100,30 Q110,45 120,30 Q130,15 140,30 Q150,45 160,30 Q170,15 180,30 Q190,45 200,30"
                fill="none"
                stroke="url(#wave-gradient-np-2)"
                strokeWidth="2"
              />
              <defs>
                <linearGradient id="wave-gradient-np-2" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#3D8BFF" />
                  <stop offset="100%" stopColor="#00C896" />
                </linearGradient>
              </defs>
            </svg>
          </div>

          {/* Content */}
          <div className="relative px-4 py-6 lg:px-6 lg:py-8">
            <div className="mx-auto max-w-7xl">
              {/* Page Title & Progress */}
              <div className="mb-8">
                <h1 className="mb-2 text-2xl font-semibold text-foreground lg:text-3xl">
                  New Project
                </h1>
                <p className="text-muted-foreground">
                  Set up your routine in just a few steps
                </p>
              </div>

              {/* Progress Steps */}
              <ProgressSteps currentStep={1} />

              {/* Main Layout */}
              <div className="mt-8 grid gap-6 lg:grid-cols-3">
                {/* Left Column - Setup Options */}
                <div className="space-y-6 lg:col-span-2">
                  {/* Sport Selection */}
                  <SportSelection
                    selected={config.sport}
                    onSelect={(sport) => updateConfig("sport", sport)}
                  />

                  {/* Level Selection */}
                  <LevelSelection
                    selected={config.level}
                    onSelect={(level) => updateConfig("level", level)}
                  />

                  {/* Routine Type */}
                  <RoutineTypeSelection
                    selected={config.routineType}
                    onSelect={(type) => updateConfig("routineType", type)}
                  />

                  {/* Routine Length */}
                  <RoutineLengthSelection
                    selected={config.length}
                    onSelect={(length) => updateConfig("length", length)}
                  />

                  {/* Music Mood */}
                  <MusicMoodSelection
                    selected={config.moods}
                    onSelect={(moods) => updateConfig("moods", moods)}
                  />

                  {/* Optional Settings */}
                  <OptionalSettings
                    config={config}
                    onUpdate={updateConfig}
                  />
                </div>

                {/* Right Column - Project Summary */}
                <div className="lg:sticky lg:top-6 lg:self-start">
                  <ProjectSummary config={config} />
                </div>
              </div>

              {/* Continue Button */}
              <div className="mt-8 flex justify-end">
                <Button
                  size="lg"
                  disabled={!isValid}
                  className="group relative overflow-hidden bg-gradient-to-r from-eqho-pink via-eqho-green to-eqho-blue px-8 py-6 text-base font-semibold text-white transition-all duration-300 hover:shadow-lg hover:shadow-eqho-pink/25 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <span className="relative z-10 flex items-center gap-2">
                    Continue to Upload
                    <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
                  </span>
                  <div className="absolute inset-0 bg-gradient-to-r from-eqho-pink via-eqho-blue to-eqho-green opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                </Button>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
