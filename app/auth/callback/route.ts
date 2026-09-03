import { createServerClient } from '@supabase/ssr'
import type { EmailOtpType } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'
import { ensureUserProfile } from '@/lib/ensure-user-profile'

// Auth callback for email confirmation (signup), magic links, and OAuth.
//
// Two verification formats arrive here:
//   1. Email OTP verify:  ?token_hash=<hash>&type=email  (signup confirmation)
//   2. PKCE / OAuth:      ?code=<uuid>                    (provider redirect)
//
// CRITICAL — email confirmation is scanner-resistant and does NOT verify here.
// The Supabase `token_hash` is STRICTLY SINGLE-USE. Email security scanners
// (Outlook SafeLinks, Proofpoint, Mimecast…), mail-app link previews and browser
// prefetch all issue a GET on the confirmation link BEFORE the human clicks. If
// we called verifyOtp on this GET, that automated request would burn the one-time
// token and the human's click would then fail as "expired" — the exact bug this
// route previously caused. So for token_hash we DO NOT verify: we hand the token
// to the /auth/confirm client interstitial, which only calls verifyOtp on an
// explicit user click (scanners issue GETs but never click). This mirrors the
// working /reset-password flow.
//
// The OAuth `code` flow is different: that redirect is issued live by the
// provider to the user's own browser and is not present in any email, so it is
// not prefetchable — exchanging it on GET here is safe and keeps existing login
// behaviour unchanged.

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

  // Email confirmation (token_hash): DO NOT verify here — redirect the token to
  // the client interstitial so an automated GET can never consume it. No Supabase
  // call happens on this request, so scanners/prefetch cannot burn the token.
  if (tokenHash && type) {
    const confirmUrl = new URL(`${origin}/auth/confirm`)
    confirmUrl.searchParams.set('token_hash', tokenHash)
    confirmUrl.searchParams.set('type', type)
    confirmUrl.searchParams.set('next', next)
    return NextResponse.redirect(confirmUrl)
  }

  // From here on it is the OAuth / PKCE `code` flow only.
  if (!code) {
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

  const { error: verifyError } = await supabase.auth.exchangeCodeForSession(code)

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
