"use client"

import { ArrowLeft, Bell, User } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"

export function NewProjectHeader() {
  return (
    <header className="flex h-16 shrink-0 items-center justify-between border-b border-border/50 bg-card/50 px-4 backdrop-blur-sm lg:px-6">
      <div className="flex items-center gap-4 pl-12 lg:pl-0">
        <Link href="/">
          <Button
            variant="ghost"
            size="sm"
            className="gap-2 text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            <span className="hidden sm:inline">Back to Dashboard</span>
          </Button>
        </Link>
      </div>

      <div className="flex items-center gap-3">
        {/* Notifications */}
        <button className="relative flex h-10 w-10 items-center justify-center rounded-lg border border-border/50 bg-card text-muted-foreground transition-all duration-200 hover:border-eqho-blue/50 hover:text-foreground hover:shadow-md hover:shadow-eqho-blue/5">
          <Bell className="h-5 w-5" />
          <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-eqho-pink text-[10px] font-medium text-white">
            2
          </span>
        </button>

        {/* User Avatar */}
        <button className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-eqho-pink/20 to-eqho-blue/20 text-foreground transition-all duration-200 hover:from-eqho-pink/30 hover:to-eqho-blue/30 hover:shadow-md hover:shadow-eqho-pink/10">
          <User className="h-5 w-5" />
        </button>
      </div>
    </header>
  )
}
