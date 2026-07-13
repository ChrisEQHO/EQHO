import { NextResponse } from "next/server"
import { Resend } from "resend"
import { createClient } from "@/lib/supabase/server"

const TO_ADDRESS = "info@eqho-player.com"
// Resend requires a verified sending domain. Until eqho-player.com is verified
// in Resend, this falls back to Resend's shared onboarding sender so delivery
// still works. The user's own email is always set as Reply-To.
const FROM_ADDRESS = process.env.CONTACT_FROM_ADDRESS || "EQHO Player <onboarding@resend.dev>"

const CATEGORY_LABELS: Record<string, string> = {
  issue: "Issue / Bug Report",
  feedback: "Feedback",
  feature: "Feature Request",
  other: "Other",
}

export async function POST(request: Request) {
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) {
    return NextResponse.json({ ok: false, error: "Email service is not configured." }, { status: 500 })
  }

  // Derive the sender from the authenticated Supabase session (not client input)
  // so we can trust the address we set as Reply-To.
  const supabase = await createClient()
  if (!supabase) {
    return NextResponse.json({ ok: false, error: "Auth service unavailable." }, { status: 500 })
  }

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user?.email) {
    return NextResponse.json({ ok: false, error: "You must be signed in to send a message." }, { status: 401 })
  }

  let body: { subject?: string; message?: string; category?: string }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid request." }, { status: 400 })
  }

  const subject = (body.subject || "").trim()
  const message = (body.message || "").trim()
  const category = (body.category || "other").trim()
  const categoryLabel = CATEGORY_LABELS[category] || CATEGORY_LABELS.other

  if (!message) {
    return NextResponse.json({ ok: false, error: "Please enter a message." }, { status: 400 })
  }
  if (message.length > 5000) {
    return NextResponse.json({ ok: false, error: "Message is too long (max 5000 characters)." }, { status: 400 })
  }

  const userEmail = user.email
  const emailSubject = `[EQHO ${categoryLabel}] ${subject || "New message"}`

  const html = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #0f172a; max-width: 560px; margin: 0 auto;">
      <div style="background: linear-gradient(135deg, #ff4fa3, #ff8a00); padding: 20px 24px; border-radius: 12px 12px 0 0;">
        <h1 style="margin: 0; color: #ffffff; font-size: 18px;">EQHO Player &mdash; ${categoryLabel}</h1>
      </div>
      <div style="border: 1px solid #e2e8f0; border-top: none; border-radius: 0 0 12px 12px; padding: 24px;">
        <p style="margin: 0 0 8px;"><strong>From:</strong> ${userEmail}</p>
        <p style="margin: 0 0 8px;"><strong>Category:</strong> ${categoryLabel}</p>
        ${subject ? `<p style="margin: 0 0 16px;"><strong>Subject:</strong> ${subject.replace(/</g, "&lt;")}</p>` : ""}
        <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 16px 0;" />
        <p style="white-space: pre-wrap; line-height: 1.6; margin: 0;">${message.replace(/</g, "&lt;")}</p>
      </div>
    </div>
  `

  const resend = new Resend(apiKey)

  try {
    const { error } = await resend.emails.send({
      from: FROM_ADDRESS,
      to: TO_ADDRESS,
      replyTo: userEmail,
      subject: emailSubject,
      html,
      text: `From: ${userEmail}\nCategory: ${categoryLabel}\n${subject ? `Subject: ${subject}\n` : ""}\n${message}`,
    })

    if (error) {
      console.log("[v0][api/contact] Resend error:", error)
      return NextResponse.json({ ok: false, error: "Failed to send. Please try again." }, { status: 502 })
    }

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.log("[v0][api/contact] send exception:", err)
    return NextResponse.json({ ok: false, error: "Failed to send. Please try again." }, { status: 502 })
  }
}
