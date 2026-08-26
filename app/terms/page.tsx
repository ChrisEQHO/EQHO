import type { Metadata } from 'next'
import Link from 'next/link'
import { ChevronRight, Home, ScrollText } from 'lucide-react'
import { SiteHeader } from '@/components/marketing/site-header'
import { SiteFooter } from '@/components/marketing/site-footer'

export const metadata: Metadata = {
  title: 'Terms of Service',
  description:
    'The terms governing your use of EQHO Player, including accounts, acceptable use, subscriptions, content and cloud storage.',
  alternates: { canonical: '/terms' },
  openGraph: {
    title: 'EQHO Player Terms of Service',
    description:
      'The terms governing your use of EQHO Player, including accounts, acceptable use, subscriptions, content and cloud storage.',
    url: '/terms',
    type: 'website',
  },
}

const LAST_UPDATED = '22 August 2026'

function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-white/10 bg-[rgba(9,15,28,0.96)] p-6 shadow-[0_18px_45px_rgba(0,0,0,0.35)] backdrop-blur-xl sm:p-8">
      <h2 className="mb-4 text-xl font-bold text-white sm:text-2xl text-balance">{title}</h2>
      <div className="space-y-4 text-[15px] leading-relaxed text-[#cbd5e1]">{children}</div>
    </section>
  )
}

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-[#020617] font-sans">
      <SiteHeader />

      <main className="relative w-full">
        <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
          <div className="absolute -top-40 -left-32 h-96 w-96 rounded-full bg-gradient-to-br from-[#ff4fa3]/20 to-transparent blur-3xl" />
          <div className="absolute bottom-0 right-1/4 h-80 w-80 rounded-full bg-gradient-to-tl from-[#ff8a00]/15 to-transparent blur-3xl" />
        </div>

        <div className="relative mx-auto w-full max-w-3xl px-4 py-10 sm:px-6 sm:py-14">
          <nav aria-label="Breadcrumb" className="mb-8">
            <ol className="flex items-center gap-2 text-sm text-[#7c8596]">
              <li>
                <Link href="/" className="inline-flex items-center gap-1.5 transition-colors hover:text-white">
                  <Home className="h-4 w-4" />
                  Home
                </Link>
              </li>
              <li aria-hidden="true">
                <ChevronRight className="h-4 w-4" />
              </li>
              <li aria-current="page" className="font-medium text-white">
                Terms of Service
              </li>
            </ol>
          </nav>

          <header className="mb-12">
            <div className="mb-5 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-[#ff8a00] to-[#ff4fa3]">
              <ScrollText className="h-6 w-6 text-white" />
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl text-balance">
              Terms of Service
            </h1>
            <p className="mt-3 text-[15px] text-[#94a3b8]">Last updated {LAST_UPDATED}</p>
          </header>

          <div className="space-y-6">
            <SectionCard title="1. Agreement to these terms">
              <p>
                These Terms of Service govern your access to and use of EQHO Player (the &quot;Service&quot;). By
                creating an account or using the Service you agree to these terms. If you do not agree, please do
                not use the Service.
              </p>
            </SectionCard>

            <SectionCard title="2. Your account">
              <p>
                You are responsible for the information you provide, for keeping your login credentials secure, and
                for all activity that happens under your account. Let us know promptly if you believe your account
                has been used without your permission.
              </p>
            </SectionCard>

            <SectionCard title="3. Acceptable use">
              <p>You agree to use EQHO Player only for lawful purposes. You must not:</p>
              <ul className="space-y-2">
                {[
                  'Upload content you do not have the rights to use.',
                  'Attempt to disrupt, reverse engineer or gain unauthorised access to the Service.',
                  'Use the Service to store or share unlawful material.',
                ].map((item) => (
                  <li key={item} className="flex items-start gap-3">
                    <span
                      aria-hidden="true"
                      className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-gradient-to-r from-[#ff4fa3] to-[#ff8a00]"
                    />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </SectionCard>

            <SectionCard title="4. Your content and music">
              <p>
                You keep ownership of the music and playlists you upload. You grant EQHO Player the permission needed
                to store, process and play back that content so we can provide the Service to you. You are
                responsible for ensuring you have the right to use any music you upload.
              </p>
            </SectionCard>

            <SectionCard title="5. Pricing, free trial and subscriptions">
              <p>
                EQHO Player comes with a 30-day free trial. After the trial, continued use may require a paid
                subscription at the price shown on our pricing page at the time you subscribe. Where a subscription
                applies, it renews until cancelled, and you can cancel at any time from your billing settings.
              </p>
            </SectionCard>

            <SectionCard title="6. Availability">
              <p>
                We work to keep the Service available and reliable, but we do not guarantee uninterrupted access. We
                recommend loading and checking your playlists before travelling to a venue.
              </p>
            </SectionCard>

            <SectionCard title="7. Changes to these terms">
              <p>
                We may update these terms from time to time. If we make material changes we will update the date at
                the top of this page. Continuing to use the Service after changes take effect means you accept the
                updated terms.
              </p>
            </SectionCard>

            <SectionCard title="8. Contact">
              <p>
                Questions about these terms? See our{' '}
                <Link href="/privacy-policy" className="text-[#ff9dc7] underline underline-offset-2 hover:text-white">
                  Privacy Policy
                </Link>{' '}
                for how we handle your data, or reach out through the app.
              </p>
            </SectionCard>
          </div>
        </div>
      </main>

      <SiteFooter />
    </div>
  )
}
