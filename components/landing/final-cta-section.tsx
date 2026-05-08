"use client"

import Link from "next/link"
import { ArrowRight, Calendar } from "lucide-react"
import { Button } from "@/components/ui/button"

export function FinalCtaSection() {
  return (
    <section className="relative py-24 sm:py-32">
      {/* Background */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-gradient-to-r from-eqho-pink/10 via-eqho-green/5 to-eqho-blue/10" />
        <div className="absolute top-0 left-1/4 h-[400px] w-[400px] rounded-full bg-eqho-pink/20 blur-[120px]" />
        <div className="absolute bottom-0 right-1/4 h-[400px] w-[400px] rounded-full bg-eqho-blue/20 blur-[120px]" />
        
        {/* Grid Pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:64px_64px]" />
      </div>
      
      <div className="relative z-10 mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center">
        {/* Content */}
        <h2 className="text-4xl font-bold text-white sm:text-5xl lg:text-6xl">
          Build your next routine with{" "}
          <span className="gradient-text">EQHO</span>
        </h2>
        
        <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground">
          Join hundreds of coaches creating competition-winning music. Start free today.
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
            <Calendar className="h-4 w-4" />
            Book Demo
          </Button>
        </div>
        
        {/* Trust Indicators */}
        <div className="mt-12 flex flex-col items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="flex -space-x-2">
              {["SM", "MC", "JR", "AK"].map((initials, i) => (
                <div
                  key={initials}
                  className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-eqho-navy bg-gradient-to-br from-eqho-pink to-eqho-blue text-xs font-semibold text-white"
                  style={{ zIndex: 4 - i }}
                >
                  {initials}
                </div>
              ))}
            </div>
            <span className="text-sm text-muted-foreground">
              <span className="text-white font-medium">500+</span> coaches already on board
            </span>
          </div>
          <p className="text-sm text-muted-foreground">
            No credit card required. Start building in minutes.
          </p>
        </div>
      </div>
    </section>
  )
}
