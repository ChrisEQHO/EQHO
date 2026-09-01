import type { Metadata } from 'next'
import { SiteHeader } from '@/components/marketing/site-header'
import { SiteFooter } from '@/components/marketing/site-footer'
import { BrandDownloads } from '@/components/brand/brand-downloads'
import { SITE } from '@/lib/marketing-config'

export const metadata: Metadata = {
  title: `Brand & style guide — ${SITE.name}`,
  description:
    'The EQHO Player brand kit: colours, gradients, typography, corner radius and imagery rules, with downloadable design tokens for designers.',
  alternates: { canonical: '/brand' },
  robots: { index: false, follow: false },
  openGraph: {
    type: 'website',
    url: `${SITE.url}/brand`,
    siteName: SITE.name,
    title: `Brand & style guide — ${SITE.name}`,
    description:
      'Colours, gradients, typography and imagery rules, with downloadable design tokens.',
  },
}

const CORE = [
  { name: 'Canvas / Deep Navy', hex: '#020617', use: 'Primary background everywhere — app, marketing, browser theme-color.', border: true },
  { name: 'EQHO Pink', hex: '#ff4fa3', use: 'Brand gradient start. The primary action colour.' },
  { name: 'EQHO Orange', hex: '#ff8a00', use: 'Brand gradient end. Warm accent.' },
]

const OFFER = [
  { name: 'Offer Blue', hex: '#2563eb' },
  { name: 'Offer Cyan', hex: '#06b6d4' },
  { name: 'Offer Green', hex: '#10b981' },
]

const NEUTRALS = [
  { name: 'Text / White', hex: '#ffffff', use: 'Headings and primary text.', border: true },
  { name: 'Muted Slate', hex: '#aeb9d4', use: 'Secondary navigation.' },
  { name: 'Subtle Slate', hex: '#cbd5e1', use: 'Tertiary text.' },
  { name: 'Faint Slate', hex: '#94a3b8', use: 'Timestamps, fine print, disabled.' },
  { name: 'Ambient Indigo', hex: '#1e1b4b', use: 'Header wash (~42% opacity).' },
  { name: 'Ambient Violet', hex: '#4c1d95', use: 'Header wash (~30% opacity).' },
]

const GRADIENTS = [
  { name: 'Brand (horizontal)', css: 'linear-gradient(90deg,#ff4fa3 0%,#ff8a00 100%)', code: 'linear-gradient(90deg, #ff4fa3, #ff8a00)' },
  { name: 'Brand (diagonal)', css: 'linear-gradient(135deg,#ff4fa3 0%,#ff8a00 100%)', code: 'linear-gradient(135deg, #ff4fa3, #ff8a00)' },
  { name: 'Free-offer accent', css: 'linear-gradient(90deg,#2563eb 0%,#06b6d4 50%,#10b981 100%)', code: 'linear-gradient(90deg, #2563eb, #06b6d4, #10b981)' },
  { name: 'Header ambient', css: 'linear-gradient(90deg,rgba(2,6,23,1) 0%,rgba(30,27,75,1) 50%,rgba(76,29,149,1) 100%)', code: 'rgba(2,6,23,.55) → rgba(30,27,75,.42) → rgba(76,29,149,.30)' },
]

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="mb-6 border-b border-white/10 pb-3 text-xs font-bold uppercase tracking-[0.16em] text-slate-500">
      {children}
    </h2>
  )
}

function Swatch({ hex, name, use, border }: { hex: string; name: string; use?: string; border?: boolean }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03]">
      <div className="h-24" style={{ backgroundColor: hex, borderBottom: border ? '1px solid rgba(255,255,255,0.1)' : undefined }} />
      <div className="p-4">
        <div className="text-sm font-semibold text-white">{name}</div>
        <div className="mt-0.5 font-mono text-[13px] text-slate-500">{hex}</div>
        {use ? <div className="mt-2 text-xs leading-relaxed text-slate-400">{use}</div> : null}
      </div>
    </div>
  )
}

export default function BrandPage() {
  return (
    <>
      <SiteHeader />
      <main className="bg-[#020617] text-white">
        {/* Hero */}
        <section className="relative overflow-hidden border-b border-white/10">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[420px] bg-[radial-gradient(70%_60%_at_50%_-10%,rgba(255,79,163,0.16),transparent_60%)]"
          />
          <div className="mx-auto w-full max-w-5xl px-4 pb-12 pt-14 sm:px-6 sm:pt-20">
            <p className="text-[13px] font-bold uppercase tracking-[0.18em] text-[#ff4fa3]">Brand &amp; style guide</p>
            <h1 className="mt-3 text-balance text-4xl font-extrabold leading-[1.05] tracking-tight sm:text-6xl">
              The{' '}
              <span className="bg-gradient-to-r from-[#ff4fa3] to-[#ff8a00] bg-clip-text text-transparent">EQHO Player</span>{' '}
              brand kit
            </h1>
            <p className="mt-4 max-w-2xl text-pretty text-lg leading-relaxed text-slate-300">
              Everything a designer needs to work in the EQHO visual language — colours, gradients, typography, corner
              radius and imagery rules. Every value below is taken directly from the live product.
            </p>
          </div>
        </section>

        <div className="mx-auto w-full max-w-5xl px-4 py-14 sm:px-6">
          {/* Downloads */}
          <section className="mb-16">
            <SectionTitle>Download the kit</SectionTitle>
            <BrandDownloads />
          </section>

          {/* Core colours */}
          <section className="mb-16">
            <SectionTitle>Core colours</SectionTitle>
            <div className="grid gap-4 sm:grid-cols-3">
              {CORE.map((c) => (
                <Swatch key={c.hex} {...c} />
              ))}
            </div>
          </section>

          {/* Offer accent */}
          <section className="mb-16">
            <SectionTitle>Free-offer accent</SectionTitle>
            <p className="-mt-2 mb-6 text-sm text-slate-400">
              Used only for the limited &ldquo;free to use until 1 October 2026&rdquo; messaging — never mixed with the
              pink/orange brand gradient.
            </p>
            <div className="grid gap-4 sm:grid-cols-3">
              {OFFER.map((c) => (
                <Swatch key={c.hex} {...c} />
              ))}
            </div>
          </section>

          {/* Neutrals */}
          <section className="mb-16">
            <SectionTitle>Neutrals &amp; text</SectionTitle>
            <div className="grid gap-4 sm:grid-cols-3">
              {NEUTRALS.map((c) => (
                <Swatch key={c.hex} {...c} />
              ))}
            </div>
          </section>

          {/* Gradients */}
          <section className="mb-16">
            <SectionTitle>Signature gradients</SectionTitle>
            <div className="grid gap-4 sm:grid-cols-2">
              {GRADIENTS.map((g) => (
                <div key={g.name} className="overflow-hidden rounded-2xl border border-white/10">
                  <div className="h-28" style={{ background: g.css }} />
                  <div className="bg-white/[0.03] p-4">
                    <div className="font-semibold text-white">{g.name}</div>
                    <div className="mt-1.5 break-all font-mono text-[12.5px] text-slate-400">{g.code}</div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Buttons */}
          <section className="mb-16">
            <SectionTitle>Buttons</SectionTitle>
            <div className="flex flex-wrap items-center gap-5 rounded-2xl border border-white/10 bg-white/[0.03] p-6">
              <span className="inline-flex h-12 items-center justify-center gap-2 rounded-full bg-gradient-to-r from-[#ff4fa3] to-[#ff8a00] px-7 font-semibold text-white shadow-[0_8px_30px_rgba(255,79,163,0.35)]">
                Create free account
              </span>
              <span className="inline-flex h-12 items-center justify-center gap-2.5 rounded-full bg-gradient-to-r from-[#2563eb] via-[#06b6d4] to-[#10b981] px-7 font-bold text-white shadow-[0_0_28px_rgba(16,185,129,0.45)]">
                Free until 1 October 2026
              </span>
            </div>
            <p className="mt-3.5 text-sm text-slate-400">
              Primary CTA: brand gradient + glow{' '}
              <span className="font-mono text-slate-300">0 8px 30px rgba(255,79,163,.35)</span>, full pill radius,
              white 600-weight label. Offer pill uses the offer gradient with an emerald glow.
            </p>
          </section>

          {/* Typography */}
          <section className="mb-16">
            <SectionTitle>Typography</SectionTitle>
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
              <div className="flex flex-wrap items-baseline gap-4 border-b border-white/10 py-4">
                <span className="w-32 font-mono text-[13px] text-slate-500">Geist 800</span>
                <span className="text-3xl font-extrabold tracking-tight">Press play and coach the session</span>
              </div>
              <div className="flex flex-wrap items-baseline gap-4 border-b border-white/10 py-4">
                <span className="w-32 font-mono text-[13px] text-slate-500">Geist 600</span>
                <span className="text-xl font-semibold">Set the running order in 30 seconds</span>
              </div>
              <div className="flex flex-wrap items-baseline gap-4 border-b border-white/10 py-4">
                <span className="w-32 font-mono text-[13px] text-slate-500">Geist 400</span>
                <span className="text-base leading-relaxed text-slate-300">
                  Body copy uses Geist at a relaxed line-height for comfortable reading on dark backgrounds.
                </span>
              </div>
              <div className="flex flex-wrap items-baseline gap-4 py-4">
                <span className="w-32 font-mono text-[13px] text-slate-500">Geist Mono</span>
                <span className="font-mono text-lg">01:54 / 1:59&nbsp;&nbsp;&nbsp;48:00</span>
              </div>
            </div>
            <p className="mt-3.5 text-sm text-slate-400">
              <span className="font-semibold text-white">Geist</span> for headings and body.{' '}
              <span className="font-semibold text-white">Geist Mono</span> for timers, durations and numeric data. Both
              are Google Fonts, loaded via next/font.
            </p>
          </section>

          {/* Radius */}
          <section className="mb-16">
            <SectionTitle>Corner radius</SectionTitle>
            <div className="flex flex-wrap items-end gap-4 rounded-2xl border border-white/10 bg-white/[0.03] p-6">
              {[
                { r: '6px', l: 'sm' },
                { r: '8px', l: 'md' },
                { r: '10px', l: 'base' },
                { r: '14px', l: 'xl' },
                { r: '9999px', l: 'pill' },
              ].map((b) => (
                <div key={b.l} className="flex flex-col items-center gap-2">
                  <div className="h-20 w-20 bg-gradient-to-br from-[#ff4fa3] to-[#ff8a00]" style={{ borderRadius: b.r }} />
                  <span className="font-mono text-xs text-slate-500">{b.l}</span>
                </div>
              ))}
            </div>
            <p className="mt-3.5 text-sm text-slate-400">
              Base radius <span className="font-mono text-slate-300">0.625rem (10px)</span>. Cards use base&rarr;xl;
              buttons, badges and pills use full pill radius.
            </p>
          </section>

          {/* Imagery / logo usage */}
          <section>
            <SectionTitle>Imagery &amp; logo usage</SectionTitle>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
                <h3 className="mb-4 font-bold text-white">Do</h3>
                <ul className="grid gap-2.5">
                  {[
                    'Place logos and imagery on the deep-navy canvas (#020617) or darker.',
                    'Reserve the pink→orange gradient for actions, the play control and small brand marks.',
                    'Use real product screenshots (player, queue, session controls) as hero imagery.',
                    'Keep photography warm and human — coaches and athletes in training.',
                    'Let generous negative space and the glow do the decorative work.',
                  ].map((t) => (
                    <li key={t} className="relative pl-5 text-[14.5px] leading-relaxed text-slate-300">
                      <span className="absolute left-0 top-2 h-2 w-2 rounded-full bg-gradient-to-r from-[#ff4fa3] to-[#ff8a00]" />
                      {t}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
                <h3 className="mb-4 font-bold text-white">Don&apos;t</h3>
                <ul className="grid gap-2.5">
                  {[
                    'Recolour the brand gradient or swap its direction between elements.',
                    'Mix the offer (blue/cyan/green) gradient with the brand gradient.',
                    'Place the logo on light or busy backgrounds without a dark plate.',
                    'Add extra accent colours — the palette is intentionally tight.',
                    'Use gradient blobs or glowing orbs as filler decoration.',
                  ].map((t) => (
                    <li key={t} className="relative pl-5 text-[14.5px] leading-relaxed text-slate-300">
                      <span className="absolute left-0 top-2 h-2 w-2 rounded-full bg-red-500" />
                      {t}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
            <p className="mt-4 text-sm text-slate-400">
              Logo files shipped with the product:{' '}
              <span className="font-mono text-slate-300">eqho-player-logo.png</span>,{' '}
              <span className="font-mono text-slate-300">eqho-player-logo-sunset.png</span>,{' '}
              <span className="font-mono text-slate-300">eqho-logo.png</span> (mark), plus{' '}
              <span className="font-mono text-slate-300">favicon.png</span>,{' '}
              <span className="font-mono text-slate-300">icon-192.png</span> and{' '}
              <span className="font-mono text-slate-300">icon-512.png</span>.
            </p>
          </section>
        </div>
      </main>
      <SiteFooter />
    </>
  )
}
