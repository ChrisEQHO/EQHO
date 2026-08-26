// Shared types for the EQHO Music Store. These mirror the columns created in
// supabase/migrations/003_store_schema.sql. Keep them in sync with that file.

export interface StoreCategory {
  id: string
  slug: string
  name: string
  description: string
  sort_order: number
  is_published: boolean
  created_at: string
  updated_at: string
}

export interface StoreTrack {
  id: string
  slug: string
  title: string
  artist: string
  category_id: string | null
  description: string
  duration_seconds: number
  bpm: number | null
  /** Standard public one-off price in the smallest currency unit (e.g. pence). null = subscription only. */
  price_cents: number | null
  /** Reduced price for EQHO customers (subscribers). null = customers pay the standard price. */
  customer_price_cents: number | null
  currency: string
  /** R2 object key for the audible-watermarked preview (served to everyone). */
  preview_key: string | null
  /** R2 object key for the clean master (served only to entitled users). */
  master_key: string | null
  included_in_subscription: boolean
  stripe_price_id: string | null
  stripe_customer_price_id: string | null
  is_published: boolean
  created_at: string
  updated_at: string
}

/** A track plus its resolved category, as shown in the storefront. */
export interface StoreTrackWithCategory extends StoreTrack {
  category: StoreCategory | null
}

export type PurchaseStatus = 'pending' | 'completed' | 'refunded' | 'failed'

export interface StorePurchase {
  id: string
  user_id: string
  track_id: string
  stripe_payment_intent_id: string | null
  stripe_checkout_session_id: string | null
  amount_cents: number
  currency: string
  status: PurchaseStatus
  created_at: string
  updated_at: string
}

/** Why a user can (or cannot) download the clean master of a track. */
export type EntitlementReason =
  | 'admin'
  | 'subscription'
  | 'purchase'
  | 'none'

export interface TrackEntitlement {
  entitled: boolean
  reason: EntitlementReason
}
