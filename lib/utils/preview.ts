// Helper to detect the v0 preview / local development environment.
//
// IMPORTANT: this gates a LOGIN BYPASS + a mock user, so it must NEVER be true on
// the real deployed site. We deliberately do NOT trust `NEXT_PUBLIC_V0_PREVIEW`:
// that public flag is set in this project's PRODUCTION environment, so relying on
// it made the production server think it was a preview. That caused two bugs:
//   1. Login was bypassed ("Login button does nothing").
//   2. The server pre-rendered the mock-granted player while the client rendered
//      the real auth gate — a hydration mismatch that wedged the app on
//      "Checking your access…".
//
// Detection is therefore client-only and based on signals that can never be true
// on the real domain:
//   - the v0 sandbox injects `window.__V0_SANDBOX_ID__`
//   - local dev runs on localhost / 127.0.0.1
//   - v0 preview hosts (*.vercel.run, *.v0.dev, *.v0.build, *.vusercontent.net)
// On the SERVER we return false (except genuine `next dev`), so SSR always renders
// the neutral, logged-out shell and matches the client's first paint on production.
function detectV0Preview(): boolean {
  if (typeof window !== "undefined") {
    // Most reliable: the v0 sandbox injects this global. Works regardless of host.
    if (typeof (window as unknown as { __V0_SANDBOX_ID__?: string }).__V0_SANDBOX_ID__ === "string") {
      return true
    }

    const host = window.location.hostname

    // Real production / custom domains are NEVER a preview.
    const isProductionHost =
      host === "eqho-player.com" || host.endsWith(".eqho-player.com")
    if (isProductionHost) return false

    // Local development and genuine v0 preview hosts.
    return (
      host === "localhost" ||
      host === "127.0.0.1" ||
      host.endsWith(".vercel.run") ||
      host.endsWith(".v0.dev") ||
      host.endsWith(".v0.build") ||
      host.endsWith(".vusercontent.net")
    )
  }

  // Server-side / build-time: only `next dev` counts as preview. Never trust the
  // public env flag here (it leaks into production). This keeps SSR consistent with
  // the production client (both non-preview), eliminating the hydration mismatch.
  return process.env.NODE_ENV === "development"
}

export const isV0Preview = detectV0Preview()

// Mock user for preview/development only
const mockUser = {
  id: "v0-preview-user",
  email: "preview@eqho.local",
}

// Returns mock user if in v0 preview, otherwise null
export function getPreviewUser() {
  if (isV0Preview) {
    return mockUser
  }
  return null
}

// Export mockUser for direct access when needed
export { mockUser }
