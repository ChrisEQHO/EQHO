"use client"

import { useState } from "react"
import { Search, Filter, SortAsc, Tag, Clock, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

const categories = ["All", "Music", "Voiceovers", "Sound FX", "Risers"]
const sortOptions = ["Recent", "Name A-Z", "Duration", "BPM"]

export function AssetsFilters() {
  const [search, setSearch] = useState("")
  const [activeCategory, setActiveCategory] = useState("All")
  const [activeSort, setActiveSort] = useState("Recent")
  const [recentOnly, setRecentOnly] = useState(false)
  const [showFilters, setShowFilters] = useState(false)

  const hasActiveFilters = activeCategory !== "All" || activeSort !== "Recent" || recentOnly || search

  return (
    <div className="space-y-4">
      {/* Main Filter Bar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search assets..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-10 w-full rounded-lg border border-border/50 bg-card/50 pl-10 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus:border-eqho-blue/50 focus:outline-none focus:ring-1 focus:ring-eqho-blue/30 transition-all"
          />
        </div>

        {/* Filter Buttons */}
        <div className="flex items-center gap-2">
          {/* Category Dropdown */}
          <div className="relative">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
              className={cn(
                "gap-2 border-border/50 bg-card/50 transition-all",
                activeCategory !== "All" && "border-eqho-blue/50 text-eqho-blue"
              )}
            >
              <Filter className="h-4 w-4" />
              <span className="hidden sm:inline">{activeCategory}</span>
            </Button>
          </div>

          {/* Sort Dropdown */}
          <div className="relative group">
            <Button
              variant="outline"
              size="sm"
              className="gap-2 border-border/50 bg-card/50"
            >
              <SortAsc className="h-4 w-4" />
              <span className="hidden sm:inline">{activeSort}</span>
            </Button>
            <div className="absolute right-0 top-full z-10 mt-1 hidden min-w-[140px] rounded-lg border border-border/50 bg-card p-1 shadow-lg group-hover:block">
              {sortOptions.map((option) => (
                <button
                  key={option}
                  onClick={() => setActiveSort(option)}
                  className={cn(
                    "w-full rounded-md px-3 py-2 text-left text-sm transition-colors",
                    activeSort === option
                      ? "bg-eqho-blue/10 text-eqho-blue"
                      : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                  )}
                >
                  {option}
                </button>
              ))}
            </div>
          </div>

          {/* Tags Filter */}
          <Button
            variant="outline"
            size="sm"
            className="gap-2 border-border/50 bg-card/50"
          >
            <Tag className="h-4 w-4" />
            <span className="hidden sm:inline">Tags</span>
          </Button>

          {/* Recent Toggle */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setRecentOnly(!recentOnly)}
            className={cn(
              "gap-2 border-border/50 bg-card/50 transition-all",
              recentOnly && "border-eqho-green/50 text-eqho-green bg-eqho-green/10"
            )}
          >
            <Clock className="h-4 w-4" />
            <span className="hidden sm:inline">Recent</span>
          </Button>

          {/* Clear Filters */}
          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setSearch("")
                setActiveCategory("All")
                setActiveSort("Recent")
                setRecentOnly(false)
              }}
              className="gap-1 text-muted-foreground hover:text-destructive"
            >
              <X className="h-4 w-4" />
              <span className="hidden sm:inline">Clear</span>
            </Button>
          )}
        </div>
      </div>

      {/* Category Pills */}
      {showFilters && (
        <div className="flex flex-wrap gap-2 rounded-lg border border-border/50 bg-card/30 p-3">
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => setActiveCategory(category)}
              className={cn(
                "rounded-full px-4 py-1.5 text-sm font-medium transition-all duration-200",
                activeCategory === category
                  ? "bg-gradient-to-r from-eqho-pink to-eqho-blue text-white shadow-md"
                  : "bg-secondary text-muted-foreground hover:bg-secondary/80 hover:text-foreground"
              )}
            >
              {category}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
