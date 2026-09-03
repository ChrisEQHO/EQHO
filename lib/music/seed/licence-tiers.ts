import type { PersonalLicence } from "@/lib/music/types"

// EQHO Music has exactly ONE licence: the Personal Licence, at a single flat
// price. There are no tiers and the customer never chooses a licence type.
//
// The price here is in pence (GBP) and is the SERVER-AUTHORITATIVE source of
// truth — the quote and checkout routes recompute every total from this value
// and never trust a price sent by the browser (spec §27).

export const PERSONAL_LICENCE_PENCE = 1999 // £19.99

export const PERSONAL_LICENCE: PersonalLicence = {
  id: "personal",
  name: "Personal Licence",
  tagline: "One simple licence for your routine — every track, one price.",
  rights: [
    "Use in one gymnast's routine or personal project",
    "Perform and compete with the track",
    "Personal, non-commercial use",
    "No resale or redistribution of the audio file",
  ],
  pricePence: PERSONAL_LICENCE_PENCE,
}

// Kept as a stable accessor so callers don't reach into the constant directly.
export function getPersonalLicence(): PersonalLicence {
  return PERSONAL_LICENCE
}
