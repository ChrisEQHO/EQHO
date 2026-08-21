// Helper to detect the v0 preview / local development environment.
//
// IMPORTANT: this gates a LOGIN BYPASS (see app/login/page.tsx), so it must NEVER
// be true on the real deployed site. `NEXT_PUBLIC_V0_PREVIEW` is a public build-time
// flag that can accidentally leak into the production bundle; when it did, the login
// page skipped Supabase auth and just redirected to "/", which middleware then
// bounced back to /login — the "Login button does nothing" bug.
//
// So in the browser we authoritatively decide by HOST: the production domain is
// never a preview, and only known v0/local hosts are. We fall back to the env flags
// on the server (SSR) and for any unrecognized host.
function detectV0Preview(): boolean {
  if (typeof window !== "undefined") {
    const host = window.location.hostname

    // Real production / custom domains are NEVER a preview.
    const isProductionHost =
      host === "eqho-player.com" || host.endsWith(".eqho-player.com")
    if (isProductionHost) return false

    // Genuine v0 preview / local development hosts.
    const isPreviewHost =
      host === "localhost" ||
      host === "127.0.0.1" ||
      host.endsWith(".vercel.run") ||
      host.endsWith(".v0.dev") ||
      host.endsWith(".vusercontent.net")
    if (isPreviewHost) return true

    // Any other real host (e.g. a Vercel *.vercel.app deployment) is treated as
    // production for auth safety.
    return false
  }

  // Server-side / build-time fallback.
  return (
    process.env.NODE_ENV === "development" ||
    process.env.NEXT_PUBLIC_V0_PREVIEW === "true"
  )
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
