"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { 
  Check, 
  ChevronRight, 
  Sparkles, 
  Music, 
  Users, 
  Wand2,
  Crown,
  ArrowRight
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"

interface OnboardingFlowProps {
  step: number
  setStep: (step: number) => void
}

const sports = [
  { id: "cheer", label: "Cheerleading", icon: "📣", color: "eqho-pink" },
  { id: "gymnastics", label: "Gymnastics", icon: "🤸", color: "eqho-green" },
  { id: "dance", label: "Dance", icon: "💃", color: "eqho-blue" },
  { id: "acro", label: "Acro", icon: "🎪", color: "eqho-pink" },
]

const goals = [
  { id: "create", label: "Create routine music", description: "Build new routines from scratch", icon: Music },
  { id: "edit", label: "Edit existing music", description: "Trim, cut, and enhance audio", icon: Wand2 },
  { id: "ai", label: "AI-generated routines", description: "Let AI help create your music", icon: Sparkles },
  { id: "collaborate", label: "Team collaboration", description: "Share and review with others", icon: Users },
]

const plans = [
  {
    id: "free",
    name: "Free",
    price: "$0",
    period: "forever",
    description: "Perfect for trying EQHO",
    features: ["3 projects", "Basic editing tools", "MP3 export", "Community templates"],
    cta: "Start Free"
  },
  {
    id: "pro",
    name: "Pro",
    price: "$19",
    period: "/month",
    description: "For serious creators",
    features: ["Unlimited projects", "AI-powered editing", "WAV/FLAC export", "Priority support", "Team sharing", "Custom templates"],
    cta: "Start Pro Trial",
    popular: true
  }
]

export function OnboardingFlow({ step, setStep }: OnboardingFlowProps) {
  const router = useRouter()
  const [selectedSport, setSelectedSport] = useState<string | null>(null)
  const [selectedGoals, setSelectedGoals] = useState<string[]>([])
  const [selectedPlan, setSelectedPlan] = useState<string>("free")
  const [projectName, setProjectName] = useState("")

  const toggleGoal = (goalId: string) => {
    setSelectedGoals(prev => 
      prev.includes(goalId) 
        ? prev.filter(g => g !== goalId)
        : [...prev, goalId]
    )
  }

  const handleComplete = () => {
    router.push("/")
  }

  const steps = [
    { number: 1, label: "Sport" },
    { number: 2, label: "Goals" },
    { number: 3, label: "Plan" },
    { number: 4, label: "Project" },
  ]

  return (
    <div className="space-y-8">
      {/* Progress Steps */}
      <div className="flex items-center justify-between">
        {steps.map((s, i) => (
          <div key={s.number} className="flex items-center">
            <div className="flex flex-col items-center">
              <div 
                className={cn(
                  "flex h-10 w-10 items-center justify-center rounded-full border-2 transition-all",
                  step > s.number 
                    ? "border-eqho-green bg-eqho-green text-white"
                    : step === s.number
                    ? "border-eqho-blue bg-eqho-blue/20 text-eqho-blue"
                    : "border-white/20 bg-white/5 text-muted-foreground"
                )}
              >
                {step > s.number ? (
                  <Check className="h-5 w-5" />
                ) : (
                  <span className="text-sm font-semibold">{s.number}</span>
                )}
              </div>
              <span className={cn(
                "mt-2 text-xs font-medium",
                step >= s.number ? "text-foreground" : "text-muted-foreground"
              )}>
                {s.label}
              </span>
            </div>
            {i < steps.length - 1 && (
              <div className={cn(
                "h-0.5 w-8 sm:w-12 mx-2 transition-colors",
                step > s.number ? "bg-eqho-green" : "bg-white/10"
              )} />
            )}
          </div>
        ))}
      </div>

      {/* Step Content */}
      <div className="min-h-[320px]">
        {/* Step 1: Select Sport */}
        {step === 1 && (
          <div className="space-y-6">
            <div className="text-center lg:text-left">
              <h2 className="text-2xl font-bold text-white">What sport do you create music for?</h2>
              <p className="mt-1 text-muted-foreground">{"We'll customize your experience"}</p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {sports.map((sport) => (
                <button
                  key={sport.id}
                  onClick={() => setSelectedSport(sport.id)}
                  className={cn(
                    "flex flex-col items-center gap-3 p-6 rounded-xl border transition-all hover-lift",
                    selectedSport === sport.id
                      ? `border-${sport.color} bg-${sport.color}/10 shadow-lg shadow-${sport.color}/20`
                      : "border-white/10 bg-white/5 hover:border-white/20"
                  )}
                >
                  <span className="text-4xl">{sport.icon}</span>
                  <span className={cn(
                    "font-semibold",
                    selectedSport === sport.id ? "text-white" : "text-muted-foreground"
                  )}>
                    {sport.label}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 2: Select Goals */}
        {step === 2 && (
          <div className="space-y-6">
            <div className="text-center lg:text-left">
              <h2 className="text-2xl font-bold text-white">What do you want to do?</h2>
              <p className="mt-1 text-muted-foreground">Select all that apply</p>
            </div>
            <div className="space-y-3">
              {goals.map((goal) => (
                <button
                  key={goal.id}
                  onClick={() => toggleGoal(goal.id)}
                  className={cn(
                    "flex items-center gap-4 w-full p-4 rounded-xl border transition-all text-left hover-lift",
                    selectedGoals.includes(goal.id)
                      ? "border-eqho-blue bg-eqho-blue/10 shadow-md shadow-eqho-blue/10"
                      : "border-white/10 bg-white/5 hover:border-white/20"
                  )}
                >
                  <div className={cn(
                    "flex h-10 w-10 items-center justify-center rounded-lg transition-colors",
                    selectedGoals.includes(goal.id)
                      ? "bg-eqho-blue text-white"
                      : "bg-white/10 text-muted-foreground"
                  )}>
                    <goal.icon className="h-5 w-5" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-white">{goal.label}</p>
                    <p className="text-sm text-muted-foreground">{goal.description}</p>
                  </div>
                  <div className={cn(
                    "flex h-6 w-6 items-center justify-center rounded-full border-2 transition-colors",
                    selectedGoals.includes(goal.id)
                      ? "border-eqho-green bg-eqho-green"
                      : "border-white/20"
                  )}>
                    {selectedGoals.includes(goal.id) && (
                      <Check className="h-4 w-4 text-white" />
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 3: Choose Plan */}
        {step === 3 && (
          <div className="space-y-6">
            <div className="text-center lg:text-left">
              <h2 className="text-2xl font-bold text-white">Choose your plan</h2>
              <p className="mt-1 text-muted-foreground">You can upgrade anytime</p>
            </div>
            <div className="grid gap-4">
              {plans.map((plan) => (
                <button
                  key={plan.id}
                  onClick={() => setSelectedPlan(plan.id)}
                  className={cn(
                    "relative p-5 rounded-xl border text-left transition-all hover-lift",
                    selectedPlan === plan.id
                      ? plan.popular
                        ? "border-eqho-pink bg-gradient-to-br from-eqho-pink/10 to-eqho-blue/10 shadow-lg shadow-eqho-pink/20"
                        : "border-eqho-blue bg-eqho-blue/10 shadow-lg shadow-eqho-blue/20"
                      : "border-white/10 bg-white/5 hover:border-white/20"
                  )}
                >
                  {plan.popular && (
                    <div className="absolute -top-3 left-4 px-3 py-1 rounded-full bg-gradient-to-r from-eqho-pink to-eqho-blue text-xs font-semibold text-white">
                      Most Popular
                    </div>
                  )}
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        {plan.popular && <Crown className="h-4 w-4 text-eqho-pink" />}
                        <h3 className="font-semibold text-white">{plan.name}</h3>
                      </div>
                      <p className="text-sm text-muted-foreground">{plan.description}</p>
                    </div>
                    <div className="text-right">
                      <span className="text-2xl font-bold text-white">{plan.price}</span>
                      <span className="text-muted-foreground">{plan.period}</span>
                    </div>
                  </div>
                  <ul className="mt-4 grid grid-cols-2 gap-2">
                    {plan.features.map((feature) => (
                      <li key={feature} className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Check className="h-4 w-4 text-eqho-green" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 4: Create First Project */}
        {step === 4 && (
          <div className="space-y-6">
            <div className="text-center lg:text-left">
              <h2 className="text-2xl font-bold text-white">Create your first project</h2>
              <p className="mt-1 text-muted-foreground">{"Let's get started with your first routine"}</p>
            </div>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="projectName" className="text-sm font-medium text-foreground">
                  Project Name
                </Label>
                <Input
                  id="projectName"
                  type="text"
                  placeholder="e.g., Nationals 2026 Floor Routine"
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value)}
                  className="h-12 bg-white/5 border-white/10 text-white placeholder:text-muted-foreground focus:border-eqho-blue focus:ring-eqho-blue/20"
                />
              </div>
              
              {/* Quick Start Options */}
              <div className="space-y-2">
                <Label className="text-sm font-medium text-foreground">Quick Start</Label>
                <div className="grid grid-cols-2 gap-3">
                  <button className="p-4 rounded-xl border border-white/10 bg-white/5 hover:border-eqho-pink/50 hover:bg-eqho-pink/5 transition-all text-left group">
                    <Music className="h-6 w-6 text-eqho-pink mb-2 group-hover:scale-110 transition-transform" />
                    <p className="font-medium text-white text-sm">Upload Music</p>
                    <p className="text-xs text-muted-foreground">Start with your audio</p>
                  </button>
                  <button className="p-4 rounded-xl border border-white/10 bg-white/5 hover:border-eqho-blue/50 hover:bg-eqho-blue/5 transition-all text-left group">
                    <Sparkles className="h-6 w-6 text-eqho-blue mb-2 group-hover:scale-110 transition-transform" />
                    <p className="font-medium text-white text-sm">Use Template</p>
                    <p className="text-xs text-muted-foreground">Browse pre-built routines</p>
                  </button>
                </div>
              </div>

              {/* Preview Card */}
              <div className="glass-panel rounded-xl p-4 space-y-3">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-eqho-pink to-eqho-blue flex items-center justify-center">
                    <Music className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <p className="font-medium text-white">{projectName || "Your Project"}</p>
                    <p className="text-xs text-muted-foreground">
                      {selectedSport ? sports.find(s => s.id === selectedSport)?.label : "Sport"} • New Project
                    </p>
                  </div>
                </div>
                <div className="h-8 rounded-lg bg-white/5 flex items-center px-3">
                  <div className="h-3 w-full rounded bg-white/10" />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Navigation Buttons */}
      <div className="flex items-center justify-between pt-4">
        <Button
          variant="ghost"
          onClick={() => setStep(Math.max(1, step - 1))}
          disabled={step === 1}
          className="text-muted-foreground hover:text-white disabled:opacity-30"
        >
          Back
        </Button>
        
        {step < 4 ? (
          <Button
            onClick={() => setStep(step + 1)}
            disabled={
              (step === 1 && !selectedSport) ||
              (step === 2 && selectedGoals.length === 0)
            }
            className="gap-2 bg-gradient-to-r from-eqho-pink to-eqho-blue text-white shadow-lg shadow-eqho-pink/20 hover:opacity-90 hover:shadow-xl disabled:opacity-50"
          >
            Continue
            <ChevronRight className="h-4 w-4" />
          </Button>
        ) : (
          <Button
            onClick={handleComplete}
            className="gap-2 bg-gradient-to-r from-eqho-pink to-eqho-blue text-white shadow-lg shadow-eqho-pink/20 hover:opacity-90 hover:shadow-xl hover:shadow-eqho-pink/30 hover:scale-105 transition-all"
          >
            Go to Dashboard
            <ArrowRight className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  )
}
