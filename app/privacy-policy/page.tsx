import type { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import { ChevronRight, Home, ArrowLeft, ShieldCheck } from 'lucide-react'

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

      <div className="relative mx-auto w-full max-w-3xl px-4 py-10 sm:px-6 sm:py-14">
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
            Protecting your information while providing professional routine and
            music management for coaches, clubs and organisations.
          </p>
          <p className="mt-6 inline-flex items-center gap-2 rounded-full border border-white/10 bg-[rgba(13,20,36,0.92)] px-4 py-1.5 text-sm font-medium text-[#7c8596]">
            Last Updated: June 2026
          </p>
          <div className="mt-8 h-1 w-full rounded-full bg-gradient-to-r from-[#ff4fa3] via-[#b86cff] to-[#00d9ff]" />
        </header>

        <div className="space-y-6">
          <SectionCard title="Introduction">
            <p>
              EQHO Player (&quot;EQHO Player&quot;, &quot;we&quot;,
              &quot;our&quot; or &quot;us&quot;) is committed to protecting user
              privacy and maintaining the security of personal information.
            </p>
            <p>
              This Privacy Policy explains how information is collected, used,
              stored and protected when using:
            </p>
            <BulletList
              items={[
                'EQHO Player Web App',
                'EQHO Player Desktop Application',
                'EQHO Player Mobile Applications',
                'EQHO Player Cloud Services',
              ]}
            />
            <p>
              By using EQHO Player you agree to the practices described in this
              policy.
            </p>
          </SectionCard>

          <SectionCard title="Information We Collect">
            <h3 className="text-base font-semibold text-white">
              Account Information
            </h3>
            <p>We may collect:</p>
            <BulletList
              items={[
                'Name',
                'Email address',
                'Subscription information',
                'Account creation date',
                'Authentication details',
              ]}
            />
            <h3 className="pt-2 text-base font-semibold text-white">
              User Content
            </h3>
            <p>We may store:</p>
            <BulletList
              items={[
                'Playlists',
                'Routine information',
                'Session settings',
                'Cloud-saved preferences',
                'Organisational data created by users',
              ]}
            />
            <h3 className="pt-2 text-base font-semibold text-white">
              Technical Information
            </h3>
            <p>We may collect:</p>
            <BulletList
              items={[
                'Browser information',
                'Device type',
                'Operating system',
                'Application version',
                'Diagnostic data',
                'Error logs',
                'Performance analytics',
              ]}
            />
          </SectionCard>

          <SectionCard title="Payments">
            <p>
              EQHO Player uses Stripe to securely process subscriptions and
              payments.
            </p>
            <p>EQHO Player does not store:</p>
            <BulletList
              items={[
                'Credit card numbers',
                'Debit card numbers',
                'Bank account information',
              ]}
            />
            <p>All payment processing is handled securely through Stripe.</p>
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

          <SectionCard title="How We Use Information">
            <p>Information may be used to:</p>
            <BulletList
              items={[
                'Provide EQHO Player services',
                'Manage subscriptions',
                'Authenticate users',
                'Synchronise cloud data',
                'Improve application performance',
                'Resolve technical issues',
                'Communicate service updates',
                'Provide customer support',
              ]}
            />
          </SectionCard>

          <SectionCard title="Cloud Storage">
            <p>
              EQHO Player may store user-generated information including
              playlists, routines, session settings and preferences using
              secure cloud infrastructure.
            </p>
            <p>
              Access to stored data is restricted to authorised account holders
              and authorised service providers required to operate the platform.
            </p>
          </SectionCard>

          <SectionCard title="Data Sharing">
            <p>EQHO Player does not sell personal information.</p>
            <p>
              Information may be shared only when necessary with trusted service
              providers used to operate the platform, including:
            </p>
            <BulletList
              items={[
                'Stripe (payments)',
                'Supabase (authentication and database services)',
                'Hosting and infrastructure providers',
              ]}
            />
            <p>
              These providers are required to protect user information and use it
              only for service-related purposes.
            </p>
          </SectionCard>

          <SectionCard title="Data Security">
            <p>EQHO Player uses industry-standard security measures including:</p>
            <BulletList
              items={[
                'Secure HTTPS connections',
                'Authentication controls',
                'Encrypted data transmission',
                'Access restrictions',
                'Secure cloud infrastructure',
              ]}
            />
            <p>
              While no system can guarantee absolute security, reasonable
              measures are taken to protect user information.
            </p>
          </SectionCard>

          <SectionCard title="Data Retention">
            <p>User information is retained while accounts remain active.</p>
            <p>Users may request account deletion by contacting support.</p>
            <p>
              Certain information may be retained where required by law or for
              legitimate business purposes.
            </p>
          </SectionCard>

          <SectionCard title="Children's Privacy">
            <p>
              EQHO Player is intended primarily for coaches, clubs, organisations
              and adults.
            </p>
            <p>
              We do not knowingly collect personal information directly from
              children under the age of 13.
            </p>
          </SectionCard>

          <SectionCard title="User Rights">
            <p>
              Depending on local regulations, users may have rights to:
            </p>
            <BulletList
              items={[
                'Access personal information',
                'Correct inaccurate information',
                'Request deletion',
                'Restrict processing',
                'Withdraw consent where applicable',
              ]}
            />
            <p>
              Requests may be submitted using the contact information below.
            </p>
          </SectionCard>

          <SectionCard title="Third-Party Services">
            <p>
              EQHO Player may contain links to third-party websites and services.
            </p>
            <p>
              We are not responsible for the privacy practices of external
              websites or services.
            </p>
          </SectionCard>

          <SectionCard title="Changes to This Policy">
            <p>This Privacy Policy may be updated periodically.</p>
            <p>
              Any updates will be published on this page together with a revised
              effective date.
            </p>
          </SectionCard>

          <SectionCard title="Contact Information">
            <h3 className="text-base font-semibold text-white">
              EQHO Player Support
            </h3>
            <div className="space-y-3">
              <p>
                Website:{' '}
                <a
                  href="https://eqho-player.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-medium text-[#00d9ff] underline-offset-4 hover:underline"
                >
                  https://eqho-player.com
                </a>
              </p>
              <p>
                Email:{' '}
                <a
                  href="mailto:info@eqho-player.com"
                  className="font-medium text-[#00d9ff] underline-offset-4 hover:underline"
                >
                  info@eqho-player.com
                </a>
              </p>
              <p>
                Business Contact:{' '}
                <span className="text-white">Christopher Rogers</span>
              </p>
              <p>United Kingdom</p>
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
