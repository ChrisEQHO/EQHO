"use client"

import { useState, useEffect } from "react"
import { Undo2, Redo2, Save, Download, Check, Cloud } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export function EditorHeader() {
  const [isSaving, setIsSaving] = useState(false)
  const [lastSaved, setLastSaved] = useState<Date>(new Date())
  const [showSaved, setShowSaved] = useState(false)

  // Simulate autosave
  useEffect(() => {
    const interval = setInterval(() => {
      setLastSaved(new Date())
    }, 30000)
    return () => clearInterval(interval)
  }, [])

  const handleSave = () => {
    setIsSaving(true)
    setTimeout(() => {
      setIsSaving(false)
      setShowSaved(true)
      setLastSaved(new Date())
      setTimeout(() => setShowSaved(false), 2000)
    }, 800)
  }

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
  }

  return (
    <header className="flex h-14 items-center justify-between border-b border-border/50 bg-card/50 px-4 backdrop-blur-sm">
      {/* Left - Project Name */}
      <div className="flex items-center gap-4">
        <div className="flex flex-col">
          <h1 className="text-sm font-semibold text-foreground">Nationals Floor Routine 2024</h1>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Cloud className="h-3 w-3" />
            <span>
              {isSaving ? (
                "Saving..."
              ) : showSaved ? (
                <span className="flex items-center gap-1 text-eqho-green">
                  <Check className="h-3 w-3" />
                  Saved
                </span>
              ) : (
                `Last saved ${formatTime(lastSaved)}`
              )}
            </span>
          </div>
        </div>
      </div>

      {/* Right - Actions */}
      <div className="flex items-center gap-2">
        {/* Undo/Redo */}
        <div className="flex items-center rounded-lg border border-border/50 bg-secondary/50">
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
          >
            <Undo2 className="h-4 w-4" />
          </Button>
          <div className="h-4 w-px bg-border/50" />
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
          >
            <Redo2 className="h-4 w-4" />
          </Button>
        </div>

        {/* Save Button */}
        <Button
          variant="outline"
          size="sm"
          onClick={handleSave}
          disabled={isSaving}
          className={cn(
            "gap-2 border-border/50 transition-all duration-200",
            showSaved && "border-eqho-green/50 text-eqho-green"
          )}
        >
          {showSaved ? <Check className="h-4 w-4" /> : <Save className="h-4 w-4" />}
          <span className="hidden sm:inline">{showSaved ? "Saved" : "Save"}</span>
        </Button>

        {/* Export Button */}
        <Button
          size="sm"
          className="gap-2 bg-gradient-to-r from-eqho-pink to-eqho-blue text-white shadow-lg shadow-eqho-pink/20 transition-all duration-200 hover:opacity-90 hover:shadow-xl hover:shadow-eqho-pink/30"
        >
          <Download className="h-4 w-4" />
          <span className="hidden sm:inline">Export</span>
        </Button>
      </div>
    </header>
  )
}
