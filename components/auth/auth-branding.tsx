"use client"

import { useEffect, useState } from "react"
import { Play } from "lucide-react"

export function AuthBranding() {
  const [currentSlide, setCurrentSlide] = useState(0)

  const slides = [
    {
      title: "AI-Powered Editing",
      description: "Intelligent suggestions for cuts, transitions, and effects",
      image: "editor"
    },
    {
      title: "Template Library",
      description: "Start with pre-built routines for any sport or level",
      image: "templates"
    },
    {
      title: "Team Collaboration",
      description: "Share and review with coaches and athletes in real-time",
      image: "collaboration"
    }
  ]

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length)
    }, 5000)
    return () => clearInterval(interval)
  }, [slides.length])

  return (
    <div className="hidden lg:flex lg:flex-1 relative overflow-hidden bg-gradient-to-br from-eqho-navy via-eqho-slate to-eqho-navy">
      {/* Animated Background Elements */}
      <div className="absolute inset-0">
        {/* Gradient Orbs */}
        <div className="absolute top-1/4 left-1/4 h-[400px] w-[400px] rounded-full bg-eqho-pink/15 blur-[100px] animate-pulse" />
        <div className="absolute bottom-1/3 right-1/4 h-[300px] w-[300px] rounded-full bg-eqho-blue/15 blur-[80px] animate-pulse" style={{ animationDelay: "1.5s" }} />
        <div className="absolute top-1/2 right-1/3 h-[250px] w-[250px] rounded-full bg-eqho-green/10 blur-[60px] animate-pulse" style={{ animationDelay: "3s" }} />

        {/* Animated Waveform Lines */}
        <svg className="absolute bottom-0 left-0 right-0 h-48 opacity-30" viewBox="0 0 800 192" preserveAspectRatio="none">
          <defs>
            <linearGradient id="authWaveGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#FF4DA6" />
              <stop offset="50%" stopColor="#00C896" />
              <stop offset="100%" stopColor="#3D8BFF" />
            </linearGradient>
          </defs>
          <path 
            d="M0,96 Q100,48 200,96 Q300,144 400,96 Q500,48 600,96 Q700,144 800,96 L800,192 L0,192 Z" 
            fill="url(#authWaveGrad)" 
            opacity="0.3"
          />
          <path 
            d="M0,128 Q100,96 200,128 Q300,160 400,128 Q500,96 600,128 Q700,160 800,128 L800,192 L0,192 Z" 
            fill="url(#authWaveGrad)" 
            opacity="0.2"
          />
        </svg>

        {/* Grid Pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:48px_48px]" />
      </div>

      {/* Content */}
      <div className="relative z-10 flex flex-col justify-between p-12">
        {/* Logo */}
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center h-10 w-10 rounded-xl bg-gradient-to-br from-eqho-pink via-eqho-green to-eqho-blue">
            <span className="text-lg font-bold text-white">EQ</span>
          </div>
          <span className="text-2xl font-bold text-white">EQHO</span>
        </div>

        {/* Main Content */}
        <div className="space-y-8">
          <div>
            <h1 className="text-4xl font-bold text-white leading-tight">
              Create competition-ready
              <br />
              routine music <span className="gradient-text">faster.</span>
            </h1>
            <p className="mt-4 text-lg text-muted-foreground max-w-md">
              AI-assisted music workflows for gymnastics, cheer, dance and acro.
            </p>
          </div>

          {/* Feature Carousel */}
          <div className="relative">
            <div className="glass-panel rounded-2xl p-6 space-y-4">
              {/* Mock UI Preview */}
              <div className="relative aspect-video rounded-xl bg-eqho-navy/50 overflow-hidden border border-white/5">
                {/* Window Chrome */}
                <div className="flex items-center gap-2 border-b border-white/5 bg-eqho-navy/50 px-3 py-2">
                  <div className="flex gap-1">
                    <div className="h-2 w-2 rounded-full bg-red-500/60" />
                    <div className="h-2 w-2 rounded-full bg-yellow-500/60" />
                    <div className="h-2 w-2 rounded-full bg-green-500/60" />
                  </div>
                </div>

                {/* Content based on slide */}
                <div className="p-4 space-y-3">
                  {slides[currentSlide].image === "editor" && (
                    <>
                      <div className="flex items-center gap-2 mb-3">
                        <div className="h-6 w-16 rounded bg-gradient-to-r from-eqho-pink to-eqho-blue opacity-70" />
                        <div className="h-6 w-6 rounded bg-white/10" />
                        <div className="h-6 w-6 rounded bg-white/10" />
                      </div>
                      <div className="h-12 rounded-lg bg-white/5 flex items-center px-3">
                        <svg className="h-8 w-full" viewBox="0 0 300 32">
                          {[...Array(60)].map((_, i) => (
                            <rect
                              key={i}
                              x={i * 5}
                              y={16 - Math.random() * 14}
                              width="3"
                              height={Math.random() * 28 + 4}
                              fill="url(#authWaveGrad)"
                              opacity={0.7}
                              rx="1"
                            />
                          ))}
                        </svg>
                      </div>
                      <div className="h-8 rounded bg-white/5 flex items-center px-3">
                        <div className="h-3 w-1/2 rounded bg-eqho-blue/40" />
                      </div>
                    </>
                  )}
                  {slides[currentSlide].image === "templates" && (
                    <div className="grid grid-cols-3 gap-2">
                      {[...Array(6)].map((_, i) => (
                        <div key={i} className="aspect-square rounded-lg bg-white/5 flex items-center justify-center">
                          <div className={`h-6 w-6 rounded ${i % 3 === 0 ? 'bg-eqho-pink/40' : i % 3 === 1 ? 'bg-eqho-green/40' : 'bg-eqho-blue/40'}`} />
                        </div>
                      ))}
                    </div>
                  )}
                  {slides[currentSlide].image === "collaboration" && (
                    <div className="space-y-2">
                      {[...Array(3)].map((_, i) => (
                        <div key={i} className="flex items-center gap-3 p-2 rounded-lg bg-white/5">
                          <div className={`h-8 w-8 rounded-full ${i === 0 ? 'bg-eqho-pink/40' : i === 1 ? 'bg-eqho-green/40' : 'bg-eqho-blue/40'}`} />
                          <div className="flex-1 space-y-1">
                            <div className="h-2 w-20 rounded bg-white/20" />
                            <div className="h-2 w-32 rounded bg-white/10" />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Play Button Overlay */}
                <div className="absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 hover:opacity-100 transition-opacity cursor-pointer">
                  <div className="h-12 w-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                    <Play className="h-5 w-5 text-white ml-0.5" fill="white" />
                  </div>
                </div>
              </div>

              {/* Slide Info */}
              <div>
                <h3 className="font-semibold text-white">{slides[currentSlide].title}</h3>
                <p className="text-sm text-muted-foreground">{slides[currentSlide].description}</p>
              </div>

              {/* Slide Indicators */}
              <div className="flex gap-2">
                {slides.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setCurrentSlide(i)}
                    className={`h-1.5 rounded-full transition-all ${
                      i === currentSlide 
                        ? 'w-6 bg-gradient-to-r from-eqho-pink to-eqho-blue' 
                        : 'w-1.5 bg-white/20 hover:bg-white/30'
                    }`}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Stats */}
        <div className="flex items-center gap-8">
          <div>
            <p className="text-2xl font-bold text-white">500+</p>
            <p className="text-sm text-muted-foreground">Active Coaches</p>
          </div>
          <div className="h-8 w-px bg-white/10" />
          <div>
            <p className="text-2xl font-bold text-white">2,000+</p>
            <p className="text-sm text-muted-foreground">Routines Created</p>
          </div>
          <div className="h-8 w-px bg-white/10" />
          <div>
            <p className="text-2xl font-bold text-white">4.9/5</p>
            <p className="text-sm text-muted-foreground">User Rating</p>
          </div>
        </div>
      </div>
    </div>
  )
}
