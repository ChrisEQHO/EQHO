# EQHO Analytics

EQHO runs two analytics pipelines side by side:

- **Vercel Analytics + Speed Insights** — page views and Web Vitals (unchanged).
- **PostHog** (EU region) — the typed product-event catalogue described here.

Both run under the **same gate**: production **web** build only. Neither runs in
the Capacitor/mobile build, in dev, or in the v0 preview. Without a PostHog key,
the PostHog path no-ops entirely, so the app is fully functional before the
integration is provisioned.

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
- `identify` uses the internal **Supabase user id** only; the sole person
  property is a coarse `subscription_status`.
- **Session replay** is OFF until explicit consent. When enabled it masks all
  inputs and text and blocks `audio`, `video`, `input[type=file]`, and any
  `[data-ph-no-capture]` node.
- Add `data-ph-no-capture` to any element that must never be recorded.

## Events

### Active (fire today)

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

`location, source, platform, app_version, surface, plan, tier, interval, reason,
duration_ms, position_ms, track_count, session_kind, has_playlist, mode,
delay_ms, rating, count, value, enabled`.

Anything outside this set is dropped before an event is sent.

## Tests

`lib/analytics/__tests__/` — run with `pnpm test`:

- `sanitize.test.ts` — PII/unlisted props stripped; only allowlisted keys survive.
- `events.test.ts` — critical events named correctly; no duplicate strings.
- `gating.test.ts` — no-ops without key / in mobile / in dev / in preview.
