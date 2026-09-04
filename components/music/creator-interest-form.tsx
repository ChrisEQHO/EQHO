'use client'

import { useState, type FormEvent } from 'react'
import { trackEvent } from '@/lib/analytics/track-event'

type Status = 'idle' | 'submitting' | 'success' | 'error'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export function CreatorInterestForm() {
  const [status, setStatus] = useState<Status>('idle')
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (status === 'submitting') return

    const form = event.currentTarget
    const data = new FormData(form)

    // Honeypot — bots fill hidden fields; humans never see this one.
    if ((data.get('company') as string)?.trim()) {
      // Silently pretend success so bots get no signal.
      setStatus('success')
      return
    }

    const name = (data.get('name') as string)?.trim() ?? ''
    const email = (data.get('email') as string)?.trim() ?? ''
    const links = (data.get('links') as string)?.trim() ?? ''
    const message = (data.get('message') as string)?.trim() ?? ''

    if (!name) {
      setError('Please enter your name.')
      setStatus('error')
      return
    }
    if (!EMAIL_RE.test(email)) {
      setError('Please enter a valid email address.')
      setStatus('error')
      return
    }

    setStatus('submitting')
    setError(null)

    try {
      const res = await fetch('/api/music/creator-interest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, links, message, company: '' }),
      })
      const json = (await res.json().catch(() => ({}))) as {
        ok?: boolean
        error?: string
      }

      if (!res.ok || !json.ok) {
        setError(json.error || 'Something went wrong. Please try again.')
        setStatus('error')
        return
      }

      trackEvent('Music Creator Interest Submitted')
      setStatus('success')
      form.reset()
    } catch {
      setError('Network error. Please try again.')
      setStatus('error')
    }
  }

  if (status === 'success') {
    return (
      <div
        role="status"
        className="rounded-2xl border border-[#ff8a00]/30 bg-[#ff8a00]/10 p-6 text-center"
      >
        <p className="text-lg font-semibold text-white">Thanks — we&apos;ve got it.</p>
        <p className="mt-2 text-sm leading-relaxed text-[#94a3b8]">
          Our team will be in touch as we open up the EQHO Music catalogue to
          creators. Keep making great work.
        </p>
      </div>
    )
  }

  const inputClass =
    'w-full rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-white placeholder:text-[#64748b] outline-none transition focus:border-[#ff4fa3]/60 focus:ring-2 focus:ring-[#ff4fa3]/20'

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
      {/* Honeypot: visually hidden, off the tab order, ignored by humans. */}
      <div aria-hidden="true" className="absolute left-[-9999px] h-0 w-0 overflow-hidden">
        <label>
          Company
          <input type="text" name="company" tabIndex={-1} autoComplete="off" />
        </label>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="ci-name" className="text-xs font-medium text-[#cbd5e1]">
            Name
          </label>
          <input
            id="ci-name"
            name="name"
            type="text"
            required
            autoComplete="name"
            className={inputClass}
            placeholder="Your name"
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="ci-email" className="text-xs font-medium text-[#cbd5e1]">
            Email
          </label>
          <input
            id="ci-email"
            name="email"
            type="email"
            required
            autoComplete="email"
            className={inputClass}
            placeholder="you@example.com"
          />
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="ci-links" className="text-xs font-medium text-[#cbd5e1]">
          Links to your work <span className="text-[#64748b]">(optional)</span>
        </label>
        <input
          id="ci-links"
          name="links"
          type="text"
          className={inputClass}
          placeholder="Spotify, SoundCloud, Bandcamp, website…"
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="ci-message" className="text-xs font-medium text-[#cbd5e1]">
          Tell us about your music <span className="text-[#64748b]">(optional)</span>
        </label>
        <textarea
          id="ci-message"
          name="message"
          rows={4}
          maxLength={2000}
          className={`${inputClass} resize-y`}
          placeholder="Genres, the kind of routines your tracks suit, anything you'd like us to know."
        />
      </div>

      {status === 'error' && error ? (
        <p role="alert" className="text-sm text-[#fda4af]">
          {error}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={status === 'submitting'}
        className="inline-flex items-center justify-center gap-2 rounded-full bg-[linear-gradient(135deg,#ff4fa3,#ff8a00)] px-6 py-3 text-sm font-semibold text-white shadow-[0_10px_30px_-10px_rgba(255,79,163,0.6)] transition hover:scale-[1.02] disabled:cursor-not-allowed disabled:opacity-60"
      >
        {status === 'submitting' ? 'Sending…' : 'Register your interest'}
      </button>

      <p className="text-xs leading-relaxed text-[#64748b]">
        By submitting you agree we may contact you about the EQHO Music creator
        programme. We&apos;ll never share your details.
      </p>
    </form>
  )
}
