'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Menu, X, ArrowRight } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { isV0Preview } from '@/lib/utils/preview'
import { SITE, NAV_LINKS, CTA, getOfferCopy } from '@/lib/marketing-config'
 import { handleSectionLinkClick } from '@/lib/utils/scroll-to-section'
 import { trackEvent } from '@/lib/analytics/track-event'

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
  // Date-driven CTA label: "Create free account" during the free phase,
  // "Start free trial" once the paywall is live — consistent with every other
  // marketing surface and the entitlement authority.
  const headerCtaLabel = getOfferCopy().preLaunch ? 'Create free account' : CTA.headerCta.label
  // Slightly increase the header opacity once the page scrolls, so content
  // passing beneath the sticky glass header can't reduce readability.
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

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
    <header
      className="sticky top-0 z-50 [backdrop-filter:blur(18px)_saturate(120%)] [-webkit-backdrop-filter:blur(18px)_saturate(120%)]"
      style={{
        // Deep translucent blue-black. A touch more opaque once scrolled, and
        // stronger again on mobile via the media-query custom prop below.
        borderBottom: '1px solid rgba(118, 132, 190, 0.16)',
        // Extend the glass bar under the iOS status bar / Dynamic Island in the
        // native app so nav content clears it. env() is 0 in normal browsers, so
        // this has no visual effect on the website. The absolute inset-0 bg layers
        // fill this padding, keeping the glass continuous to the top edge.
        paddingTop: 'env(safe-area-inset-top)',
      }}
    >
      {/* z-0 — base translucent navy, opacity bumps after scroll */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 z-0 transition-colors duration-300"
        style={{ backgroundColor: scrolled ? 'rgba(3, 7, 25, 0.92)' : 'rgba(3, 7, 25, 0.82)' }}
      />
      {/* mobile: condensed nav needs stronger separation (~0.94) */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 z-0 md:hidden"
        style={{ backgroundColor: 'rgba(3, 7, 25, 0.94)' }}
      />
      {/* z-0 — horizontal brand gradient: navy left → indigo centre → faint violet
          near the Start free button. Lets a little hero atmosphere show through. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 z-0 bg-[linear-gradient(90deg,rgba(2,6,23,0.55)_0%,rgba(30,27,75,0.42)_50%,rgba(76,29,149,0.3)_100%)]"
      />
      {/* z-0 — soft 28px gradient fade beneath the header into the hero */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-full z-0 h-7 bg-gradient-to-b from-[rgba(3,7,25,0.55)] to-transparent"
      />

      <div className="relative z-[1] mx-auto flex h-16 w-full max-w-6xl items-center gap-4 px-4 sm:px-6 lg:gap-6">
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

        {/* Desktop nav — centred and evenly distributed in the space between the
            logo and the CTAs. `flex-1` claims the middle, `justify-center` spreads
            the links, and `whitespace-nowrap` keeps each label on one line. */}
        <nav
          className="hidden flex-1 items-center justify-center gap-5 md:flex lg:gap-8"
          aria-label="Primary"
        >
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={(e) => handleSectionLinkClick(e, link.href)}
              className="whitespace-nowrap text-sm font-medium text-[#aeb9d4] transition-colors hover:text-white hover:[text-shadow:0_0_14px_rgba(129,140,248,0.55)]"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {/* Desktop CTAs */}
        <div className="hidden shrink-0 items-center gap-3 md:flex">
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
                onClick={() => trackEvent('Login Clicked', { location: 'header' })}
                className="whitespace-nowrap text-sm font-semibold text-white/90 transition-colors hover:text-white"
              >
                {CTA.secondary.label}
              </Link>
              <Link
                href={CTA.headerCta.href}
                onClick={() => trackEvent('Create Account Clicked', { location: 'header' })}
                className="inline-flex h-10 items-center gap-1.5 whitespace-nowrap rounded-full bg-gradient-to-r from-[#ff4fa3] to-[#ff8a00] px-5 text-sm font-semibold text-white shadow-[0_4px_20px_rgba(255,79,163,0.3)] transition-transform hover:scale-[1.03]"
              >
                {headerCtaLabel}
                <ArrowRight className="h-4 w-4" />
              </Link>
            </>
          )}
        </div>

        {/* Mobile menu toggle */}
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="ml-auto inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-white/10 text-white md:hidden"
          aria-label={open ? 'Close menu' : 'Open menu'}
          aria-expanded={open}
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {/* Mobile drawer.
          NOTE: `relative z-[1]` is REQUIRED. The header's translucent background
          layers are `absolute inset-0 z-0`, and `inset-0` also covers this drawer's
          height. A statically-positioned drawer paints BENEATH positioned z-0
          elements, so without this the links render behind the opaque navy panel
          and the menu looks empty. Lifting it to z-[1] (like the top row) fixes it. */}
      {open && (
        <div className="relative z-[1] border-t border-white/10 bg-[#020617] md:hidden">
          <nav className="mx-auto flex w-full max-w-6xl flex-col gap-1 px-4 py-4" aria-label="Mobile">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={(e) => {
                  handleSectionLinkClick(e, link.href)
                  setOpen(false)
                }}
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
                  onClick={() => {
                    trackEvent('Login Clicked', { location: 'header' })
                    setOpen(false)
                  }}
                  className="inline-flex h-11 items-center justify-center rounded-full border border-white/20 px-5 text-sm font-semibold text-white transition-colors hover:bg-white/10"
                  >
                    {CTA.secondary.label}
                  </Link>
                  <Link
                  href={CTA.headerCta.href}
                  onClick={() => {
                    trackEvent('Create Account Clicked', { location: 'header' })
                    setOpen(false)
                  }}
                  className="inline-flex h-11 items-center justify-center gap-1.5 rounded-full bg-gradient-to-r from-[#ff4fa3] to-[#ff8a00] px-5 text-sm font-semibold text-white"
                  >
                    {headerCtaLabel}
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
