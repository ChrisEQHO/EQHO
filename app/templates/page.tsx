"use client"

import { useState } from "react"
import Link from "next/link"
import { Sidebar } from "@/components/dashboard/sidebar"
import { TemplatesHeader } from "@/components/templates/header"
import { TemplateFilters } from "@/components/templates/filters"
import { PopularTemplates } from "@/components/templates/popular-templates"
import { BrowseByCategory } from "@/components/templates/browse-by-category"
import { RecentlyAdded } from "@/components/templates/recently-added"
import { InfoCard } from "@/components/templates/info-card"

export default function TemplatesPage() {
  const [filters, setFilters] = useState({
    search: "",
    sport: "all",
    length: "all",
    level: "all",
  })

  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)

  const updateFilter = (key: keyof typeof filters, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }))
  }

  const clearFilters = () => {
    setFilters({
      search: "",
      sport: "all",
      length: "all",
      level: "all",
    })
    setSelectedCategory(null)
  }

  const hasActiveFilters =
    filters.search !== "" ||
    filters.sport !== "all" ||
    filters.length !== "all" ||
    filters.level !== "all" ||
    selectedCategory !== null

  return (
    <div className="flex min-h-screen bg-background">
      {/* Sidebar */}
      <Sidebar activePage="templates" />

      {/* Main Content */}
      <div className="flex flex-1 flex-col">
        {/* Header */}
        <TemplatesHeader />

        {/* Templates Content */}
        <main className="relative flex-1 overflow-auto custom-scrollbar">
          {/* Waveform Background Accents */}
          <div className="pointer-events-none absolute inset-0 overflow-hidden">
            <svg
              className="absolute -right-20 -top-10 h-64 w-96 opacity-[0.03] waveform-accent"
              viewBox="0 0 200 80"
              preserveAspectRatio="none"
            >
              <path
                d="M0,40 Q10,20 20,40 Q30,60 40,40 Q50,20 60,40 Q70,60 80,40 Q90,20 100,40 Q110,60 120,40 Q130,20 140,40 Q150,60 160,40 Q170,20 180,40 Q190,60 200,40"
                fill="none"
                stroke="url(#wave-gradient-tpl-1)"
                strokeWidth="3"
              />
              <defs>
                <linearGradient id="wave-gradient-tpl-1" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#FF4DA6" />
                  <stop offset="100%" stopColor="#00C896" />
                </linearGradient>
              </defs>
            </svg>

            <svg
              className="absolute -bottom-10 -left-20 h-48 w-80 opacity-[0.03] waveform-accent"
              viewBox="0 0 200 60"
              preserveAspectRatio="none"
              style={{ animationDelay: "2s" }}
            >
              <path
                d="M0,30 Q10,15 20,30 Q30,45 40,30 Q50,15 60,30 Q70,45 80,30 Q90,15 100,30 Q110,45 120,30 Q130,15 140,30 Q150,45 160,30 Q170,15 180,30 Q190,45 200,30"
                fill="none"
                stroke="url(#wave-gradient-tpl-2)"
                strokeWidth="2"
              />
              <defs>
                <linearGradient id="wave-gradient-tpl-2" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#3D8BFF" />
                  <stop offset="100%" stopColor="#00C896" />
                </linearGradient>
              </defs>
            </svg>
          </div>

          {/* Content */}
          <div className="relative px-4 py-6 lg:px-6 lg:py-8">
            <div className="mx-auto max-w-7xl space-y-8">
              {/* Page Header */}
              <div>
                <h1 className="mb-2 text-2xl font-semibold text-foreground lg:text-3xl">
                  Template Library
                </h1>
                <p className="text-muted-foreground">
                  Start with a professional structure built for your sport, level and routine length.
                </p>
              </div>

              {/* Filters */}
              <TemplateFilters
                filters={filters}
                onFilterChange={updateFilter}
                onClearFilters={clearFilters}
                hasActiveFilters={hasActiveFilters}
              />

              {/* Popular Templates */}
              <PopularTemplates filters={filters} selectedCategory={selectedCategory} />

              {/* Browse by Category */}
              <BrowseByCategory
                selectedCategory={selectedCategory}
                onSelectCategory={setSelectedCategory}
              />

              {/* Recently Added */}
              <RecentlyAdded filters={filters} selectedCategory={selectedCategory} />

              {/* Info Card */}
              <InfoCard />
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
