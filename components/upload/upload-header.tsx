"use client"

import { Upload, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"

export function UploadHeader() {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          <span className="gradient-text">Upload Music</span>
        </h1>
        <p className="mt-1 text-muted-foreground">
          Upload and prepare your routine music for AI-assisted editing.
        </p>
      </div>
      
      <div className="flex gap-3">
        <Button
          variant="outline"
          className="gap-2 border-border/50 bg-card/50 text-foreground transition-all duration-200 hover:bg-secondary hover:border-eqho-blue/50"
        >
          <Upload className="h-4 w-4" />
          <span className="hidden sm:inline">Upload Files</span>
        </Button>
        <Button className="gap-2 bg-gradient-to-r from-eqho-pink to-eqho-blue text-white shadow-lg shadow-eqho-pink/20 transition-all duration-200 hover:opacity-90 hover:shadow-xl hover:shadow-eqho-pink/30 hover:scale-[1.02]">
          <Plus className="h-4 w-4" />
          <span className="hidden sm:inline">Create Project</span>
        </Button>
      </div>
    </div>
  )
}
