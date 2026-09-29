import { NextResponse } from 'next/server'

/**
 * Retired. This endpoint used to reveal whether an email had an EQHO account
 * and subscription, which allowed email enumeration. It now always returns the
 * same neutral response and performs no lookup. Kept so older clients don't
 * hit a hard 404.
 */
export async function POST() {
  return NextResponse.json({ ok: true })
}
