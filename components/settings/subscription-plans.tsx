"use client"

import { Check, Crown, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"

const plans = [
  {
    name: "Free",
    price: "$0",
    period: "/month",
    description: "Get started with basic features",
    current: false,
    features: [
      "1 active project",
      "5 exports per month",
      "EQHO watermark on exports",
      "Limited AI suggestions",
      "Basic templates",
      "Community support",
    ],
    limitations: [
      "No asset library access",
      "No advanced editing tools",
    ],
  },
  {
    name: "Pro",
    price: "$29",
    period: "/month",
    description: "Everything you need for competition music",
    current: true,
    popular: true,
    features: [
      "Unlimited projects",
      "Unlimited exports",
      "No watermark",
      "Full AI assistant access",
      "Advanced editing tools",
      "Complete asset library",
      "Priority processing",
      "Premium templates",
      "Email support",
    ],
  },
]

export function SubscriptionPlans() {
  return (
    <div className="rounded-xl border border-border/50 bg-card p-6 hover-lift">
      <div className="mb-6 flex items-center justify-between">
        <h3 className="text-lg font-semibold text-foreground">Subscription Plans</h3>
        <span className="text-xs text-muted-foreground">Billing: Monthly</span>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {plans.map((plan) => (
          <div
            key={plan.name}
            className={`relative rounded-xl border p-6 transition-all duration-300 ${
              plan.popular
                ? "border-eqho-blue/50 bg-gradient-to-br from-eqho-blue/5 via-transparent to-eqho-pink/5 shadow-lg shadow-eqho-blue/10"
                : "border-border/50 bg-secondary/20"
            }`}
          >
            {/* Popular Badge */}
            {plan.popular && (
              <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                <span className="flex items-center gap-1.5 rounded-full bg-gradient-to-r from-eqho-pink to-eqho-blue px-4 py-1 text-xs font-semibold text-white shadow-lg shadow-eqho-pink/30">
                  <Sparkles className="h-3 w-3" />
                  Most Popular
                </span>
              </div>
            )}

            {/* Plan Header */}
            <div className="mb-4 pt-2">
              <div className="flex items-center gap-2">
                <h4 className={`text-xl font-bold ${plan.popular ? "text-eqho-blue" : "text-foreground"}`}>
                  {plan.name}
                </h4>
                {plan.current && (
                  <span className="rounded-full bg-eqho-green/20 px-2 py-0.5 text-xs font-medium text-eqho-green">
                    Current Plan
                  </span>
                )}
              </div>
              <p className="mt-1 text-sm text-muted-foreground">{plan.description}</p>
            </div>

            {/* Pricing */}
            <div className="mb-6">
              <span className={`text-4xl font-bold ${plan.popular ? "gradient-text" : "text-foreground"}`}>
                {plan.price}
              </span>
              <span className="text-muted-foreground">{plan.period}</span>
            </div>

            {/* Features */}
            <ul className="mb-6 space-y-3">
              {plan.features.map((feature) => (
                <li key={feature} className="flex items-start gap-3">
                  <div className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full ${
                    plan.popular ? "bg-eqho-green/20" : "bg-secondary"
                  }`}>
                    <Check className={`h-3 w-3 ${plan.popular ? "text-eqho-green" : "text-muted-foreground"}`} />
                  </div>
                  <span className="text-sm text-foreground">{feature}</span>
                </li>
              ))}
              {plan.limitations?.map((limitation) => (
                <li key={limitation} className="flex items-start gap-3 opacity-50">
                  <div className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-secondary">
                    <span className="text-xs text-muted-foreground">-</span>
                  </div>
                  <span className="text-sm text-muted-foreground line-through">{limitation}</span>
                </li>
              ))}
            </ul>

            {/* CTA Button */}
            {plan.current ? (
              <Button
                variant="outline"
                className="w-full border-eqho-green/50 bg-eqho-green/10 text-eqho-green hover:bg-eqho-green/20"
                disabled
              >
                <Crown className="mr-2 h-4 w-4" />
                Current Plan
              </Button>
            ) : (
              <Button
                className={`w-full ${
                  plan.popular
                    ? "bg-gradient-to-r from-eqho-pink to-eqho-blue text-white shadow-lg shadow-eqho-pink/20 hover:opacity-90 hover:shadow-xl"
                    : "bg-secondary text-foreground hover:bg-secondary/80"
                }`}
              >
                {plan.name === "Free" ? "Downgrade" : "Upgrade Now"}
              </Button>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
