"use client"

import Link from "next/link"
import { Bell, Plus, Search } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

export function TemplatesHeader() {
  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-border/50 bg-background/80 px-4 backdrop-blur-xl lg:px-6">
      {/* Left Side - Spacer for mobile menu */}
      <div className="w-10 lg:w-0" />

      {/* Center - Search (Desktop) */}
      <div className="hidden flex-1 justify-center md:flex">
        <div className="relative w-full max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search templates..."
            className="h-10 w-full rounded-lg border border-border/50 bg-secondary/50 pl-10 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus:border-eqho-blue/50 focus:outline-none focus:ring-1 focus:ring-eqho-blue/50 transition-all duration-200"
          />
        </div>
      </div>

      {/* Right Side - Actions */}
      <div className="flex items-center gap-3">
        {/* Mobile Search Button */}
        <Button
          variant="ghost"
          size="icon"
          className="h-9 w-9 text-muted-foreground hover:text-foreground md:hidden"
        >
          <Search className="h-4 w-4" />
        </Button>

        {/* Create Button */}
        <Link href="/new-project">
          <Button className="gap-2 bg-gradient-to-r from-eqho-pink to-eqho-blue text-white shadow-lg shadow-eqho-pink/20 transition-all duration-200 hover:opacity-90 hover:shadow-xl hover:shadow-eqho-pink/30 hover:scale-[1.02]">
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">New Project</span>
          </Button>
        </Link>

        {/* Notifications */}
        <Button
          variant="ghost"
          size="icon"
          className="relative h-9 w-9 text-muted-foreground hover:text-foreground transition-colors duration-200"
        >
          <Bell className="h-4 w-4" />
          <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-eqho-pink" />
        </Button>

        {/* Avatar */}
        <Avatar className="h-8 w-8 ring-2 ring-border/50 transition-all duration-200 hover:ring-eqho-blue/50">
          <AvatarImage src="/placeholder-user.jpg" alt="User" />
          <AvatarFallback className="bg-gradient-to-br from-eqho-pink/20 to-eqho-blue/20 text-xs font-medium text-foreground">
            JD
          </AvatarFallback>
        </Avatar>
      </div>
    </header>
  )
}
