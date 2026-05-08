"use client"

import { Download, Share2 } from "lucide-react"
import { Button } from "@/components/ui/button"

export function ExportsHeader() {
  return (
    <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          <span className="gradient-text">Exports & Sharing</span>
        </h1>
        <p className="mt-1 text-muted-foreground">
          Manage exports, approvals and review links for your routines.
        </p>
      </div>

      <div className="flex items-center gap-3">
        <Button
          variant="outline"
          className="gap-2 border-border/50 bg-card hover:bg-secondary hover:border-eqho-blue/50 transition-all duration-200"
        >
          <Share2 className="h-4 w-4" />
          <span className="hidden sm:inline">Share Project</span>
        </Button>
        <Button className="gap-2 bg-gradient-to-r from-eqho-pink to-eqho-blue text-white shadow-lg shadow-eqho-pink/20 transition-all duration-200 hover:opacity-90 hover:shadow-xl hover:shadow-eqho-pink/30 hover:scale-[1.02]">
          <Download className="h-4 w-4" />
          <span className="hidden sm:inline">New Export</span>
        </Button>
      </div>
    </div>
  )
}
