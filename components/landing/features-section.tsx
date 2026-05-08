"use client"

import { 
  Clock, 
  Wand2, 
  Volume2, 
  Mic, 
  Layers, 
  Activity, 
  LayoutTemplate, 
  Users 
} from "lucide-react"

const features = [
  {
    icon: Clock,
    title: "AI Routine Timing",
    description: "Automatically detect and match music to your routine length requirements.",
    color: "eqho-pink",
  },
  {
    icon: Wand2,
    title: "Smart Transitions",
    description: "AI-powered crossfades and beat-matched transitions between sections.",
    color: "eqho-green",
  },
  {
    icon: Volume2,
    title: "Sound Effects",
    description: "Library of competition-ready sound effects and risers.",
    color: "eqho-blue",
  },
  {
    icon: Mic,
    title: "Voiceovers",
    description: "Add and sync voiceover cues for coaches and athletes.",
    color: "eqho-pink",
  },
  {
    icon: Layers,
    title: "Multi-Track Editor",
    description: "Professional timeline with multiple audio tracks and layers.",
    color: "eqho-green",
  },
  {
    icon: Activity,
    title: "BPM Detection",
    description: "Automatic tempo analysis for perfect beat alignment.",
    color: "eqho-blue",
  },
  {
    icon: LayoutTemplate,
    title: "Template Library",
    description: "Start faster with pre-built routine structures and templates.",
    color: "eqho-pink",
  },
  {
    icon: Users,
    title: "Collaboration Tools",
    description: "Share with coaches and athletes for feedback and approval.",
    color: "eqho-green",
  },
]

export function FeaturesSection() {
  return (
    <section id="features" className="relative py-24 sm:py-32">
      {/* Background */}
      <div className="absolute inset-0">
        <div className="absolute top-1/2 left-1/4 h-[400px] w-[400px] -translate-y-1/2 rounded-full bg-eqho-pink/10 blur-[100px]" />
        <div className="absolute top-1/3 right-1/4 h-[300px] w-[300px] rounded-full bg-eqho-blue/10 blur-[80px]" />
      </div>
      
      <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center">
          <p className="text-sm font-semibold uppercase tracking-wider text-eqho-blue">Capabilities</p>
          <h2 className="mt-2 text-3xl font-bold text-white sm:text-4xl lg:text-5xl">
            Powerful Features
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-muted-foreground">
            Everything you need to create competition-winning routine music.
          </p>
        </div>

        {/* Features Grid */}
        <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {features.map((feature) => (
            <div
              key={feature.title}
              className="group relative overflow-hidden rounded-2xl border border-white/5 bg-eqho-slate/30 p-6 backdrop-blur-sm transition-all duration-300 hover:border-white/10 hover:bg-eqho-slate/50 hover:-translate-y-1 card-shine"
            >
              {/* Glow on hover */}
              <div className={`absolute -inset-px rounded-2xl bg-gradient-to-b from-${feature.color}/20 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100`} />
              
              <div className="relative">
                {/* Icon */}
                <div className={`mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-${feature.color}/10`}>
                  <feature.icon className={`h-6 w-6 text-${feature.color}`} />
                </div>
                
                {/* Content */}
                <h3 className="text-base font-semibold text-white">{feature.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{feature.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
