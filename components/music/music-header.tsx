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
      <div className="mx-auto flex h-16 max-w-6xl items-center gap-4 px-4 sm:px-6">
        <Link href="/music" className="flex items-center gap-2">
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-gradient-to-br from-[#b86cff] to-[#ff4fa3]">
            <Music2 className="h-4 w-4 text-white" aria-hidden="true" />
          </span>
          <span className="text-lg font-semibold tracking-tight">
            EQHO <span className="text-[#b86cff]">Music</span>
          </span>
          <span className="ml-1 hidden rounded-full border border-[#b86cff]/40 bg-[#b86cff]/10 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-[#c9a3ff] sm:inline">
            Preview
          </span>
        </Link>

        <nav className="ml-4 hidden items-center gap-1 md:flex">
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
                  "rounded-full px-4 py-2 text-sm font-medium transition-colors",
                  active
                    ? "bg-white/10 text-white"
                    : "text-white/60 hover:text-white hover:bg-white/5",
                )}
              >
                {item.label}
              </Link>
            )
          })}
        </nav>

        <div className="ml-auto flex items-center gap-2">
          <Link
            href="/music/browse"
            aria-label="Search tracks"
            className="grid h-10 w-10 place-items-center rounded-full text-white/70 transition-colors hover:bg-white/5 hover:text-white md:hidden"
          >
            <Search className="h-5 w-5" aria-hidden="true" />
          </Link>
          <Link
            href="/music/basket"
            className="relative flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-white/10"
          >
            <ShoppingBag className="h-4 w-4" aria-hidden="true" />
            <span className="hidden sm:inline">Basket</span>
            {basketCount > 0 && (
              <span className="grid h-5 min-w-5 place-items-center rounded-full bg-gradient-to-br from-[#b86cff] to-[#ff4fa3] px-1 text-xs font-semibold text-white">
                {basketCount}
              </span>
            )}
          </Link>
        </div>
      </div>
    </header>
  )
}
