/**
 * Single source of truth for all EQHO marketing-site copy and navigation.
 *
 * Keeping this in one config (instead of inline JSX prose) means launch dates,
 * CTAs, and section copy can be changed in one place, and there are no fabricated
 * numbers/testimonials scattered through the components. Nothing here is a claim
 * that isn't true of the product.
 */

export const SITE = {
  name: 'EQHO Player',
  // Short tagline used in the hero and <title>.
  tagline: 'Run every routine on cue.',
  description:
    'EQHO Player is the music player built for gymnastics, dance and cheer coaches — organise routine music into playlists, lock your running order, and control every track from the floor.',
  url: 'https://www.eqho-player.com',
  logo: '/images/eqho-player-header-v2.png',
} as const

/**
 * Launch / pricing messaging. The user chose "free until launch" messaging only,
 * so the marketing site does NOT advertise the 30-day trial. Update the date here
 * and it changes everywhere it is shown.
 */
export const LAUNCH = {
  // Shown in the top strip and pricing page.
  freeUntilLabel: 'Free to use until 31 August',
  freeUntilShort: 'Free until 31 Aug',
  // Human sentence used in longer copy.
  freeNote:
    'EQHO Player is completely free to use until 31 August. Create your account today and start building your sessions.',
} as const

/**
 * Pricing-page content + the SINGLE launch transition date.
 *
 * All date logic and pricing copy live here so nothing is scattered across
 * components. Before `launchTransitionUtc` the page shows the launch offer; on or
 * after it, the standard 30-day-trial offer. £4.99/month is the price; the actual
 * figure shown is always the live Stripe price (see lib/get-pricing.ts), with
 * £4.99 as the documented fallback.
 *
 * launchTransitionUtc: 1 September 2026, 00:00 Europe/London. September is BST
 * (UTC+1), so midnight London == 2026-08-31T23:00:00Z.
 */
export const PRICING = {
  launchTransitionUtc: '2026-08-31T23:00:00.000Z',
  productName: 'EQHO Player',
  trialLabel: 'First 30 days free',
  ctaHref: '/signup',
} as const

/** True when `now` is before the launch transition (Europe/London midnight). */
export function isPreLaunch(now: Date = new Date()): boolean {
  return now.getTime() < new Date(PRICING.launchTransitionUtc).getTime()
}

export type PricingCopy = {
  preLaunch: boolean
  badge: string
  heading: string
  supporting: string
  priceLabel: string
  frequency: string
  trialLabel: string
  explanation: string
  cta: string
  cardNote: string
}

/**
 * Resolve the exact pricing-page copy for the current launch phase, injecting the
 * (live or fallback) price so the wording never contradicts Stripe.
 *
 * @param formattedPrice e.g. "£4.99"
 * @param interval       e.g. "month" (empty for one-off)
 * @param now            injectable for testing; defaults to current time
 */
export function getPricingCopy(formattedPrice: string, interval: string, now: Date = new Date()): PricingCopy {
  const per = interval ? `${formattedPrice}/${interval}` : formattedPrice
  const frequency = interval ? `per ${interval}` : ''

  // Signup collects NO payment method (Supabase-only account creation), so both
  // phases use the "No card required" wording — never an unqualified "cancel anytime".
  if (isPreLaunch(now)) {
    return {
      preLaunch: true,
      badge: 'Launch offer: free until 31 August',
      heading: `30 days free, then ${per}`,
      supporting:
        'Create your account now and use EQHO free until 31 August. Your 30-day free trial begins on 1 September.',
      priceLabel: formattedPrice,
      frequency,
      trialLabel: PRICING.trialLabel,
      explanation: `Free access until 31 August, followed by your 30-day free trial. Subscribe for ${per} after the trial to continue.`,
      cta: 'Start using EQHO free',
      cardNote: 'No card required. No charge during free access or your trial.',
    }
  }

  return {
    preLaunch: false,
    badge: '30-day free trial',
    heading: 'Simple pricing for coaches.',
    supporting: `Try every EQHO feature free for 30 days. Continue for ${per} after your trial.`,
    priceLabel: formattedPrice,
    frequency,
    trialLabel: PRICING.trialLabel,
    explanation: '',
    cta: 'Start 30-day free trial',
    cardNote: 'No card required. Subscribe after your trial to continue.',
  }
}

/** Primary calls to action. Pre-launch the primary action is "Start free". */
export const CTA = {
  primary: { label: 'Start free', href: '/signup' },
  secondary: { label: 'Log in', href: '/login' },
  // Shown to already-signed-in visitors in the header.
  openApp: { label: 'Open EQHO', href: '/app' },
} as const

/** Header navigation (anchors on the homepage + the pricing route). */
export const NAV_LINKS: { label: string; href: string }[] = [
  { label: 'Features', href: '/#features' },
  { label: 'How it works', href: '/#how-it-works' },
  { label: 'Who it’s for', href: '/#audiences' },
  { label: 'Pricing', href: '/pricing' },
  { label: 'FAQ', href: '/#faq' },
]

/** The problem → outcome framing under the hero. */
export const PROBLEM = {
  heading: 'Fumbling with a phone at the side of the floor is the worst part of the meet.',
  body: 'Scrubbing through a camera roll, muting the wrong track, or missing a cue puts pressure on your athletes at the exact moment they need calm. EQHO Player puts your whole session in order so you press play once and trust it.',
} as const

/**
 * Feature cards. Icons are lucide-react names resolved in the component, so this
 * file stays free of JSX.
 */
export const FEATURES: { icon: string; title: string; body: string }[] = [
  {
    icon: 'ListMusic',
    title: 'Playlists that match your session',
    body: 'Group routine music into playlists per squad, level or competition, so the right tracks are always a tap away.',
  },
  {
    icon: 'ListOrdered',
    title: 'Locked running order',
    body: 'Set the exact order your athletes compete in and play straight down the list — no hunting for the next track.',
  },
  {
    icon: 'SlidersHorizontal',
    title: 'Precise track control',
    body: 'Start, pause and reset each routine cleanly, with clear track names and durations you can read from the floor.',
  },
  {
    icon: 'Timer',
    title: 'Countdown you can see',
    body: 'A full-screen countdown makes it obvious when a routine is about to start, from anywhere in the hall.',
  },
  {
    icon: 'CloudUpload',
    title: 'Your library in the cloud',
    body: 'Push your playlists and audio to your account so your sessions are backed up and ready on any device you log in to.',
  },
  {
    icon: 'MonitorSmartphone',
    title: 'Works on your devices',
    body: 'Run EQHO Player in the browser on a laptop or tablet, or install the app — the same session, wherever you coach.',
  },
]

/** How-it-works steps. Not "01/02/03" decoration — these are a real sequence. */
export const STEPS: { title: string; body: string }[] = [
  {
    title: 'Upload your music',
    body: 'Add a folder of routine tracks and EQHO Player organises them into a playlist you can name and reorder.',
  },
  {
    title: 'Set your running order',
    body: 'Drag tracks into the exact order your athletes compete, then push the playlist to your account to save it.',
  },
  {
    title: 'Play from the floor',
    body: 'On the day, open your session and play down the list — countdown, track names and controls all in one place.',
  },
]

/** Audience cards. */
export const AUDIENCES: { icon: string; title: string; body: string }[] = [
  {
    icon: 'Medal',
    title: 'Gymnastics coaches',
    body: 'Manage floor and beam music for every gymnast across a full competition day.',
  },
  {
    icon: 'Music2',
    title: 'Dance & performance',
    body: 'Keep group and solo tracks in order for showcases, exams and competitions.',
  },
  {
    icon: 'Megaphone',
    title: 'Cheer & tumbling',
    body: 'Run team routines back to back without missing a beat between performances.',
  },
]

/** FAQ — honest answers, no invented specifics. */
export const FAQ: { q: string; a: string }[] = [
  {
    q: 'How much does EQHO Player cost?',
    a: 'EQHO Player is free to use until 31 August. After that it moves to a simple subscription — see the pricing page for the current price.',
  },
  {
    q: 'Do I need to install anything?',
    a: 'No. EQHO Player runs in your web browser on a laptop or tablet. You can also install the app if you prefer a home-screen icon.',
  },
  {
    q: 'Where is my music stored?',
    a: 'When you push a playlist, your audio and running order are saved securely to your EQHO account so they are backed up and available when you log in.',
  },
  {
    q: 'Can I use it on the day without internet?',
    a: 'Your loaded session plays from your device. We recommend loading and checking your playlists before you travel to the venue.',
  },
  {
    q: 'What do I need to get started?',
    a: 'Just an EQHO account and your routine music files. Create an account and upload a folder to build your first playlist.',
  },
]

/** Footer link groups. */
export const FOOTER_LINKS: { heading: string; links: { label: string; href: string }[] }[] = [
  {
    heading: 'Product',
    links: [
      { label: 'Features', href: '/#features' },
      { label: 'How it works', href: '/#how-it-works' },
      { label: 'Pricing', href: '/pricing' },
    ],
  },
  {
    heading: 'Account',
    links: [
      { label: 'Log in', href: '/login' },
      { label: 'Create account', href: '/signup' },
      { label: 'Open EQHO', href: '/app' },
    ],
  },
  {
    heading: 'Legal',
    links: [
      { label: 'Privacy Policy', href: '/privacy-policy' },
      { label: 'Terms of Service', href: '/terms' },
    ],
  },
]
