import "server-only"

/**
 * Server-side PostHog capture, used for lifecycle events that only the backend
 * can observe reliably (e.g. Stripe subscription webhooks). Kept completely
 * separate from the client bundle.
 *
 * Safety:
 * - No-ops when the PostHog key is absent, so nothing breaks before the env
 *   var is configured.
 * - Reuses the same public project key as the client — no secret is introduced.
 * - Flushes after every capture because serverless functions can freeze/exit
 *   immediately after the response, dropping unflushed events.
 * - Never throws to the caller; analytics must never break a webhook.
 */

import { PostHog } from "posthog-node"
import { ANALYTICS_EVENTS, sanitizeProps, type AnalyticsEvent } from "./events"

const KEY = process.env.NEXT_PUBLIC_POSTHOG_KEY
const HOST = process.env.NEXT_PUBLIC_POSTHOG_HOST ?? "https://eu.i.posthog.com"

let client: PostHog | null = null

function getClient(): PostHog | null {
  if (!KEY) return null
  if (!client) {
    client = new PostHog(KEY, {
      host: HOST,
      // Send immediately; we flush explicitly per call in serverless.
      flushAt: 1,
      flushInterval: 0,
    })
  }
  return client
}

/**
 * Capture a server-side event keyed by the internal Supabase user id.
 * `distinctId` MUST be the opaque user id — never an email or name.
 */
export async function captureServer(
  distinctId: string,
  event: AnalyticsEvent,
  props?: Record<string, unknown>,
): Promise<void> {
  const ph = getClient()
  if (!ph || !distinctId) return
  try {
    ph.capture({
      distinctId,
      event,
      properties: { ...sanitizeProps(props), source: "server" },
    })
    await ph.flush()
  } catch {
    // analytics must never break the webhook
  }
}

export { ANALYTICS_EVENTS }
