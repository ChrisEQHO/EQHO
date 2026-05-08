"use client"

import { useState } from "react"
import { FolderOpen, Plus, ChevronDown, Clock, Users, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

const existingProjects = [
  { id: 1, name: "Floor Routine - Nationals", sport: "Gymnastics", lastEdited: "2 hours ago" },
  { id: 2, name: "Beam Routine", sport: "Gymnastics", lastEdited: "1 day ago" },
  { id: 3, name: "Cheer Mix 2024", sport: "Cheerleading", lastEdited: "3 days ago" },
]

const sports = ["Gymnastics", "Cheerleading", "Figure Skating", "Dance", "Synchronized Swimming"]
const routineLengths = ["1:00", "1:30", "2:00", "2:30", "3:00", "Custom"]
const templates = ["Competition Standard", "High Energy", "Dramatic Build", "Classic Flow", "None"]

export function ProjectAssignment() {
  const [selectedProject, setSelectedProject] = useState<number | null>(null)
  const [createNew, setCreateNew] = useState(false)
  const [selectedSport, setSelectedSport] = useState<string | null>(null)
  const [selectedLength, setSelectedLength] = useState<string | null>(null)
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null)

  return (
    <div className="sticky top-8 space-y-6">
      {/* Attach to Existing Project */}
      <div className="glass-panel rounded-xl p-5">
        <div className="mb-4 flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-eqho-blue/10">
            <FolderOpen className="h-4 w-4 text-eqho-blue" />
          </div>
          <h3 className="font-semibold text-foreground">Attach to Project</h3>
        </div>

        <div className="space-y-2">
          {existingProjects.map((project) => (
            <button
              key={project.id}
              onClick={() => {
                setSelectedProject(project.id)
                setCreateNew(false)
              }}
              className={cn(
                "w-full rounded-lg border p-3 text-left transition-all duration-200",
                selectedProject === project.id
                  ? "border-eqho-blue bg-eqho-blue/10 shadow-sm shadow-eqho-blue/20"
                  : "border-border/30 bg-card/30 hover:border-eqho-blue/30 hover:bg-card/50"
              )}
            >
              <p className="font-medium text-foreground">{project.name}</p>
              <div className="mt-1 flex items-center gap-3 text-xs text-muted-foreground">
                <span>{project.sport}</span>
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {project.lastEdited}
                </span>
              </div>
            </button>
          ))}
        </div>

        <div className="relative my-4">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-border/50" />
          </div>
          <div className="relative flex justify-center text-xs">
            <span className="bg-card px-2 text-muted-foreground">or</span>
          </div>
        </div>

        <Button
          onClick={() => {
            setCreateNew(true)
            setSelectedProject(null)
          }}
          variant={createNew ? "default" : "outline"}
          className={cn(
            "w-full gap-2",
            createNew
              ? "bg-gradient-to-r from-eqho-pink to-eqho-blue text-white"
              : "border-border/50 hover:border-eqho-green/50"
          )}
        >
          <Plus className="h-4 w-4" />
          Create New Project
        </Button>
      </div>

      {/* New Project Options */}
      {createNew && (
        <div className="glass-panel rounded-xl p-5 space-y-5">
          {/* Sport Selection */}
          <div>
            <label className="mb-2 flex items-center gap-2 text-sm font-medium text-foreground">
              <Users className="h-4 w-4 text-eqho-pink" />
              Sport
            </label>
            <div className="flex flex-wrap gap-2">
              {sports.map((sport) => (
                <button
                  key={sport}
                  onClick={() => setSelectedSport(sport)}
                  className={cn(
                    "rounded-full px-3 py-1.5 text-xs font-medium transition-all duration-200",
                    selectedSport === sport
                      ? "bg-eqho-pink text-white shadow-sm shadow-eqho-pink/30"
                      : "bg-secondary text-muted-foreground hover:bg-secondary/80 hover:text-foreground"
                  )}
                >
                  {sport}
                </button>
              ))}
            </div>
          </div>

          {/* Routine Length */}
          <div>
            <label className="mb-2 flex items-center gap-2 text-sm font-medium text-foreground">
              <Clock className="h-4 w-4 text-eqho-green" />
              Routine Length
            </label>
            <div className="flex flex-wrap gap-2">
              {routineLengths.map((length) => (
                <button
                  key={length}
                  onClick={() => setSelectedLength(length)}
                  className={cn(
                    "rounded-lg px-3 py-1.5 text-xs font-medium transition-all duration-200",
                    selectedLength === length
                      ? "bg-eqho-green text-white shadow-sm shadow-eqho-green/30"
                      : "bg-secondary text-muted-foreground hover:bg-secondary/80 hover:text-foreground"
                  )}
                >
                  {length}
                </button>
              ))}
            </div>
          </div>

          {/* Template */}
          <div>
            <label className="mb-2 flex items-center gap-2 text-sm font-medium text-foreground">
              <Sparkles className="h-4 w-4 text-eqho-blue" />
              Template
            </label>
            <div className="relative">
              <select
                value={selectedTemplate || ""}
                onChange={(e) => setSelectedTemplate(e.target.value)}
                className="w-full appearance-none rounded-lg border border-border/50 bg-card/50 px-3 py-2.5 text-sm text-foreground focus:border-eqho-blue focus:outline-none focus:ring-1 focus:ring-eqho-blue"
              >
                <option value="">Select a template</option>
                {templates.map((template) => (
                  <option key={template} value={template}>
                    {template}
                  </option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            </div>
          </div>

          {/* Create Button */}
          <Button className="w-full gap-2 bg-gradient-to-r from-eqho-pink to-eqho-blue text-white shadow-lg shadow-eqho-pink/20 transition-all duration-200 hover:opacity-90 hover:shadow-xl hover:shadow-eqho-pink/30">
            Create Project
          </Button>
        </div>
      )}

      {/* Quick Tips */}
      <div className="rounded-xl border border-eqho-blue/20 bg-eqho-blue/5 p-4">
        <h4 className="mb-2 flex items-center gap-2 text-sm font-medium text-eqho-blue">
          <Sparkles className="h-4 w-4" />
          Pro Tip
        </h4>
        <p className="text-xs text-muted-foreground">
          Attach your music to a project to unlock AI-powered suggestions specific to your sport and routine length.
        </p>
      </div>
    </div>
  )
}
