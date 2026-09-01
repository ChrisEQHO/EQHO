'use client'

const FILES = [
  {
    href: '/brand/eqho-brand-guidelines.html',
    name: 'eqho-brand-guidelines.html',
    label: 'Full guidelines',
    desc: 'Self-contained visual guide. Open in any browser, works offline.',
  },
  {
    href: '/brand/eqho-brand-tokens.json',
    name: 'eqho-brand-tokens.json',
    label: 'Design tokens',
    desc: 'Machine-readable colours, gradients, type and radius.',
  },
  {
    href: '/brand/eqho-brand.css',
    name: 'eqho-brand.css',
    label: 'CSS variables',
    desc: 'Drop-in custom properties (var(--eqho-*)) + utility classes.',
  },
] as const

export function BrandDownloads() {
  return (
    <div className="grid gap-4 sm:grid-cols-3">
      {FILES.map((f) => (
        <a
          key={f.href}
          href={f.href}
          download={f.name}
          className="group flex flex-col rounded-2xl border border-white/10 bg-white/[0.03] p-5 transition-colors hover:border-white/20 hover:bg-white/[0.06] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#ff4fa3]"
        >
          <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-[#ff4fa3] to-[#ff8a00] text-white">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M12 3v12" />
              <path d="m7 10 5 5 5-5" />
              <path d="M5 21h14" />
            </svg>
          </span>
          <span className="mt-4 font-semibold text-white">{f.label}</span>
          <span className="mt-1 text-sm leading-relaxed text-slate-400">{f.desc}</span>
          <span className="mt-4 font-mono text-xs text-slate-500 group-hover:text-slate-300">{f.name}</span>
        </a>
      ))}
    </div>
  )
}
