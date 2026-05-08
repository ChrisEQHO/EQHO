"use client"

import { useState } from "react"
import { AuthBranding } from "@/components/auth/auth-branding"
import { SignInCard } from "@/components/auth/sign-in-card"
import { SignUpCard } from "@/components/auth/sign-up-card"
import { OnboardingFlow } from "@/components/auth/onboarding-flow"

export default function AuthPage() {
  const [view, setView] = useState<"signin" | "signup" | "onboarding">("signin")
  const [onboardingStep, setOnboardingStep] = useState(1)

  const handleSignUp = () => {
    setView("onboarding")
    setOnboardingStep(1)
  }

  return (
    <div className="min-h-screen bg-eqho-navy flex">
      {/* Left Side - Branding */}
      <AuthBranding />

      {/* Right Side - Auth Cards */}
      <div className="flex-1 flex items-center justify-center p-6 lg:p-12">
        <div className="w-full max-w-md">
          {view === "signin" && (
            <SignInCard onSwitchToSignUp={() => setView("signup")} />
          )}
          {view === "signup" && (
            <SignUpCard 
              onSwitchToSignIn={() => setView("signin")} 
              onSignUp={handleSignUp}
            />
          )}
          {view === "onboarding" && (
            <OnboardingFlow 
              step={onboardingStep} 
              setStep={setOnboardingStep}
            />
          )}
        </div>
      </div>
    </div>
  )
}
