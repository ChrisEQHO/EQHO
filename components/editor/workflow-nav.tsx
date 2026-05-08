"use client"

import { Upload, Pencil, Sparkles, Download } from "lucide-react"
import { cn } from "@/lib/utils"

const workflowSteps = [
  { id: "upload" as const, label: "Upload", icon: Upload },
  { id: "edit" as const, label: "Edit", icon: Pencil },
  { id: "ai-assist" as const, label: "AI Assist", icon: Sparkles },
  { id: "export" as const, label: "Export", icon: Download },
]

interface WorkflowNavProps {
  active: "upload" | "edit" | "ai-assist" | "export"
  onChange: (step: "upload" | "edit" | "ai-assist" | "export") => void
}

export function WorkflowNav({ active, onChange }: WorkflowNavProps) {
  return (
    <div className="flex items-center justify-center border-b border-border/50 bg-card/30 px-4 py-2">
      <div className="flex items-center gap-1 rounded-lg bg-secondary/50 p-1">
        {workflowSteps.map((step, index) => (
          <div key={step.id} className="flex items-center">
            <button
              onClick={() => onChange(step.id)}
              className={cn(
                "flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-all duration-200",
                active === step.id
                  ? "bg-gradient-to-r from-eqho-pink/20 to-eqho-blue/20 text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground hover:bg-secondary"
              )}
            >
              <step.icon
                className={cn(
                  "h-4 w-4 transition-colors",
                  active === step.id && "text-eqho-blue"
                )}
              />
              <span className="hidden sm:inline">{step.label}</span>
            </button>
            {index < workflowSteps.length - 1 && (
              <div className="mx-1 h-4 w-px bg-border/30" />
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
