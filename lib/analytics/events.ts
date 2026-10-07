/**
 * Central analytics event catalogue for EQHO.
 *
 * Every analytics event name lives here so the whole app shares one typed
 * vocabulary. Events marked "dormant" have no trigger in the product yet — the
 * name is defined and documented so the feature can fire it the moment it ships,
 * with zero refactor.
 *
 * PRIVACY CONTRACT (gymnastics context — minors are frequently on screen/in audio):
 * - Never send gymnast/coach names, emails, or any free-text identifiers.
 * - Never send audio file names, lyrics, or raw file contents.
 * - Identify users only by their internal Supabase user id (an opaque UUID).
 * - Property values are allowlisted + sanitized before they ever leave the app.
 */

export const ANALYTICS_EVENTS = {
  // --- Auth / account (fires today) ---
  signed_up: "signed_up",
  logged_in: "logged_in",
  account_deleted: "account_deleted",

  // --- Subscription (fires today, server-side via Stripe webhook) ---
  subscription_started: "subscription_started",
  subscription_cancelled: "subscription_cancelled",

  // --- Music marketplace (fires today) ---
  music_page_viewed: "music_page_viewed",
  creator_interest_submitted: "creator_interest_submitted",

  // --- Player: core session (fires today) ---
  track_imported: "track_imported",
  track_played: "track_played",
  track_paused: "track_paused",
  track_completed: "track_completed",
  session_started: "session_started",
  fullscreen_entered: "fullscreen_entered",

  // --- Dormant: defined now, fire when the feature ships ---
  playlist_updated: "playlist_updated",
  competition_mode_entered: "competition_mode_entered",
  competition_mode_exited: "competition_mode_exited",
  podium_training_started: "podium_training_started",
  podium_training_completed: "podium_training_completed",
  feedback_submitted: "feedback_submitted",
  playback_delayed: "playback_delayed",
  track_hidden: "track_hidden",

  // --- Product events (client, web + native app; see PRODUCT_EVENTS) ---
  app_opened: "app_opened",
  login_succeeded: "login_succeeded",
  logout_completed: "logout_completed",
  playlist_created: "playlist_created",
  playlist_deleted: "playlist_deleted",
  cloud_upload_started: "cloud_upload_started",
  cloud_upload_completed: "cloud_upload_completed",
  cloud_upload_failed: "cloud_upload_failed",
  cloud_playlist_download_started: "cloud_playlist_download_started",
  cloud_playlist_download_completed: "cloud_playlist_download_completed",
  cloud_playlist_download_failed: "cloud_playlist_download_failed",
  session_paused: "session_paused",
  session_resumed: "session_resumed",
  session_completed: "session_completed",
  track_play_started: "track_play_started",
  track_play_completed: "track_play_completed",
  fullscreen_player_opened: "fullscreen_player_opened",
  fullscreen_player_closed: "fullscreen_player_closed",
  offline_playback_started: "offline_playback_started",
} as const

export type AnalyticsEvent = (typeof ANALYTICS_EVENTS)[keyof typeof ANALYTICS_EVENTS]

/**
 * The ONLY events the client sends to PostHog (website + Capacitor apps).
 * Anything else passed to trackEvent() goes to Vercel Analytics only, and
 * captureEvent() drops it, so PostHog never receives an unlisted event.
 */
export const PRODUCT_EVENTS = [
  "app_opened",
  "login_succeeded",
  "logout_completed",
  "playlist_created",
  "playlist_deleted",
  "cloud_upload_started",
  "cloud_upload_completed",
  "cloud_upload_failed",
  "cloud_playlist_download_started",
  "cloud_playlist_download_completed",
  "cloud_playlist_download_failed",
  "session_started",
  "session_paused",
  "session_resumed",
  "session_completed",
  "track_play_started",
  "track_play_completed",
  "fullscreen_player_opened",
  "fullscreen_player_closed",
  "offline_playback_started",
] as const satisfies readonly AnalyticsEvent[]

export type ProductEvent = (typeof PRODUCT_EVENTS)[number]

const PRODUCT_EVENT_SET: ReadonlySet<string> = new Set(PRODUCT_EVENTS)

export function isProductEvent(name: string): name is ProductEvent {
  return PRODUCT_EVENT_SET.has(name)
}

/** Safe, content-free failure buckets. Raw error text is never sent. */
export type ErrorCategory =
  | "network"
  | "authentication"
  | "permission"
  | "storage"
  | "validation"
  | "unknown"

/** Events that have a real trigger in the product today. */
export const ACTIVE_EVENTS: ReadonlySet<AnalyticsEvent> = new Set([
  ANALYTICS_EVENTS.signed_up,
  ANALYTICS_EVENTS.logged_in,
  ANALYTICS_EVENTS.account_deleted,
  ANALYTICS_EVENTS.subscription_started,
  ANALYTICS_EVENTS.subscription_cancelled,
  ANALYTICS_EVENTS.music_page_viewed,
  ANALYTICS_EVENTS.creator_interest_submitted,
  ANALYTICS_EVENTS.track_imported,
  ANALYTICS_EVENTS.track_played,
  ANALYTICS_EVENTS.track_paused,
  ANALYTICS_EVENTS.track_completed,
  ANALYTICS_EVENTS.session_started,
  ANALYTICS_EVENTS.fullscreen_entered,
  ANALYTICS_EVENTS.track_hidden,
])

/**
 * Allowlisted property keys. Any key not in this set is dropped by
 * `sanitizeProps` before an event is sent. This is the primary defence against
 * accidentally leaking PII (names, emails, file names, etc.) into analytics.
 */
export const ALLOWED_PROP_KEYS: ReadonlySet<string> = new Set([
  // context
  "location",
  "source",
  "platform",
  "native_app",
  "build_target",
  "app_version",
  "surface",
  "error_category",
  "subscription_tier",
  // subscription (non-PII, low cardinality)
  "plan",
  "tier",
  "interval",
  "reason",
  // player (durations/counts/flags only — never track identity)
  "duration_ms",
  "position_ms",
  "track_count",
  "session_kind",
  "has_playlist",
  "mode",
  "delay_ms",
  "rating",
  // generic booleans/counts
  "count",
  "value",
  "enabled",
  "had_subscription",
])

/** Primitive property values we allow. Objects/arrays/functions are dropped. */
type Primitive = string | number | boolean | null

/**
 * Cap on string length for any allowlisted string value. Keeps low-cardinality
 * enums intact while preventing a stray long string (e.g. a pasted note) from
 * slipping through even on an allowed key.
 */
const MAX_STRING_LEN = 64

/**
 * Strip an event's properties down to the allowlist and to safe primitive
 * values. Returns a new object; never mutates the input. This runs on both the
 * client and server paths so no code can bypass it.
 */
export function sanitizeProps(
  props: Record<string, unknown> | undefined,
): Record<string, Primitive> {
  if (!props) return {}
  const clean: Record<string, Primitive> = {}
  for (const [key, raw] of Object.entries(props)) {
    if (!ALLOWED_PROP_KEYS.has(key)) continue
    if (raw === null) {
      clean[key] = null
      continue
    }
    const t = typeof raw
    if (t === "number" && Number.isFinite(raw as number)) {
      clean[key] = raw as number
    } else if (t === "boolean") {
      clean[key] = raw as boolean
    } else if (t === "string") {
      clean[key] = (raw as string).slice(0, MAX_STRING_LEN)
    }
    // anything else (object, array, undefined, function, NaN) is intentionally dropped
  }
  return clean
}
