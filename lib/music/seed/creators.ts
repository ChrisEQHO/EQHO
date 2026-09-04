import type { MusicCreator } from "@/lib/music/types"

// EQHO Music — creator PLACEHOLDERS.
//
// The original prototype used invented artist names/photos. Per the spec
// revision that is explicitly forbidden: there must be NO fake creator names,
// NO fake biographies and NO fake human photos.
//
// These are exactly TEN neutral slots that show WHERE real creator information
// will appear once EQHO Music launches. The label ("Creator 01") is a slot
// number, not an identity, and the artwork is a branded abstract gradient
// rendered in the UI (no photos).
export const CREATORS: MusicCreator[] = Array.from({ length: 10 }, (_, i) => {
  const n = (i + 1).toString().padStart(2, "0")
  return {
    id: `cr_${n}`,
    slug: `creator-${n}`,
    name: `Creator ${n}`,
    tagline: "Creator profile coming soon",
    bio: "This is a placeholder creator slot. Verified EQHO Music creators, their profiles and their catalogues will appear here at launch.",
    accent: i,
    // Surface the first four as "featured" placeholders on the discover page.
    featured: i < 4,
  }
})

export function getCreatorById(id: string): MusicCreator | undefined {
  return CREATORS.find((c) => c.id === id)
}

export function getCreatorBySlug(slug: string): MusicCreator | undefined {
  return CREATORS.find((c) => c.slug === slug)
}
