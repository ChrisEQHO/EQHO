"use client"

import Link from "next/link"
import { Bell, Plus, Search } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

export function Header() {
  return (
    <header className="flex h-16 items-center justify-between border-b border-border/50 bg-background/80 px-4 backdrop-blur-md lg:px-6">
      {/* Welcome Section */}
      <div className="ml-12 lg:ml-0">
        <h1 className="text-lg font-semibold text-foreground lg:text-xl">
          Welcome back, <span className="gradient-text">Alex</span>
        </h1>
        <p className="hidden text-sm text-muted-foreground sm:block">
          {"Let's create something amazing today"}
        </p>
      </div>

      {/* Right Section */}
      <div className="flex items-center gap-2 sm:gap-4">
        {/* Search - Hidden on mobile */}
        <div className="relative hidden md:block">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search routines..."
            className="h-9 w-48 rounded-lg border border-border/50 bg-secondary/50 pl-9 pr-4 text-sm text-foreground placeholder:text-muted-foreground transition-all duration-200 focus:w-64 focus:border-eqho-blue focus:outline-none focus:ring-1 focus:ring-eqho-blue lg:w-64 lg:focus:w-72"
          />
        </div>

        {/* Mobile Search Button */}
        <button className="flex h-9 w-9 items-center justify-center rounded-lg border border-border/50 bg-secondary/50 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground md:hidden">
          <Search className="h-4 w-4" />
        </button>

        {/* Create Button */}
        <Link href="/new-project">
          <Button className="gap-2 bg-gradient-to-r from-eqho-pink to-eqho-blue text-white shadow-lg shadow-eqho-pink/20 transition-all duration-200 hover:opacity-90 hover:shadow-xl hover:shadow-eqho-pink/30 hover:scale-[1.02]">
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">New Project</span>
          </Button>
        </Link>

        {/* Notifications */}
        <button className="relative flex h-9 w-9 items-center justify-center rounded-lg border border-border/50 bg-secondary/50 text-muted-foreground transition-all duration-200 hover:bg-secondary hover:text-foreground hover:scale-105">
          <Bell className="h-4 w-4" />
          <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-eqho-pink text-[10px] font-medium text-white shadow-lg shadow-eqho-pink/30 animate-pulse">
            3
          </span>
        </button>

        {/* Profile */}
        <Avatar className="h-9 w-9 border-2 border-border/50 transition-all duration-200 hover:border-eqho-blue/50 hover:scale-105 cursor-pointer">
          <AvatarImage src="https://api.dicebear.com/7.x/avataaars/svg?seed=alex" />
          <AvatarFallback className="bg-gradient-to-br from-eqho-pink to-eqho-blue text-white text-sm">AK</AvatarFallback>
        </Avatar>
      </div>
    </header>
  )
}
