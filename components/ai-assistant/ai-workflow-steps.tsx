"use client"

import { Upload, BarChart3, Scissors, CheckCircle2, Download, ArrowRight } from "lucide-react"
import { cn } from "@/lib/utils"

const workflowSteps = [
  {
    icon: Upload,
    title: "Upload Music",
    description: "Import your audio files",
    status: "complete",
    color: "eqho-pink",
  },
  {
    icon: BarChart3,
    title: "AI Analyses",
    description: "BPM & structure detection",
    status: "complete",
    color: "eqho-green",
  },
  {
    icon: Scissors,
    title: "AI Suggests Cuts",
    description: "Smart edit recommendations",
    status: "active",
    color: "eqho-blue",
  },
  {
    icon: CheckCircle2,
    title: "User Approves",
    description: "Review and approve changes",
    status: "pending",
    color: "eqho-pink",
  },
  {
    icon: Download,
    title: "Export Final",
    description: "Competition-ready routine",
    status: "pending",
    color: "eqho-green",
  },
]

export function AIWorkflowSteps() {
  return (
    <div className="rounded-xl border border-border/50 bg-card/50 p-5 backdrop-blur-sm">
      <h2 className="mb-6 text-lg font-semibold text-foreground">AI Music Editing Workflow</h2>

      {/* Desktop View */}
      <div className="hidden md:flex items-start justify-between gap-2">
        {workflowSteps.map((step, index) => (
          <div key={step.title} className="flex items-start flex-1">
            <div className="flex flex-col items-center text-center flex-1">
              {/* Step Circle */}
              <div
                className={cn(
                  "relative flex h-14 w-14 items-center justify-center rounded-2xl border-2 transition-all duration-300",
                  step.status === "complete" && "border-eqho-green bg-eqho-green/10",
                  step.status === "active" && `border-${step.color} bg-${step.color}/10 shadow-lg shadow-${step.color}/20`,
                  step.status === "pending" && "border-border/50 bg-secondary/30"
                )}
                style={step.status === "active" ? {
                  boxShadow: step.color === "eqho-blue" ? "0 0 20px rgba(61, 139, 255, 0.3)" : "0 0 20px rgba(255, 77, 166, 0.3)"
                } : {}}
              >
                <step.icon
                  className={cn(
                    "h-6 w-6 transition-colors duration-300",
                    step.status === "complete" && "text-eqho-green",
                    step.status === "active" && (
                      step.color === "eqho-pink" ? "text-eqho-pink" :
                      step.color === "eqho-green" ? "text-eqho-green" : "text-eqho-blue"
                    ),
                    step.status === "pending" && "text-muted-foreground"
                  )}
                />
                {step.status === "active" && (
                  <div className="absolute -inset-1 rounded-2xl bg-gradient-to-r from-eqho-pink via-eqho-green to-eqho-blue opacity-20 blur-sm animate-pulse" />
                )}
              </div>

              {/* Step Info */}
              <h3 className={cn(
                "mt-3 text-sm font-medium",
                step.status === "pending" ? "text-muted-foreground" : "text-foreground"
              )}>
                {step.title}
              </h3>
              <p className="mt-1 text-xs text-muted-foreground max-w-[100px]">
                {step.description}
              </p>
            </div>

            {/* Arrow */}
            {index < workflowSteps.length - 1 && (
              <div className="flex items-center pt-5 px-1">
                <ArrowRight className={cn(
                  "h-5 w-5",
                  workflowSteps[index + 1].status !== "pending" ? "text-eqho-green" : "text-border"
                )} />
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Mobile View */}
      <div className="flex flex-col gap-3 md:hidden">
        {workflowSteps.map((step, index) => (
          <div
            key={step.title}
            className={cn(
              "flex items-center gap-4 rounded-lg border p-3 transition-all duration-200",
              step.status === "complete" && "border-eqho-green/30 bg-eqho-green/5",
              step.status === "active" && "border-eqho-blue/30 bg-eqho-blue/5",
              step.status === "pending" && "border-border/30 bg-secondary/20"
            )}
          >
            <div
              className={cn(
                "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl",
                step.status === "complete" && "bg-eqho-green/20",
                step.status === "active" && "bg-eqho-blue/20",
                step.status === "pending" && "bg-secondary/50"
              )}
            >
              <step.icon
                className={cn(
                  "h-5 w-5",
                  step.status === "complete" && "text-eqho-green",
                  step.status === "active" && "text-eqho-blue",
                  step.status === "pending" && "text-muted-foreground"
                )}
              />
            </div>
            <div className="flex-1">
              <h3 className={cn(
                "text-sm font-medium",
                step.status === "pending" ? "text-muted-foreground" : "text-foreground"
              )}>
                {step.title}
              </h3>
              <p className="text-xs text-muted-foreground">{step.description}</p>
            </div>
            {step.status === "complete" && (
              <CheckCircle2 className="h-5 w-5 text-eqho-green" />
            )}
            {step.status === "active" && (
              <div className="h-2 w-2 rounded-full bg-eqho-blue animate-pulse" />
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
