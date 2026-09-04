import { NextResponse } from 'next/server'
import { Resend } from 'resend'
import { getSupabaseAdmin } from '@/lib/supabase/admin'

// Resend requires a verified sending domain. Until eqho-player.com is verified,
// this falls back to Resend's shared onboarding sender so delivery still works.
// The enquirer's email is always set as Reply-To so the team can respond.
const FROM_ADDRESS =
  process.env.CONTACT_FROM_ADDRESS || 'EQHO Player <onboarding@resend.dev>'

// Notifications go to the team. Prefer the admin allowlist; fall back to the
// shared inbox. Supports a comma-separated ADMIN_EMAILS list.
function getRecipients(): string[] {
  const admins = (process.env.ADMIN_EMAILS || '')
    .split(',')
    .map((e) => e.trim())
    .filter(Boolean)
  return admins.length > 0 ? admins : ['info@eqho-player.com']
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}

export async function POST(request: Request) {
  let body: {
    name?: string
    email?: string
    links?: string
    message?: string
    company?: string
  }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ ok: false, error: 'Invalid request.' }, { status: 400 })
  }

  // Honeypot: a real (hidden) "company" value means a bot. Pretend success so
  // the bot gets no useful signal, but do no work.
  if ((body.company || '').trim()) {
    return NextResponse.json({ ok: true })
  }

  const name = (body.name || '').trim()
  const email = (body.email || '').trim()
  const links = (body.links || '').trim()
  const message = (body.message || '').trim()

  if (!name || name.length > 200) {
    return NextResponse.json(
      { ok: false, error: 'Please enter your name.' },
      { status: 400 },
    )
  }
  if (!EMAIL_RE.test(email) || email.length > 320) {
    return NextResponse.json(
      { ok: false, error: 'Please enter a valid email address.' },
      { status: 400 },
    )
  }
  if (links.length > 1000 || message.length > 2000) {
    return NextResponse.json(
      { ok: false, error: 'Submission is too long.' },
      { status: 400 },
    )
  }

  // Persist to Supabase if the table exists. This is best-effort: a missing
  // table (migration not yet applied) or any DB error must NOT fail the
  // enquiry — the email below is the reliable delivery channel.
  try {
    const admin = getSupabaseAdmin()
    const { error } = await admin.from('music_creator_interest').insert({
      name,
      email,
      links: links || null,
      message: message || null,
    })
    if (error) {
      console.log('[v0][api/music/creator-interest] Supabase insert skipped:', error.message)
    }
  } catch (err) {
    console.log('[v0][api/music/creator-interest] Supabase unavailable:', err)
  }

  // Send the team notification. This is the authoritative success path.
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) {
    return NextResponse.json(
      { ok: false, error: 'Email service is not configured.' },
      { status: 500 },
    )
  }

  const html = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #0f172a; max-width: 560px; margin: 0 auto;">
      <div style="background: linear-gradient(135deg, #ff4fa3, #ff8a00); padding: 20px 24px; border-radius: 12px 12px 0 0;">
        <h1 style="margin: 0; color: #ffffff; font-size: 18px;">EQHO Music &mdash; Creator enquiry</h1>
      </div>
      <div style="border: 1px solid #e2e8f0; border-top: none; border-radius: 0 0 12px 12px; padding: 24px;">
        <p style="margin: 0 0 8px;"><strong>Name:</strong> ${escapeHtml(name)}</p>
        <p style="margin: 0 0 8px;"><strong>Email:</strong> ${escapeHtml(email)}</p>
        ${links ? `<p style="margin: 0 0 8px;"><strong>Links:</strong> ${escapeHtml(links)}</p>` : ''}
        ${
          message
            ? `<hr style="border: none; border-top: 1px solid #e2e8f0; margin: 16px 0;" />
        <p style="white-space: pre-wrap; line-height: 1.6; margin: 0;">${escapeHtml(message)}</p>`
            : ''
        }
      </div>
    </div>
  `

  const resend = new Resend(apiKey)

  try {
    const { error } = await resend.emails.send({
      from: FROM_ADDRESS,
      to: getRecipients(),
      replyTo: email,
      subject: `[EQHO Music] Creator enquiry from ${name}`,
      html,
      text: `Creator enquiry\n\nName: ${name}\nEmail: ${email}\n${links ? `Links: ${links}\n` : ''}${message ? `\n${message}` : ''}`,
    })

    if (error) {
      console.log('[v0][api/music/creator-interest] Resend error:', error)
      return NextResponse.json(
        { ok: false, error: 'Failed to send. Please try again.' },
        { status: 502 },
      )
    }

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.log('[v0][api/music/creator-interest] send exception:', err)
    return NextResponse.json(
      { ok: false, error: 'Failed to send. Please try again.' },
      { status: 502 },
    )
  }
}
