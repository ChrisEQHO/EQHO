'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Menu, X, ArrowRight } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { isV0Preview } from '@/lib/utils/preview'
import { SITE, NAV_LINKS, CTA } from '@/lib/marketing-config'

/**
 * Public marketing header. Sticky, translucent, with a mobile drawer.
 *
 * Auth-aware: it checks the Supabase session client-side and, for signed-in
 * visitors, swaps the "Log in / Start free" pair for a single "Open EQHO" button
 * pointing at the protected player at /app. In v0 preview there is no real session,
 * so it always shows the logged-out CTAs.
 */
export function SiteHeader() {
  const [open, setOpen] = useState(false)
  const [signedIn, setSignedIn] = useState(false)

  useEffect(() => {
    if (isV0Preview) return
    const supabase = createClient()
    if (!supabase) return
    let active = true
    supabase.auth.getUser().then(({ data }) => {
      if (active) setSignedIn(!!data.user)
    })
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      setSignedIn(!!session)
    })
    return () => {
      active = false
      sub.subscription.unsubscribe()
    }
  }, [])

  // Lock body scroll while the mobile drawer is open.
  useEffect(() => {
    if (typeof document === 'undefined') return
    document.body.style.overflow = open ? 'hidden' : ''
    return () => {
      document.body.style.overflow = ''
    }
  }, [open])

  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-[#020617]/80 backdrop-blur-xl">
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
        {/* Logo → home. The image already contains the full "EQHO PLAYER" wordmark,
            so there is NO separate text label. Sized by height (h-11 mobile / h-14
            desktop) with w-auto so the ~2.5:1 lockup keeps its aspect ratio. */}
        <Link href="/" className="flex shrink-0 items-center" aria-label={`${SITE.name} home`}>
          <Image
            src={SITE.logo || "/placeholder.svg"}
            alt={SITE.name}
            width={240}
            height={60}
            priority
            className="h-11 w-auto shrink-0 object-contain md:h-14"
          />
        </Link>

        {/* Desktop nav */}
        <nav className="hidden items-center gap-7 md:flex" aria-label="Primary">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-sm font-medium text-[#94a3b8] transition-colors hover:text-white"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {/* Desktop CTAs */}
        <div className="hidden items-center gap-3 md:flex">
          {signedIn ? (
            <Link
              href={CTA.openApp.href}
              className="inline-flex h-10 items-center gap-1.5 rounded-full bg-gradient-to-r from-[#ff4fa3] to-[#ff8a00] px-5 text-sm font-semibold text-white shadow-[0_4px_20px_rgba(255,79,163,0.3)] transition-transform hover:scale-[1.03]"
            >
              {CTA.openApp.label}
              <ArrowRight className="h-4 w-4" />
            </Link>
          ) : (
            <>
              <Link
                href={CTA.secondary.href}
                className="text-sm font-semibold text-white/90 transition-colors hover:text-white"
              >
                {CTA.secondary.label}
              </Link>
              <Link
                href={CTA.primary.href}
                className="inline-flex h-10 items-center gap-1.5 rounded-full bg-gradient-to-r from-[#ff4fa3] to-[#ff8a00] px-5 text-sm font-semibold text-white shadow-[0_4px_20px_rgba(255,79,163,0.3)] transition-transform hover:scale-[1.03]"
              >
                {CTA.primary.label}
                <ArrowRight className="h-4 w-4" />
              </Link>
            </>
          )}
        </div>

        {/* Mobile menu toggle */}
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-white/10 text-white md:hidden"
          aria-label={open ? 'Close menu' : 'Open menu'}
          aria-expanded={open}
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {/* Mobile drawer */}
      {open && (
        <div className="border-t border-white/10 bg-[#020617] md:hidden">
          <nav className="mx-auto flex w-full max-w-6xl flex-col gap-1 px-4 py-4" aria-label="Mobile">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
                className="rounded-lg px-3 py-3 text-base font-medium text-[#cbd5e1] transition-colors hover:bg-white/5 hover:text-white"
              >
                {link.label}
              </Link>
            ))}
            <div className="mt-3 flex flex-col gap-2 border-t border-white/10 pt-4">
              {signedIn ? (
                <Link
                  href={CTA.openApp.href}
                  onClick={() => setOpen(false)}
                  className="inline-flex h-11 items-center justify-center gap-1.5 rounded-full bg-gradient-to-r from-[#ff4fa3] to-[#ff8a00] px-5 text-sm font-semibold text-white"
                >
                  {CTA.openApp.label}
                  <ArrowRight className="h-4 w-4" />
                </Link>
              ) : (
                <>
                  <Link
                    href={CTA.secondary.href}
                    onClick={() => setOpen(false)}
                    className="inline-flex h-11 items-center justify-center rounded-full border border-white/20 px-5 text-sm font-semibold text-white transition-colors hover:bg-white/10"
                  >
                    {CTA.secondary.label}
                  </Link>
                  <Link
                    href={CTA.primary.href}
                    onClick={() => setOpen(false)}
                    className="inline-flex h-11 items-center justify-center gap-1.5 rounded-full bg-gradient-to-r from-[#ff4fa3] to-[#ff8a00] px-5 text-sm font-semibold text-white"
                  >
                    {CTA.primary.label}
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </>
              )}
            </div>
          </nav>
        </div>
      )}
    </header>
  )
}
