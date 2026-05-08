"use client"

import { Check, Settings, Upload, Sparkles, Eye } from "lucide-react"
import { cn } from "@/lib/utils"

interface ProgressStepsProps {
  currentStep: number
}

const steps = [
  { id: 1, label: "Routine Setup", icon: Settings },
  { id: 2, label: "Upload Music", icon: Upload },
  { id: 3, label: "AI Assist", icon: Sparkles },
  { id: 4, label: "Review & Create", icon: Eye },
]

export function ProgressSteps({ currentStep }: ProgressStepsProps) {
  return (
    <div className="rounded-xl border border-border/50 bg-card/50 p-4 backdrop-blur-sm lg:p-6">
      <div className="flex items-center justify-between">
        {steps.map((step, index) => (
          <div key={step.id} className="flex items-center">
            {/* Step */}
            <div className="flex flex-col items-center gap-2">
              <div
                className={cn(
                  "relative flex h-10 w-10 items-center justify-center rounded-full border-2 transition-all duration-300 lg:h-12 lg:w-12",
                  step.id < currentStep
                    ? "border-eqho-green bg-eqho-green/10 text-eqho-green"
                    : step.id === currentStep
                      ? "border-eqho-blue bg-eqho-blue/10 text-eqho-blue shadow-lg shadow-eqho-blue/20"
                      : "border-border/50 bg-card text-muted-foreground"
                )}
              >
                {step.id < currentStep ? (
                  <Check className="h-5 w-5 lg:h-6 lg:w-6" />
                ) : (
                  <step.icon className="h-5 w-5 lg:h-6 lg:w-6" />
                )}
                {step.id === currentStep && (
                  <span className="absolute -inset-1 animate-pulse rounded-full border border-eqho-blue/50" />
                )}
              </div>
              <span
                className={cn(
                  "text-center text-xs font-medium transition-colors lg:text-sm",
                  step.id === currentStep
                    ? "text-foreground"
                    : step.id < currentStep
                      ? "text-eqho-green"
                      : "text-muted-foreground"
                )}
              >
                <span className="hidden sm:inline">{step.label}</span>
                <span className="sm:hidden">{step.id}</span>
              </span>
            </div>

            {/* Connector Line */}
            {index < steps.length - 1 && (
              <div
                className={cn(
                  "mx-2 h-0.5 flex-1 transition-all duration-500 lg:mx-4",
                  step.id < currentStep
                    ? "bg-gradient-to-r from-eqho-green to-eqho-green"
                    : step.id === currentStep
                      ? "bg-gradient-to-r from-eqho-blue/50 to-border/50"
                      : "bg-border/50"
                )}
                style={{ minWidth: "2rem" }}
              />
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
