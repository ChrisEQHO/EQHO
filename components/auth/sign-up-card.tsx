"use client"

import { useState } from "react"
import { Eye, EyeOff, Mail, Lock, User } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { cn } from "@/lib/utils"

interface SignUpCardProps {
  onSwitchToSignIn: () => void
  onSignUp: () => void
}

const roles = [
  { id: "coach", label: "Coach", description: "Team or gym coach" },
  { id: "athlete", label: "Athlete", description: "Competitor" },
  { id: "choreographer", label: "Choreographer", description: "Routine creator" },
  { id: "gym-owner", label: "Gym Owner", description: "Business owner" },
]

export function SignUpCard({ onSwitchToSignIn, onSignUp }: SignUpCardProps) {
  const [showPassword, setShowPassword] = useState(false)
  const [fullName, setFullName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [selectedRole, setSelectedRole] = useState<string | null>(null)
  const [agreedToTerms, setAgreedToTerms] = useState(false)

  const handleSignUp = (e: React.FormEvent) => {
    e.preventDefault()
    onSignUp()
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-2 text-center lg:text-left">
        {/* Mobile Logo */}
        <div className="flex items-center justify-center lg:hidden gap-2 mb-6">
          <div className="flex items-center justify-center h-10 w-10 rounded-xl bg-gradient-to-br from-eqho-pink via-eqho-green to-eqho-blue">
            <span className="text-lg font-bold text-white">EQ</span>
          </div>
          <span className="text-2xl font-bold text-white">EQHO</span>
        </div>
        <h2 className="text-3xl font-bold text-white">Create your account</h2>
        <p className="text-muted-foreground">Start creating competition music for free</p>
      </div>

      {/* Social Sign Up */}
      <div className="grid grid-cols-2 gap-3">
        <Button
          variant="outline"
          className="gap-2 h-11 border-white/10 bg-white/5 text-white hover:bg-white/10 transition-all"
        >
          <svg className="h-4 w-4" viewBox="0 0 24 24">
            <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          Google
        </Button>
        <Button
          variant="outline"
          className="gap-2 h-11 border-white/10 bg-white/5 text-white hover:bg-white/10 transition-all"
        >
          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
            <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
          </svg>
          Apple
        </Button>
      </div>

      {/* Divider */}
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-white/10" />
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="bg-eqho-navy px-4 text-muted-foreground">or continue with email</span>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSignUp} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="fullName" className="text-sm font-medium text-foreground">
            Full Name
          </Label>
          <div className="relative">
            <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              id="fullName"
              type="text"
              placeholder="John Smith"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="pl-10 h-11 bg-white/5 border-white/10 text-white placeholder:text-muted-foreground focus:border-eqho-blue focus:ring-eqho-blue/20"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="signupEmail" className="text-sm font-medium text-foreground">
            Email
          </Label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              id="signupEmail"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="pl-10 h-11 bg-white/5 border-white/10 text-white placeholder:text-muted-foreground focus:border-eqho-blue focus:ring-eqho-blue/20"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="signupPassword" className="text-sm font-medium text-foreground">
            Password
          </Label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              id="signupPassword"
              type={showPassword ? "text" : "password"}
              placeholder="Create a password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="pl-10 pr-10 h-11 bg-white/5 border-white/10 text-white placeholder:text-muted-foreground focus:border-eqho-blue focus:ring-eqho-blue/20"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>

        {/* Role Selection */}
        <div className="space-y-2">
          <Label className="text-sm font-medium text-foreground">I am a...</Label>
          <div className="grid grid-cols-2 gap-2">
            {roles.map((role) => (
              <button
                key={role.id}
                type="button"
                onClick={() => setSelectedRole(role.id)}
                className={cn(
                  "flex flex-col items-start p-3 rounded-lg border transition-all text-left",
                  selectedRole === role.id
                    ? "border-eqho-blue bg-eqho-blue/10 shadow-md shadow-eqho-blue/10"
                    : "border-white/10 bg-white/5 hover:border-white/20 hover:bg-white/10"
                )}
              >
                <span className="font-medium text-white text-sm">{role.label}</span>
                <span className="text-xs text-muted-foreground">{role.description}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Terms */}
        <div className="flex items-start gap-2">
          <Checkbox
            id="terms"
            checked={agreedToTerms}
            onCheckedChange={(checked) => setAgreedToTerms(checked as boolean)}
            className="mt-0.5 border-white/20 data-[state=checked]:bg-eqho-blue data-[state=checked]:border-eqho-blue"
          />
          <Label htmlFor="terms" className="text-sm text-muted-foreground cursor-pointer leading-tight">
            I agree to the{" "}
            <a href="#" className="text-eqho-blue hover:underline">Terms of Service</a>
            {" "}and{" "}
            <a href="#" className="text-eqho-blue hover:underline">Privacy Policy</a>
          </Label>
        </div>

        <Button
          type="submit"
          className="w-full h-12 bg-gradient-to-r from-eqho-pink to-eqho-blue text-white font-semibold shadow-lg shadow-eqho-pink/20 hover:opacity-90 hover:shadow-xl hover:shadow-eqho-pink/30 transition-all"
        >
          Create Free Account
        </Button>
      </form>

      {/* Sign In Link */}
      <p className="text-center text-sm text-muted-foreground">
        Already have an account?{" "}
        <button
          onClick={onSwitchToSignIn}
          className="text-eqho-blue hover:text-eqho-blue/80 font-medium transition-colors"
        >
          Sign in
        </button>
      </p>
    </div>
  )
}
