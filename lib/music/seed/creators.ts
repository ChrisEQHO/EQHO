import type { MusicCreator } from "@/lib/music/types"

// Seed creators for the EQHO Music prototype. These are fictional artists used
// to demonstrate the marketplace UX. No real people or real sales are implied.
export const CREATORS: MusicCreator[] = [
  {
    id: "cr_aurelia",
    slug: "aurelia-vance",
    name: "Aurelia Vance",
    tagline: "Cinematic ambient & modern classical",
    bio: "Aurelia builds slow-moving cinematic worlds from piano, tape and analogue synths. Her pieces are made for reflective scenes, title sequences and quiet trailers.",
    country: "United Kingdom",
    avatar: "/music/creators/aurelia-vance.png",
    genres: ["Cinematic", "Ambient", "Modern Classical"],
    featured: true,
  },
  {
    id: "cr_kojo",
    slug: "kojo-mensah",
    name: "Kojo Mensah",
    tagline: "Afrobeat, highlife & percussive grooves",
    bio: "Accra-based producer Kojo Mensah fuses highlife guitar lines with modern Afrobeat drums. Warm, danceable and built for brand films and travel content.",
    country: "Ghana",
    avatar: "/music/creators/kojo-mensah.png",
    genres: ["Afrobeat", "Highlife", "World"],
    featured: true,
  },
  {
    id: "cr_lin",
    slug: "lin-yuki",
    name: "Lin Yuki",
    tagline: "Lo-fi beats & textured hip-hop",
    bio: "Lin Yuki makes dusty, tape-saturated lo-fi and instrumental hip-hop from a tiny Kyoto studio. Ideal for study playlists, vlogs and calm product demos.",
    country: "Japan",
    avatar: "/music/creators/lin-yuki.png",
    genres: ["Lo-fi", "Hip-Hop", "Chillhop"],
    featured: false,
  },
  {
    id: "cr_sable",
    slug: "sable-rivera",
    name: "Sable Rivera",
    tagline: "Neon synthwave & retro electronica",
    bio: "Sable Rivera channels 80s arpeggios and widescreen synths into modern synthwave. Bright, propulsive and made for tech reveals and montages.",
    country: "United States",
    avatar: "/music/creators/sable-rivera.png",
    genres: ["Synthwave", "Electronic", "Retro"],
    featured: true,
  },
  {
    id: "cr_ottoline",
    slug: "ottoline-fisk",
    name: "Ottoline Fisk",
    tagline: "Folk, acoustic & intimate songwriting",
    bio: "Ottoline writes fingerpicked acoustic folk with hushed vocals and room-recorded warmth. Perfect for heartfelt adverts and documentary beds.",
    country: "Ireland",
    avatar: "/music/creators/ottoline-fisk.png",
    genres: ["Folk", "Acoustic", "Singer-Songwriter"],
    featured: false,
  },
  {
    id: "cr_dmitri",
    slug: "dmitri-sorokin",
    name: "Dmitri Sorokin",
    tagline: "Driving techno & club electronica",
    bio: "Berlin-by-way-of-Tbilisi producer Dmitri Sorokin makes hypnotic, driving techno with analogue grit. Built for fashion films, nightlife and high-energy edits.",
    country: "Georgia",
    avatar: "/music/creators/dmitri-sorokin.png",
    genres: ["Techno", "Electronic", "Club"],
    featured: false,
  },
]

export function getCreatorById(id: string): MusicCreator | undefined {
  return CREATORS.find((c) => c.id === id)
}

export function getCreatorBySlug(slug: string): MusicCreator | undefined {
  return CREATORS.find((c) => c.slug === slug)
}
