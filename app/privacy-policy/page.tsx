import type { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import { ChevronRight, Home, ArrowLeft, ShieldCheck } from 'lucide-react'
import { LEGAL } from '@/lib/marketing-config'

export const metadata: Metadata = {
  title: 'EQHO Player Privacy Policy',
  description:
    'Learn how EQHO Player collects, stores and protects account information, subscription data, playlists, cloud content and user information.',
  alternates: { canonical: '/privacy-policy' },
  openGraph: {
    title: 'EQHO Player Privacy Policy',
    description:
      'Learn how EQHO Player collects, stores and protects account information, subscription data, playlists, cloud content and user information.',
    url: '/privacy-policy',
    type: 'website',
  },
}

function SectionCard({
  title,
  children,
}: {
  title: string
  children: React.ReactNode
}) {
  return (
    <section className="rounded-2xl border border-white/10 bg-[rgba(9,15,28,0.96)] p-6 shadow-[0_18px_45px_rgba(0,0,0,0.35)] backdrop-blur-xl sm:p-8">
      <h2 className="mb-4 text-xl font-bold text-white sm:text-2xl text-balance">
        {title}
      </h2>
      <div className="space-y-4 text-[15px] leading-relaxed text-[#cbd5e1]">
        {children}
      </div>
    </section>
  )
}

function BulletList({ items }: { items: string[] }) {
  return (
    <ul className="space-y-2">
      {items.map((item) => (
        <li key={item} className="flex items-start gap-3">
          <span
            aria-hidden="true"
            className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-gradient-to-r from-[#ff4fa3] to-[#ff8a00]"
          />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  )
}

function SubHeading({ children }: { children: React.ReactNode }) {
  return <h3 className="pt-2 text-base font-semibold text-white">{children}</h3>
}

export default function PrivacyPolicyPage() {
  return (
    <main className="relative min-h-screen w-full bg-[#020617] font-sans">
      {/* Neon gradient background accents */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
        <div className="absolute -top-40 -left-32 h-96 w-96 rounded-full bg-gradient-to-br from-[#ff4fa3]/20 to-transparent blur-3xl" />
        <div className="absolute top-1/3 -right-32 h-96 w-96 rounded-full bg-gradient-to-bl from-[#00d9ff]/15 to-transparent blur-3xl" />
        <div className="absolute bottom-0 left-1/4 h-96 w-96 rounded-full bg-gradient-to-tr from-[#b86cff]/15 to-transparent blur-3xl" />
        <div className="absolute -bottom-32 right-1/4 h-80 w-80 rounded-full bg-gradient-to-tl from-[#ff8a00]/15 to-transparent blur-3xl" />
      </div>

      <div
        className="relative mx-auto w-full max-w-3xl px-4 py-10 sm:px-6 sm:py-14"
        style={{ paddingTop: 'max(2.5rem, env(safe-area-inset-top))' }}
      >
        {/* Breadcrumb */}
        <nav aria-label="Breadcrumb" className="mb-8">
          <ol className="flex items-center gap-2 text-sm text-[#7c8596]">
            <li>
              <Link
                href="/"
                className="inline-flex items-center gap-1.5 transition-colors hover:text-white"
              >
                <Home className="h-4 w-4" />
                Home
              </Link>
            </li>
            <li aria-hidden="true">
              <ChevronRight className="h-4 w-4" />
            </li>
            <li aria-current="page" className="font-medium text-white">
              Privacy Policy
            </li>
          </ol>
        </nav>

        {/* Header */}
        <header className="mb-12">
          <Image
            src="/images/eqho-logo.png"
            alt="EQHO Player"
            width={200}
            height={80}
            className="mb-6 h-auto w-[200px] max-w-full"
            priority
          />
          <h1 className="text-3xl font-bold leading-tight text-white text-balance sm:text-4xl md:text-5xl">
            EQHO Player Privacy Policy
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-relaxed text-[#cbd5e1] text-pretty sm:text-lg">
            How EQHO Player collects, uses, stores and protects your information
            when you use our website, web player and applications.
          </p>
          <p className="mt-6 inline-flex items-center gap-2 rounded-full border border-white/10 bg-[rgba(13,20,36,0.92)] px-4 py-1.5 text-sm font-medium text-[#7c8596]">
            {`Last updated: ${LEGAL.lastUpdated}`}
          </p>
          <div className="mt-8 h-1 w-full rounded-full bg-gradient-to-r from-[#ff4fa3] via-[#b86cff] to-[#00d9ff]" />
        </header>

        <div className="space-y-6">
          <SectionCard title="Introduction">
            <p>
              {`EQHO Player is operated by ${LEGAL.operatorName} in the ${LEGAL.country}.`}
            </p>
            <p>
              {`For data-protection purposes, ${LEGAL.operatorName} is the data controller responsible for the personal information described in this policy.`}
            </p>
            <p>
              This Privacy Policy explains how information is collected, used,
              stored and protected when you use:
            </p>
            <BulletList
              items={[
                'The EQHO Player website',
                'The EQHO Player web app',
                'The EQHO Player applications for iPhone and iPad',
                'EQHO Cloud services',
              ]}
            />
            <p>
              By using EQHO Player you agree to the practices described in this
              policy.
            </p>
          </SectionCard>

          <SectionCard title="Information We Collect">
            <SubHeading>1. Account information</SubHeading>
            <p>We may collect and store:</p>
            <BulletList
              items={[
                'Name',
                'Email address',
                'Supabase user ID',
                'Authentication and account-recovery information',
                'Login and security records',
              ]}
            />

            <SubHeading>2. Payment and subscription information</SubHeading>
            <p>
              Stripe processes all payments and card details on our behalf. From
              Stripe, EQHO Player may receive and store:
            </p>
            <BulletList
              items={[
                'Stripe customer ID',
                'Stripe subscription ID',
                'Subscription status',
                'Trial start and end dates',
                'Billing-period dates',
                'Payment status',
                'Cancellation status',
              ]}
            />
            <p>
              EQHO Player does <strong className="text-white">not</strong>{' '}
              directly collect or store complete card numbers, card security
              codes or bank credentials. Those details are handled solely by
              Stripe.
            </p>

            <SubHeading>3. User content</SubHeading>
            <p>
              When you choose to push content to EQHO Cloud, EQHO Player may
              process or store:
            </p>
            <BulletList
              items={[
                'Playlist names',
                'Uploaded audio files',
                'Track names and durations',
                'Playlist running orders',
                'Gaps between tracks',
                'Repeat settings',
                'Session and playback preferences',
                'Cloud backup and download status',
              ]}
            />
            <p>
              Music and playlists are uploaded to EQHO Cloud{' '}
              <strong className="text-white">only when you choose to push them</strong>.
              Content is not uploaded or synchronised automatically.
            </p>

            <SubHeading>4. Technical information</SubHeading>
            <p>Where it is actually collected or transmitted, we may process:</p>
            <BulletList
              items={[
                'Device type',
                'Browser',
                'Operating system',
                'App version',
                'IP address',
                'Authentication records',
                'Error and diagnostic information',
                'Security and performance information',
              ]}
            />
            <p>
              We use aggregate, privacy-friendly usage analytics on our website
              only. These analytics do not use advertising cookies and do not
              track you across other companies&apos; apps or websites. The EQHO
              Player mobile apps do not load this analytics.
            </p>
          </SectionCard>

          <SectionCard title="How We Use Information">
            <p>Information is used to:</p>
            <BulletList
              items={[
                'Create and manage accounts',
                'Authenticate users',
                'Recover accounts',
                'Provide player and playlist functionality',
                'Store content you push to EQHO Cloud',
                'Make pushed content available on your supported devices',
                'Manage trials and subscriptions',
                'Confirm access rights',
                'Send necessary account, billing and security messages',
                'Respond to support requests',
                'Prevent misuse',
                'Diagnose faults',
                'Improve service reliability',
                'Meet legal, accounting and regulatory obligations',
              ]}
            />
            <p className="font-semibold text-white">
              EQHO Player does not sell personal information.
            </p>
          </SectionCard>

          <SectionCard title="Legal Bases for Processing">
            <p>
              Under UK data-protection law, we rely on the following legal bases:
            </p>
            <BulletList
              items={[
                'Contract: providing accounts, player services, cloud storage and subscriptions.',
                'Legitimate interests: security, fraud prevention, support and service reliability.',
                'Legal obligation: accounting, taxation and legally required records.',
                'Consent: only where consent is specifically required.',
              ]}
            />
          </SectionCard>

          <SectionCard title="Service Providers">
            <p>
              We use the following service providers to operate EQHO Player. They
              are required to protect your information and use it only for
              service-related purposes.
            </p>
            <BulletList
              items={[
                'Supabase — authentication and database services',
                'Cloudflare R2 — cloud storage for uploaded audio',
                'Stripe — trial, subscription and payment processing',
                'Resend — transactional and service email',
                'Vercel — website and application hosting, and privacy-friendly website analytics',
              ]}
            />
            <p>
              Stripe Privacy Policy:{' '}
              <a
                href="https://stripe.com/privacy"
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium text-[#00d9ff] underline-offset-4 hover:underline"
              >
                https://stripe.com/privacy
              </a>
            </p>
          </SectionCard>

          <SectionCard title="International Data Transfers">
            <p>
              Some of our service providers may process or store information
              outside the United Kingdom or European Economic Area.
            </p>
            <p>
              Where information is transferred internationally, appropriate
              contractual or recognised transfer safeguards (such as standard
              contractual clauses and equivalent protections) are used where
              required, so your information remains protected.
            </p>
          </SectionCard>

          <SectionCard title="Data Retention">
            <BulletList
              items={[
                'Account information is normally retained while your account remains active.',
                'Cloud playlists and uploaded audio are retained until you delete them or delete your account, subject to any legitimate backup-deletion period.',
                'Subscription and transaction records may be retained for accounting, fraud prevention, disputes and legal compliance.',
              ]}
            />
            <p>
              We do not retain records indefinitely without a defined reason.
            </p>
          </SectionCard>

          <SectionCard title="Account Deletion">
            <p>
              You can delete your account at any time from your account settings
              in the app. When you delete your account, EQHO Player will:
            </p>
            <BulletList
              items={[
                'Cancel any active Stripe subscription',
                'Remove your EQHO database records',
                'Remove your playlists and session information',
                'Delete your uploaded audio from Cloudflare R2',
                'Delete or disable your Supabase authentication account',
                'Revoke access',
              ]}
            />
            <p>
              We preserve only those records we are legally required to retain
              (for example, records needed for accounting or tax). You can also
              request deletion by contacting us at the email address below.
            </p>
          </SectionCard>

          <SectionCard title="Your Rights">
            <p>
              Subject to UK data-protection law, you may have the right to:
            </p>
            <BulletList
              items={[
                'Access your personal information',
                'Correct inaccurate information',
                'Request deletion',
                'Restrict processing',
                'Object to applicable processing',
                'Request portable, eligible information',
                'Withdraw consent where consent is the legal basis',
              ]}
            />
            <p>
              You can exercise these rights using the contact details below. If
              you are in the UK and believe we have not handled your personal
              information properly, you also have the right to complain to the
              Information Commissioner&apos;s Office (ICO) at{' '}
              <a
                href="https://ico.org.uk"
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium text-[#00d9ff] underline-offset-4 hover:underline"
              >
                https://ico.org.uk
              </a>
              .
            </p>
          </SectionCard>

          <SectionCard title="Children">
            <p>
              EQHO Player is intended for coaches, clubs, organisations and other
              authorised adult users.
            </p>
            <p>
              Children should not create or manage their own accounts. Coaches
              and clubs should avoid placing unnecessary personal information
              about children in track names, playlist names or other uploaded
              content.
            </p>
          </SectionCard>

          <SectionCard title="Cookies and Device Storage">
            <p>
              EQHO Player uses cookies, IndexedDB and equivalent local storage
              only where necessary for:
            </p>
            <BulletList
              items={[
                'Secure sign-in sessions',
                'Essential preferences',
                'Player operation',
                'Downloaded playlists',
                'Offline playback',
                'Security',
              ]}
            />
            <p>
              We do not use advertising or marketing tracking technologies. Our
              website analytics are privacy-friendly and do not use advertising
              cookies, so no cookie-consent banner is required. If we ever
              introduce non-essential analytics, advertising or marketing
              technologies, we will block them until valid consent is obtained.
            </p>
          </SectionCard>

          <SectionCard title="Security">
            <p>
              We use reasonable technical and organisational safeguards to
              protect your information, including:
            </p>
            <BulletList
              items={[
                'HTTPS for data in transit',
                'Secure authentication',
                'Account-based access controls',
                'Restricted database and storage access',
                'Server-side handling of secrets',
                'Stripe-hosted payment processing',
              ]}
            />
            <p>
              No system can guarantee absolute security, but we take reasonable
              measures to protect your information.
            </p>
          </SectionCard>

          <SectionCard title="Changes to This Policy">
            <p>This Privacy Policy may be updated periodically.</p>
            <p>
              Any updates will be published on this page together with a revised
              &quot;last updated&quot; date.
            </p>
          </SectionCard>

          <SectionCard title="Data Controller and Contact Information">
            <p>
              {`For data-protection purposes, the data controller is ${LEGAL.operatorName}.`}
            </p>
            <div className="space-y-1.5 rounded-xl border border-white/10 bg-[rgba(13,20,36,0.6)] p-4">
              <p className="font-semibold text-white">{LEGAL.operatorName}</p>
              <p>{LEGAL.country}</p>
              <p>
                Email:{' '}
                <a
                  href={`mailto:${LEGAL.contactEmail}`}
                  className="font-medium text-[#00d9ff] underline-offset-4 hover:underline"
                >
                  {LEGAL.contactEmail}
                </a>
              </p>
              <p>
                Website:{' '}
                <a
                  href={LEGAL.websiteUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-medium text-[#00d9ff] underline-offset-4 hover:underline"
                >
                  {LEGAL.websiteUrl}
                </a>
              </p>
            </div>
          </SectionCard>
        </div>

        {/* Highlighted neon information card */}
        <div className="relative mt-10 overflow-hidden rounded-2xl p-[1.5px]">
          <div className="absolute inset-0 bg-gradient-to-r from-[#ff4fa3] via-[#b86cff] to-[#00d9ff]" aria-hidden="true" />
          <div className="relative rounded-2xl bg-[rgba(9,15,28,0.96)] p-6 backdrop-blur-xl sm:p-8">
            <div className="flex items-start gap-4">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#ff4fa3] to-[#ff8a00] shadow-[0_0_24px_rgba(255,79,163,0.4)]">
                <ShieldCheck className="h-6 w-6 text-white" />
              </div>
              <p className="text-base leading-relaxed text-white text-pretty">
                Your privacy matters. EQHO Player is designed to help coaches
                manage routine music, playlists and training sessions
                efficiently while protecting user information and maintaining
                secure cloud services.
              </p>
            </div>
          </div>
        </div>

        {/* Back to Home button */}
        <div className="mt-10 flex justify-center">
          <Link
            href="/"
            className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#ff4fa3] to-[#ff8a00] px-8 font-semibold text-white shadow-[0_4px_20px_rgba(255,79,163,0.3)] transition-transform hover:scale-[1.02]"
          >
            <ArrowLeft className="h-5 w-5" />
            Back to Home
          </Link>
        </div>
      </div>
    </main>
  )
}
