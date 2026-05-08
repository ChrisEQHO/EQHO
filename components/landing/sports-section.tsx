"use client"

import { Star, Trophy, Music, Zap } from "lucide-react"

const sports = [
  {
    title: "Cheerleading",
    description: "Create high-energy mixes with precise 8-count timing, crowd-pumping builds, and competition-legal audio.",
    icon: Star,
    color: "eqho-pink",
    features: ["8-count markers", "Stunt music", "Crowd effects"],
  },
  {
    title: "Gymnastics",
    description: "Design floor music that flows with your routine, from graceful intros to powerful tumbling passes.",
    icon: Trophy,
    color: "eqho-green",
    features: ["Floor routine timing", "Apparatus cues", "FIG compliant"],
  },
  {
    title: "Dance",
    description: "Blend tracks seamlessly for choreography with beat-perfect transitions and dynamic energy shifts.",
    icon: Music,
    color: "eqho-blue",
    features: ["Choreography sync", "Style mixing", "Competition cuts"],
  },
  {
    title: "Acro",
    description: "Build dramatic soundscapes that highlight lifts, balances, and dynamic acrobatic sequences.",
    icon: Zap,
    color: "eqho-pink",
    features: ["Lift cues", "Balance music", "Impact effects"],
  },
]

export function SportsSection() {
  return (
    <section className="relative py-24 sm:py-32">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-eqho-navy via-eqho-slate/30 to-eqho-navy" />
      
      <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center">
          <p className="text-sm font-semibold uppercase tracking-wider text-eqho-pink">Sports</p>
          <h2 className="mt-2 text-3xl font-bold text-white sm:text-4xl lg:text-5xl">
            Built For Your Sport
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-muted-foreground">
            Specialized workflows designed for the unique demands of each discipline.
          </p>
        </div>

        {/* Sport Cards */}
        <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {sports.map((sport) => (
            <div
              key={sport.title}
              className="group relative overflow-hidden rounded-2xl border border-white/5 bg-eqho-slate/50 transition-all duration-300 hover:border-white/10 hover:-translate-y-2"
            >
              {/* Gradient Top Border */}
              <div className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-transparent via-${sport.color} to-transparent opacity-50 group-hover:opacity-100 transition-opacity`} />
              
              {/* Glow Effect */}
              <div className={`absolute inset-0 bg-gradient-to-b from-${sport.color}/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300`} />
              
              <div className="relative p-6">
                {/* Icon */}
                <div className={`mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-${sport.color}/10 shadow-lg shadow-${sport.color}/10 group-hover:shadow-${sport.color}/20 transition-all`}>
                  <sport.icon className={`h-7 w-7 text-${sport.color}`} />
                </div>
                
                {/* Content */}
                <h3 className="text-xl font-semibold text-white">{sport.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{sport.description}</p>
                
                {/* Features */}
                <div className="mt-4 flex flex-wrap gap-2">
                  {sport.features.map((feature) => (
                    <span
                      key={feature}
                      className={`rounded-full bg-${sport.color}/10 px-3 py-1 text-xs font-medium text-${sport.color}`}
                    >
                      {feature}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
