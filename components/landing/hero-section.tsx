"use client"

import Link from "next/link"
import { Play, ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"

export function HeroSection() {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-16">
      {/* Animated Background */}
      <div className="absolute inset-0">
        {/* Gradient Orbs */}
        <div className="absolute top-1/4 left-1/4 h-[500px] w-[500px] rounded-full bg-eqho-pink/20 blur-[120px] animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 h-[400px] w-[400px] rounded-full bg-eqho-blue/20 blur-[100px] animate-pulse" style={{ animationDelay: "1s" }} />
        <div className="absolute top-1/2 left-1/2 h-[300px] w-[300px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-eqho-green/15 blur-[80px] animate-pulse" style={{ animationDelay: "2s" }} />
        
        {/* Grid Pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:64px_64px]" />
        
        {/* Waveform Lines */}
        <svg className="absolute bottom-0 left-0 right-0 h-32 opacity-20" viewBox="0 0 1440 128" preserveAspectRatio="none">
          <path d="M0,64 Q180,32 360,64 Q540,96 720,64 Q900,32 1080,64 Q1260,96 1440,64 L1440,128 L0,128 Z" fill="url(#waveGradient)" />
          <defs>
            <linearGradient id="waveGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#FF4DA6" />
              <stop offset="50%" stopColor="#00C896" />
              <stop offset="100%" stopColor="#3D8BFF" />
            </linearGradient>
          </defs>
        </svg>
      </div>

      <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
        {/* Badge */}
        <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 backdrop-blur-sm">
          <div className="h-2 w-2 rounded-full bg-eqho-green animate-pulse" />
          <span className="text-sm font-medium text-muted-foreground">Now in Beta - Join 500+ coaches</span>
        </div>

        {/* Headline */}
        <h1 className="mx-auto max-w-4xl text-5xl font-bold tracking-tight sm:text-6xl lg:text-7xl">
          <span className="text-white">Competition Music.</span>
          <br />
          <span className="gradient-text">Perfected.</span>
        </h1>

        {/* Subheadline */}
        <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground sm:text-xl leading-relaxed">
          EQHO helps gymnastics, cheer and dance coaches create competition-ready routine music faster with AI-assisted editing workflows.
        </p>

        {/* CTAs */}
        <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
          <Link href="/">
            <Button size="lg" className="group gap-2 bg-gradient-to-r from-eqho-pink to-eqho-blue px-8 text-white shadow-xl shadow-eqho-pink/25 transition-all hover:opacity-90 hover:shadow-2xl hover:shadow-eqho-pink/30 hover:scale-105">
              Start Free
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Button>
          </Link>
          <Button size="lg" variant="outline" className="gap-2 border-white/10 bg-white/5 text-white backdrop-blur-sm hover:bg-white/10">
            <Play className="h-4 w-4" />
            Watch Demo
          </Button>
        </div>

        {/* Product Preview */}
        <div className="mt-16 sm:mt-20">
          <div className="relative mx-auto max-w-5xl">
            {/* Glow Effect */}
            <div className="absolute -inset-4 rounded-2xl bg-gradient-to-r from-eqho-pink/20 via-eqho-green/20 to-eqho-blue/20 blur-2xl" />
            
            {/* Mock UI */}
            <div className="relative overflow-hidden rounded-xl border border-white/10 bg-eqho-slate/80 shadow-2xl backdrop-blur-sm">
              {/* Window Chrome */}
              <div className="flex items-center gap-2 border-b border-white/5 bg-eqho-navy/50 px-4 py-3">
                <div className="flex gap-1.5">
                  <div className="h-3 w-3 rounded-full bg-red-500/80" />
                  <div className="h-3 w-3 rounded-full bg-yellow-500/80" />
                  <div className="h-3 w-3 rounded-full bg-green-500/80" />
                </div>
                <div className="ml-4 flex-1 rounded-md bg-white/5 px-3 py-1 text-xs text-muted-foreground">
                  app.eqho.io/editor
                </div>
              </div>
              
              {/* Editor Preview */}
              <div className="p-6">
                {/* Toolbar */}
                <div className="mb-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-24 rounded-lg bg-gradient-to-r from-eqho-pink to-eqho-blue opacity-80" />
                    <div className="h-8 w-8 rounded-lg bg-white/10" />
                    <div className="h-8 w-8 rounded-lg bg-white/10" />
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="h-8 w-20 rounded-lg bg-white/5" />
                    <div className="h-8 w-24 rounded-lg bg-eqho-green/20" />
                  </div>
                </div>
                
                {/* Timeline */}
                <div className="space-y-2">
                  {/* Time markers */}
                  <div className="flex justify-between text-xs text-muted-foreground px-2">
                    <span>0:00</span>
                    <span>0:30</span>
                    <span>1:00</span>
                    <span>1:30</span>
                    <span>2:00</span>
                  </div>
                  
                  {/* Waveform Track */}
                  <div className="relative h-20 rounded-lg bg-white/5 overflow-hidden">
                    <div className="absolute inset-y-0 left-0 w-3/4 flex items-center px-4">
                      {/* Animated Waveform */}
                      <svg className="h-12 w-full" viewBox="0 0 400 48">
                        <defs>
                          <linearGradient id="heroWaveGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                            <stop offset="0%" stopColor="#FF4DA6" />
                            <stop offset="50%" stopColor="#00C896" />
                            <stop offset="100%" stopColor="#3D8BFF" />
                          </linearGradient>
                        </defs>
                        {[...Array(80)].map((_, i) => (
                          <rect
                            key={i}
                            x={i * 5}
                            y={24 - Math.random() * 20}
                            width="3"
                            height={Math.random() * 40 + 8}
                            fill="url(#heroWaveGrad)"
                            opacity={0.8}
                            rx="1"
                          />
                        ))}
                      </svg>
                    </div>
                    {/* Playhead */}
                    <div className="absolute top-0 bottom-0 left-1/3 w-0.5 bg-white shadow-[0_0_10px_rgba(255,255,255,0.5)]" />
                  </div>
                  
                  {/* Additional Tracks */}
                  <div className="h-10 rounded-lg bg-white/5 flex items-center px-4">
                    <div className="h-4 w-1/2 rounded bg-eqho-blue/30" />
                  </div>
                  <div className="h-10 rounded-lg bg-white/5 flex items-center px-4">
                    <div className="h-4 w-1/3 rounded bg-eqho-green/30 ml-20" />
                  </div>
                </div>
                
                {/* Bottom Controls */}
                <div className="mt-4 flex items-center justify-center gap-4">
                  <div className="h-10 w-10 rounded-full bg-white/10" />
                  <div className="h-12 w-12 rounded-full bg-gradient-to-r from-eqho-pink to-eqho-blue flex items-center justify-center">
                    <Play className="h-5 w-5 text-white ml-0.5" fill="white" />
                  </div>
                  <div className="h-10 w-10 rounded-full bg-white/10" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Social Proof */}
        <div className="mt-16 flex flex-col items-center gap-6">
          <p className="text-sm text-muted-foreground">Trusted by coaches at</p>
          <div className="flex flex-wrap items-center justify-center gap-x-12 gap-y-4 opacity-50">
            {["Cheer Athletics", "Gym Stars", "Elite Dance", "All Star Acro", "Premier Gymnastics"].map((name) => (
              <span key={name} className="text-lg font-semibold text-white/60">{name}</span>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
