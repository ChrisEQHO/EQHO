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
  // Hero headline.
  tagline: 'Set the music once. Coach the whole session.',
  // Hero supporting paragraph (sits under the headline).
  heroSupport:
    'Build the running order, choose the gap between routines and set the repeats before training starts. Press play and EQHO Player keeps the session moving while you coach.',
  // Short product description reused for summaries and structured data.
  description:
    'EQHO Player manages competition music during training. Prepare the running order, timing and repeats in around 30 seconds, then press play and coach the session.',
  url: 'https://www.eqho-player.com',
  logo: '/images/eqho-player-header-v2.png',
} as const

/**
 * Native app availability. EQHO Player works in any modern web browser on
 * desktop, tablet and mobile; the iOS app gives the best experience on iPad
 * and iPhone. Keep the App Store link here so every download button/badge
 * across the site points at one place.
 */
export const APP = {
  appStoreUrl: 'https://apps.apple.com/us/app/eqho-player/id6779510312',
  appStoreLabel: 'Download on the App Store',
  // Short line shown beside download buttons.
  bestOn: 'Best experience on iPad & iPhone',
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
  { label: 'The player', href: '/features' },
  { label: 'Music store', href: '/store' },
  { label: 'How it works', href: '/#how-it-works' },
  { label: 'Who it’s for', href: '/#audiences' },
  { label: 'Pricing', href: '/pricing' },
  { label: 'FAQ', href: '/#faq' },
]

/** The problem → outcome framing under the hero. */
export const PROBLEM = {
  heading: 'Floor time is for coaching, not searching for tracks.',
  body: 'When training time is limited, every interruption takes valuable time away from your session. EQHO Player keeps your running order, gaps and repeats organised, helping you maximise the time available for routines. Set up your session in around 30 seconds, press play and focus on coaching.',
} as const

/**
 * Feature cards. Icons are lucide-react names resolved in the component, so this
 * file stays free of JSX.
 */
export const FEATURES: { icon: string; title: string; body: string }[] = [
  {
    icon: 'ListOrdered',
    title: 'Keep the running order',
    body: 'Your playlist stays in the order you prepared, ready for the next routine.',
  },
  {
    icon: 'Timer',
    title: 'Control the gaps',
    body: 'Choose how many seconds athletes have between routines.',
  },
  {
    icon: 'Repeat',
    title: 'Run repetitions without stopping',
    body: 'Use back-to-back playback and set how many times a routine should run.',
  },
  {
    icon: 'Eye',
    title: 'Make better use of floor time',
    body: 'Spend less of the session handling music and more of it coaching.',
  },
  {
    icon: 'CloudUpload',
    title: 'Your sessions, backed up',
    body: 'Push your playlists and audio to your EQHO account, so a session created at home is ready when you log in on any device at training.',
  },
  {
    icon: 'MonitorSmartphone',
    title: 'Works on all your devices',
    body: 'Use EQHO Player in any web browser on desktop, tablet or mobile. For the best experience on iPad and iPhone, download the free app from the Apple App Store.',
  },
]

/** How-it-works steps. Not "01/02/03" decoration — these are a real sequence. */
export const STEPS: { title: string; body: string }[] = [
  {
    title: 'Arrange the routines',
    body: 'Put the competition music in the order you want to run it.',
  },
  {
    title: 'Set the session controls',
    body: 'Choose the gap between routines, set the repeats and switch on back-to-back playback when needed.',
  },
  {
    title: 'Press play and coach',
    body: 'EQHO Player follows the session plan while you watch, teach and give feedback.',
  },
]

/** Audience cards. */
export const AUDIENCES: { icon: string; title: string; body: string }[] = [
  {
    icon: 'Medal',
    title: 'Gymnastics coaches',
    body: 'Keep every gymnast’s floor music organised and ready to play throughout the training session.',
  },
  {
    icon: 'Music2',
    title: 'Dance & performance',
    body: 'Keep group and solo routines in order while you work through the session.',
  },
  {
    icon: 'Megaphone',
    title: 'Cheer & tumbling',
    body: 'Run team routines back to back so tumbling passes keep moving between reps.',
  },
]

/** FAQ — honest answers, no invented specifics. */
export const FAQ: { q: string; a: string }[] = [
  {
    q: 'What is EQHO Player?',
    a: 'EQHO Player is a training music player for gymnastics, acro, dance and cheer coaches. It organises routine playlists and controls the order, gaps and repeats, reducing interruptions when floor time is limited.',
  },
  {
    q: 'How much does EQHO Player cost?',
    a: 'EQHO Player is free to use until 31 August. After that it moves to a simple subscription. See the pricing page for the current price.',
  },
  {
    q: 'Do I need to install anything?',
    a: 'No. EQHO Player works in any web browser on desktop, tablet and mobile — nothing to install. For the best experience on iPad and iPhone, you can download the free EQHO Player app from the Apple App Store.',
  },
  {
    q: 'Where is my music stored?',
    a: 'When you push a playlist, your audio and running order are saved securely to your EQHO account so they are backed up and available when you log in.',
  },
  {
    q: 'Can I use it on the day without internet?',
    a: 'Yes. Downloaded playlists play directly to your device, so you can use them without an internet connection. We recommend downloading and checking all your playlists on every device you plan to use before travelling to the venue.',
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
      { label: 'The player', href: '/features' },
      { label: 'Music store', href: '/store' },
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
