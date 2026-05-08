"use client"

import Link from "next/link"
import { Check, X } from "lucide-react"
import { Button } from "@/components/ui/button"

const plans = [
  {
    name: "Free",
    price: "$0",
    period: "forever",
    description: "Perfect for trying out EQHO",
    features: [
      { text: "3 projects", included: true },
      { text: "Basic editing tools", included: true },
      { text: "5 exports per month", included: true },
      { text: "Watermarked exports", included: true },
      { text: "AI suggestions", included: false },
      { text: "Template library", included: false },
      { text: "Collaboration", included: false },
      { text: "Priority support", included: false },
    ],
    cta: "Get Started",
    highlighted: false,
  },
  {
    name: "Pro",
    price: "$29",
    period: "per month",
    description: "For serious coaches and gyms",
    features: [
      { text: "Unlimited projects", included: true },
      { text: "Advanced editing tools", included: true },
      { text: "Unlimited exports", included: true },
      { text: "No watermarks", included: true },
      { text: "AI suggestions", included: true },
      { text: "Full template library", included: true },
      { text: "Team collaboration", included: true },
      { text: "Priority support", included: true },
    ],
    cta: "Upgrade to Pro",
    highlighted: true,
  },
]

export function PricingSection() {
  return (
    <section id="pricing" className="relative py-24 sm:py-32">
      {/* Background */}
      <div className="absolute inset-0">
        <div className="absolute top-1/3 left-1/2 h-[500px] w-[500px] -translate-x-1/2 rounded-full bg-eqho-blue/10 blur-[120px]" />
      </div>
      
      <div className="relative z-10 mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center">
          <p className="text-sm font-semibold uppercase tracking-wider text-eqho-blue">Pricing</p>
          <h2 className="mt-2 text-3xl font-bold text-white sm:text-4xl lg:text-5xl">
            Simple, Transparent Pricing
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-muted-foreground">
            Start free, upgrade when you need more power.
          </p>
        </div>

        {/* Pricing Cards */}
        <div className="mt-16 grid gap-8 md:grid-cols-2">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`relative overflow-hidden rounded-2xl border transition-all duration-300 ${
                plan.highlighted
                  ? "border-eqho-blue/50 bg-gradient-to-b from-eqho-blue/10 to-transparent shadow-xl shadow-eqho-blue/10"
                  : "border-white/5 bg-eqho-slate/30"
              }`}
            >
              {/* Popular Badge */}
              {plan.highlighted && (
                <div className="absolute inset-x-0 top-0 flex justify-center">
                  <div className="rounded-b-lg bg-gradient-to-r from-eqho-pink to-eqho-blue px-4 py-1 text-xs font-semibold text-white">
                    Most Popular
                  </div>
                </div>
              )}
              
              <div className="p-8 pt-10">
                {/* Plan Name */}
                <h3 className="text-xl font-semibold text-white">{plan.name}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{plan.description}</p>
                
                {/* Price */}
                <div className="mt-6 flex items-baseline gap-2">
                  <span className="text-5xl font-bold text-white">{plan.price}</span>
                  <span className="text-muted-foreground">/ {plan.period}</span>
                </div>
                
                {/* CTA */}
                <Link href="/">
                  <Button
                    className={`mt-8 w-full ${
                      plan.highlighted
                        ? "bg-gradient-to-r from-eqho-pink to-eqho-blue text-white shadow-lg shadow-eqho-pink/20 hover:opacity-90 hover:shadow-xl"
                        : "bg-white/10 text-white hover:bg-white/20"
                    }`}
                  >
                    {plan.cta}
                  </Button>
                </Link>
                
                {/* Features */}
                <ul className="mt-8 space-y-3">
                  {plan.features.map((feature) => (
                    <li key={feature.text} className="flex items-center gap-3">
                      {feature.included ? (
                        <div className="flex h-5 w-5 items-center justify-center rounded-full bg-eqho-green/20">
                          <Check className="h-3 w-3 text-eqho-green" />
                        </div>
                      ) : (
                        <div className="flex h-5 w-5 items-center justify-center rounded-full bg-white/5">
                          <X className="h-3 w-3 text-muted-foreground" />
                        </div>
                      )}
                      <span className={feature.included ? "text-white/90" : "text-muted-foreground"}>
                        {feature.text}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
