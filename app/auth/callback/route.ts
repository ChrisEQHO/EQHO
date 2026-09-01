import { createServerClient } from '@supabase/ssr'
import type { EmailOtpType } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'
import { ensureUserProfile } from '@/lib/ensure-user-profile'

// Auth callback for email confirmation (signup), magic links, and OAuth.
//
// It accepts BOTH verification formats so it works regardless of how the
// Supabase email template is configured:
//   1. PKCE / OAuth:      ?code=<uuid>            -> exchangeCodeForSession
//   2. Email OTP verify:  ?token_hash=<hash>&type -> verifyOtp
//
// Format 2 (token_hash) is the robust one for confirmation emails, because it
// does NOT require the PKCE code-verifier cookie to be present in the browser
// that opens the link. That cookie is missing whenever the link is opened in a
// different browser/app/device than the one used to sign up (very common on
// mobile), which is exactly why the old code-only handler dropped users back on
// a logged-out page. See the dashboard note in the change summary.

// Only allow internal, single-slash paths as the post-verification destination,
// so `?next=` can never be used as an open redirect (`//evil.com`, `https://…`).
function safeNext(raw: string | null): string {
  if (!raw) return '/app'
  if (!raw.startsWith('/') || raw.startsWith('//')) return '/app'
  if (raw.includes('://') || raw.includes('\\')) return '/app'
  return raw
}

export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl
  const code = searchParams.get('code')
  const tokenHash = searchParams.get('token_hash')
  const type = searchParams.get('type') as EmailOtpType | null
  const next = safeNext(searchParams.get('next'))

  // The provider can bounce back with an explicit error (e.g. expired link).
  const providerError = searchParams.get('error') || searchParams.get('error_description')

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  // Send every failure to the recovery page with a coarse, non-sensitive reason.
  // We never surface tokens or raw provider error text in the URL.
  const errorRedirect = (reason: 'expired' | 'invalid' | 'config') =>
    NextResponse.redirect(`${origin}/auth/error?reason=${reason}`)

  if (providerError) {
    return errorRedirect('expired')
  }

  if (!supabaseUrl || !supabaseAnonKey) {
    return errorRedirect('config')
  }

  if (!code && !tokenHash) {
    return errorRedirect('invalid')
  }

  const cookieStore = await cookies()
  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll()
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          )
        } catch {
          // Ignore cookie-setting errors in route handlers.
        }
      },
    },
  })

  // Verify using whichever parameter the link carried.
  let verifyError: { message?: string } | null = null
  if (tokenHash && type) {
    const { error } = await supabase.auth.verifyOtp({ type, token_hash: tokenHash })
    verifyError = error
  } else if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    verifyError = error
  } else {
    return errorRedirect('invalid')
  }

  if (verifyError) {
    // Expired/used links report as such; anything else is treated as invalid.
    const msg = (verifyError.message || '').toLowerCase()
    return errorRedirect(msg.includes('expire') ? 'expired' : 'invalid')
  }

  // Session established. Make sure a profiles row exists, then send the user in.
  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) {
    return errorRedirect('invalid')
  }

  await ensureUserProfile({
    userId: session.user.id,
    email: session.user.email,
    fullName: (session.user.user_metadata?.full_name as string | undefined) ?? '',
  })

  // Always land verified users in the app. Access itself (free phase vs. paid
  // entitlement after launch) is enforced by middleware on /app, which will send
  // a non-entitled user to /upgrade — so there is no redirect loop here.
  return NextResponse.redirect(`${origin}${next}`)
}
