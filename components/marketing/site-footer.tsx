import Link from 'next/link'
import Image from 'next/image'
import { SITE, FOOTER_LINKS } from '@/lib/marketing-config'

/**
 * Public marketing footer. Server component (no interactivity) so it renders as
 * static HTML for SEO.
 */
export function SiteFooter() {
  const year = new Date().getFullYear()

  return (
    <footer className="border-t border-white/10 bg-[#020617]">
      <div className="mx-auto w-full max-w-6xl px-4 py-12 sm:px-6 lg:py-16">
        <div className="grid grid-cols-2 gap-10 sm:grid-cols-2 lg:grid-cols-4">
          {/* Brand column */}
          <div className="col-span-2 lg:col-span-1">
            <Link href="/" className="inline-flex items-center" aria-label={`${SITE.name} home`}>
              <Image
                src={SITE.logo || "/placeholder.svg"}
                alt={SITE.name}
                width={230}
                height={92}
                className="h-9 w-auto"
              />
            </Link>
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-[#7c8596]">
              The music player built for gymnastics, dance and cheer coaches.
            </p>
          </div>

          {/* Link groups */}
          {FOOTER_LINKS.map((group) => (
            <div key={group.heading}>
              <h2 className="text-xs font-semibold uppercase tracking-wider text-white/50">
                {group.heading}
              </h2>
              <ul className="mt-4 space-y-3">
                {group.links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-sm text-[#94a3b8] transition-colors hover:text-white"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 flex flex-col items-start justify-between gap-3 border-t border-white/10 pt-6 sm:flex-row sm:items-center">
          <p className="text-xs text-[#7c8596]">
            {`\u00A9 ${year} ${SITE.name}. All rights reserved.`}
          </p>
          <p className="text-xs text-[#7c8596]">Made for coaches.</p>
        </div>
      </div>
    </footer>
  )
}
