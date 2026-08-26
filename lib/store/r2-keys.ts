// R2 key helpers for the music store.
//
// Store audio lives under a SHARED `store/` namespace in the same private R2
// bucket used for user playlists — deliberately separate from the per-user
// `users/<id>/...` namespace that /api/r2 guards. Store objects are catalogue
// content owned by EQHO, not user uploads, and access is decided by entitlement
// (subscription/purchase/admin) in /api/store/audio rather than by key prefix.
//
// Layout:
//   store/tracks/<trackSlug>/preview.<ext>   audible-watermarked clip (public)
//   store/tracks/<trackSlug>/master.<ext>    clean master (entitled users only)

export const STORE_KEY_PREFIX = 'store/'

/** True if a key belongs to the shared store namespace (not a user's folder). */
export function isStoreKey(key: string): boolean {
  return key.startsWith(STORE_KEY_PREFIX)
}

/** Suggested preview key for a track slug. Admins may override when uploading. */
export function storePreviewKey(trackSlug: string, ext = 'mp3'): string {
  return `${STORE_KEY_PREFIX}tracks/${trackSlug}/preview.${ext}`
}

/** Suggested master key for a track slug. Admins may override when uploading. */
export function storeMasterKey(trackSlug: string, ext = 'mp3'): string {
  return `${STORE_KEY_PREFIX}tracks/${trackSlug}/master.${ext}`
}
