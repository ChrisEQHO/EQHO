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
  freeUntilLabel: 'Includes a 30-day free trial',
  freeUntilShort: '30-day free trial',
  // Human sentence used in longer copy.
  freeNote:
    'EQHO Player comes with a 30-day free trial. Create your account today and start building your sessions.',
} as const

/**
 * Pricing-page content + the SINGLE launch transition date.
 *
 * All pricing copy lives here so nothing is scattered across components. Every
 * visitor sees the same 30-day-free-trial offer. £4.99/month is the price; the
 * figure shown is always the live Stripe price (see lib/get-pricing.ts), with
 * £4.99 as the documented fallback.
 *
 * launchTransitionUtc is retained only so existing callers of `isPreLaunch()`
 * keep compiling; both pricing phases now show identical trial copy.
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

  // Signup collects a payment method, but nothing is charged during the 30-day
  // trial and the user can cancel before it ends — so copy leads with "no charge
  // during your trial", never "no card required".
  if (isPreLaunch(now)) {
    return {
      preLaunch: true,
      badge: '30-day free trial',
      heading: `30 days free, then ${per}`,
      supporting: `Create your account and try every EQHO feature free for 30 days. Continue for ${per} after your trial.`,
      priceLabel: formattedPrice,
      frequency,
      trialLabel: PRICING.trialLabel,
      explanation: `Add your payment details securely through Stripe and pay nothing today. Your subscription renews automatically at ${per} when your 30-day trial ends, unless you cancel.`,
      cta: 'Start 30-day free trial',
      cardNote: 'No charge today. Cancel anytime before your trial ends.',
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
    explanation: `Add your payment details securely through Stripe and pay nothing today. Your subscription renews automatically at ${per} when your 30-day trial ends, unless you cancel.`,
    cta: 'Start 30-day free trial',
    cardNote: 'No charge today. Cancel anytime before your trial ends.',
  }
}

/**
 * Subscription packages — the single source of truth for what each plan includes.
 *
 * PLAYER is the package customers can subscribe to TODAY (£4.99/month, shown live
 * from Stripe via lib/get-pricing.ts). Its benefit list contains ONLY features that
 * currently work — nothing aspirational.
 *
 * CLUB is a PLANNED package for 1 February 2027. It is NOT purchasable yet and is
 * presented purely as forward-looking information. Unreleased features (the EQHO
 * Music Marketplace and EQHO Fit) are explicitly marked "when released" so they are
 * never advertised as currently available. Existing EQHO Player subscribers are
 * never silently moved onto Club or charged more without the required notice,
 * disclosure and consent — this config only *describes* the future package.
 */
export const PLAYER_PACKAGE = {
  name: 'EQHO Player',
  fallbackPrice: '£4.99',
  interval: 'month',
  // Launch offer window during which the £4.99 Player price is promoted.
  launchOfferFrom: '1 September 2026',
  launchOfferUntil: '31 January 2027',
  benefits: [
    'Unlimited playlists and session plans',
    'Organised running orders',
    'Adjustable gaps between routines',
    'Repeats and back-to-back playback',
    'Full-screen session mode',
    'Cloud storage and playlist backup',
    'Access on supported desktop, tablet and mobile devices',
    'Offline playback from playlists downloaded to the device',
  ],
} as const

export const CLUB_PACKAGE = {
  name: 'EQHO Club',
  price: '£19.99',
  interval: 'month',
  availableFrom: '1 February 2027',
  benefits: [
    'Multiple user access',
    'Multiple logged-in devices',
    'Playlist access across supported desktop, tablet and mobile devices',
    'EQHO Music Marketplace access when released',
    'EQHO Fit access when released',
  ],
} as const

/**
 * Primary calls to action. Signup starts a 30-day free trial that requires a
 * payment method, so the CTA is never the vague "Start free" — it always says
 * "Start 30-day free trial". `headerCta` is a shorter variant for the compact
 * header pill where the full label would overflow.
 */
export const CTA = {
  primary: { label: 'Start 30-day free trial', href: '/signup' },
  headerCta: { label: 'Start free trial', href: '/signup' },
  secondary: { label: 'Log in', href: '/login' },
  // Shown to already-signed-in visitors in the header.
  openApp: { label: 'Open EQHO', href: '/app' },
} as const

/** Header navigation (anchors on the homepage + the pricing route). */
// NOTE: The "Music store" link is intentionally omitted while the EQHO Music
// marketplace is hidden pre-launch. Re-add `{ label: 'Music store', href: '/store' }`
// (and re-enable the store via NEXT_PUBLIC_STORE_ENABLED) when it is ready.
export const NAV_LINKS: { label: string; href: string }[] = [
  { label: 'The player', href: '/features' },
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

/**
 * Audience cards. Launch focus is gymnastics coaches and clubs — the specific
 * disciplines named here are the ones EQHO markets to. (The product is not
 * restricted to these; this is positioning only.)
 */
export const AUDIENCES: { icon: string; title: string; body: string }[] = [
  {
    icon: 'Medal',
    title: 'Gymnastics coaches',
    body: 'Keep every gymnast’s floor music organised and ready to play throughout the training session.',
  },
  {
    icon: 'Music2',
    title: 'Every gymnastics discipline',
    body: 'Built for Artistic, Women’s Artistic, Rhythmic, Acrobatic and Aerobic Gymnastics routines.',
  },
  {
    icon: 'Megaphone',
    title: 'Clubs & squads',
    body: 'Run squad sessions with running orders, gaps and repeats so floor time keeps moving.',
  },
]

/** FAQ — honest answers, no invented specifics. */
export const FAQ: { q: string; a: string }[] = [
  {
    q: 'What is EQHO Player?',
    a: 'EQHO Player is a training music player for gymnastics coaches and clubs — across Artistic, Women’s Artistic, Rhythmic, Acrobatic and Aerobic Gymnastics. It organises routine playlists and controls the order, gaps and repeats, reducing interruptions when floor time is limited.',
  },
  {
    q: 'How much does EQHO Player cost?',
    a: 'EQHO Player starts with a 30-day free trial. You add your payment details securely through Stripe when you sign up, pay nothing during the trial, and your subscription then renews automatically at £4.99/month unless you cancel. A larger EQHO Club package (£19.99/month) is planned for 1 February 2027; it is not available yet and nothing changes for existing subscribers without notice and consent. See the pricing page for the latest details.',
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
