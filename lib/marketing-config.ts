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
  launchTransitionUtc: '2026-09-30T23:00:00.000Z',
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

  // Pre-launch = the FREE phase (before 1 Oct 2026): every feature is free with
  // no card and no Stripe, so copy must promise exactly that — never a trial or
  // a payment method. This mirrors getOfferCopy() and what the player enforces.
  if (isPreLaunch(now)) {
    return {
      preLaunch: true,
      badge: 'Free until 1 October 2026',
      heading: 'Use EQHO Player free until 1 October 2026.',
      supporting:
        'Create your free account today and use every EQHO Player feature free until 1 October 2026. No card required.',
      priceLabel: 'Free',
      frequency: 'until 1 Oct 2026',
      trialLabel: 'No card required',
      explanation: `No payment details needed today. From 1 October 2026 you can start a 30-day free trial, then it renews at ${per} unless you cancel.`,
      cta: 'Create free account',
      cardNote: 'No card required.',
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
 * Date-driven OFFER copy — the single source of truth for the changeover on
 * 1 Oct 2026 (Europe/London). Keyed off the same instant as the server-side
 * entitlement authority (`PRICING.launchTransitionUtc` === PAYWALL_START_AT),
 * so what the marketing/signup/upgrade surfaces PROMISE always matches what the
 * player actually ENFORCES.
 *
 *   • Before the changeover → free phase: "Create free account", no card.
 *   • From the changeover on → each user's own 30-day Stripe trial, card taken
 *     at signup, nothing charged until the trial ends.
 *
 * The `paywall` variants are for the `/upgrade` screen, which must speak
 * differently to a brand-new visitor vs. someone whose free access just ended.
 */
export type OfferCopy = {
  preLaunch: boolean
  headline: string
  supporting: string
  cta: string
  cardNote: string
  paywall: {
    newUser: { heading: string; body: string; cta: string }
    existingUser: { heading: string; body: string; cta: string }
  }
}

export function getOfferCopy(
  formattedPrice: string = PLAYER_PACKAGE.fallbackPrice,
  interval: string = PLAYER_PACKAGE.interval,
  now: Date = new Date(),
): OfferCopy {
  const per = interval ? `${formattedPrice} per ${interval}` : formattedPrice

  if (isPreLaunch(now)) {
    // FREE phase: no card, no Stripe, no price tail. The promise is simply free
    // access until 1 Oct 2026 — never "then £4.99" (that wording is banned here
    // because the user does NOT auto-convert; they choose to start a trial later).
    return {
      preLaunch: true,
      headline: 'Use EQHO Player free until 1 October 2026.',
      supporting:
        'Create your free account today and use every EQHO Player feature free until 1 October 2026. No card required.',
      cta: 'Create free account',
      cardNote: 'No card required.',
      paywall: {
        newUser: {
          heading: 'Use EQHO Player free until 1 October 2026.',
          body: 'Create your free account today and use every EQHO Player feature free until 1 October 2026. No card required.',
          cta: 'Create free account',
        },
        existingUser: {
          heading: 'You’re all set — EQHO Player is free until 1 October 2026.',
          body: 'Keep using every EQHO Player feature free until 1 October 2026. No card required, and nothing is charged before then.',
          cta: 'Open EQHO Player',
        },
      },
    }
  }

  // PAYWALL phase (from 1 Oct 2026): each user starts their own 30-day Stripe
  // trial, card collected now, nothing charged until the individual trial ends.
  return {
    preLaunch: false,
    headline: 'Start your 30-day free trial.',
    supporting: `Add your payment details securely through Stripe and pay nothing today. Your subscription will automatically renew at ${per} after your 30-day trial unless you cancel.`,
    cta: 'Start 30-day free trial',
    cardNote: 'No charge today. Cancel anytime before your trial ends.',
    paywall: {
      newUser: {
        heading: 'Start your 30-day free trial.',
        body: `Add your payment details securely through Stripe and pay nothing today. Your subscription will automatically renew at ${per} after your 30-day trial unless you cancel.`,
        cta: 'Start 30-day free trial',
      },
      existingUser: {
        heading: 'Your free access has ended — start your 30-day free trial.',
        body: `Add your payment details securely through Stripe and pay nothing today. Your subscription will automatically renew at ${per} after your 30-day trial unless you cancel.`,
        cta: 'Start 30-day free trial',
      },
    },
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
  launchOfferFrom: '1 October 2026',
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
  { label: 'How it works', href: '/how-it-works' },
  { label: 'Who it’s for', href: '/who-its-for' },
  { label: 'Pricing', href: '/pricing' },
  { label: "FAQ's", href: '/faq' },
]

/** The problem → outcome framing under the hero. */
export const PROBLEM = {
  heading: 'Floor time is for coaching, not searching for tracks.',
  body: 'Arrange your routines before training, set the gaps and repeats, then press play and focus on the floor.',
} as const

/**
 * Feature cards. Icons are lucide-react names resolved in the component, so this
 * file stays free of JSX.
 */
export const FEATURES: { icon: string; title: string; body: string }[] = [
  {
    icon: 'ListOrdered',
    title: 'Keep your running order',
    body: 'Arrange routines exactly as you need them for the session.',
  },
  {
    icon: 'Timer',
    title: 'Control the gaps',
    body: 'Choose how much time plays between routines.',
  },
  {
    icon: 'Repeat',
    title: 'Repeat without searching',
    body: 'Replay routines without leaving the session view.',
  },
  {
    icon: 'ListMusic',
    title: 'Build useful playlists',
    body: 'Prepare playlists for partnerships, groups or complete sessions.',
  },
  {
    icon: 'Eye',
    title: 'Keep sessions moving',
    body: 'Move through the running order without stopping to find music.',
  },
  {
    icon: 'MonitorSmartphone',
    title: 'Use supported devices',
    body: 'Access pushed playlists on supported desktop, tablet and mobile devices.',
  },
]

/**
 * How-it-works steps — the real end-to-end sequence, from preparing music to
 * checking downloaded playlists before travelling. Shown on the dedicated
 * /how-it-works page. Not "01/02/03" decoration; these are an actual order.
 */
export const STEPS: { title: string; body: string }[] = [
  {
    title: 'Create your playlists',
    body: 'Upload your routine music and organise it into the playlists you need.',
  },
  {
    title: 'Arrange the running order',
    body: 'Place routines in the order you want to run them.',
  },
  {
    title: 'Set the session controls',
    body: 'Choose the gap, set repeats and turn on back-to-back playback when needed.',
  },
  {
    title: 'Press play and coach',
    body: 'EQHO follows the running order while showing the current and next routine.',
  },
  {
    title: 'Push sessions to EQHO Cloud',
    body: 'When you choose to push a playlist, its audio and session information are saved to your EQHO account.',
  },
  {
    title: 'Prepare your other devices',
    body: 'Log in on each supported device and load or download the pushed playlists you need.',
  },
  {
    title: 'Check before training',
    body: 'Downloaded playlists can be used offline. Check them before travelling.',
  },
]

/**
 * Who EQHO Player is for. Launch focus is gymnastics coaches and clubs, and the
 * specific disciplines EQHO markets to. Do NOT add dance, cheer, CrossFit,
 * general fitness, EQHO Music or a marketplace here — those are out of scope.
 */
export const WHO_ITS_FOR = {
  people: [
    {
      icon: 'Medal',
      title: 'Gymnastics coaches',
      body: 'Keep every gymnast’s floor music organised and ready to play throughout the training session.',
    },
    {
      icon: 'Megaphone',
      title: 'Clubs & squads',
      body: 'Run squad sessions with running orders, gaps and repeats so floor time keeps moving.',
    },
  ],
  disciplines: [
    'Floor and Vault Gymnastics',
    'Women’s Artistic Gymnastics',
    'Acrobatic Gymnastics',
    'Aerobic Gymnastics',
    'Rhythmic Gymnastics',
  ],
} as const

/** FAQ — honest answers, no invented specifics. */
export const FAQ: { q: string; a: string }[] = [
  {
    q: 'What is EQHO Player?',
    a: 'EQHO Player is a training music player for gymnastics coaches and clubs — across Floor and Vault Gymnastics, Women’s Artistic Gymnastics, Rhythmic, Acrobatic and Aerobic Gymnastics. It organises routine playlists and controls the order, gaps and repeats, reducing interruptions when floor time is limited.',
  },
  {
    q: 'How much does it cost?',
    a: 'EQHO Player starts with a 30-day free trial. You add your payment details securely through Stripe when you sign up, pay nothing during the trial, and your subscription then renews automatically at £4.99/month unless you cancel. See the pricing page for the latest details.',
  },
  {
    q: 'Do I need to install anything?',
    a: 'No. EQHO Player works in any web browser on desktop, tablet and mobile — nothing to install. For the best experience on iPad and iPhone, you can download the free EQHO Player app from the Apple App Store.',
  },
  {
    q: 'Where is my music stored?',
    a: 'Cloud upload is manual: when you choose to push a playlist, its audio and running order are saved securely to your EQHO account so they are backed up and available when you log in on another device.',
  },
  {
    q: 'Can I use it offline?',
    a: 'Yes. Downloaded playlists play directly on your device without an internet connection. Download and check every playlist on each device before travelling.',
  },
  {
    q: 'Does everything synchronise automatically?',
    a: 'No. EQHO Player does not synchronise automatically. Cloud upload is manual — you choose when to push a playlist, and you load or download your pushed playlists on each device before training.',
  },
  {
    q: 'Can I cancel?',
    a: 'Yes. Cancel anytime before your 30-day trial ends and you will not be charged. You can also cancel your subscription whenever you like from your account settings.',
  },
  {
    q: 'Is the interactive demo saved?',
    a: 'No. The interactive demo resets each time and does not save any changes you make. It is a way to explore the player without an account.',
  },
]

/**
 * FAQ with a date-driven pricing answer, so the homepage FAQ and its structured
 * data never contradict the current offer phase. Pre-launch it describes the
 * free period (no card); from 1 Oct it describes the individual 30-day trial.
 * All other answers are static.
 */
export function getFaq(now: Date = new Date()): { q: string; a: string }[] {
  const pricingAnswer = isPreLaunch(now)
    ? 'EQHO Player is free to use until 1 October 2026 — just create a free account, no card required. From 1 October 2026 you can start an individual 30-day free trial: you add your payment details securely through Stripe, pay nothing during the trial, and your subscription then renews automatically at £4.99/month unless you cancel. See the pricing page for the latest details.'
    : 'EQHO Player starts with a 30-day free trial. You add your payment details securely through Stripe when you sign up, pay nothing during the trial, and your subscription then renews automatically at £4.99/month unless you cancel. See the pricing page for the latest details.'
  return FAQ.map((item) =>
    item.q === 'How much does it cost?' ? { ...item, a: pricingAnswer } : item,
  )
}

/** Footer link groups. */
export const FOOTER_LINKS: { heading: string; links: { label: string; href: string }[] }[] = [
  {
    heading: 'Product',
    links: [
      { label: 'The player', href: '/features' },
      { label: 'How it works', href: '/how-it-works' },
      { label: 'Who it’s for', href: '/who-its-for' },
      { label: 'Pricing', href: '/pricing' },
      { label: "FAQ's", href: '/faq' },
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
  {
    heading: 'Contact',
    links: [
      { label: 'info@eqho-player.com', href: 'mailto:info@eqho-player.com' },
      { label: 'Download the app', href: APP.appStoreUrl },
    ],
  },
]

/**
 * Legal / operator details shared by the Terms of Service and Privacy Policy so
 * the two pages can never drift apart (same "last updated" date, same contact
 * email, same operator identity, same governing law).
 *
 * EQHO Player is operated by a SOLE TRADER, not a limited company. The confirmed
 * legal identity is "Christopher Rogers trading as EQHO Player" in the United
 * Kingdom. Do NOT describe EQHO Player as a limited/registered company and do NOT
 * invent a company registration number, VAT number, registered office or postal
 * address — none exist for a sole trader unless the owner supplies them.
 *
 * OWNER ACTION (not blocking): if a postal contact address later becomes legally
 * required, add it here as a real value — never a placeholder.
 */
export const LEGAL = {
  // Keep both legal pages on the SAME date whenever either is edited.
  lastUpdated: '27 August 2026',
  // Confirmed legal identity (sole trader).
  operatorName: 'Christopher Rogers trading as EQHO Player',
  businessContact: 'Christopher Rogers',
  country: 'United Kingdom',
  // Confirmed, in-use contact details.
  contactEmail: 'info@eqho-player.com',
  websiteUrl: 'https://www.eqho-player.com',
  // Confirmed by the owner for the Terms: England and Wales (subject to any
  // mandatory consumer protections that apply where the customer lives).
  governingLaw: 'England and Wales',
} as const
