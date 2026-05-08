"use client"

import { CreditCard, Download, Receipt } from "lucide-react"
import { Button } from "@/components/ui/button"

const invoices = [
  {
    id: "INV-2026-0508",
    date: "May 8, 2026",
    amount: "$29.00",
    status: "Paid",
    method: "Visa •••• 4242",
  },
  {
    id: "INV-2026-0408",
    date: "Apr 8, 2026",
    amount: "$29.00",
    status: "Paid",
    method: "Visa •••• 4242",
  },
  {
    id: "INV-2026-0308",
    date: "Mar 8, 2026",
    amount: "$29.00",
    status: "Paid",
    method: "Visa •••• 4242",
  },
]

export function BillingHistory() {
  return (
    <div className="rounded-xl border border-border/50 bg-card p-6 hover-lift">
      <div className="mb-6 flex items-center justify-between">
        <h3 className="text-lg font-semibold text-foreground">Billing History</h3>
        <Button
          variant="outline"
          size="sm"
          className="gap-2 border-border/50 bg-secondary/50 text-muted-foreground hover:bg-secondary hover:text-foreground"
        >
          <CreditCard className="h-4 w-4" />
          Manage Payment
        </Button>
      </div>

      <div className="space-y-3">
        {invoices.map((invoice) => (
          <div
            key={invoice.id}
            className="group flex items-center justify-between rounded-lg border border-border/30 bg-secondary/20 p-4 transition-all duration-200 hover:border-border/50 hover:bg-secondary/30"
          >
            <div className="flex items-center gap-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-eqho-blue/10">
                <Receipt className="h-5 w-5 text-eqho-blue" />
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">{invoice.id}</p>
                <p className="text-xs text-muted-foreground">{invoice.date}</p>
              </div>
            </div>

            <div className="flex items-center gap-6">
              <div className="text-right">
                <p className="text-sm font-semibold text-foreground">{invoice.amount}</p>
                <p className="text-xs text-muted-foreground">{invoice.method}</p>
              </div>

              <span className="rounded-full bg-eqho-green/20 px-2.5 py-1 text-xs font-medium text-eqho-green">
                {invoice.status}
              </span>

              <Button
                variant="ghost"
                size="sm"
                className="opacity-0 transition-opacity group-hover:opacity-100"
              >
                <Download className="h-4 w-4 text-muted-foreground hover:text-foreground" />
              </Button>
            </div>
          </div>
        ))}
      </div>

      {/* Empty State */}
      {invoices.length === 0 && (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-secondary">
            <Receipt className="h-8 w-8 text-muted-foreground" />
          </div>
          <p className="text-sm font-medium text-foreground">No billing history</p>
          <p className="text-xs text-muted-foreground">Your invoices will appear here</p>
        </div>
      )}
    </div>
  )
}
