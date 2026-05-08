"use client"

import { HardDrive, Download, Sparkles, FolderOpen } from "lucide-react"

const usageData = [
  {
    label: "Storage Used",
    value: "2.4 GB",
    max: "10 GB",
    percentage: 24,
    icon: HardDrive,
    color: "eqho-blue",
  },
  {
    label: "Exports This Month",
    value: "18",
    max: "Unlimited",
    percentage: null,
    icon: Download,
    color: "eqho-green",
  },
  {
    label: "AI Requests Used",
    value: "142",
    max: "500",
    percentage: 28,
    icon: Sparkles,
    color: "eqho-pink",
  },
  {
    label: "Active Projects",
    value: "6",
    max: "Unlimited",
    percentage: null,
    icon: FolderOpen,
    color: "eqho-blue",
  },
]

export function UsageOverview() {
  return (
    <div className="rounded-xl border border-border/50 bg-card p-6">
      <h3 className="mb-6 text-lg font-semibold text-foreground">Usage Overview</h3>

      <div className="space-y-6">
        {usageData.map((item) => (
          <div key={item.label} className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`flex h-9 w-9 items-center justify-center rounded-lg bg-${item.color}/10`}>
                  <item.icon className={`h-4 w-4 text-${item.color}`} />
                </div>
                <span className="text-sm font-medium text-foreground">{item.label}</span>
              </div>
              <div className="text-right">
                <span className="text-sm font-semibold text-foreground">{item.value}</span>
                <span className="text-xs text-muted-foreground"> / {item.max}</span>
              </div>
            </div>

            {item.percentage !== null && (
              <div className="h-2 overflow-hidden rounded-full bg-secondary">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    item.color === "eqho-blue"
                      ? "bg-eqho-blue"
                      : item.color === "eqho-green"
                      ? "bg-eqho-green"
                      : "bg-eqho-pink"
                  }`}
                  style={{ width: `${item.percentage}%` }}
                />
              </div>
            )}

            {item.percentage === null && (
              <div className="flex items-center gap-2">
                <div className="h-2 flex-1 overflow-hidden rounded-full bg-gradient-to-r from-eqho-green/30 to-eqho-blue/30">
                  <div className="h-full w-full animate-pulse rounded-full bg-gradient-to-r from-eqho-green/50 to-eqho-blue/50" />
                </div>
                <span className="text-xs font-medium text-eqho-green">Unlimited</span>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Pro Benefits */}
      <div className="mt-8 rounded-lg border border-eqho-blue/20 bg-gradient-to-br from-eqho-blue/5 to-eqho-pink/5 p-4">
        <div className="mb-3 flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-eqho-blue" />
          <span className="text-sm font-semibold text-foreground">Pro Benefits Active</span>
        </div>
        <ul className="space-y-2 text-xs text-muted-foreground">
          <li className="flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-eqho-green" />
            Unlimited projects & exports
          </li>
          <li className="flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-eqho-green" />
            Priority processing queue
          </li>
          <li className="flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-eqho-green" />
            Full AI assistant access
          </li>
        </ul>
      </div>

      {/* Billing Info */}
      <div className="mt-6 border-t border-border/30 pt-6">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Next billing date</span>
          <span className="font-medium text-foreground">Jun 8, 2026</span>
        </div>
        <div className="mt-2 flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Amount</span>
          <span className="font-semibold text-eqho-blue">$29.00</span>
        </div>
      </div>
    </div>
  )
}
