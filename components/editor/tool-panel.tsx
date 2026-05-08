"use client"

import { useState } from "react"
import { Plus, Wand2, Magnet, Grid3X3, ChevronDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

const gridSizes = ["1/4 Beat", "1/2 Beat", "1 Beat", "2 Beats", "Bar", "Free"]

export function ToolPanel() {
  const [snapEnabled, setSnapEnabled] = useState(true)
  const [gridSize, setGridSize] = useState("1 Beat")
  const [showGridDropdown, setShowGridDropdown] = useState(false)

  return (
    <div className="w-56 shrink-0 border-r border-border/50 bg-card/50 p-4">
      <h3 className="mb-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        Tools
      </h3>

      <div className="space-y-3">
        {/* Add Section */}
        <Button
          variant="outline"
          className="w-full justify-start gap-3 border-border/50 text-foreground hover:bg-secondary transition-all hover:border-eqho-green/50"
        >
          <div className="flex h-7 w-7 items-center justify-center rounded-md bg-eqho-green/20">
            <Plus className="h-4 w-4 text-eqho-green" />
          </div>
          <span>Add Section</span>
        </Button>

        {/* Auto Section */}
        <Button
          variant="outline"
          className="w-full justify-start gap-3 border-border/50 text-foreground hover:bg-secondary transition-all hover:border-eqho-blue/50"
        >
          <div className="flex h-7 w-7 items-center justify-center rounded-md bg-eqho-blue/20">
            <Wand2 className="h-4 w-4 text-eqho-blue" />
          </div>
          <span>Auto Section</span>
        </Button>

        {/* Divider */}
        <div className="my-4 h-px bg-border/50" />

        {/* Snap Toggle */}
        <div className="rounded-lg border border-border/50 bg-secondary/30 p-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Magnet
                className={cn(
                  "h-4 w-4 transition-colors",
                  snapEnabled ? "text-eqho-pink" : "text-muted-foreground"
                )}
              />
              <span className="text-sm font-medium text-foreground">Snap</span>
            </div>
            <button
              onClick={() => setSnapEnabled(!snapEnabled)}
              className={cn(
                "relative h-5 w-9 rounded-full transition-all duration-200",
                snapEnabled
                  ? "bg-eqho-pink"
                  : "bg-secondary"
              )}
            >
              <span
                className={cn(
                  "absolute top-0.5 h-4 w-4 rounded-full bg-white shadow-sm transition-all duration-200",
                  snapEnabled ? "left-[18px]" : "left-0.5"
                )}
              />
            </button>
          </div>
        </div>

        {/* Grid Size Dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowGridDropdown(!showGridDropdown)}
            className="flex w-full items-center justify-between rounded-lg border border-border/50 bg-secondary/30 p-3 text-sm transition-all hover:border-border"
          >
            <div className="flex items-center gap-2">
              <Grid3X3 className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium text-foreground">{gridSize}</span>
            </div>
            <ChevronDown
              className={cn(
                "h-4 w-4 text-muted-foreground transition-transform",
                showGridDropdown && "rotate-180"
              )}
            />
          </button>

          {showGridDropdown && (
            <div className="absolute left-0 right-0 top-full z-10 mt-1 rounded-lg border border-border/50 bg-card py-1 shadow-xl">
              {gridSizes.map((size) => (
                <button
                  key={size}
                  onClick={() => {
                    setGridSize(size)
                    setShowGridDropdown(false)
                  }}
                  className={cn(
                    "flex w-full items-center px-3 py-2 text-sm transition-colors",
                    size === gridSize
                      ? "bg-eqho-blue/10 text-eqho-blue"
                      : "text-foreground hover:bg-secondary"
                  )}
                >
                  {size}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Divider */}
        <div className="my-4 h-px bg-border/50" />

        {/* Quick Tips */}
        <div className="rounded-lg bg-gradient-to-br from-eqho-pink/5 to-eqho-blue/5 p-3">
          <h4 className="mb-2 text-xs font-semibold text-muted-foreground">
            Quick Tip
          </h4>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Hold <kbd className="rounded bg-secondary px-1 py-0.5 text-foreground">Shift</kbd> while dragging to snap clips to the grid.
          </p>
        </div>
      </div>
    </div>
  )
}
