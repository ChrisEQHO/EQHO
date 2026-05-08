"use client"

import { useState } from "react"
import { Send, Sparkles, Clock, Music2, Mic, Wand2, Volume2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

const suggestedPrompts = [
  { icon: Clock, text: "Make this routine exactly 1:30", color: "text-eqho-pink" },
  { icon: Music2, text: "Blend these two songs together at 00:42", color: "text-eqho-green" },
  { icon: Wand2, text: "Add a dramatic ending", color: "text-eqho-blue" },
  { icon: Volume2, text: "Add crowd impact at 01:12", color: "text-eqho-pink" },
  { icon: Sparkles, text: "Create a smoother transition", color: "text-eqho-green" },
  { icon: Mic, text: "Generate intro voiceover", color: "text-eqho-blue" },
  { icon: Music2, text: "Detect best beat drops", color: "text-eqho-pink" },
]

const aiResponses = [
  {
    type: "analysis",
    title: "Routine Analysis Complete",
    content: "I've analyzed your routine. Current length: 1:45. BPM: 128. Key: A Minor. I detected 4 natural section breaks that would work well for trimming.",
    confidence: 94,
  },
  {
    type: "suggestion",
    title: "Suggested Edit",
    content: "Based on your music structure, I recommend cutting the section from 1:30 to 1:45 for the cleanest ending. This preserves the build-up and ends on a strong beat.",
    confidence: 87,
  },
]

export function AIPromptWorkspace() {
  const [prompt, setPrompt] = useState("")
  const [showResponses, setShowResponses] = useState(true)

  return (
    <div className="rounded-xl border border-border/50 bg-card/50 p-5 backdrop-blur-sm">
      <div className="mb-4 flex items-center gap-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-eqho-pink to-eqho-blue">
          <Sparkles className="h-4 w-4 text-white" />
        </div>
        <h2 className="text-lg font-semibold text-foreground">AI Prompt Workspace</h2>
      </div>

      {/* Waveform Preview Area */}
      <div className="mb-4 rounded-lg border border-border/30 bg-eqho-navy/50 p-4">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs text-muted-foreground">Current Project: Summer_Routine_v2.mp3</span>
          <span className="text-xs text-eqho-green">Ready for AI editing</span>
        </div>
        <div className="h-16 flex items-center justify-center">
          {/* Animated Waveform */}
          <div className="flex items-end gap-[2px] h-full">
            {Array.from({ length: 60 }).map((_, i) => {
              const height = Math.sin(i * 0.3) * 30 + 35 + Math.random() * 10
              return (
                <div
                  key={i}
                  className="w-1 rounded-full bg-gradient-to-t from-eqho-pink via-eqho-green to-eqho-blue opacity-60"
                  style={{ height: `${height}%` }}
                />
              )
            })}
          </div>
        </div>
        <div className="mt-2 flex justify-between text-xs text-muted-foreground">
          <span>0:00</span>
          <span>0:45</span>
          <span>1:30</span>
          <span>1:45</span>
        </div>
      </div>

      {/* AI Response Cards */}
      {showResponses && (
        <div className="mb-4 space-y-3">
          {aiResponses.map((response, index) => (
            <div
              key={index}
              className={cn(
                "rounded-lg border p-4 transition-all duration-300 hover-lift",
                response.type === "analysis"
                  ? "border-eqho-blue/30 bg-eqho-blue/5"
                  : "border-eqho-green/30 bg-eqho-green/5"
              )}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <Sparkles className={cn(
                      "h-4 w-4",
                      response.type === "analysis" ? "text-eqho-blue" : "text-eqho-green"
                    )} />
                    <span className="font-medium text-foreground">{response.title}</span>
                  </div>
                  <p className="text-sm text-muted-foreground">{response.content}</p>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <div className={cn(
                    "rounded-full px-2 py-0.5 text-xs font-medium",
                    response.confidence >= 90
                      ? "bg-eqho-green/20 text-eqho-green"
                      : "bg-eqho-blue/20 text-eqho-blue"
                  )}>
                    {response.confidence}% confident
                  </div>
                  <Button size="sm" variant="outline" className="h-7 text-xs">
                    Apply
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Suggested Prompts */}
      <div className="mb-4">
        <span className="text-xs text-muted-foreground mb-2 block">Suggested prompts</span>
        <div className="flex flex-wrap gap-2">
          {suggestedPrompts.map((item, index) => (
            <button
              key={index}
              onClick={() => setPrompt(item.text)}
              className="flex items-center gap-1.5 rounded-full border border-border/50 bg-secondary/50 px-3 py-1.5 text-xs text-muted-foreground transition-all duration-200 hover:bg-secondary hover:text-foreground hover:border-eqho-pink/30 hover:scale-[1.02]"
            >
              <item.icon className={cn("h-3 w-3", item.color)} />
              {item.text}
            </button>
          ))}
        </div>
      </div>

      {/* Prompt Input */}
      <div className="relative">
        <input
          type="text"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Ask EQHO AI to edit your routine..."
          className="w-full rounded-xl border border-border/50 bg-eqho-navy/50 px-4 py-3.5 pr-12 text-sm text-foreground placeholder:text-muted-foreground focus:border-eqho-pink/50 focus:outline-none focus:ring-1 focus:ring-eqho-pink/30 transition-all duration-200"
        />
        <Button
          size="icon"
          className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 rounded-lg bg-gradient-to-r from-eqho-pink to-eqho-blue text-white transition-all duration-200 hover:opacity-90 hover:scale-105"
        >
          <Send className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}
