"use client"

import { useState } from "react"
import Link from "next/link"
import { Menu, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

const navLinks = [
  { label: "Features", href: "#features" },
  { label: "How It Works", href: "#how-it-works" },
  { label: "Templates", href: "#templates" },
  { label: "Pricing", href: "#pricing" },
]

export function LandingNav() {
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 border-b border-white/5 bg-eqho-navy/80 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Logo */}
        <Link href="/landing" className="flex items-center gap-2">
          <div className="relative flex h-8 w-8 items-center justify-center">
            <div className="absolute inset-0 rounded-lg bg-gradient-to-br from-eqho-pink via-eqho-green to-eqho-blue opacity-80" />
            <span className="relative text-lg font-bold text-white">EQ</span>
          </div>
          <span className="text-xl font-semibold text-white">EQHO</span>
        </Link>

        {/* Desktop Nav */}
        <div className="hidden items-center gap-8 md:flex">
          {navLinks.map((link) => (
            <a
              key={link.label}
              href={link.href}
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-white"
            >
              {link.label}
            </a>
          ))}
        </div>

        {/* Desktop CTA */}
        <div className="hidden items-center gap-3 md:flex">
          <Link href="/">
            <Button variant="ghost" className="text-muted-foreground hover:text-white">
              Log In
            </Button>
          </Link>
          <Link href="/">
            <Button className="bg-gradient-to-r from-eqho-pink to-eqho-blue text-white shadow-lg shadow-eqho-pink/20 transition-all hover:opacity-90 hover:shadow-xl hover:shadow-eqho-pink/30">
              Start Free
            </Button>
          </Link>
        </div>

        {/* Mobile Menu Button */}
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-secondary hover:text-white md:hidden"
        >
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {/* Mobile Menu */}
      <div
        className={cn(
          "border-t border-white/5 bg-eqho-navy/95 backdrop-blur-xl md:hidden",
          mobileOpen ? "block" : "hidden"
        )}
      >
        <div className="space-y-1 px-4 py-4">
          {navLinks.map((link) => (
            <a
              key={link.label}
              href={link.href}
              onClick={() => setMobileOpen(false)}
              className="block rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-white"
            >
              {link.label}
            </a>
          ))}
          <div className="mt-4 flex flex-col gap-2 pt-4 border-t border-white/5">
            <Link href="/">
              <Button variant="ghost" className="w-full justify-center text-muted-foreground hover:text-white">
                Log In
              </Button>
            </Link>
            <Link href="/">
              <Button className="w-full bg-gradient-to-r from-eqho-pink to-eqho-blue text-white">
                Start Free
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </nav>
  )
}
