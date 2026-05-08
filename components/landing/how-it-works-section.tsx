"use client"

import { Upload, Sparkles, Sliders, Download } from "lucide-react"

const steps = [
  {
    icon: Upload,
    title: "Upload Music",
    description: "Drop your tracks into EQHO. We support MP3, WAV, and more.",
    color: "eqho-pink",
    number: "01",
  },
  {
    icon: Sparkles,
    title: "AI Suggests Edits",
    description: "Our AI analyzes BPM, key, and structure to suggest perfect cuts.",
    color: "eqho-green",
    number: "02",
  },
  {
    icon: Sliders,
    title: "Refine Your Routine",
    description: "Fine-tune transitions, add effects, and perfect every beat.",
    color: "eqho-blue",
    number: "03",
  },
  {
    icon: Download,
    title: "Export Competition-Ready",
    description: "Download high-quality audio ready for the competition floor.",
    color: "eqho-pink",
    number: "04",
  },
]

export function HowItWorksSection() {
  return (
    <section id="how-it-works" className="relative py-24 sm:py-32">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-eqho-navy via-eqho-slate/50 to-eqho-navy" />
      
      <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center">
          <p className="text-sm font-semibold uppercase tracking-wider text-eqho-green">Workflow</p>
          <h2 className="mt-2 text-3xl font-bold text-white sm:text-4xl lg:text-5xl">
            How It Works
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-muted-foreground">
            From upload to competition floor in four simple steps.
          </p>
        </div>

        {/* Steps */}
        <div className="mt-16 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {steps.map((step, index) => (
            <div
              key={step.title}
              className="group relative"
            >
              {/* Connector Line */}
              {index < steps.length - 1 && (
                <div className="absolute top-12 left-1/2 hidden h-0.5 w-full bg-gradient-to-r from-white/10 to-transparent lg:block" />
              )}
              
              <div className="relative rounded-2xl border border-white/5 bg-eqho-slate/50 p-6 backdrop-blur-sm transition-all duration-300 hover:border-white/10 hover:bg-eqho-slate/80 hover:-translate-y-1">
                {/* Number Badge */}
                <div className="absolute -top-3 -right-3 flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-eqho-pink to-eqho-blue text-xs font-bold text-white">
                  {step.number}
                </div>
                
                {/* Icon */}
                <div className={`mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-${step.color}/10 transition-all duration-300 group-hover:bg-${step.color}/20 group-hover:shadow-lg group-hover:shadow-${step.color}/20`}>
                  <step.icon className={`h-7 w-7 text-${step.color}`} />
                </div>
                
                {/* Content */}
                <h3 className="text-lg font-semibold text-white">{step.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{step.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
