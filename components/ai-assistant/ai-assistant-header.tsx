"use client"

import { Upload, Wand2 } from "lucide-react"
import { Button } from "@/components/ui/button"

export function AIAssistantHeader() {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 className="text-2xl font-bold tracking-tight lg:text-3xl">
          <span className="gradient-text">AI Assistant</span>
        </h1>
        <p className="mt-1 text-sm text-muted-foreground lg:text-base">
          Use AI to build, edit and refine competition-ready routine music.
        </p>
      </div>
      <div className="flex items-center gap-3">
        <Button
          variant="outline"
          className="gap-2 border-border/50 bg-card/50 text-foreground transition-all duration-200 hover:bg-secondary hover:border-eqho-blue/50"
        >
          <Upload className="h-4 w-4" />
          <span className="hidden sm:inline">Upload Music</span>
        </Button>
        <Button className="gap-2 bg-gradient-to-r from-eqho-pink to-eqho-blue text-white shadow-lg shadow-eqho-pink/20 transition-all duration-200 hover:opacity-90 hover:shadow-xl hover:shadow-eqho-pink/30 hover:scale-[1.02]">
          <Wand2 className="h-4 w-4" />
          <span className="hidden sm:inline">Generate Music</span>
        </Button>
      </div>
    </div>
  )
}
