"use client"

import { Music, Download, Sparkles, Clock, TrendingUp } from "lucide-react"
import { cn } from "@/lib/utils"

const stats = [
  {
    label: "Total Routines",
    value: "24",
    change: "+3 this month",
    trend: "up",
    icon: Music,
    color: "eqho-pink",
    glowColor: "rgba(255, 77, 166, 0.15)",
    borderGlow: "hover:border-eqho-pink/30",
  },
  {
    label: "Total Exports",
    value: "156",
    change: "+12 this week",
    trend: "up",
    icon: Download,
    color: "eqho-green",
    glowColor: "rgba(0, 200, 150, 0.15)",
    borderGlow: "hover:border-eqho-green/30",
  },
  {
    label: "AI Suggestions Used",
    value: "89",
    change: "73% acceptance",
    trend: "up",
    icon: Sparkles,
    color: "eqho-blue",
    glowColor: "rgba(61, 139, 255, 0.15)",
    borderGlow: "hover:border-eqho-blue/30",
  },
  {
    label: "Total Runtime",
    value: "42:36:18",
    change: "Across all routines",
    trend: null,
    icon: Clock,
    color: "gradient",
    glowColor: "rgba(61, 139, 255, 0.1)",
    borderGlow: "hover:border-eqho-blue/20",
  },
]

export function StatsCards() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {stats.map((stat, index) => (
        <div
          key={stat.label}
          className={cn(
            "group relative overflow-hidden rounded-xl border border-border/50 bg-card p-5 transition-all duration-300 hover-lift card-shine",
            stat.borderGlow
          )}
          style={{
            transitionDelay: `${index * 50}ms`,
          }}
        >
          {/* Animated Background Glow */}
          <div
            className="absolute -right-8 -top-8 h-32 w-32 rounded-full blur-3xl transition-all duration-500 group-hover:scale-150"
            style={{
              background: stat.glowColor,
              opacity: 0,
            }}
          />
          <div
            className="absolute -right-8 -top-8 h-32 w-32 rounded-full blur-3xl transition-all duration-500 group-hover:opacity-100"
            style={{
              background: stat.glowColor,
              opacity: 0,
            }}
          />

          {/* Subtle corner accent */}
          <div
            className={cn(
              "absolute -right-12 -top-12 h-24 w-24 rounded-full opacity-0 blur-2xl transition-opacity duration-300 group-hover:opacity-60",
              stat.color === "eqho-pink" && "bg-eqho-pink/30",
              stat.color === "eqho-green" && "bg-eqho-green/30",
              stat.color === "eqho-blue" && "bg-eqho-blue/30",
              stat.color === "gradient" && "bg-gradient-to-br from-eqho-pink/20 via-eqho-green/20 to-eqho-blue/20"
            )}
          />

          <div className="relative">
            <div className="mb-4 flex items-center justify-between">
              <span className="text-sm font-medium text-muted-foreground">{stat.label}</span>
              <div
                className={cn(
                  "flex h-10 w-10 items-center justify-center rounded-xl transition-all duration-300 group-hover:scale-110",
                  stat.color === "eqho-pink" && "bg-eqho-pink/10 text-eqho-pink group-hover:bg-eqho-pink/20 group-hover:shadow-lg group-hover:shadow-eqho-pink/20",
                  stat.color === "eqho-green" && "bg-eqho-green/10 text-eqho-green group-hover:bg-eqho-green/20 group-hover:shadow-lg group-hover:shadow-eqho-green/20",
                  stat.color === "eqho-blue" && "bg-eqho-blue/10 text-eqho-blue group-hover:bg-eqho-blue/20 group-hover:shadow-lg group-hover:shadow-eqho-blue/20",
                  stat.color === "gradient" && "bg-gradient-to-br from-eqho-pink/10 via-eqho-green/10 to-eqho-blue/10 text-eqho-blue group-hover:from-eqho-pink/20 group-hover:via-eqho-green/20 group-hover:to-eqho-blue/20"
                )}
              >
                <stat.icon className="h-5 w-5" />
              </div>
            </div>
            <p className="text-3xl font-semibold tracking-tight text-foreground">{stat.value}</p>
            <div className="mt-2 flex items-center gap-1.5">
              {stat.trend === "up" && (
                <TrendingUp className="h-3.5 w-3.5 text-eqho-green" />
              )}
              <p className={cn(
                "text-xs",
                stat.trend === "up" ? "text-eqho-green" : "text-muted-foreground"
              )}>
                {stat.change}
              </p>
            </div>
          </div>

          {/* Bottom accent line */}
          <div
            className={cn(
              "absolute bottom-0 left-0 h-0.5 w-0 transition-all duration-500 group-hover:w-full",
              stat.color === "eqho-pink" && "bg-gradient-to-r from-eqho-pink/80 to-transparent",
              stat.color === "eqho-green" && "bg-gradient-to-r from-eqho-green/80 to-transparent",
              stat.color === "eqho-blue" && "bg-gradient-to-r from-eqho-blue/80 to-transparent",
              stat.color === "gradient" && "bg-gradient-to-r from-eqho-pink via-eqho-green to-eqho-blue"
            )}
          />
        </div>
      ))}
    </div>
  )
}
