# EQHO Analytics

EQHO runs two analytics pipelines side by side:

- **Vercel Analytics + Speed Insights** — page views and Web Vitals (unchanged).
- **PostHog** (EU region) — the typed product-event catalogue described here.

Vercel Analytics runs on the production **web** build only. PostHog runs on
production builds of the **website and the Capacitor iPhone, iPad and Android
apps**. Neither runs in dev or in the v0 preview. Without a PostHog key, the
PostHog path no-ops entirely, so the app is fully functional before the
integration is provisioned. Events captured while offline are queued by the SDK
and sent when the connection returns.

## Environment variables

| Variable | Purpose | Default |
| --- | --- | --- |
| `NEXT_PUBLIC_POSTHOG_KEY` | PostHog project key. If unset, PostHog no-ops. | — |
| `NEXT_PUBLIC_POSTHOG_HOST` | Ingestion host. | `https://eu.i.posthog.com` |

The server path (`posthog-node`, used by the Stripe webhook) reuses the same
public key. No secret key is introduced.

## Architecture

| File | Role |
| --- | --- |
| `lib/analytics/events.ts` | Typed event catalogue + property allowlist + `sanitizeProps()`. |
| `lib/analytics/posthog-client.ts` | Client init/gate, `captureEvent`, `identifyUser`, `resetUser`, `groupClub`, replay toggle. |
| `lib/analytics/posthog-server.ts` | `captureServer()` for webhook events (flushes per call). |
| `lib/analytics/consent.ts` | Consent state (localStorage) + change subscription. |
| `lib/analytics/device.ts` | Coarse, non-PII device/version context. |
| `lib/analytics/track-event.ts` | Existing Vercel wrapper — now also fans out to PostHog. |
| `components/analytics/posthog-provider.tsx` | Mounts under the gate; pageviews, identify, consent. |
| `components/analytics/consent-banner.tsx` | On-brand accept/decline control. |

`trackEvent(name, props)` remains the single client entry point. It still sends
to Vercel Analytics exactly as before and now additionally forwards the same
event to PostHog through `sanitizeProps`.

## Privacy contract

- Only **allowlisted, low-cardinality** properties leave the app; `sanitizeProps`
  strips everything else (defence-in-depth against PII).
- **Never** send gymnast/coach names, emails, track/playlist/file names, audio
  contents, URLs, tokens, or free text.
- Even on an allowed key, string values that look like an email, a JWT, a
  secret (`sk_live_`, `service_role`, `Bearer`) or an audio filename are dropped,
  and strings are capped at 64 characters.
- Only events in `PRODUCT_EVENTS` reach PostHog; `captureEvent` drops anything
  else.
- `identify` uses an **anonymous id**: a SHA-256 hash of the internal Supabase
  user id (`lib/analytics/anonymous-id.ts`), never the email or the raw id. If
  Web Crypto is unavailable the user stays on PostHog's random anonymous id. The
  only person property is a coarse `subscription_tier`.
- Errors are reported as an `error_category` bucket (`network`,
  `authentication`, `permission`, `storage`, `validation`, `unknown`); raw
  error text is never sent.
- **Session replay** is OFF until explicit consent. When enabled it masks all
  inputs and text and blocks `audio`, `video`, `input[type=file]`, and any
  `[data-ph-no-capture]` node.
- Add `data-ph-no-capture` to any element that must never be recorded.

## Events

### Product events (PostHog, web + native apps)

Every product event automatically carries the context properties `platform`
(`web`, `ios`, `ipados`, `android`), `native_app`, `build_target`,
`app_version`, `build_number` and `offline`. iPads are reported as `ipados`,
including iPadOS 13+ devices that identify as a Mac.

| Event | Fires when | Extra properties |
| --- | --- | --- |
| `app_opened` | PostHog initialises | — |
| `login_succeeded` | Sign-in succeeds | — |
| `logout_completed` | Sign-out completes | — |
| `auth_failed` | Sign-in fails | `error_category` |
| `playlist_created` | A playlist is created | `track_count` |
| `playlist_deleted` | A playlist is deleted | — |
| `playlist_upload_started` / `playlist_upload_completed` | Cloud upload begins / finishes | `track_count`, `failed_count` |
| `playlist_download_started` / `playlist_download_completed` | Cloud download begins / finishes | `track_count`, `failed_count` |
| `cloud_sync_failed` | An upload or download fails | `direction` (`upload`/`download`), `error_category`, `failed_count` |
| `session_started` / `session_paused` / `session_resumed` / `session_completed` | Session lifecycle | `track_count` |
| `track_play_started` / `track_play_completed` | A single play begins / reaches its natural end | — |
| `track_target_completed` | A track reaches its per-track play target (fires once per track per round, on both audio engines) | `target_plays` |
| `fullscreen_opened` / `fullscreen_closed` | Coach view opened / closed | — |
| `offline_playback_started` | Playback starts while the device is offline | — |
| `onboarding_completed` | The first-run guide is finished | `step_count` |

### Legacy Vercel Analytics events (fire today)

| Event | Where | Properties |
| --- | --- | --- |
| `signed_up` | Signup success (`app/signup/page.tsx`) | — |
| `logged_in` | Login success (`app/login/page.tsx`) | — |
| `music_page_viewed` | `/music` beacon | — |
| `creator_interest_submitted` | Creator interest form | — |
| `track_imported` | Player import flow | — |
| `track_played` / `track_paused` / `track_completed` | Player controls (discrete) | — |
| `session_started` | Player session start | — |
| `subscription_started` | **Server** — Stripe `subscription.created/updated` → trialing/active | `plan`, `reason` |
| `subscription_cancelled` | **Server** — Stripe `subscription.deleted` | `plan` |

Player control events are **discrete** (button actions), never continuous
`timeupdate` streams, and are de-duped so one user action emits once. Audio
playback logic is untouched.

### Dormant (defined, no trigger yet)

`playlist_updated`, `competition_mode_entered`, `competition_mode_exited`,
`podium_training_started`, `podium_training_completed`, `feedback_submitted`,
`playback_delayed`, `track_hidden`.

These have stable names in the catalogue and are callable the moment their
feature ships — no refactor required.

## Club grouping

`groupClub(clubId)` exists and no-ops until a club model is available. When club
ids exist, call it after `identifyUser` to associate the user with a `club`
group; nothing else needs to change.

## Allowed property keys

`location, source, platform, native_app, build_target, app_version,
build_number, offline, direction, target_plays, failed_count, step_count,
surface, error_category, subscription_tier, plan, tier, interval, reason,
duration_ms, position_ms, track_count, session_kind, has_playlist, mode,
delay_ms, rating, count, value, enabled, had_subscription`.

Anything outside this set is dropped before an event is sent.

## Tests

`lib/analytics/__tests__/` — run with `pnpm test`:

- `sanitize.test.ts` — PII/unlisted props stripped; only allowlisted keys survive.
- `events.test.ts` — critical events named correctly; no duplicate strings.
- `gating.test.ts` — no-ops without key / in mobile / in dev / in preview.
