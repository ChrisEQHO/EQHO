"use client"

import { Lightbulb, ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"

export function InfoCard() {
  return (
    <section className="relative overflow-hidden rounded-xl border border-border/50 bg-gradient-to-br from-eqho-pink/5 via-eqho-green/5 to-eqho-blue/5 p-6 lg:p-8">
      {/* Decorative Waveform */}
      <div className="pointer-events-none absolute -right-10 top-1/2 -translate-y-1/2 opacity-10">
        <svg width="200" height="80" viewBox="0 0 200 80" fill="none">
          <path
            d="M0,40 Q10,20 20,40 Q30,60 40,40 Q50,20 60,40 Q70,60 80,40 Q90,20 100,40 Q110,60 120,40 Q130,20 140,40 Q150,60 160,40 Q170,20 180,40 Q190,60 200,40"
            stroke="url(#info-wave-gradient)"
            strokeWidth="4"
            fill="none"
          />
          <defs>
            <linearGradient id="info-wave-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#FF4DA6" />
              <stop offset="50%" stopColor="#00C896" />
              <stop offset="100%" stopColor="#3D8BFF" />
            </linearGradient>
          </defs>
        </svg>
      </div>

      <div className="relative flex flex-col items-start gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-start gap-4 lg:items-center">
          {/* Icon */}
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-eqho-pink/20 to-eqho-blue/20 shadow-lg shadow-eqho-pink/10">
            <Lightbulb className="h-6 w-6 text-eqho-pink" />
          </div>

          {/* Text */}
          <div>
            <h3 className="mb-1 font-semibold text-foreground">
              Why use templates?
            </h3>
            <p className="max-w-xl text-sm text-muted-foreground">
              Templates give you a proven routine structure so you can focus on making it your own. 
              Each template is designed by professionals and optimized for competition scoring.
            </p>
          </div>
        </div>

        {/* CTA Button */}
        <Link href="/new-project">
          <Button className="group shrink-0 gap-2 bg-gradient-to-r from-eqho-pink via-eqho-green to-eqho-blue text-white transition-all duration-200 hover:opacity-90 hover:shadow-lg hover:shadow-eqho-pink/20">
            Start from scratch
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </Button>
        </Link>
      </div>
    </section>
  )
}
