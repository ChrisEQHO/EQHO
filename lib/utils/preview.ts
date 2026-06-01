// Helper to detect v0 preview/development environment
export const isV0Preview =
  process.env.NODE_ENV === "development" ||
  process.env.NEXT_PUBLIC_V0_PREVIEW === "true"

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
