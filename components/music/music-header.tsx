"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { ShoppingBag, Search, Music2 } from "lucide-react"
import { useMusicStore } from "@/components/music/music-store"
import { cn } from "@/lib/utils"

const NAV = [
  { href: "/music", label: "Discover" },
  { href: "/music/browse", label: "Browse" },
  { href: "/music/creators", label: "Creators" },
]

export function MusicHeader() {
  const pathname = usePathname()
  const { basketCount } = useMusicStore()

  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-[#050414]/85 backdrop-blur-xl">
      <div className="mx-auto flex max-w-6xl items-center gap-4 px-4 py-3 sm:px-6">
        {/* EQHO Music wordmark — EQHO brand pink→orange gradient */}
        <Link href="/music" className="flex items-center gap-2">
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-gradient-to-br from-[#ff4fa3] to-[#ff8a00] text-white shadow-[0_0_20px_-4px_rgba(255,79,163,0.7)]">
            <Music2 className="h-4 w-4" aria-hidden="true" />
          </span>
          <span className="text-base font-semibold tracking-tight text-white">
            EQHO{" "}
            <span className="bg-gradient-to-r from-[#ff4fa3] to-[#ff8a00] bg-clip-text text-transparent">
              Music
            </span>
          </span>
        </Link>

        <span className="hidden rounded-full border border-white/15 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-white/50 sm:inline">
          Private preview
        </span>

        <nav className="ml-auto hidden items-center gap-1 md:flex">
          {NAV.map((item) => {
            const active =
              item.href === "/music"
                ? pathname === "/music"
                : pathname.startsWith(item.href)
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "rounded-full px-3 py-1.5 text-sm transition-colors",
                  active
                    ? "bg-white/10 text-white"
                    : "text-white/60 hover:text-white",
                )}
              >
                {item.label}
              </Link>
            )
          })}
        </nav>

        <div className="ml-auto flex items-center gap-1 md:ml-2">
          <Link
            href="/music/browse"
            aria-label="Search the catalogue"
            className="grid h-9 w-9 place-items-center rounded-full text-white/60 transition-colors hover:bg-white/10 hover:text-white md:hidden"
          >
            <Search className="h-4 w-4" aria-hidden="true" />
          </Link>
          <Link
            href="/music/basket"
            aria-label={`Basket, ${basketCount} item${basketCount === 1 ? "" : "s"}`}
            className="relative grid h-9 w-9 place-items-center rounded-full text-white/70 transition-colors hover:bg-white/10 hover:text-white"
          >
            <ShoppingBag className="h-4 w-4" aria-hidden="true" />
            {basketCount > 0 && (
              <span className="absolute -right-0.5 -top-0.5 grid h-4 min-w-4 place-items-center rounded-full bg-gradient-to-br from-[#ff4fa3] to-[#ff8a00] px-1 text-[10px] font-semibold text-white">
                {basketCount}
              </span>
            )}
          </Link>
        </div>
      </div>
    </header>
  )
}
