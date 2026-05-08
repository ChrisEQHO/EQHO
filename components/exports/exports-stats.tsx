"use client"

import { Download, Clock, Link2, TrendingUp } from "lucide-react"

const stats = [
  {
    label: "Total Exports",
    value: "47",
    change: "+12 this month",
    icon: Download,
    color: "eqho-pink",
    glow: "shadow-eqho-pink/20",
  },
  {
    label: "Pending Reviews",
    value: "5",
    change: "3 awaiting feedback",
    icon: Clock,
    color: "eqho-green",
    glow: "shadow-eqho-green/20",
  },
  {
    label: "Shared Links",
    value: "23",
    change: "8 active",
    icon: Link2,
    color: "eqho-blue",
    glow: "shadow-eqho-blue/20",
  },
  {
    label: "Most Downloaded",
    value: "Nationals Floor",
    change: "128 downloads",
    icon: TrendingUp,
    color: "eqho-pink",
    glow: "shadow-eqho-pink/20",
  },
]

export function ExportsStats() {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {stats.map((stat) => (
        <div
          key={stat.label}
          className={`group relative overflow-hidden rounded-xl border border-border/50 bg-card p-5 transition-all duration-300 hover:border-${stat.color}/30 hover:shadow-lg hover:${stat.glow} hover-lift card-shine`}
        >
          {/* Gradient accent line */}
          <div
            className={`absolute bottom-0 left-0 h-0.5 w-0 bg-${stat.color} transition-all duration-300 group-hover:w-full`}
          />

          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                {stat.label}
              </p>
              <p className={`mt-2 text-2xl font-bold text-foreground ${stat.label === "Most Downloaded" ? "text-lg" : ""}`}>
                {stat.value}
              </p>
              <p className={`mt-1 text-xs text-${stat.color}`}>{stat.change}</p>
            </div>
            <div
              className={`flex h-10 w-10 items-center justify-center rounded-lg bg-${stat.color}/10 transition-transform duration-200 group-hover:scale-110`}
            >
              <stat.icon className={`h-5 w-5 text-${stat.color}`} />
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
