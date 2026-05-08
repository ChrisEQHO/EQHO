"use client"

import { Play, Clock } from "lucide-react"
import { Button } from "@/components/ui/button"

const templates = [
  {
    title: "Cheer Elite",
    category: "Cheerleading",
    duration: "2:30",
    structure: ["Intro", "Build", "Drop", "Pyramid", "Outro"],
    gradient: "from-eqho-pink to-eqho-pink/50",
  },
  {
    title: "Floor Music",
    category: "Gymnastics",
    duration: "1:30",
    structure: ["Opening", "Tumble 1", "Dance", "Tumble 2", "Finale"],
    gradient: "from-eqho-green to-eqho-green/50",
  },
  {
    title: "Acro Dynamic",
    category: "Acrobatics",
    duration: "2:45",
    structure: ["Intro", "Balance", "Dynamic", "Lift", "Ending"],
    gradient: "from-eqho-blue to-eqho-blue/50",
  },
  {
    title: "Dance Solo",
    category: "Dance",
    duration: "2:00",
    structure: ["Entrance", "Verse", "Chorus", "Bridge", "Exit"],
    gradient: "from-eqho-pink via-eqho-green to-eqho-blue",
  },
]

export function TemplatesSection() {
  return (
    <section id="templates" className="relative py-24 sm:py-32">
      {/* Background */}
      <div className="absolute inset-0">
        <div className="absolute bottom-0 left-1/3 h-[400px] w-[400px] rounded-full bg-eqho-green/10 blur-[100px]" />
        <div className="absolute top-1/4 right-1/4 h-[300px] w-[300px] rounded-full bg-eqho-pink/10 blur-[80px]" />
      </div>
      
      <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center">
          <p className="text-sm font-semibold uppercase tracking-wider text-eqho-green">Templates</p>
          <h2 className="mt-2 text-3xl font-bold text-white sm:text-4xl lg:text-5xl">
            Start With a Template
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-muted-foreground">
            Professional routine structures to jumpstart your creative process.
          </p>
        </div>

        {/* Template Cards */}
        <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {templates.map((template) => (
            <div
              key={template.title}
              className="group relative overflow-hidden rounded-2xl border border-white/5 bg-eqho-slate/50 backdrop-blur-sm transition-all duration-300 hover:border-white/10 hover:-translate-y-2 hover:shadow-xl"
            >
              {/* Waveform Preview */}
              <div className="relative h-32 overflow-hidden bg-eqho-navy/50">
                <div className={`absolute inset-0 bg-gradient-to-br ${template.gradient} opacity-20`} />
                
                {/* Waveform */}
                <svg className="absolute inset-0 h-full w-full p-4" viewBox="0 0 200 60" preserveAspectRatio="none">
                  <defs>
                    <linearGradient id={`waveGrad-${template.title}`} x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#FF4DA6" />
                      <stop offset="50%" stopColor="#00C896" />
                      <stop offset="100%" stopColor="#3D8BFF" />
                    </linearGradient>
                  </defs>
                  {[...Array(40)].map((_, i) => (
                    <rect
                      key={i}
                      x={i * 5}
                      y={30 - Math.random() * 25}
                      width="3"
                      height={Math.random() * 50 + 10}
                      fill={`url(#waveGrad-${template.title})`}
                      opacity={0.6}
                      rx="1"
                    />
                  ))}
                </svg>
                
                {/* Play Button */}
                <div className="absolute inset-0 flex items-center justify-center opacity-0 transition-opacity group-hover:opacity-100">
                  <button className="flex h-12 w-12 items-center justify-center rounded-full bg-white/20 backdrop-blur-sm transition-transform hover:scale-110">
                    <Play className="h-5 w-5 text-white ml-0.5" fill="white" />
                  </button>
                </div>
              </div>
              
              <div className="p-5">
                {/* Category */}
                <span className="text-xs font-medium text-eqho-green">{template.category}</span>
                
                {/* Title & Duration */}
                <div className="mt-1 flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-white">{template.title}</h3>
                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                    <Clock className="h-3.5 w-3.5" />
                    {template.duration}
                  </div>
                </div>
                
                {/* Structure Tags */}
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {template.structure.map((section, index) => (
                    <span
                      key={section}
                      className="rounded-md bg-white/5 px-2 py-0.5 text-xs text-muted-foreground"
                    >
                      {section}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="mt-12 text-center">
          <Button variant="outline" className="border-white/10 bg-white/5 text-white hover:bg-white/10">
            View All Templates
          </Button>
        </div>
      </div>
    </section>
  )
}
