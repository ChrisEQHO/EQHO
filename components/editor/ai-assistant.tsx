"use client"

import { useState } from "react"
import { Sparkles, Wand2, Zap, Music, Mic, SlidersHorizontal, Send, ChevronDown, ChevronUp } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

const aiSuggestions = [
  {
    id: 1,
    icon: Wand2,
    title: "Make this transition smoother",
    description: "AI detected an abrupt transition at 0:32",
    color: "eqho-pink",
  },
  {
    id: 2,
    icon: Zap,
    title: "Add more impact at ending",
    description: "Enhance the final hit for a stronger finish",
    color: "eqho-blue",
  },
  {
    id: 3,
    icon: Music,
    title: "Find cleaner beat drop",
    description: "Suggest alternative drop points",
    color: "eqho-green",
  },
  {
    id: 4,
    icon: Mic,
    title: "Generate intro voiceover",
    description: "Create AI voiceover for your intro",
    color: "eqho-pink",
  },
  {
    id: 5,
    icon: SlidersHorizontal,
    title: "Auto-balance my mix",
    description: "Optimize levels across all tracks",
    color: "eqho-blue",
  },
]

const suggestedPrompts = [
  "Make the build more intense",
  "Add reverb to the vocals",
  "Suggest a better ending",
  "Find matching BPM tracks",
]

export function AIAssistant() {
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [inputValue, setInputValue] = useState("")
  const [activeSuggestion, setActiveSuggestion] = useState<number | null>(null)

  return (
    <div
      className={cn(
        "shrink-0 border-l border-border/50 bg-card/50 transition-all duration-300",
        isCollapsed ? "w-12" : "w-80"
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border/50 p-4">
        {!isCollapsed && (
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-eqho-pink/20 to-eqho-blue/20">
              <Sparkles className="h-4 w-4 text-eqho-pink" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-foreground">AI Assistant</h3>
              <p className="text-xs text-muted-foreground">Powered by EQHO AI</p>
            </div>
          </div>
        )}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
        >
          {isCollapsed ? (
            <Sparkles className="h-4 w-4" />
          ) : (
            <ChevronDown className="h-4 w-4 rotate-90" />
          )}
        </button>
      </div>

      {!isCollapsed && (
        <div className="flex h-[calc(100%-65px)] flex-col">
          {/* Suggestions */}
          <div className="flex-1 overflow-auto custom-scrollbar p-4">
            <h4 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Suggestions
            </h4>
            <div className="space-y-2">
              {aiSuggestions.map((suggestion) => (
                <button
                  key={suggestion.id}
                  onClick={() => setActiveSuggestion(
                    activeSuggestion === suggestion.id ? null : suggestion.id
                  )}
                  className={cn(
                    "w-full rounded-lg border p-3 text-left transition-all duration-200 hover-lift group",
                    activeSuggestion === suggestion.id
                      ? "border-eqho-blue/50 bg-eqho-blue/10 shadow-md shadow-eqho-blue/10"
                      : "border-border/50 bg-secondary/30 hover:border-border hover:bg-secondary/50"
                  )}
                >
                  <div className="flex items-start gap-3">
                    <div
                      className={cn(
                        "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-colors",
                        suggestion.color === "eqho-pink" && "bg-eqho-pink/20 text-eqho-pink",
                        suggestion.color === "eqho-green" && "bg-eqho-green/20 text-eqho-green",
                        suggestion.color === "eqho-blue" && "bg-eqho-blue/20 text-eqho-blue"
                      )}
                    >
                      <suggestion.icon className="h-4 w-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">
                        {suggestion.title}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                        {suggestion.description}
                      </p>
                    </div>
                  </div>

                  {/* Action Button (visible when active) */}
                  {activeSuggestion === suggestion.id && (
                    <Button
                      size="sm"
                      className="mt-3 w-full bg-gradient-to-r from-eqho-pink to-eqho-blue text-white shadow-lg shadow-eqho-pink/20 transition-all hover:opacity-90"
                    >
                      <Wand2 className="mr-2 h-3.5 w-3.5" />
                      Apply Suggestion
                    </Button>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Chat Input */}
          <div className="border-t border-border/50 p-4">
            {/* Suggested Prompts */}
            <div className="mb-3 flex flex-wrap gap-1.5">
              {suggestedPrompts.slice(0, 2).map((prompt) => (
                <button
                  key={prompt}
                  onClick={() => setInputValue(prompt)}
                  className="rounded-full bg-secondary/50 px-2.5 py-1 text-[10px] text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
                >
                  {prompt}
                </button>
              ))}
            </div>

            {/* Input Field */}
            <div className="relative">
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="Ask AI anything..."
                className="w-full rounded-lg border border-border/50 bg-secondary/50 py-2.5 pl-4 pr-10 text-sm text-foreground placeholder:text-muted-foreground focus:border-eqho-blue focus:outline-none focus:ring-1 focus:ring-eqho-blue/50 transition-all"
              />
              <button
                className={cn(
                  "absolute right-2 top-1/2 -translate-y-1/2 flex h-7 w-7 items-center justify-center rounded-md transition-all",
                  inputValue
                    ? "bg-gradient-to-r from-eqho-pink to-eqho-blue text-white"
                    : "bg-secondary text-muted-foreground"
                )}
              >
                <Send className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
