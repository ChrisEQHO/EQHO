// Helper to detect v0 preview/development environment
export const isV0Preview =
  process.env.NODE_ENV === "development" ||
  process.env.NEXT_PUBLIC_V0_PREVIEW === "true"

// Mock user for preview/development only
export const mockUser = {
  id: "preview-user-id",
  email: "preview@v0.dev",
  user_metadata: {
    full_name: "v0 Preview User",
  },
}
