"use client"

import { Upload, FolderPlus } from "lucide-react"
import { Button } from "@/components/ui/button"

export function AssetsHeader() {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 className="text-2xl font-semibold text-foreground lg:text-3xl">
          Asset <span className="gradient-text">Library</span>
        </h1>
        <p className="mt-1 text-sm text-muted-foreground lg:text-base">
          Manage music, effects, voiceovers and routine assets.
        </p>
      </div>

      <div className="flex items-center gap-3">
        <Button
          variant="outline"
          className="gap-2 border-border/50 bg-card/50 text-foreground transition-all duration-200 hover:bg-secondary hover:border-eqho-blue/50"
        >
          <FolderPlus className="h-4 w-4" />
          <span className="hidden sm:inline">Create Folder</span>
        </Button>
        <Button className="gap-2 bg-gradient-to-r from-eqho-pink to-eqho-blue text-white shadow-lg shadow-eqho-pink/20 transition-all duration-200 hover:opacity-90 hover:shadow-xl hover:shadow-eqho-pink/30 hover:scale-[1.02]">
          <Upload className="h-4 w-4" />
          <span className="hidden sm:inline">Upload Files</span>
        </Button>
      </div>
    </div>
  )
}
