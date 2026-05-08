"use client"

import { Search, X, Filter } from "lucide-react"
import { Button } from "@/components/ui/button"

interface TemplateFiltersProps {
  filters: {
    search: string
    sport: string
    length: string
    level: string
  }
  onFilterChange: (key: "search" | "sport" | "length" | "level", value: string) => void
  onClearFilters: () => void
  hasActiveFilters: boolean
}

const sportOptions = [
  { value: "all", label: "All Sports" },
  { value: "cheerleading", label: "Cheerleading" },
  { value: "gymnastics", label: "Gymnastics" },
  { value: "acro", label: "Acro" },
  { value: "dance", label: "Dance" },
  { value: "pom", label: "Pom" },
  { value: "hip-hop", label: "Hip Hop" },
  { value: "drill-team", label: "Drill Team" },
]

const lengthOptions = [
  { value: "all", label: "All Lengths" },
  { value: "60", label: "60 seconds" },
  { value: "90", label: "90 seconds" },
  { value: "120", label: "2 minutes" },
  { value: "150", label: "2:30" },
  { value: "180", label: "3 minutes" },
]

const levelOptions = [
  { value: "all", label: "All Levels" },
  { value: "beginner", label: "Beginner" },
  { value: "intermediate", label: "Intermediate" },
  { value: "elite", label: "Elite" },
  { value: "professional", label: "Professional" },
]

export function TemplateFilters({
  filters,
  onFilterChange,
  onClearFilters,
  hasActiveFilters,
}: TemplateFiltersProps) {
  return (
    <div className="glass-panel rounded-xl p-4">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:gap-3">
        {/* Search Input */}
        <div className="relative flex-1 lg:max-w-xs">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            value={filters.search}
            onChange={(e) => onFilterChange("search", e.target.value)}
            placeholder="Search templates..."
            className="h-10 w-full rounded-lg border border-border/50 bg-background/50 pl-10 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus:border-eqho-blue/50 focus:outline-none focus:ring-1 focus:ring-eqho-blue/50 transition-all duration-200"
          />
        </div>

        {/* Filter Selects */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Filter className="h-4 w-4" />
            <span className="hidden text-sm sm:inline">Filters:</span>
          </div>

          {/* Sport Filter */}
          <select
            value={filters.sport}
            onChange={(e) => onFilterChange("sport", e.target.value)}
            className="h-10 rounded-lg border border-border/50 bg-background/50 px-3 text-sm text-foreground focus:border-eqho-blue/50 focus:outline-none focus:ring-1 focus:ring-eqho-blue/50 transition-all duration-200 cursor-pointer"
          >
            {sportOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>

          {/* Length Filter */}
          <select
            value={filters.length}
            onChange={(e) => onFilterChange("length", e.target.value)}
            className="h-10 rounded-lg border border-border/50 bg-background/50 px-3 text-sm text-foreground focus:border-eqho-blue/50 focus:outline-none focus:ring-1 focus:ring-eqho-blue/50 transition-all duration-200 cursor-pointer"
          >
            {lengthOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>

          {/* Level Filter */}
          <select
            value={filters.level}
            onChange={(e) => onFilterChange("level", e.target.value)}
            className="h-10 rounded-lg border border-border/50 bg-background/50 px-3 text-sm text-foreground focus:border-eqho-blue/50 focus:outline-none focus:ring-1 focus:ring-eqho-blue/50 transition-all duration-200 cursor-pointer"
          >
            {levelOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>

          {/* Clear Filters */}
          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onClearFilters}
              className="h-10 gap-2 text-muted-foreground hover:text-foreground transition-all duration-200"
            >
              <X className="h-4 w-4" />
              Clear filters
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
