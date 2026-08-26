// Server-only catalogue reads for the music store.
//
// Uses the Supabase service-role client (bypasses RLS) and ALWAYS filters
// is_published = true itself, so unpublished drafts never leak to the public
// storefront. Never import this into client components.

import 'server-only'
import { createClient } from '@supabase/supabase-js'
import type { StoreCategory, StoreTrack, StoreTrackWithCategory } from './types'

function getStoreAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !serviceKey) {
    console.error('[v0][store] Missing Supabase env vars for catalog reads', {
      hasUrl: !!url,
      hasServiceKey: !!serviceKey,
    })
    return null
  }
  return createClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
}

/** All published categories, ordered for display. Empty array on any failure. */
export async function getStoreCategories(): Promise<StoreCategory[]> {
  const supabase = getStoreAdminClient()
  if (!supabase) return []
  const { data, error } = await supabase
    .from('store_categories')
    .select('*')
    .eq('is_published', true)
    .order('sort_order', { ascending: true })
    .order('name', { ascending: true })
  if (error) {
    console.error('[v0][store] getStoreCategories error:', error.message)
    return []
  }
  return (data as StoreCategory[]) ?? []
}

/** All published tracks with their (published) category joined in. */
export async function getPublishedTracks(): Promise<StoreTrackWithCategory[]> {
  const supabase = getStoreAdminClient()
  if (!supabase) return []
  const [tracksRes, categories] = await Promise.all([
    supabase
      .from('store_tracks')
      .select('*')
      .eq('is_published', true)
      .order('created_at', { ascending: false }),
    getStoreCategories(),
  ])
  if (tracksRes.error) {
    console.error('[v0][store] getPublishedTracks error:', tracksRes.error.message)
    return []
  }
  const catById = new Map(categories.map((c) => [c.id, c]))
  return ((tracksRes.data as StoreTrack[]) ?? []).map((t) => ({
    ...t,
    category: t.category_id ? catById.get(t.category_id) ?? null : null,
  }))
}

/** A single published track by slug, or null if missing/unpublished. */
export async function getTrackBySlug(slug: string): Promise<StoreTrackWithCategory | null> {
  const supabase = getStoreAdminClient()
  if (!supabase) return null
  const { data, error } = await supabase
    .from('store_tracks')
    .select('*')
    .eq('slug', slug)
    .eq('is_published', true)
    .maybeSingle()
  if (error) {
    console.error('[v0][store] getTrackBySlug error:', error.message)
    return null
  }
  if (!data) return null
  const track = data as StoreTrack
  let category: StoreCategory | null = null
  if (track.category_id) {
    const { data: cat } = await supabase
      .from('store_categories')
      .select('*')
      .eq('id', track.category_id)
      .maybeSingle()
    category = (cat as StoreCategory) ?? null
  }
  return { ...track, category }
}

/** Published tracks grouped by category, in category sort order. */
export async function getTracksGroupedByCategory(): Promise<
  Array<{ category: StoreCategory | null; tracks: StoreTrackWithCategory[] }>
> {
  const [tracks, categories] = await Promise.all([
    getPublishedTracks(),
    getStoreCategories(),
  ])
  const groups: Array<{ category: StoreCategory | null; tracks: StoreTrackWithCategory[] }> =
    categories.map((category) => ({
      category,
      tracks: tracks.filter((t) => t.category_id === category.id),
    }))
  const uncategorized = tracks.filter((t) => !t.category_id)
  if (uncategorized.length > 0) {
    groups.push({ category: null, tracks: uncategorized })
  }
  // Drop empty categories so the storefront only shows sections with content.
  return groups.filter((g) => g.tracks.length > 0)
}
