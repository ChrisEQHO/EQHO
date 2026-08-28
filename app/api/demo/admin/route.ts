import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { isAdminEmail } from '@/lib/access'
import {
  readManifest,
  publishSnapshot,
  setDemoEnabled,
  isDemoStorageConfigured,
  type PublishPlaylistInput,
} from '@/lib/demo/demo-storage'

/**
 * ADMIN-ONLY demo control API. Every handler requires a valid Supabase session
 * whose email is in ADMIN_EMAILS. Publishing copies the admin's OWN selected
 * audio into the demo/ prefix; it never touches other users and never deletes
 * the admin's originals.
 */

export const dynamic = 'force-dynamic'

async function requireAdmin() {
  const supabase = await createClient()
  if (!supabase) return { error: 'Auth not configured', status: 500 as const }
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized', status: 401 as const }
  if (!isAdminEmail(user.email)) return { error: 'Forbidden', status: 403 as const }
  return { user }
}

// GET ?action=status — safe status for the admin UI (counts + public names only).
export async function GET() {
  const gate = await requireAdmin()
  if ('error' in gate) {
    return NextResponse.json({ error: gate.error }, { status: gate.status })
  }
  const manifest = await readManifest()
  return NextResponse.json({
    configured: isDemoStorageConfigured(),
    enabled: manifest.enabled,
    publishedAt: manifest.publishedAt,
    playlists: manifest.playlists.map((p) => ({
      name: p.name,
      trackCount: p.tracks.length,
      trackNames: p.tracks.map((t) => t.name),
    })),
  })
}

export async function POST(request: NextRequest) {
  const gate = await requireAdmin()
  if ('error' in gate) {
    return NextResponse.json({ error: gate.error }, { status: gate.status })
  }

  let body: {
    action?: string
    confirmPermission?: boolean
    playlists?: PublishPlaylistInput[]
  }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  if (body.action === 'disable') {
    const res = await setDemoEnabled(false)
    return NextResponse.json(res, { status: res.ok ? 200 : 400 })
  }
  if (body.action === 'enable') {
    const res = await setDemoEnabled(true)
    return NextResponse.json(res, { status: res.ok ? 200 : 400 })
  }

  if (body.action === 'publish') {
    // Require explicit permission confirmation (spec).
    if (body.confirmPermission !== true) {
      return NextResponse.json(
        { error: 'Permission to publish must be confirmed' },
        { status: 400 },
      )
    }
    if (!Array.isArray(body.playlists)) {
      return NextResponse.json({ error: 'Missing playlists' }, { status: 400 })
    }
    // publishSnapshot enforces exactly 2×5 and validates every source key is
    // owned by this admin before copying.
    const res = await publishSnapshot(gate.user.id, body.playlists)
    return NextResponse.json(res, { status: res.ok ? 200 : 400 })
  }

  return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
}
