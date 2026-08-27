import type { Metadata } from 'next'
import Link from 'next/link'
import { ChevronRight, Home, ScrollText } from 'lucide-react'
import { SiteHeader } from '@/components/marketing/site-header'
import { SiteFooter } from '@/components/marketing/site-footer'
import { LegalValue } from '@/components/legal/legal-value'
import { LEGAL } from '@/lib/marketing-config'

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

const LAST_UPDATED = LEGAL.lastUpdated

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
                These Terms of Service govern your access to and use of EQHO Player (the &quot;Service&quot;), which
                is provided by{' '}
                <LegalValue value={LEGAL.legalEntityName} placeholder="registered company name" /> (&quot;EQHO
                Player&quot;, &quot;we&quot;, &quot;us&quot; or &quot;our&quot;),{' '}
                <LegalValue value={LEGAL.companyNumber} placeholder="company registration number" />, registered at{' '}
                <LegalValue value={LEGAL.registeredAddress} placeholder="registered office address" />. By creating
                an account or using the Service you agree to these terms. If you do not agree, please do not use the
                Service.
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
                EQHO Player starts with a 30-day free trial. To start the trial you add your payment details securely
                through our payment processor, Stripe. You are not charged during the trial. When the 30-day trial
                ends, the EQHO Player subscription renews automatically at the price shown on the pricing page at the
                time you subscribe (currently £4.99 per month) unless you cancel before the trial ends. The
                subscription then continues to renew each month until cancelled.
              </p>
              <p>
                We will not change your subscription price without giving you clear advance notice and, where
                required, obtaining your consent, so that any future price is clear to you before it applies.
              </p>
              <p>
                You can cancel at any time from your billing settings or through the Stripe customer portal.
                Cancelling stops future renewals; it does not immediately remove access if you still have paid or
                trial time remaining, and access ends when the current subscription or trial period expires.
              </p>
              <p>
                Because a 30-day free trial is provided before any payment is taken, we do not generally offer
                refunds for subscription periods that have already started. This does not affect any refund or
                cancellation rights you have under applicable consumer law.
              </p>
              <p>
                You can delete your account at any time from your account settings. Deleting your account cancels any
                active subscription and permanently removes your account, playlists and uploaded audio, as described
                in our{' '}
                <Link href="/privacy-policy" className="text-[#ff9dc7] underline underline-offset-2 hover:text-white">
                  Privacy Policy
                </Link>
                .
              </p>
            </SectionCard>

            <SectionCard title="6. Availability">
              <p>
                We work to keep the Service available and reliable, but we do not guarantee uninterrupted access. We
                recommend loading and checking your playlists before travelling to a venue.
              </p>
            </SectionCard>

            <SectionCard title="7. Liability">
              <p>
                The Service is provided on an &quot;as is&quot; and &quot;as available&quot; basis. To the fullest
                extent permitted by law, we are not liable for indirect or consequential loss, or for any loss
                arising from your reliance on the Service being available during a session. Nothing in these terms
                excludes or limits liability that cannot be excluded or limited under applicable law. This does not
                affect your statutory rights as a consumer.
              </p>
            </SectionCard>

            <SectionCard title="8. Governing law">
              <p>
                These terms are governed by the laws of{' '}
                <LegalValue value={LEGAL.governingLaw} placeholder="governing law / jurisdiction" />, and the courts
                of that jurisdiction will have exclusive jurisdiction over any dispute, without affecting any
                mandatory consumer-protection rights available to you where you live.
              </p>
            </SectionCard>

            <SectionCard title="9. Changes to these terms">
              <p>
                We may update these terms from time to time. If we make material changes we will update the date at
                the top of this page. Continuing to use the Service after changes take effect means you accept the
                updated terms.
              </p>
            </SectionCard>

            <SectionCard title="10. Contact">
              <p>
                Questions about these terms? Email us at{' '}
                <a
                  href={`mailto:${LEGAL.contactEmail}`}
                  className="text-[#ff9dc7] underline underline-offset-2 hover:text-white"
                >
                  {LEGAL.contactEmail}
                </a>
                , or see our{' '}
                <Link href="/privacy-policy" className="text-[#ff9dc7] underline underline-offset-2 hover:text-white">
                  Privacy Policy
                </Link>{' '}
                for how we handle your data.
              </p>
              <p className="text-sm text-[#94a3b8]">
                {`${LEGAL.businessContact} · ${LEGAL.country}`}
              </p>
            </SectionCard>
          </div>
        </div>
      </main>

      <SiteFooter />
    </div>
  )
}
