"use client"

import { cn } from "@/lib/utils"

interface BrowseByCategoryProps {
  selectedCategory: string | null
  onSelectCategory: (category: string | null) => void
}

const categories = [
  { id: "cheerleading", name: "Cheerleading", icon: "🎀", count: 24 },
  { id: "gymnastics", name: "Gymnastics", icon: "🤸", count: 18 },
  { id: "acro", name: "Acro", icon: "🤸‍♀️", count: 12 },
  { id: "dance", name: "Dance", icon: "💃", count: 32 },
  { id: "pom", name: "Pom", icon: "🎊", count: 15 },
  { id: "hip-hop", name: "Hip Hop", icon: "🎤", count: 20 },
  { id: "drill-team", name: "Drill Team", icon: "🎖️", count: 8 },
]

export function BrowseByCategory({ selectedCategory, onSelectCategory }: BrowseByCategoryProps) {
  return (
    <section>
      <h2 className="mb-5 text-lg font-semibold text-foreground">Browse by Category</h2>

      <div className="flex flex-wrap gap-3">
        {categories.map((category) => {
          const isSelected = selectedCategory === category.id
          return (
            <button
              key={category.id}
              onClick={() => onSelectCategory(isSelected ? null : category.id)}
              className={cn(
                "group relative flex items-center gap-3 rounded-xl border px-5 py-3 transition-all duration-200 hover-lift",
                isSelected
                  ? "border-eqho-blue/50 bg-eqho-blue/10 text-foreground shadow-lg shadow-eqho-blue/10"
                  : "border-border/50 bg-card text-muted-foreground hover:border-border hover:bg-secondary hover:text-foreground"
              )}
            >
              {/* Icon */}
              <span className="text-xl">{category.icon}</span>

              {/* Name */}
              <span className="font-medium">{category.name}</span>

              {/* Count Badge */}
              <span
                className={cn(
                  "rounded-full px-2 py-0.5 text-xs font-medium transition-colors duration-200",
                  isSelected
                    ? "bg-eqho-blue/20 text-eqho-blue"
                    : "bg-secondary text-muted-foreground group-hover:bg-background"
                )}
              >
                {category.count}
              </span>

              {/* Selected Indicator */}
              {isSelected && (
                <div className="absolute -bottom-px left-1/2 h-0.5 w-8 -translate-x-1/2 rounded-full bg-eqho-blue" />
              )}
            </button>
          )
        })}
      </div>
    </section>
  )
}
