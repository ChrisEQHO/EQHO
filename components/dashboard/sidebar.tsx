"use client"

import { useState } from "react"
import Link from "next/link"
import {
  LayoutDashboard,
  Music,
  FolderOpen,
  Library,
  Sliders,
  Download,
  Settings,
  Crown,
  ChevronLeft,
  Menu,
  X,
  Sparkles,
  Upload,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

const navItems = [
  { icon: LayoutDashboard, label: "Dashboard", href: "/" },
  { icon: Upload, label: "Upload Music", href: "/upload" },
  { icon: Music, label: "My Routines", href: "#" },
  { icon: FolderOpen, label: "Templates", href: "/templates" },
  { icon: Library, label: "Asset Library", href: "/assets" },
  { icon: Sliders, label: "Editor", href: "/editor" },
  { icon: Sparkles, label: "AI Assistant", href: "/ai-assistant" },
  { icon: Download, label: "Exports", href: "/exports" },
  { icon: Settings, label: "Settings", href: "/settings" },
]

interface SidebarProps {
  activePage?: string
}

export function Sidebar({ activePage = "dashboard" }: SidebarProps) {
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <>
      {/* Mobile Menu Button */}
      <button
        onClick={() => setMobileOpen(true)}
        className="fixed left-4 top-4 z-50 flex h-10 w-10 items-center justify-center rounded-lg border border-border/50 bg-card text-foreground lg:hidden"
      >
        <Menu className="h-5 w-5" />
      </button>

      {/* Mobile Overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex h-screen flex-col border-r border-border/50 bg-sidebar sidebar-transition",
          "lg:relative lg:translate-x-0",
          collapsed ? "w-20" : "w-64",
          mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
      >
        {/* Logo */}
        <div className="flex h-16 items-center justify-between border-b border-border/50 px-4">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center">
              <svg
                width="40"
                height="40"
                viewBox="0 0 40 40"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <defs>
                  <linearGradient
                    id="eqho-gradient"
                    x1="0%"
                    y1="0%"
                    x2="100%"
                    y2="100%"
                  >
                    <stop offset="0%" stopColor="#FF4DA6" />
                    <stop offset="50%" stopColor="#00C896" />
                    <stop offset="100%" stopColor="#3D8BFF" />
                  </linearGradient>
                </defs>
                <text
                  x="4"
                  y="28"
                  fill="url(#eqho-gradient)"
                  fontSize="20"
                  fontWeight="700"
                  fontFamily="Poppins, sans-serif"
                >
                  EQ
                </text>
              </svg>
            </div>
            <span
              className={cn(
                "text-xl font-semibold tracking-tight text-foreground transition-opacity duration-200",
                collapsed ? "opacity-0 lg:hidden" : "opacity-100"
              )}
            >
              EQHO
            </span>
          </div>
          {/* Mobile Close Button */}
          <button
            onClick={() => setMobileOpen(false)}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-secondary hover:text-foreground lg:hidden"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1 p-3">
          {navItems.map((item) => {
            const isActive = item.label.toLowerCase().replace(" ", "-") === activePage || 
                           (item.label === "Dashboard" && activePage === "dashboard")
            return (
              <Link
                key={item.label}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className={cn(
                  "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200",
                  isActive
                    ? "bg-eqho-blue/10 text-eqho-blue shadow-sm shadow-eqho-blue/10"
                    : "text-muted-foreground hover:bg-secondary hover:text-foreground hover:translate-x-1"
                )}
              >
                <item.icon
                  className={cn(
                    "h-5 w-5 shrink-0 transition-transform duration-200",
                    isActive && "text-eqho-blue"
                  )}
                />
                <span
                  className={cn(
                    "whitespace-nowrap transition-opacity duration-200",
                    collapsed ? "opacity-0 lg:hidden" : "opacity-100"
                  )}
                >
                  {item.label}
                </span>
              </Link>
            )
          })}
        </nav>

        {/* Upgrade Card */}
        <div
          className={cn(
            "m-3 overflow-hidden rounded-xl bg-gradient-to-br from-eqho-pink/20 via-eqho-green/10 to-eqho-blue/20 p-4 transition-all duration-300",
            collapsed ? "scale-0 opacity-0" : "scale-100 opacity-100"
          )}
        >
          <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-eqho-pink to-eqho-blue shadow-lg shadow-eqho-pink/20">
            <Crown className="h-5 w-5 text-white" />
          </div>
          <h4 className="mb-1 font-semibold text-foreground">Upgrade to Pro</h4>
          <p className="mb-3 text-xs text-muted-foreground">
            Unlock unlimited exports and AI features
          </p>
          <Button
            size="sm"
            className="w-full bg-gradient-to-r from-eqho-pink to-eqho-blue text-white transition-all hover:opacity-90 hover:shadow-lg hover:shadow-eqho-pink/20"
          >
            Upgrade Now
          </Button>
        </div>

        {/* Collapse Button - Desktop only */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="absolute -right-3 top-20 hidden h-6 w-6 items-center justify-center rounded-full border border-border bg-card text-muted-foreground shadow-sm transition-all duration-200 hover:bg-secondary hover:text-foreground hover:scale-110 lg:flex"
        >
          <span
            className={cn(
              "transition-transform duration-300",
              collapsed && "rotate-180"
            )}
          >
            <ChevronLeft className="h-3.5 w-3.5" />
          </span>
        </button>
      </aside>
    </>
  )
}
