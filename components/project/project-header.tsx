"use client"

import { Clock, Share2, Download, MoreHorizontal, ChevronLeft } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export function ProjectHeader() {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      {/* Left Side */}
      <div className="flex items-start gap-4">
        <Link
          href="/"
          className="mt-1 flex h-8 w-8 items-center justify-center rounded-lg border border-border/50 bg-card text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
        >
          <ChevronLeft className="h-4 w-4" />
        </Link>

        <div>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-bold text-foreground">
              Nationals Floor Routine 2024
            </h1>
            <span className="rounded-full bg-eqho-pink/10 px-3 py-1 text-xs font-medium text-eqho-pink">
              Gymnastics
            </span>
            <span className="rounded-full bg-eqho-green/10 px-3 py-1 text-xs font-medium text-eqho-green">
              In Progress
            </span>
          </div>

          <div className="mt-2 flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5" />
              <span>1:30 duration</span>
            </div>
            <span className="text-border">|</span>
            <span>Last edited 2 hours ago</span>
            <span className="text-border">|</span>
            <span>v3.2</span>
          </div>
        </div>
      </div>

      {/* Right Side Actions */}
      <div className="flex items-center gap-2 pl-12 sm:pl-0">
        <Button
          variant="outline"
          size="sm"
          className="gap-2 border-border/50 bg-card text-foreground hover:bg-secondary"
        >
          <Share2 className="h-4 w-4" />
          <span className="hidden sm:inline">Share</span>
        </Button>

        <Button
          size="sm"
          className="gap-2 bg-gradient-to-r from-eqho-pink to-eqho-blue text-white shadow-lg shadow-eqho-pink/20 transition-all hover:opacity-90 hover:shadow-xl hover:shadow-eqho-pink/30"
        >
          <Download className="h-4 w-4" />
          <span className="hidden sm:inline">Quick Export</span>
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="h-9 w-9 border-border/50 bg-card p-0 text-muted-foreground hover:bg-secondary hover:text-foreground"
            >
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem>Duplicate Project</DropdownMenuItem>
            <DropdownMenuItem>Rename</DropdownMenuItem>
            <DropdownMenuItem>Archive</DropdownMenuItem>
            <DropdownMenuItem className="text-destructive">Delete</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  )
}
