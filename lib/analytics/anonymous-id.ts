/**
 * PostHog never receives the Supabase user id. It receives a one-way SHA-256
 * digest of it, namespaced so the value cannot be matched against the raw id
 * in any other system. The digest is stable, so the same person is still one
 * profile across web, iPhone and iPad.
 */
const NAMESPACE = "eqho-analytics-v1:"

function toHex(buffer: ArrayBuffer): string {
  return Array.from(new Uint8Array(buffer), (b) => b.toString(16).padStart(2, "0")).join("")
}

export async function anonymousUserId(userId: string): Promise<string | null> {
  if (!userId) return null
  const subtle = globalThis.crypto?.subtle
  if (!subtle) return null
  try {
    const digest = await subtle.digest("SHA-256", new TextEncoder().encode(NAMESPACE + userId))
    return `anon_${toHex(digest).slice(0, 32)}`
  } catch {
    return null
  }
}
